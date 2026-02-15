import { Product, CalculationParams, TaxRegime } from "@/types/pricing";

export interface LegacyCalculationResult {
  regime: TaxRegime;
  totalRevenue: number;
  totalTax: number;
  totalAcquisitionCost: number;
  totalVariableExpenses: number;
  totalFixedCosts: number;
  netProfit: number;
  breakEvenPoint: number;
  taxBreakdown: {
    pis?: number;
    cofins?: number;
    icms?: number;
    irpj?: number;
    csll?: number;
    simples?: number;
  };
}

export const calculateLegacyPricing = (
  products: Product[],
  params: CalculationParams
): LegacyCalculationResult => {
  const totalAcquisitionCost = products.reduce((sum, p) => sum + p.cost * p.quantity, 0);
  const totalVariableExpensesPercent = params.variableExpenses.reduce((s, e) => s + e.percentage, 0) / 100;
  const totalFixedCosts = params.fixedCostsTotal || 0;

  let totalRevenue = 0;
  let taxBreakdown: any = {};
  let totalTax = 0;
  let totalTaxRate = 0;

  if (params.taxRegime === TaxRegime.SimplesNacional) {
    totalTaxRate = params.simplesNacionalRate / 100;
    totalRevenue = totalAcquisitionCost / (1 - totalVariableExpensesPercent - totalTaxRate);
    totalTax = totalRevenue * totalTaxRate;
    taxBreakdown = { simples: totalTax };
  } else {
    const PIS_RATE = 0.0065;
    const COFINS_RATE = 0.03;
    const ICMS_RATE = 0.18; 
    const IRPJ_PRESUMPTION = 0.08; 
    const CSLL_PRESUMPTION = 0.12; 
    const IRPJ_RATE = 0.15;
    const CSLL_RATE = 0.09;
    
    totalTaxRate = PIS_RATE + COFINS_RATE + ICMS_RATE + (IRPJ_PRESUMPTION * IRPJ_RATE) + (CSLL_PRESUMPTION * CSLL_RATE);
    totalRevenue = totalAcquisitionCost / (1 - totalVariableExpensesPercent - totalTaxRate);

    taxBreakdown = {
      pis: totalRevenue * PIS_RATE,
      cofins: totalRevenue * COFINS_RATE,
      icms: totalRevenue * ICMS_RATE,
      irpj: (totalRevenue * IRPJ_PRESUMPTION) * IRPJ_RATE,
      csll: (totalRevenue * CSLL_PRESUMPTION) * CSLL_RATE,
    };
    totalTax = Object.values(taxBreakdown).reduce((a: any, b: any) => a + b, 0) as number;
  }

  const totalVariableExpenses = totalRevenue * totalVariableExpensesPercent;
  const netProfit = totalRevenue - totalAcquisitionCost - totalVariableExpenses - totalFixedCosts - totalTax;

  // Cálculo do Ponto de Equilíbrio: Custo Fixo / Margem de Contribuição %
  // Margem de Contribuição % = 1 - (Custo Mercadoria % + Desp Var % + Impostos %)
  const costOfGoodsPercent = totalAcquisitionCost / totalRevenue;
  const contributionMarginRatio = 1 - (costOfGoodsPercent + totalVariableExpensesPercent + totalTaxRate);
  const breakEvenPoint = contributionMarginRatio > 0 ? totalFixedCosts / contributionMarginRatio : 0;

  return {
    regime: params.taxRegime,
    totalRevenue,
    totalTax,
    totalAcquisitionCost,
    totalVariableExpenses,
    totalFixedCosts,
    netProfit,
    breakEvenPoint,
    taxBreakdown,
  };
};