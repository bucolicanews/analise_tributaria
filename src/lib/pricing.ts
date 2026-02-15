import { Product, CalculationParams, CalculatedProduct, TaxRegime } from "@/types/pricing";
import { findCClassByNcm, checkIfNcmHasSelectiveTax } from "./tax/taxClassificationService";

export const calculatePricing = (
  product: Product,
  params: CalculationParams,
  cfu: number // Custo Fixo por Unidade
): CalculatedProduct => {
  // 1. Créditos (Simulação Reforma) - No futuro, o crédito é financeiro (pago na etapa anterior = crédito agora)
  
  // CBS substitui PIS/COFINS
  const cbsCredit = params.usePisCofins ? (product.pisCredit + product.cofinsCredit) : 0;
  
  // IBS substitui ICMS
  // Mesmo que seja ST hoje, na Reforma o imposto pago na entrada gera crédito financeiro
  const icmsCreditPercentageFactor = params.icmsPercentage / 100;
  const ibsCredit = (product.icmsCredit || 0) * icmsCreditPercentageFactor;
  
  const totalCredit = cbsCredit + ibsCredit;

  // 2. Custo efetivo (Preço pago - créditos recuperáveis)
  const effectiveCost = product.cost - totalCredit;

  const fixedCostPerCommercialUnit = cfu * (product.innerQuantity > 0 ? product.innerQuantity : 1);
  let baseCostForMarkup = product.cost + fixedCostPerCommercialUnit;

  // 4. Incorporar perdas
  if (params.lossPercentage > 0 && params.lossPercentage < 100) {
    baseCostForMarkup = baseCostForMarkup / (1 - params.lossPercentage / 100);
  } else if (params.lossPercentage >= 100) {
    baseCostForMarkup = Infinity; 
  }

  // --- LÓGICA DE CLASSIFICAÇÃO TRIBUTÁRIA ---
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

  if (params.taxRegime === TaxRegime.LucroPresumido) {
    totalPercentageForMarkup = (totalVariableExpensesPercentage + params.irpjRate + params.csllRate + params.profitMargin) / 100 + cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective;
  } else if (params.taxRegime === TaxRegime.LucroReal) {
    const irpjCsllRate = (params.irpjRateLucroReal / 100) + (params.csllRateLucroReal / 100);
    if (irpjCsllRate >= 1) {
      totalPercentageForMarkup = Infinity;
    } else {
      const profitComponent = (params.profitMargin / 100) / (1 - irpjCsllRate);
      totalPercentageForMarkup = (totalVariableExpensesPercentage / 100) + cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective + profitComponent;
    }
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

  if (markupDivisor <= 0 || baseCostForMarkup === Infinity) {
    sellingPrice = 0;
    minSellingPrice = 0;
    status = "PREÇO CORRIGIDO";
  } else {
    sellingPrice = baseCostForMarkup / markupDivisor;
    
    let totalTaxRateForMinPrice = 0;
    if (params.taxRegime === TaxRegime.LucroPresumido) {
      totalTaxRateForMinPrice = cbsRateEffective + ibsRateEffective + (params.irpjRate / 100) + (params.csllRate / 100) + selectiveTaxRateEffective;
    } else if (params.taxRegime === TaxRegime.LucroReal) {
      totalTaxRateForMinPrice = cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective;
    } else {
      totalTaxRateForMinPrice = params.generateIvaCredit ? (params.simplesNacionalRate / 100) + cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective : (params.simplesNacionalRate / 100) + selectiveTaxRateEffective;
    }
    const minSellingDivisor = 1 - (totalVariableExpensesPercentage / 100 + totalTaxRateForMinPrice);
    minSellingPrice = minSellingDivisor > 0 ? baseCostForMarkup / minSellingDivisor : baseCostForMarkup;

    selectiveTaxToPay = sellingPrice * selectiveTaxRateEffective;
    
    if (params.taxRegime === TaxRegime.LucroPresumido || params.taxRegime === TaxRegime.LucroReal) {
      cbsDebit = sellingPrice * cbsRateEffective;
      ibsDebit = sellingPrice * ibsRateEffective;
      if (params.taxRegime === TaxRegime.LucroPresumido) {
        irpjToPay = sellingPrice * (params.irpjRate / 100);
        csllToPay = sellingPrice * (params.csllRate / 100);
      } else {
        const irpjCsllRate = (params.irpjRateLucroReal / 100) + (params.csllRateLucroReal / 100);
        const netProfit = sellingPrice * (params.profitMargin / 100);
        const pbt = (irpjCsllRate < 1) ? netProfit / (1 - irpjCsllRate) : 0;
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
    
    taxToPay = (params.taxRegime === TaxRegime.LucroPresumido || params.taxRegime === TaxRegime.LucroReal) 
      ? (cbsTaxToPay + ibsTaxToPay + irpjToPay + csllToPay + selectiveTaxToPay)
      : (simplesToPay + (params.generateIvaCredit ? (cbsTaxToPay + ibsTaxToPay) : 0) + selectiveTaxToPay);

    markupPercentage = product.cost > 0 ? ((sellingPrice - product.cost) / product.cost) * 100 : 0;
  }

  const innerQty = product.innerQuantity > 0 ? product.innerQuantity : 1;
  const contributionMargin = sellingPrice - (product.cost + (sellingPrice * (totalVariableExpensesPercentage / 100)));

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
    valueForVariableExpenses: Math.max(0, sellingPrice * (totalVariableExpensesPercentage / 100)),
    valueForFixedCost: fixedCostPerCommercialUnit,
    valueForProfit: sellingPrice * (params.profitMargin / 100),
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