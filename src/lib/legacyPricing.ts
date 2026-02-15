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
  isInviable: boolean;
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
  const targetProfitPercent = params.profitMargin / 100;

  let totalTaxRate = 0;

  if (params.taxRegime === TaxRegime.SimplesNacional) {
    totalTaxRate = params.simplesNacionalRate / 100;
  } else {
    const PIS_RATE = 0.0065;
    const COFINS_RATE = 0.03;
    const ICMS_RATE = 0.18; 
    const IRPJ_PRESUMPTION = 0.08; 
    const CSLL_PRESUMPTION = 0.12; 
    const IRPJ_RATE = 0.15;
    const CSLL_RATE = 0.09;
    totalTaxRate = PIS_RATE + COFINS_RATE + ICMS_RATE + (IRPJ_PRESUMPTION * IRPJ_RATE) + (CSLL_PRESUMPTION * CSLL_RATE);
  }

  // Divisor incluindo a margem de lucro alvo para uma comparação justa
  const divisor = 1 - totalVariableExpensesPercent - totalTaxRate - targetProfitPercent;
  
  if (divisor <= 0.01) {
    return {
      regime: params.taxRegime,
      totalRevenue: 0,
      totalTax: 0,
      totalAcquisitionCost,
      totalVariableExpenses: 0,
      totalFixedCosts,
      netProfit: -totalFixedCosts,
      breakEvenPoint: 0,
      isInviable: true,
      taxBreakdown: {},
    };
  }

  const totalRevenue = totalAcquisitionCost / divisor;
  let taxBreakdown: any = {};
  let totalTax = 0;

  if (params.taxRegime === TaxRegime.SimplesNacional) {
    totalTax = totalRevenue * totalTaxRate;
    taxBreakdown = { simples: totalTax };
  } else {
    taxBreakdown = {
      pis: totalRevenue * 0.0065,
      cofins: totalRevenue * 0.03,
      icms: totalRevenue * 0.18,
      irpj: (totalRevenue * 0.08) * 0.15,
      csll: (totalRevenue * 0.12) * 0.09,
    };
    totalTax = Object.values(taxBreakdown).reduce((a: any, b: any) => a + b, 0) as number;
  }

  const totalVariableExpenses = totalRevenue * totalVariableExpensesPercent;
  
  // Lucro Bruto (Venda - Impostos - Variáveis - Custo Produto)
  const grossProfit = totalRevenue - totalTax - totalVariableExpenses - totalAcquisitionCost;
  // Lucro Líquido (Lucro Bruto - Custos Fixos)
  const netProfit = grossProfit - totalFixedCosts;

  // Margem de Contribuição % = 1 - (Custo Produto% + Desp Var% + Impostos%)
  const costRatio = totalAcquisitionCost / totalRevenue;
  const contributionMarginRatio = 1 - (costRatio + totalVariableExpensesPercent + (totalTax / totalRevenue));
  
  const breakEvenPoint = contributionMarginRatio > 0.001 ? totalFixedCosts / contributionMarginRatio : 0;

  return {
    regime: params.taxRegime,
    totalRevenue,
    totalTax,
    totalAcquisitionCost,
    totalVariableExpenses,
    totalFixedCosts,
    netProfit,
    breakEvenPoint,
    isInviable: false,
    taxBreakdown,
  };
};