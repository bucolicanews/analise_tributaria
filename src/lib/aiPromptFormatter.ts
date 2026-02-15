import { CalculationParams, CalculatedProduct, TaxRegime, StrategicData } from "@/types/pricing";
import { GlobalSummaryData } from "@/components/ProductsTable";

interface ProfessionalAIPayload {
  objective: string;
  companyProfile: {
    name?: string;
    cnpj?: string;
    cnaes?: string[];
    legalNature?: string;
  };
  context: {
    taxRegime: TaxRegime;
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
  };
  productAnalysis: {
    ncmGroups: AggregatedNcmData[];
  };
  auditSummary?: {
    totalItems: number;
    divergentItems: number;
    riskLevel: 'Baixo' | 'Médio' | 'Alto';
  };
}

interface AggregatedNcmData {
  ncm: string;
  itemCount: number;
  annualRevenueShare: number;
  averageSalePrice: number;
  averageCost: number;
  selectiveTaxExposure: boolean;
  supplierType: string;
  customerMix: {
    b2c: number;
    b2b: number;
  };
  essentialRisk: boolean;
  suggestedTaxStatus: string;
}

const defaultStrategicData: StrategicData = {
  purchaseProfile: { supplierType: 'distribuidor', creditEligible: true },
  salesProfile: { customerType: 'B2C', percentageB2B: 0 },
  regulatoryRisk: { essentialFoodCandidate: false, healthTaxRisk: false },
};

export const createOptimizedAIPayload = (
  params: CalculationParams,
  summary: GlobalSummaryData,
  products: CalculatedProduct[],
): ProfessionalAIPayload => {
  
  const ncmMap = new Map<string, {
    itemCount: number;
    totalRevenue: number;
    totalCost: number;
    hasSelectiveTax: boolean;
    supplierTypes: Record<string, number>;
    customerTypes: Record<string, number>;
    essentialCandidates: number;
    dominantStatus: string;
  }>();

  for (const p of products) {
    const ncm = p.ncm || "N/A";
    const strategic = p.strategicData || defaultStrategicData;

    if (!ncmMap.has(ncm)) {
      ncmMap.set(ncm, {
        itemCount: 0,
        totalRevenue: 0,
        totalCost: 0,
        hasSelectiveTax: false,
        supplierTypes: {},
        customerTypes: {},
        essentialCandidates: 0,
        dominantStatus: p.taxAnalysis.icms
      });
    }

    const group = ncmMap.get(ncm)!;
    const productRevenue = p.sellingPrice * p.quantity;
    const productCost = p.cost * p.quantity;

    group.itemCount++;
    group.totalRevenue += productRevenue;
    group.totalCost += productCost;
    if (p.taxAnalysis.incideIS) group.hasSelectiveTax = true;
    if (strategic.regulatoryRisk.essentialFoodCandidate) group.essentialCandidates++;
    
    group.supplierTypes[strategic.purchaseProfile.supplierType] = (group.supplierTypes[strategic.purchaseProfile.supplierType] || 0) + 1;
    group.customerTypes[strategic.salesProfile.customerType] = (group.customerTypes[strategic.salesProfile.customerType] || 0) + 1;
  }

  const ncmGroups: AggregatedNcmData[] = Array.from(ncmMap.entries()).map(
    ([ncm, data]) => {
      const dominantSupplier = Object.keys(data.supplierTypes).reduce((a, b) => data.supplierTypes[a] > data.supplierTypes[b] ? a : b, 'desconhecido');
      const dominantCustomer = Object.keys(data.customerTypes).reduce((a, b) => data.customerTypes[a] > data.customerTypes[b] ? a : b, 'desconhecido');
      
      let b2c = 0, b2b = 0;
      if (dominantCustomer === 'B2C') b2c = 1;
      if (dominantCustomer === 'B2B') b2b = 1;
      if (dominantCustomer === 'misto') { b2c = 0.5; b2b = 0.5; }

      return {
        ncm,
        itemCount: data.itemCount,
        annualRevenueShare: summary.totalSelling > 0 ? data.totalRevenue / summary.totalSelling : 0,
        averageSalePrice: data.itemCount > 0 ? data.totalRevenue / data.itemCount : 0,
        averageCost: data.itemCount > 0 ? data.totalCost / data.itemCount : 0,
        selectiveTaxExposure: data.hasSelectiveTax,
        supplierType: dominantSupplier,
        customerMix: { b2c, b2b },
        essentialRisk: data.essentialCandidates > 0,
        suggestedTaxStatus: data.dominantStatus
      };
    }
  );

  return {
    objective: "Realizar análise tributária de precisão cruzando perfil de CNAEs com regimes da Reforma Tributária. Identificar riscos de bitributação (ST/Monofásico) e exposição ao Imposto Seletivo.",
    companyProfile: {
      name: params.companyName,
      cnpj: params.companyCnpj,
      cnaes: params.companyCnaes?.split(',').map(c => c.trim()),
      legalNature: params.companyLegalNature || "Não Informada",
    },
    context: {
      taxRegime: params.taxRegime,
      parameters: {
        targetProfitMargin: params.profitMargin / 100,
        lossPercentage: params.lossPercentage / 100,
        variableExpensesPercentage: params.variableExpenses.reduce((acc, curr) => acc + curr.percentage, 0) / 100,
        totalFixedCosts: params.fixedCostsTotal || 0,
        effectiveSimplesRate: params.simplesNacionalRate
      },
    },
    financialSummary: {
      totalRevenue: summary.totalSelling,
      netProfit: summary.totalProfit,
      netProfitMargin: summary.profitMarginPercent / 100,
      breakEvenPoint: summary.breakEvenPoint,
      taxPressurePercent: summary.totalTaxPercent / 100
    },
    productAnalysis: {
      ncmGroups,
    }
  };
};