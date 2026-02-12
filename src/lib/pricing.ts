import { Product, CalculationParams, CalculatedProduct, TaxRegime } from "@/types/pricing";
import { findCClassByNcm, checkIfNcmHasSelectiveTax } from "./tax/taxClassificationService";

export const calculatePricing = (
  product: Product,
  params: CalculationParams,
  cfu: number // Custo Fixo por Unidade
): CalculatedProduct => {
  // 1. Créditos (do XML) - por unidade comercial, respeitando os parâmetros de transição
  
  const cbsCredit = 
    params.taxRegime !== TaxRegime.SimplesNacional && params.usePisCofins 
    ? product.pisCredit + product.cofinsCredit 
    : 0;
  
  const isIcmsST = ["10", "30", "60", "70", "90", "201", "202", "203", "500"].includes(product.cst || "");
  const icmsCreditPercentageFactor = params.icmsPercentage / 100;
  const ibsCredit = 
    !isIcmsST && product.icmsCredit 
    ? product.icmsCredit * icmsCreditPercentageFactor 
    : 0;
  
  const totalCredit = cbsCredit + ibsCredit;

  // 2. Custo efetivo
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
  
  // --- LÓGICA PARA ENCONTRAR A ALÍQUOTA CORRETA DO IMPOSTO SELETIVO ---
  let selectiveTaxRateForProduct = 0;
  if (incideIS && params.taxRegime !== TaxRegime.SimplesNacional) {
    const ncm = product.ncm?.replace(/\./g, '') || '';
    let bestMatchRate: number | null = null;
    let longestMatch = 0;

    // Procura a regra de NCM mais específica
    for (const rule of params.selectiveTaxRates) {
      const ruleNcm = rule.ncm.replace(/\./g, '');
      if (ncm.startsWith(ruleNcm) && ruleNcm.length > longestMatch) {
        bestMatchRate = rule.rate;
        longestMatch = ruleNcm.length;
      }
    }
    
    // Se encontrou uma regra específica, usa ela. Senão, usa a padrão.
    selectiveTaxRateForProduct = bestMatchRate !== null ? bestMatchRate : params.defaultSelectiveTaxRate;
  }

  // 5. Soma das alíquotas percentuais
  const totalVariableExpensesPercentage = params.variableExpenses.reduce(
    (sum, exp) => sum + exp.percentage,
    0
  );
  
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
    if (params.generateIvaCredit) {
      totalPercentageForMarkup =
        (totalVariableExpensesPercentage + params.simplesNacionalRate + params.profitMargin) / 100 +
        cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective;
    } else {
      totalPercentageForMarkup =
        (totalVariableExpensesPercentage + params.simplesNacionalRate + params.profitMargin) / 100 +
        selectiveTaxRateEffective;
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
    sellingPrice = baseCostForMarkup / markupDivisor;
    
    let minSellingDivisor = 0;
    let totalTaxRateForMinPrice = 0;
    if (params.taxRegime === TaxRegime.LucroPresumido) {
      totalTaxRateForMinPrice = cbsRateEffective + ibsRateEffective + (params.irpjRate / 100) + (params.csllRate / 100) + selectiveTaxRateEffective;
    } else if (params.taxRegime === TaxRegime.LucroReal) {
      totalTaxRateForMinPrice = cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective;
    } else {
      if (params.generateIvaCredit) {
        totalTaxRateForMinPrice = (params.simplesNacionalRate / 100) + cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective;
      } else {
        totalTaxRateForMinPrice = (params.simplesNacionalRate / 100) + selectiveTaxRateEffective;
      }
    }
    minSellingDivisor = 1 - (totalVariableExpensesPercentage / 100 + totalTaxRateForMinPrice);
    minSellingPrice = minSellingDivisor > 0 ? baseCostForMarkup / minSellingDivisor : baseCostForMarkup;

    selectiveTaxToPay = sellingPrice * selectiveTaxRateEffective;
    
    if (params.taxRegime === TaxRegime.LucroPresumido) {
      cbsDebit = sellingPrice * cbsRateEffective;
      ibsDebit = sellingPrice * ibsRateEffective;
      irpjToPay = sellingPrice * (params.irpjRate / 100);
      csllToPay = sellingPrice * (params.csllRate / 100);
      ivaCreditForClient = cbsDebit + ibsDebit;
    } else if (params.taxRegime === TaxRegime.LucroReal) {
      cbsDebit = sellingPrice * cbsRateEffective;
      ibsDebit = sellingPrice * ibsRateEffective;
      const irpjCsllRate = (params.irpjRateLucroReal / 100) + (params.csllRateLucroReal / 100);
      const netProfit = sellingPrice * (params.profitMargin / 100);
      const pbt = (irpjCsllRate < 1) ? netProfit / (1 - irpjCsllRate) : 0;
      irpjToPay = pbt * (params.irpjRateLucroReal / 100);
      csllToPay = pbt * (params.csllRateLucroReal / 100);
      ivaCreditForClient = cbsDebit + ibsDebit;
    } else {
      if (params.generateIvaCredit) {
        simplesToPay = sellingPrice * (params.simplesNacionalRate / 100);
        cbsDebit = sellingPrice * cbsRateEffective;
        ibsDebit = sellingPrice * ibsRateEffective;
        ivaCreditForClient = cbsDebit + ibsDebit;
      } else {
        simplesToPay = sellingPrice * (params.simplesNacionalRate / 100);
        cbsDebit = 0;
        ibsDebit = 0;
        ivaCreditForClient = 0;
      }
    }

    cbsTaxToPay = cbsDebit - cbsCredit;
    ibsTaxToPay = ibsDebit - ibsCredit;
    
    if (params.taxRegime === TaxRegime.LucroPresumido || params.taxRegime === TaxRegime.LucroReal) {
      taxToPay = cbsTaxToPay + ibsTaxToPay + irpjToPay + csllToPay + selectiveTaxToPay;
    } else {
      if (params.generateIvaCredit) {
        taxToPay = simplesToPay + cbsTaxToPay + ibsTaxToPay + selectiveTaxToPay;
      } else {
        taxToPay = simplesToPay + selectiveTaxToPay;
      }
    }

    markupPercentage = product.cost > 0 ? ((sellingPrice - product.cost) / product.cost) * 100 : 0;
    valueForTaxes = taxToPay;
    valueForVariableExpenses = sellingPrice * (totalVariableExpensesPercentage / 100);
    valueForFixedCost = fixedCostPerCommercialUnit;
    valueForProfit = sellingPrice * (params.profitMargin / 100);
    contributionMargin = sellingPrice - (product.cost + valueForVariableExpenses);
  }

  const innerQty = product.innerQuantity > 0 ? product.innerQuantity : 1;
  const costPerInnerUnit = product.cost / innerQty;
  const effectiveCostPerInnerUnit = effectiveCost / innerQty;
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
  let suggestedIcmsCstOrCsosn = '102';
  if (isIcmsST) {
    suggestedIcmsCstOrCsosn = '500';
  }
  let suggestedPisCofinsCst = '01';
  if (isPisCofinsMonofasico) {
    suggestedPisCofinsCst = '04';
  }

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
    valueForTaxes: Math.max(0, valueForTaxes),
    valueForVariableExpenses: Math.max(0, valueForVariableExpenses),
    valueForFixedCost: Math.max(0, valueForFixedCost),
    valueForProfit: Math.max(0, valueForProfit),
    contributionMargin: contributionMargin,
    ivaCreditForClient: Math.max(0, ivaCreditForClient),
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
    taxAnalysis: {
      icms: icmsClassification,
      pisCofins: pisCofinsClassification,
      wasNcmFound: wasNcmFound,
      incideIS: incideIS,
    },
    suggestedCodes: {
      icmsCstOrCsosn: suggestedIcmsCstOrCsosn,
      pisCofinsCst: suggestedPisCofinsCst,
    },
    cClassTrib: cClassTrib,
  };
};