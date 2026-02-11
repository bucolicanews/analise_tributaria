import { Product, CalculationParams, CalculatedProduct, TaxRegime } from "@/types/pricing";
import { findCClassByNcm, checkIfNcmHasSelectiveTax } from "./tax/taxClassificationService";

export const calculatePricing = (
  product: Product,
  params: CalculationParams,
  cfu: number // Custo Fixo por Unidade
): CalculatedProduct => {
  // 1. Créditos (do XML) - por unidade comercial, respeitando os parâmetros de transição
  
  // CORREÇÃO 1: PIS/COFINS (CBS) só gera crédito fora do Simples Nacional.
  const cbsCredit = 
    params.taxRegime !== TaxRegime.SimplesNacional && params.usePisCofins 
    ? product.pisCredit + product.cofinsCredit 
    : 0;
  
  // CORREÇÃO 2: ICMS (IBS) não gera crédito em cenários de Substituição Tributária (ST).
  // CSTs de ST: 10, 30, 60, 70, 90. CSOSNs de ST: 201, 202, 203, 500.
  const isIcmsST = ["10", "30", "60", "70", "90", "201", "202", "203", "500"].includes(product.cst || "");
  const icmsCreditPercentageFactor = params.icmsPercentage / 100;
  const ibsCredit = 
    !isIcmsST && product.icmsCredit 
    ? product.icmsCredit * icmsCreditPercentageFactor 
    : 0;
  
  const totalCredit = cbsCredit + ibsCredit;

  // 2. Custo efetivo - por unidade comercial (pode ser negativo, é uma métrica de custo líquido)
  const effectiveCost = product.cost - totalCredit;

  // CORREÇÃO 3: O Custo Fixo (CFU) deve ser aplicado à unidade comercial inteira.
  // Custo Fixo da Unidade Comercial = Custo Fixo por Unidade Interna * Quantidade de Unidades Internas.
  const fixedCostPerCommercialUnit = cfu * (product.innerQuantity > 0 ? product.innerQuantity : 1);
  let baseCostForMarkup = product.cost + fixedCostPerCommercialUnit;

  // 4. Incorporar a porcentagem de perdas e quebras ao custo base
  if (params.lossPercentage > 0 && params.lossPercentage < 100) {
    baseCostForMarkup = baseCostForMarkup / (1 - params.lossPercentage / 100);
  } else if (params.lossPercentage >= 100) {
    baseCostForMarkup = Infinity; 
  }

  // --- LÓGICA DE CLASSIFICAÇÃO TRIBUTÁRIA ---
  const incideIS = checkIfNcmHasSelectiveTax(product.ncm);

  // 5. Soma das alíquotas percentuais (variável por regime e cenário)
  const totalVariableExpensesPercentage = params.variableExpenses.reduce(
    (sum, exp) => sum + exp.percentage,
    0
  );
  
  // Aplica os controles de débito nas alíquotas
  const cbsRateEffective = params.useCbsDebit ? params.cbsRate / 100 : 0;
  const ibsRateEffective = (params.ibsRate / 100) * (params.ibsDebitPercentage / 100);
  const selectiveTaxRateEffective = params.useSelectiveTaxDebit && incideIS ? params.selectiveTaxRate / 100 : 0;

  let totalPercentageForMarkup = 0;
  let irpjToPay = 0;
  let csllToPay = 0;
  let simplesToPay = 0;
  let cbsDebit = 0;
  let ibsDebit = 0;
  let selectiveTaxToPay = 0;
  let ivaCreditForClient = 0; // Novo: Crédito de IVA para o cliente

  if (params.taxRegime === TaxRegime.LucroPresumido) {
    totalPercentageForMarkup =
      (totalVariableExpensesPercentage + params.irpjRate + params.csllRate + params.profitMargin) / 100 +
      cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective;
  } else if (params.taxRegime === TaxRegime.LucroReal) {
    const irpjCsllRate = (params.irpjRateLucroReal / 100) + (params.csllRateLucroReal / 100);
    if (irpjCsllRate >= 1) {
      totalPercentageForMarkup = Infinity;
    } else {
      const profitComponent = (params.profitMargin / 100) / (1 - irpjCsllRate);
      totalPercentageForMarkup =
        (totalVariableExpensesPercentage / 100) +
        cbsRateEffective +
        ibsRateEffective +
        selectiveTaxRateEffective +
        profitComponent;
    }
  } else { // Simples Nacional
    if (params.generateIvaCredit) { // Simples Nacional Híbrido (gera crédito de IVA)
      // No Simples Híbrido, o Simples é pago integralmente, e CBS/IBS são pagos por fora (e controlados pelo débito)
      totalPercentageForMarkup =
        (totalVariableExpensesPercentage + params.simplesNacionalRate + params.profitMargin) / 100 +
        cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective;
    } else { // Simples Nacional Padrão (não gera crédito de IVA)
      // No Simples Padrão, apenas o Simples e o Imposto Seletivo são pagos (seletivo controlado pelo débito)
      totalPercentageForMarkup =
        (totalVariableExpensesPercentage + params.simplesNacionalRate + params.profitMargin) / 100 +
        selectiveTaxRateEffective;
    }
  }

  // 6. Markup divisor
  const markupDivisor = 1 - totalPercentageForMarkup;

  let sellingPrice = 0;
  let minSellingPrice = 0;
  let cbsTaxToPay = 0;
  let ibsTaxToPay = 0;
  let taxToPay = 0;
  let markupPercentage = 0;
  let status: "OK" | "PREÇO CORRIGIDO" = "OK";

  // Detalhamento do Preço de Venda
  let valueForTaxes = 0;
  let valueForVariableExpenses = 0;
  let valueForFixedCost = 0;
  let valueForProfit = 0;
  let contributionMargin = 0;

  if (markupDivisor <= 0 || baseCostForMarkup === Infinity) {
    sellingPrice = 0;
    minSellingPrice = 0;
    status = "PREÇO CORRIGIDO";
  } else {
    // 7. Preço de venda sugerido - por unidade comercial
    sellingPrice = baseCostForMarkup / markupDivisor;
    
    // 8. Menor valor a ser vendido (cobre custo de compra + despesas variáveis + impostos diretos) - por unidade comercial
    let minSellingDivisor = 0;
    
    // Recalcula a taxa total de impostos para o cálculo do preço mínimo (sem margem de lucro)
    let totalTaxRateForMinPrice = 0;
    if (params.taxRegime === TaxRegime.LucroPresumido) {
      totalTaxRateForMinPrice = cbsRateEffective + ibsRateEffective + (params.irpjRate / 100) + (params.csllRate / 100) + selectiveTaxRateEffective;
    } else if (params.taxRegime === TaxRegime.LucroReal) {
      // No preço mínimo (lucro zero), IRPJ e CSLL também são zero.
      totalTaxRateForMinPrice = cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective;
    } else { // Simples Nacional
      if (params.generateIvaCredit) {
        totalTaxRateForMinPrice = (params.simplesNacionalRate / 100) + cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective;
      } else {
        totalTaxRateForMinPrice = (params.simplesNacionalRate / 100) + selectiveTaxRateEffective;
      }
    }

    minSellingDivisor = 1 - (totalVariableExpensesPercentage / 100 + totalTaxRateForMinPrice);
    
    minSellingPrice = minSellingDivisor > 0 ? baseCostForMarkup / minSellingDivisor : baseCostForMarkup;

    // 9. Débitos na venda - por unidade comercial (calculados com base no sellingPrice final)
    selectiveTaxToPay = sellingPrice * selectiveTaxRateEffective;
    
    if (params.taxRegime === TaxRegime.LucroPresumido) {
      cbsDebit = sellingPrice * cbsRateEffective;
      ibsDebit = sellingPrice * ibsRateEffective;
      irpjToPay = sellingPrice * (params.irpjRate / 100);
      csllToPay = sellingPrice * (params.csllRate / 100);
      ivaCreditForClient = cbsDebit + ibsDebit; // Crédito de IVA para o cliente
    } else if (params.taxRegime === TaxRegime.LucroReal) {
      cbsDebit = sellingPrice * cbsRateEffective;
      ibsDebit = sellingPrice * ibsRateEffective;
      
      const irpjCsllRate = (params.irpjRateLucroReal / 100) + (params.csllRateLucroReal / 100);
      const netProfit = sellingPrice * (params.profitMargin / 100);
      const pbt = (irpjCsllRate < 1) ? netProfit / (1 - irpjCsllRate) : 0;

      irpjToPay = pbt * (params.irpjRateLucroReal / 100);
      csllToPay = pbt * (params.csllRateLucroReal / 100);
      ivaCreditForClient = cbsDebit + ibsDebit;
    } else { // Simples Nacional
      if (params.generateIvaCredit) { // Simples Nacional Híbrido
        simplesToPay = sellingPrice * (params.simplesNacionalRate / 100);
        cbsDebit = sellingPrice * cbsRateEffective;
        ibsDebit = sellingPrice * ibsRateEffective;
        ivaCreditForClient = cbsDebit + ibsDebit; // Crédito de IVA para o cliente
      } else { // Simples Nacional Padrão
        simplesToPay = sellingPrice * (params.simplesNacionalRate / 100);
        cbsDebit = 0; // Não aplicável diretamente no Simples Nacional para débitos de saída
        ibsDebit = 0; // Não aplicável diretamente no Simples Nacional para débitos de saída
        ivaCreditForClient = 0; // Não gera crédito de IVA
      }
    }

    // 10. Imposto a pagar (líquido) - por unidade comercial
    cbsTaxToPay = cbsDebit - cbsCredit;
    ibsTaxToPay = ibsDebit - ibsCredit;
    
    if (params.taxRegime === TaxRegime.LucroPresumido || params.taxRegime === TaxRegime.LucroReal) {
      taxToPay = cbsTaxToPay + ibsTaxToPay + irpjToPay + csllToPay + selectiveTaxToPay;
    } else { // Simples Nacional
      if (params.generateIvaCredit) {
        taxToPay = simplesToPay + cbsTaxToPay + ibsTaxToPay + selectiveTaxToPay;
      } else {
        taxToPay = simplesToPay + selectiveTaxToPay;
      }
    }

    // 11. Porcentagem de markup (sobre o custo de compra original)
    markupPercentage = product.cost > 0 ? ((sellingPrice - product.cost) / product.cost) * 100 : 0;

    // 12. Detalhamento do Preço de Venda (por Unidade Comercial)
    valueForTaxes = taxToPay;
    valueForVariableExpenses = sellingPrice * (totalVariableExpensesPercentage / 100);
    valueForFixedCost = fixedCostPerCommercialUnit; // O valor do custo fixo por unidade comercial
    valueForProfit = sellingPrice * (params.profitMargin / 100);
    
    // Margem de Contribuição (Unit): Preço de Venda - (Custo de Aquisição + Despesas Variáveis)
    contributionMargin = sellingPrice - (product.cost + valueForVariableExpenses);
  }

  // Cálculos por Unidade Interna
  const innerQty = product.innerQuantity > 0 ? product.innerQuantity : 1;

  const costPerInnerUnit = product.cost / innerQty;
  const effectiveCostPerInnerUnit = effectiveCost / innerQty; // Pode ser negativo
  const sellingPricePerInnerUnit = sellingPrice / innerQty;
  const minSellingPricePerInnerUnit = minSellingPrice / innerQty;
  const cbsCreditPerInnerUnit = cbsCredit / innerQty;
  const ibsCreditPerInnerUnit = ibsCredit / innerQty;
  const cbsDebitPerInnerUnit = cbsDebit / innerQty;
  const ibsDebitPerInnerUnit = ibsDebit / innerQty;
  const cbsTaxToPayPerInnerUnit = cbsTaxToPay / innerQty;
  const ibsTaxToPayPerInnerUnit = ibsTaxToPay / innerQty;
  const irpjToPayPerInnerUnit = irpjToPay / innerQty;
  const csllToPayPerInnerUnit = csllToPay / innerQty;
  const simplesToPayPerInnerUnit = simplesToPay / innerQty;
  const taxToPayPerInnerUnit = taxToPay / innerQty;
  const selectiveTaxToPayPerInnerUnit = selectiveTaxToPay / innerQty;

  // --- LÓGICA DE CLASSIFICAÇÃO TRIBUTÁRIA ---
  const icmsClassification = isIcmsST ? 'Substituição Tributária' : 'Tributado Integralmente';
  
  const isPisCofinsMonofasico = ["04", "05", "06", "07", "08", "09"].includes(product.pisCst || "");
  let pisCofinsClassification: 'Monofásico (Receita Segregada)' | 'Tributado (Alíquota Unificada no DAS)' | 'Débito e Crédito (Não Cumulativo)';

  if (params.taxRegime === TaxRegime.SimplesNacional) {
    pisCofinsClassification = isPisCofinsMonofasico ? 'Monofásico (Receita Segregada)' : 'Tributado (Alíquota Unificada no DAS)';
  } else {
    pisCofinsClassification = 'Débito e Crédito (Não Cumulativo)';
  }
  
  const foundCClass = findCClassByNcm(product.ncm);
  const cClassTrib = foundCClass !== null ? foundCClass : 1;
  const wasNcmFound = foundCClass !== null;
  // --- FIM DA LÓGICA DE CLASSIFICAÇÃO ---

  // --- LÓGICA DE SUGESTÃO DE CÓDIGOS DE SAÍDA (PARA SIMPLES NACIONAL) ---
  let suggestedIcmsCstOrCsosn = '102'; // Padrão: Tributado Integralmente
  if (isIcmsST) {
    suggestedIcmsCstOrCsosn = '500'; // ICMS cobrado anteriormente por ST
  }

  let suggestedPisCofinsCst = '01'; // Padrão: Operação Tributável
  if (isPisCofinsMonofasico) {
    suggestedPisCofinsCst = '04'; // Operação Tributável Monofásica - Revenda
  }
  // --- FIM DA LÓGICA DE SUGESTÃO ---

  return {
    ...product,
    effectiveCost,
    sellingPrice: Math.max(0, sellingPrice),
    minSellingPrice: Math.max(0, minSellingPrice),
    cbsCredit,
    ibsCredit,
    cbsDebit: Math.max(0, cbsDebit),
    ibsDebit: Math.max(0, ibsDebit),
    taxToPay: Math.max(0, taxToPay),
    cbsTaxToPay: Math.max(0, cbsTaxToPay),
    ibsTaxToPay: Math.max(0, ibsTaxToPay),
    irpjToPay: Math.max(0, irpjToPay),
    csllToPay: Math.max(0, csllToPay),
    simplesToPay: Math.max(0, simplesToPay),
    selectiveTaxToPay: Math.max(0, selectiveTaxToPay),
    markupPercentage,
    cfop: product.cfop || "5102",
    cst: product.cst || "101",
    status,

    // Detalhamento do Preço de Venda (por Unidade Comercial)
    valueForTaxes: Math.max(0, valueForTaxes),
    valueForVariableExpenses: Math.max(0, valueForVariableExpenses),
    valueForFixedCost: Math.max(0, valueForFixedCost),
    valueForProfit: Math.max(0, valueForProfit),
    contributionMargin: contributionMargin,
    ivaCreditForClient: Math.max(0, ivaCreditForClient), // Garante que não seja negativo

    // Valores por Unidade Interna
    costPerInnerUnit,
    effectiveCostPerInnerUnit,
    sellingPricePerInnerUnit: Math.max(0, sellingPricePerInnerUnit),
    minSellingPricePerInnerUnit: Math.max(0, minSellingPricePerInnerUnit),
    cbsCreditPerInnerUnit,
    ibsCreditPerInnerUnit,
    cbsDebitPerInnerUnit: Math.max(0, cbsDebitPerInnerUnit),
    ibsDebitPerInnerUnit: Math.max(0, ibsDebitPerInnerUnit),
    taxToPayPerInnerUnit: Math.max(0, taxToPayPerInnerUnit),
    cbsTaxToPayPerInnerUnit: Math.max(0, cbsTaxToPayPerInnerUnit),
    ibsTaxToPayPerInnerUnit: Math.max(0, ibsTaxToPayPerInnerUnit),
    irpjToPayPerInnerUnit: Math.max(0, irpjToPayPerInnerUnit),
    csllToPayPerInnerUnit: Math.max(0, csllToPayPerInnerUnit),
    simplesToPayPerInnerUnit: Math.max(0, simplesToPayPerInnerUnit),
    selectiveTaxToPayPerInnerUnit: Math.max(0, selectiveTaxToPayPerInnerUnit),

    // Objeto de análise tributária explícita
    taxAnalysis: {
      icms: icmsClassification,
      pisCofins: pisCofinsClassification,
      wasNcmFound: wasNcmFound,
      incideIS: incideIS,
    },

    // Códigos sugeridos para a venda (saída)
    suggestedCodes: {
      icmsCstOrCsosn: suggestedIcmsCstOrCsosn,
      pisCofinsCst: suggestedPisCofinsCst,
    },
    
    cClassTrib: cClassTrib,
  };
};