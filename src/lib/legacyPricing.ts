import { Product, CalculationParams } from "@/types/pricing";

export interface LegacyCalculationResult {
  totalRevenue: number;
  totalTax: number;
  totalAcquisitionCost: number;
  totalVariableExpenses: number;
  totalFixedCosts: number;
  netProfit: number;
  taxBreakdown: {
    pis: number;
    cofins: number;
    icms: number;
    irpj: number;
    csll: number;
  };
}

export const calculateLegacyPricing = (
  products: Product[],
  params: CalculationParams
): LegacyCalculationResult => {
  const PIS_RATE = 0.0065;
  const COFINS_RATE = 0.03;
  const ICMS_RATE = 0.18; 
  const IRPJ_PRESUMPTION = 0.08; 
  const CSLL_PRESUMPTION = 0.12; 
  const IRPJ_RATE = 0.15;
  const CSLL_RATE = 0.09;

  const totalAcquisitionCost = products.reduce((sum, p) => sum + p.cost * p.quantity, 0);
  const totalVariableExpensesPercent = params.variableExpenses.reduce((s, e) => s + e.percentage, 0) / 100;
  
  // No legado, a receita é baseada no custo real atual
  const totalRevenue = totalAcquisitionCost / (1 - totalVariableExpensesPercent - PIS_RATE - COFINS_RATE - ICMS_RATE - (IRPJ_PRESUMPTION * IRPJ_RATE) - (CSLL_PRESUMPTION * CSLL_RATE));

  const pis = totalRevenue * PIS_RATE;
  const cofins = totalRevenue * COFINS_RATE;
  const icms = totalRevenue * ICMS_RATE;
  const irpj = (totalRevenue * IRPJ_PRESUMPTION) * IRPJ_RATE;
  const csll = (totalRevenue * CSLL_PRESUMPTION) * CSLL_RATE;

  const totalTax = pis + cofins + icms + irpj + csll;
  const totalVariableExpenses = totalRevenue * totalVariableExpensesPercent;
  const totalFixedCosts = params.fixedCostsTotal || 0;

  const netProfit = totalRevenue - totalAcquisitionCost - totalVariableExpenses - totalFixedCosts - totalTax;

  return {
    totalRevenue,
    totalTax,
    totalAcquisitionCost,
    totalVariableExpenses,
    totalFixedCosts,
    netProfit,
    taxBreakdown: { pis, cofins, icms, irpj, csll },
  };
};