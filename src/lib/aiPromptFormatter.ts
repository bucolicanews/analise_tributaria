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
  };
  productAnalysis: {
    ncmGroups: AggregatedNcmData[];
  };
}

interface AggregatedNcmData {
  ncm: string;
  itemCount: number;
  revenueShare: number;
  averageSalePrice: number;
  essentialityLC214: string;
  selectiveTaxExposure: boolean;
  supplierType: string;
  customerMix: { b2c: number; b2b: number };
  interestateMix: number;
}

const defaultStrategicData: StrategicData = {
  purchaseProfile: { supplierType: 'distribuidor', creditEligible: true },
  salesProfile: { customerType: 'B2C', percentageB2B: 0, interestateSalesPercent: 0 },
  regulatoryRisk: { essentialFoodCandidate: false, healthTaxRisk: false, essentiality: 'standard' },
};

export const createOptimizedAIPayload = (
  params: CalculationParams,
  summary: GlobalSummaryData,
  products: CalculatedProduct[],
): ProfessionalAIPayload => {
  
  const ncmMap = new Map<string, {
    itemCount: number;
    totalRevenue: number;
    essentialityCounts: Record<string, number>;
    hasSelectiveTax: boolean;
    supplierTypes: Record<string, number>;
    customerTypes: Record<string, number>;
    totalInterestatePercent: number;
  }>();

  let globalInterestateSum = 0;

  for (const p of products) {
    const ncm = p.ncm || "N/A";
    const strategic = p.strategicData || defaultStrategicData;
    globalInterestateSum += strategic.salesProfile.interestateSalesPercent;

    if (!ncmMap.has(ncm)) {
      ncmMap.set(ncm, {
        itemCount: 0, totalRevenue: 0, hasSelectiveTax: false,
        essentialityCounts: {}, supplierTypes: {}, customerTypes: {}, totalInterestatePercent: 0
      });
    }

    const group = ncmMap.get(ncm)!;
    group.itemCount++;
    group.totalRevenue += (p.sellingPrice * p.quantity);
    group.totalInterestatePercent += strategic.salesProfile.interestateSalesPercent;
    
    const ess = strategic.regulatoryRisk.essentiality;
    group.essentialityCounts[ess] = (group.essentialityCounts[ess] || 0) + 1;
    
    group.supplierTypes[strategic.purchaseProfile.supplierType] = (group.supplierTypes[strategic.purchaseProfile.supplierType] || 0) + 1;
    group.customerTypes[strategic.salesProfile.customerType] = (group.customerTypes[strategic.salesProfile.customerType] || 0) + 1;
    if (p.taxAnalysis.incideIS) group.hasSelectiveTax = true;
  }

  const ncmGroups: AggregatedNcmData[] = Array.from(ncmMap.entries()).map(([ncm, data]) => {
    const dominantEss = Object.keys(data.essentialityCounts).reduce((a, b) => data.essentialityCounts[a] > data.essentialityCounts[b] ? a : b, 'standard');
    return {
      ncm,
      itemCount: data.itemCount,
      revenueShare: summary.totalSelling > 0 ? data.totalRevenue / summary.totalSelling : 0,
      averageSalePrice: data.itemCount > 0 ? data.totalRevenue / data.itemCount : 0,
      essentialityLC214: dominantEss,
      selectiveTaxExposure: data.hasSelectiveTax,
      supplierType: Object.keys(data.supplierTypes).reduce((a, b) => data.supplierTypes[a] > data.supplierTypes[b] ? a : b, 'distribuidor'),
      customerMix: { b2c: 1, b2b: 0 },
      interestateMix: data.totalInterestatePercent / data.itemCount
    };
  });

  return {
    objective: "Realizar auditoria fiscal e planejamento preventivo para a transição do IBS/CBS (2026-2033), considerando essencialidade e créditos interestaduais.",
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
      interestateSalesAvgPercent: products.length > 0 ? globalInterestateSum / products.length : 0
    },
    productAnalysis: { ncmGroups }
  };
};