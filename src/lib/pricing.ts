import { Product, CalculationParams, CalculatedProduct, TaxRegime } from "@/types/pricing";

export const CBS_RATE = 0.088; // 8.8%
export const IBS_RATE = 0.177; // 17.7%

export const calculatePricing = (
  product: Product,
  params: CalculationParams,
  cfu: number // Custo Fixo por Unidade
): CalculatedProduct => {
  // 1. Créditos (do XML) - por unidade comercial
  const cbsCredit = product.pisCredit + product.cofinsCredit;
  const ibsCredit = product.icmsCredit || 0;
  const totalCredit = cbsCredit + ibsCredit;

  // 2. Custo efetivo - por unidade comercial (pode ser negativo, é uma métrica de custo líquido)
  const effectiveCost = product.cost - totalCredit;

  // 3. Custo Base para o Markup Divisor: Custo de Aquisição Unitário (CAU) + Custo Fixo por Unidade (CFU)
  let baseCostForMarkup = product.cost + cfu;

  // 4. Incorporar a porcentagem de perdas e quebras ao custo base
  if (params.lossPercentage > 0 && params.lossPercentage < 100) {
    baseCostForMarkup = baseCostForMarkup / (1 - params.lossPercentage / 100);
  } else if (params.lossPercentage >= 100) {
    baseCostForMarkup = Infinity; 
  }

  // 5. Soma das alíquotas percentuais (variável por regime e cenário)
  const totalVariableExpensesPercentage = params.variableExpenses.reduce(
    (sum, exp) => sum + exp.percentage,
    0
  );
  
  let totalPercentageForMarkup = 0;
  let irpjToPay = 0;
  let csllToPay = 0;
  let simplesToPay = 0;
  let cbsDebit = 0;
  let ibsDebit = 0;
  let ivaCreditForClient = 0; // Novo: Crédito de IVA para o cliente

  if (params.taxRegime === TaxRegime.LucroPresumido) {
    totalPercentageForMarkup =
      (totalVariableExpensesPercentage + params.irpjRate + params.csllRate + params.profitMargin) / 100 +
      CBS_RATE + IBS_RATE;
  } else { // Simples Nacional
    if (params.generateIvaCredit) { // Simples Nacional Híbrido (gera crédito de IVA)
      totalPercentageForMarkup =
        (totalVariableExpensesPercentage + params.simplesNacionalRemanescenteRate + params.profitMargin) / 100 +
        CBS_RATE + IBS_RATE;
    } else { // Simples Nacional Padrão (não gera crédito de IVA)
      totalPercentageForMarkup =
        (totalVariableExpensesPercentage + params.simplesNacionalRate + params.profitMargin) / 100;
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
    if (params.taxRegime === TaxRegime.LucroPresumido) {
      minSellingDivisor = 1 - (totalVariableExpensesPercentage / 100 + CBS_RATE + IBS_RATE);
    } else { // Simples Nacional
      if (params.generateIvaCredit) {
        minSellingDivisor = 1 - (totalVariableExpensesPercentage / 100 + params.simplesNacionalRemanescenteRate / 100 + CBS_RATE + IBS_RATE);
      } else {
        minSellingDivisor = 1 - (totalVariableExpensesPercentage / 100 + params.simplesNacionalRate / 100);
      }
    }
    
    minSellingPrice = minSellingDivisor > 0 ? baseCostForMarkup / minSellingDivisor : baseCostForMarkup;

    // 9. Débitos na venda - por unidade comercial (calculados com base no sellingPrice final)
    if (params.taxRegime === TaxRegime.LucroPresumido) {
      cbsDebit = sellingPrice * CBS_RATE;
      ibsDebit = sellingPrice * IBS_RATE;
      irpjToPay = sellingPrice * (params.irpjRate / 100);
      csllToPay = sellingPrice * (params.csllRate / 100);
      ivaCreditForClient = cbsDebit + ibsDebit; // Crédito de IVA para o cliente
    } else { // Simples Nacional
      if (params.generateIvaCredit) { // Simples Nacional Híbrido
        simplesToPay = sellingPrice * (params.simplesNacionalRemanescenteRate / 100);
        cbsDebit = sellingPrice * CBS_RATE;
        ibsDebit = sellingPrice * IBS_RATE;
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
    
    if (params.taxRegime === TaxRegime.LucroPresumido) {
      taxToPay = cbsTaxToPay + ibsTaxToPay + irpjToPay + csllToPay;
    } else { // Simples Nacional
      if (params.generateIvaCredit) {
        taxToPay = simplesToPay + cbsTaxToPay + ibsTaxToPay;
      } else {
        taxToPay = simplesToPay;
      }
    }

    // 11. Porcentagem de markup (sobre o custo de compra original)
    markupPercentage = product.cost > 0 ? ((sellingPrice - product.cost) / product.cost) * 100 : 0;

    // 12. Detalhamento do Preço de Venda (por Unidade Comercial)
    valueForTaxes = taxToPay;
    valueForVariableExpenses = sellingPrice * (totalVariableExpensesPercentage / 100);
    valueForFixedCost = cfu; // O valor do CFU é a parcela do custo fixo por unidade
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
  };
};