import { Product, CalculationParams, CalculatedProduct, TaxRegime } from "@/types/pricing";
import { findCClassByNcm, checkIfNcmHasSelectiveTax } from "./tax/taxClassificationService";

export const calculatePricing = (
  product: Product,
  params: CalculationParams,
  cfu: number, // Custo Fixo por Unidade
  fixedSellingPrice?: number // Parâmetro opcional para simulações de mercado fixo
): CalculatedProduct => {
  
  // 1. Definição de Regime para Créditos
  // No Simples Nacional PADRÃO, não há recuperação de créditos de CBS/IBS.
  // No Híbrido, a empresa opta por recolher e creditar IVA.
  const canRecoverCredits = params.taxRegime !== TaxRegime.SimplesNacional || params.generateIvaCredit;

  const cbsCredit = (canRecoverCredits && params.usePisCofins) ? (product.pisCredit + product.cofinsCredit) : 0;
  const icmsCreditPercentageFactor = params.icmsPercentage / 100;
  const ibsCredit = (canRecoverCredits) ? (product.icmsCredit || 0) * icmsCreditPercentageFactor : 0;
  
  const totalCredit = cbsCredit + ibsCredit;
  const effectiveCost = product.cost - totalCredit;

  const innerQty = product.innerQuantity > 0 ? product.innerQuantity : 1;
  const fixedCostPerCommercialUnit = cfu * innerQty;
  let baseCostForMarkup = product.cost + fixedCostPerCommercialUnit;

  if (params.lossPercentage > 0 && params.lossPercentage < 100) {
    baseCostForMarkup = baseCostForMarkup / (1 - params.lossPercentage / 100);
  } else if (params.lossPercentage >= 100) {
    baseCostForMarkup = Infinity; 
  }

  const incideIS = checkIfNcmHasSelectiveTax(product.ncm);
  
  let selectiveTaxRateForProduct = 0;
  if (incideIS) {
    const ncm = product.ncm?.replace(/\./g, '') || '';
    let bestMatchRate: number | null = null;
    let longestMatch = 0;

    for (const rule of params.selectiveTaxRates) {
      const ruleNcm = rule.ncm.replace(/\./g, '');
      if (ncm.startsWith(ruleNcm) && ruleNcm.length > longestMatch) {
        bestMatchRate = rule.rate;
        longestMatch = ruleNcm.length;
      }
    }
    selectiveTaxRateForProduct = bestMatchRate !== null ? bestMatchRate : params.defaultSelectiveTaxRate;
  }

  const totalVariableExpensesPercentage = params.variableExpenses.reduce((sum, exp) => sum + exp.percentage, 0);
  
  const cbsRateEffective = params.useCbsDebit ? params.cbsRate / 100 : 0;
  const ibsRateEffective = (params.ibsRate / 100) * (params.ibsDebitPercentage / 100);
  const selectiveTaxRateEffective = params.useSelectiveTaxDebit ? selectiveTaxRateForProduct / 100 : 0;

  let totalPercentageForMarkup = 0;
  let irpjToPay = 0;
  let csllToPay = 0;
  let simplesToPay = 0;
  let cbsDebit = 0;
  let ibsDebit = 0;
  let selectiveTaxToPay = 0;
  let ivaCreditForClient = 0;

  // CÁLCULO DO MARKUP DIVISOR
  if (params.taxRegime === TaxRegime.LucroPresumido) {
    totalPercentageForMarkup = (totalVariableExpensesPercentage + params.irpjRate + params.csllRate + params.profitMargin) / 100 + cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective;
  } else if (params.taxRegime === TaxRegime.LucroReal) {
    const irpjCsllRate = (params.irpjRateLucroReal / 100) + (params.csllRateLucroReal / 100);
    const profitComponent = (irpjCsllRate < 1) ? (params.profitMargin / 100) / (1 - irpjCsllRate) : 0;
    totalPercentageForMarkup = (totalVariableExpensesPercentage / 100) + cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective + profitComponent;
  } else { // Simples Nacional
    if (params.generateIvaCredit) {
      totalPercentageForMarkup = (totalVariableExpensesPercentage + params.simplesNacionalRate + params.profitMargin) / 100 + cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective;
    } else {
      totalPercentageForMarkup = (totalVariableExpensesPercentage + params.simplesNacionalRate + params.profitMargin) / 100 + selectiveTaxRateEffective;
    }
  }

  const markupDivisor = 1 - totalPercentageForMarkup;

  let sellingPrice = 0;
  let minSellingPrice = 0;
  let cbsTaxToPay = 0;
  let ibsTaxToPay = 0;
  let taxToPay = 0;
  let markupPercentage = 0;
  let status: "OK" | "PREÇO CORRIGIDO" = "OK";

  // Se um preço fixo foi fornecido (Simulação de Mercado), forçamos o valor
  if (fixedSellingPrice !== undefined) {
    sellingPrice = fixedSellingPrice;
    
    // Calcula o preço mínimo normal para referência
    let minSellingTaxRate = 0;
    if (params.taxRegime === TaxRegime.LucroPresumido) {
      minSellingTaxRate = cbsRateEffective + ibsRateEffective + (params.irpjRate / 100) + (params.csllRate / 100) + selectiveTaxRateEffective;
    } else if (params.taxRegime === TaxRegime.LucroReal) {
      minSellingTaxRate = cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective;
    } else {
      minSellingTaxRate = params.generateIvaCredit ? (params.simplesNacionalRate / 100) + cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective : (params.simplesNacionalRate / 100) + selectiveTaxRateEffective;
    }
    const minSellingDivisor = 1 - (totalVariableExpensesPercentage / 100 + minSellingTaxRate);
    minSellingPrice = minSellingDivisor > 0 ? baseCostForMarkup / minSellingDivisor : baseCostForMarkup;

  } else {
    // Lógica padrão de Markup (Precificação Bottom-Up)
    if (markupDivisor <= 0.05 || baseCostForMarkup === Infinity) {
      sellingPrice = 0;
      minSellingPrice = 0;
      status = "PREÇO CORRIGIDO";
    } else {
      sellingPrice = baseCostForMarkup / markupDivisor;
      
      let minSellingTaxRate = 0;
      if (params.taxRegime === TaxRegime.LucroPresumido) {
        minSellingTaxRate = cbsRateEffective + ibsRateEffective + (params.irpjRate / 100) + (params.csllRate / 100) + selectiveTaxRateEffective;
      } else if (params.taxRegime === TaxRegime.LucroReal) {
        minSellingTaxRate = cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective;
      } else {
        minSellingTaxRate = params.generateIvaCredit ? (params.simplesNacionalRate / 100) + cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective : (params.simplesNacionalRate / 100) + selectiveTaxRateEffective;
      }
      const minSellingDivisor = 1 - (totalVariableExpensesPercentage / 100 + minSellingTaxRate);
      minSellingPrice = minSellingDivisor > 0 ? baseCostForMarkup / minSellingDivisor : baseCostForMarkup;
    }
  }

  // Com o sellingPrice definido (seja calculado ou fixado), apuramos os impostos
  if (sellingPrice > 0) {
    selectiveTaxToPay = sellingPrice * selectiveTaxRateEffective;
    
    if (params.taxRegime === TaxRegime.LucroPresumido || params.taxRegime === TaxRegime.LucroReal) {
      cbsDebit = sellingPrice * cbsRateEffective;
      ibsDebit = sellingPrice * ibsRateEffective;
      if (params.taxRegime === TaxRegime.LucroPresumido) {
        irpjToPay = sellingPrice * (params.irpjRate / 100);
        csllToPay = sellingPrice * (params.csllRate / 100);
      } else {
        const irpjCsllRate = (params.irpjRateLucroReal / 100) + (params.csllRateLucroReal / 100);
        // O lucro presumido na base real usa a margem atual. Como o preço está travado, a margem de lucro muda.
        // A rigor, o IRPJ/CSLL no Lucro Real incide sobre o lucro efetivo.
        // Para simplificação da estimativa, usamos a margem alvo fornecida ou o lucro apurado.
        const assumedProfit = sellingPrice * (params.profitMargin / 100); 
        const pbt = (irpjCsllRate < 1) ? assumedProfit / (1 - irpjCsllRate) : 0;
        irpjToPay = pbt * (params.irpjRateLucroReal / 100);
        csllToPay = pbt * (params.csllRateLucroReal / 100);
      }
      ivaCreditForClient = cbsDebit + ibsDebit;
    } else {
      simplesToPay = sellingPrice * (params.simplesNacionalRate / 100);
      if (params.generateIvaCredit) {
        cbsDebit = sellingPrice * cbsRateEffective;
        ibsDebit = sellingPrice * ibsRateEffective;
        ivaCreditForClient = cbsDebit + ibsDebit;
      }
    }

    cbsTaxToPay = cbsDebit - cbsCredit;
    ibsTaxToPay = ibsDebit - ibsCredit;
    
    if (params.taxRegime === TaxRegime.LucroPresumido || params.taxRegime === TaxRegime.LucroReal) {
      taxToPay = cbsTaxToPay + ibsTaxToPay + irpjToPay + csllToPay + selectiveTaxToPay;
    } else {
      taxToPay = simplesToPay + selectiveTaxToPay + (params.generateIvaCredit ? (cbsTaxToPay + ibsTaxToPay) : 0);
    }

    markupPercentage = product.cost > 0 ? ((sellingPrice - product.cost) / product.cost) * 100 : 0;
  }

  const valueForVariableExpenses = Math.max(0, sellingPrice * (totalVariableExpensesPercentage / 100));
  
  // Lucro Real Efetivo da Operação Unitária
  const actualProfit = sellingPrice - product.cost - taxToPay - valueForVariableExpenses - fixedCostPerCommercialUnit;
  
  const valueForProfit = fixedSellingPrice !== undefined 
    ? actualProfit 
    : sellingPrice * (params.profitMargin / 100);

  const contributionMargin = sellingPrice - (product.cost + valueForVariableExpenses);

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
    valueForTaxes: Math.max(0, taxToPay),
    valueForVariableExpenses,
    valueForFixedCost: fixedCostPerCommercialUnit,
    valueForProfit,
    contributionMargin: contributionMargin,
    ivaCreditForClient: Math.max(0, ivaCreditForClient),
    costPerInnerUnit: product.cost / innerQty,
    effectiveCostPerInnerUnit: effectiveCost / innerQty,
    sellingPricePerInnerUnit: sellingPrice / innerQty,
    minSellingPricePerInnerUnit: minSellingPrice / innerQty,
    cbsCreditPerInnerUnit: cbsCredit / innerQty,
    ibsCreditPerInnerUnit: ibsCredit / innerQty,
    cbsDebitPerInnerUnit: cbsDebit / innerQty,
    ibsDebitPerInnerUnit: ibsDebit / innerQty,
    taxToPayPerInnerUnit: taxToPay / innerQty,
    cbsTaxToPayPerInnerUnit: cbsTaxToPay / innerQty,
    ibsTaxToPayPerInnerUnit: ibsTaxToPay / innerQty,
    irpjToPayPerInnerUnit: irpjToPay / innerQty,
    csllToPayPerInnerUnit: csllToPay / innerQty,
    simplesToPayPerInnerUnit: simplesToPay / innerQty,
    selectiveTaxToPayPerInnerUnit: selectiveTaxToPay / innerQty,
    taxAnalysis: {
      icms: ['10', '30', '60', '70', '90', '201', '202', '203', '500'].includes(product.cst || "") ? 'Substituição Tributária' : 'Tributado Integralmente',
      pisCofins: ["04", "05", "06", "07", "08", "09"].includes(product.pisCst || "") ? 'Monofásico (Receita Segregada)' : 'Tributado (Alíquota Unificada no DAS)',
      wasNcmFound: findCClassByNcm(product.ncm) !== null,
      incideIS: incideIS,
    },
    suggestedCodes: {
      icmsCstOrCsosn: ['10', '30', '60', '70', '90', '201', '202', '203', '500'].includes(product.cst || "") ? '500' : '102',
      pisCofinsCst: ["04", "05", "06", "07", "08", "09"].includes(product.pisCst || "") ? '04' : '01',
    },
    cClassTrib: findCClassByNcm(product.ncm) || 1,
  };
};