import { CalculationParams, CalculatedProduct, TaxRegime, StrategicData } from "@/types/pricing";
import { GlobalSummaryData } from "@/components/ProductsTable";

interface ProfessionalAIPayload {
  objective: string;
  companyProfile: {
    name?: string;
    cnpj?: string;
    cnaes?: string[];
    state: string;
    legalNature: string;
  };
  context: {
    taxRegime: TaxRegime;
    timeframe: "Mensal" | "Anual";
    parameters: {
      targetProfitMargin: number;
      lossPercentage: number;
      variableExpensesPercentage: number;
      totalFixedCosts: number;
      effectiveSimplesRate?: number;
    };
  };
  financialSummary: {
    totalRevenue: number;
    netProfit: number;
    netProfitMargin: number;
    breakEvenPoint: number;
    taxPressurePercent: number;
    interestateSalesAvgPercent: number;
    financialConsistencyScore: number; 
    stCapitalLockValue: number; // Valor de ST embutido que bloqueia capital
    expectedWorkingCapitalReleasePercent: number; // Expectativa de liberação de caixa
  };
  productAnalysis: {
    ncmGroups: AggregatedNcmData[];
    transitionRiskScore: number; 
    taxImpactProjectionPercent: number; // Impacto projetado na carga tributária
  };
}

interface AggregatedNcmData {
  ncm: string;
  itemCount: number;
  revenueShare: number;
  averageSalePrice: number;
  averageCost: number;
  grossMarginPercent: number;
  essentialityCategory: string; // Granular: cesta_basica, reduzida, etc
  selectiveTaxExposure: boolean;
  supplierRegimeMix: Record<string, number>;
  customerMix: { b2c: number; b2b: number };
  stImpactValue: number;
}

const defaultStrategicData: StrategicData = {
  purchaseProfile: { supplierType: 'distribuidor', supplierRegime: 'desconhecido', creditEligible: true },
  salesProfile: { customerType: 'B2C', percentageB2B: 0, interestateSalesPercent: 0 },
  regulatoryRisk: { essentialFoodCandidate: false, healthTaxRisk: false, essentiality: 'standard' },
};

