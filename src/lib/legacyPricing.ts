import { Product, CalculationParams } from "@/types/pricing";

// Interface simplificada para o resultado do cálculo legado
export interface LegacyCalculationResult {
  totalRevenue: number;
  totalTax: number;
  netProfit: number;
  taxBreakdown: {
    pis: number;
    cofins: number;
    icms: number;
    irpj: number;
    csll: number;
  };
}

/**
 * Simula a precificação e tributação sob as regras do Lucro Presumido ANTES da reforma.
 * NOTA: Esta é uma simulação simplificada para fins de comparação.
 * @param products Lista de produtos da nota.
 * @param params Parâmetros globais de custo e margem.
 * @returns Um objeto com os resultados financeiros do cenário legado.
 */
export const calculateLegacyPricing = (
  products: Product[],
  params: CalculationParams
): LegacyCalculationResult => {
  // Premissas para o Lucro Presumido (simplificado)
  const PIS_RATE = 0.0065;
  const COFINS_RATE = 0.03;
  const ICMS_RATE = 0.18; // Alíquota média de ICMS, pode variar.
  const IRPJ_PRESUMPTION = 0.08; // Presunção de lucro para IRPJ (comércio)
  const CSLL_PRESUMPTION = 0.12; // Presunção de lucro para CSLL (comércio)
  const IRPJ_RATE = 0.15;
  const CSLL_RATE = 0.09;

  // 1. Calcular a Receita Bruta Total
  // Para uma comparação justa, usamos o mesmo preço de venda do cenário da reforma.
  // A ideia é ver o impacto tributário sobre a mesma receita.
  const totalRevenue = products.reduce((sum, p) => {
    // Precisamos de um preço de venda base. Vamos usar o custo + margem como proxy.
    // Isso é uma simplificação, pois o preço de venda na realidade já embute os impostos.
    // Para o propósito da simulação de impacto, vamos assumir que a receita é a mesma.
    const cost = p.cost * p.quantity;
    const profit = cost * (params.profitMargin / 100);
    // Um preço de venda simplificado para ter uma base de receita
    return sum + (cost / (1 - (params.profitMargin / 100) - (params.variableExpenses.reduce((s, e) => s + e.percentage, 0) / 100)));
  }, 0);

  // 2. Calcular Impostos sobre o Faturamento
  const pis = totalRevenue * PIS_RATE;
  const cofins = totalRevenue * COFINS_RATE;
  const icms = totalRevenue * ICMS_RATE;

  // 3. Calcular IRPJ e CSLL sobre o Lucro Presumido
  const presumedProfitIrpj = totalRevenue * IRPJ_PRESUMPTION;
  const irpj = presumedProfitIrpj * IRPJ_RATE;

  const presumedProfitCsll = totalRevenue * CSLL_PRESUMPTION;
  const csll = presumedProfitCsll * CSLL_RATE;

  const totalTax = pis + cofins + icms + irpj + csll;

  // 4. Calcular Custos e Lucro
  const totalAcquisitionCost = products.reduce((sum, p) => sum + p.cost * p.quantity, 0);
  const totalVariableExpenses = totalRevenue * (params.variableExpenses.reduce((s, e) => s + e.percentage, 0) / 100);
  const totalFixedCosts = params.fixedCostsTotal || 0;

  const netProfit = totalRevenue - totalAcquisitionCost - totalVariableExpenses - totalFixedCosts - totalTax;

  return {
    totalRevenue,
    totalTax,
    netProfit,
    taxBreakdown: { pis, cofins, icms, irpj, csll },
  };
};