export const createOptimizedAIPayload = (
  params: CalculationParams,
  summary: GlobalSummaryData,
  products: CalculatedProduct[],
): ProfessionalAIPayload => {
  
  let stCapitalLockValue = 0;
  const ncmMap = new Map<string, {
    itemCount: number;
    totalRevenue: number;
    totalCost: number;
    essentialityCounts: Record<string, number>;
    hasSelectiveTax: boolean;
    supplierRegimes: Record<string, number>;
    customerTypes: Record<string, number>;
    totalInterestatePercent: number;
    stValue: number;
  }>();

  let globalInterestateSum = 0;

  for (const p of products) {
    const ncm = p.ncm || "N/A";
    const strategic = p.strategicData || defaultStrategicData;
    globalInterestateSum += strategic.salesProfile.interestateSalesPercent;

    if (!ncmMap.has(ncm)) {
      ncmMap.set(ncm, {
        itemCount: 0, totalRevenue: 0, totalCost: 0, hasSelectiveTax: false,
        essentialityCounts: {}, supplierRegimes: {}, customerTypes: {}, totalInterestatePercent: 0, stValue: 0
      });
    }

    const group = ncmMap.get(ncm)!;
    group.itemCount++;
    group.totalRevenue += (p.sellingPrice * p.quantity);
    group.totalCost += (p.cost * p.quantity);
    group.totalInterestatePercent += strategic.salesProfile.interestateSalesPercent;
    
    const ess = strategic.regulatoryRisk.essentiality;
    group.essentialityCounts[ess] = (group.essentialityCounts[ess] || 0) + 1;
    
    const regime = strategic.purchaseProfile.supplierRegime;
    group.supplierRegimes[regime] = (group.supplierRegimes[regime] || 0) + 1;
    
    group.customerTypes[strategic.salesProfile.customerType] = (group.customerTypes[strategic.salesProfile.customerType] || 0) + 1;
    
    if (p.taxAnalysis.incideIS) group.hasSelectiveTax = true;
    
    // Estimativa de Capital Preso em ST (valor de compra com ST vs custo limpo)
    if (p.taxAnalysis.icms === 'Substituição Tributária') {
      const stEstimated = p.cost * 0.15; // Estimativa conservadora de MVA/ST
      group.stValue += stEstimated;
      stCapitalLockValue += (stEstimated * p.quantity);
    }
  }

  const ncmGroups: AggregatedNcmData[] = Array.from(ncmMap.entries()).map(([ncm, data]) => {
    const dominantEss = Object.keys(data.essentialityCounts).reduce((a, b) => data.essentialityCounts[a] > data.essentialityCounts[b] ? a : b, 'standard');
    return {
      ncm,
      itemCount: data.itemCount,
      revenueShare: summary.totalSelling > 0 ? data.totalRevenue / summary.totalSelling : 0,
      averageSalePrice: data.itemCount > 0 ? data.totalRevenue / data.itemCount : 0,
      averageCost: data.itemCount > 0 ? data.totalCost / data.itemCount : 0,
      grossMarginPercent: data.totalRevenue > 0 ? ((data.totalRevenue - data.totalCost) / data.totalRevenue) * 100 : 0,
      essentialityCategory: dominantEss,
      selectiveTaxExposure: data.hasSelectiveTax,
      supplierRegimeMix: data.supplierRegimes,
      customerMix: { b2c: 1, b2b: 0 },
      interestateMix: data.totalInterestatePercent / data.itemCount,
      stImpactValue: data.stValue
    };
  });

  const avgMargin = ncmGroups.reduce((acc, g) => acc + g.grossMarginPercent, 0) / (ncmGroups.length || 1);
  const stDependency = ncmGroups.filter(g => g.stImpactValue > 0).length / (ncmGroups.length || 1);
  const riskScore = Math.min(100, (stDependency * 40) + (avgMargin < 20 ? 30 : 0) + (ncmGroups.some(g => g.selectiveTaxExposure) ? 30 : 0));

  const consistencyScore = summary.totalSelling >= summary.breakEvenPoint ? 100 : Math.max(0, (summary.totalSelling / summary.breakEvenPoint) * 100);

  return {
    objective: "Análise consultiva Big4 de transição para EC 132/2023. Foco em liberação de capital de giro por fim da ST, impacto na margem líquida e creditamento B2B.",
    companyProfile: {
      name: params.companyName,
      cnpj: params.companyCnpj,
      state: params.companyState || "SP",
      cnaes: params.companyCnaes?.split(','),
      legalNature: params.companyLegalNature || "ME/EPP"
    },
    context: {
      taxRegime: params.taxRegime,
      timeframe: "Mensal",
      parameters: {
        targetProfitMargin: params.profitMargin / 100,
        lossPercentage: params.lossPercentage / 100,
        variableExpensesPercentage: params.variableExpenses.reduce((a, b) => a + b.percentage, 0) / 100,
        totalFixedCosts: params.fixedCostsTotal || 0,
        effectiveSimplesRate: params.simplesNacionalRate
      }
    },
    financialSummary: {
      totalRevenue: summary.totalSelling,
      netProfit: summary.totalProfit,
      netProfitMargin: summary.profitMarginPercent / 100,
      breakEvenPoint: summary.breakEvenPoint,
      taxPressurePercent: summary.totalTaxPercent / 100,
      interestateSalesAvgPercent: products.length > 0 ? globalInterestateSum / products.length : 0,
      financialConsistencyScore: consistencyScore,
      stCapitalLockValue,
      expectedWorkingCapitalReleasePercent: (stCapitalLockValue / summary.totalSelling) * 100
    },
    productAnalysis: { 
      ncmGroups,
      transitionRiskScore: riskScore,
      taxImpactProjectionPercent: (params.ibsRate + params.cbsRate) - summary.totalTaxPercent
    }
  };
};