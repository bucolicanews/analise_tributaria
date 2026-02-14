import { CalculationParams, CalculatedProduct, TaxRegime } from "@/types/pricing";
import { GlobalSummaryData } from "@/components/ProductsTable";

// Interfaces para o novo payload estruturado
interface OptimizedAIPayload {
  objective: string;
  context: {
    taxRegime: TaxRegime;
    parameters: {
      targetProfitMargin: number;
      lossPercentage: number;
      variableExpensesPercentage: number;
      totalFixedCosts: number;
    };
  };
  financialSummary: {
    totalRevenue: number;
    netProfit: number;
    netProfitMargin: number;
    breakEvenPoint: number;
  };
  productAnalysis: {
    ncmGroups: AggregatedNcmData[];
  };
}

interface AggregatedNcmData {
  ncm: string;
  itemCount: number;
  averageSellingPrice: number;
  averageProfitMargin: number;
  hasSelectiveTax: boolean;
  selectiveTaxRate?: number;
  cClassTrib?: number;
}

/**
 * Cria um payload JSON otimizado para a análise de IA.
 * Agrupa produtos por NCM para reduzir redundância e foca em dados estruturados.
 * @param params Parâmetros de cálculo globais.
 * @param summary Resumo financeiro global.
 * @param products Lista de produtos calculados.
 * @returns Um objeto JSON estruturado e otimizado.
 */
export const createOptimizedAIPayload = (
  params: CalculationParams,
  summary: GlobalSummaryData,
  products: CalculatedProduct[],
): OptimizedAIPayload => {
  
  // 1. Agrupar produtos por NCM
  const ncmMap = new Map<string, {
    itemCount: number;
    totalSellingPrice: number;
    totalProfit: number;
    hasSelectiveTax: boolean;
    selectiveTaxRateSum: number;
    cClassTrib?: number;
  }>();

  for (const p of products) {
    const ncm = p.ncm || "N/A";
    if (!ncmMap.has(ncm)) {
      ncmMap.set(ncm, {
        itemCount: 0,
        totalSellingPrice: 0,
        totalProfit: 0,
        hasSelectiveTax: false,
        selectiveTaxRateSum: 0,
        cClassTrib: p.cClassTrib,
      });
    }

    const group = ncmMap.get(ncm)!;
    group.itemCount++;
    group.totalSellingPrice += p.sellingPrice * p.quantity;
    group.totalProfit += p.valueForProfit * p.quantity;
    
    if (p.taxAnalysis.incideIS) {
      group.hasSelectiveTax = true;
      const selectiveTaxRate = p.sellingPrice > 0 ? (p.selectiveTaxToPay / p.sellingPrice) * 100 : 0;
      group.selectiveTaxRateSum += selectiveTaxRate;
    }
  }

  // 2. Finalizar o cálculo das médias e formatar a saída
  const ncmGroups: AggregatedNcmData[] = Array.from(ncmMap.entries()).map(
    ([ncm, data]) => {
      const averageSellingPrice = data.itemCount > 0 ? data.totalSellingPrice / data.itemCount : 0;
      const averageProfit = data.itemCount > 0 ? data.totalProfit / data.itemCount : 0;
      const averageProfitMargin = averageSellingPrice > 0 ? (averageProfit / averageSellingPrice) : 0;
      const averageSelectiveTaxRate = data.hasSelectiveTax && data.itemCount > 0 ? data.selectiveTaxRateSum / data.itemCount : undefined;

      return {
        ncm,
        itemCount: data.itemCount,
        averageSellingPrice,
        averageProfitMargin,
        hasSelectiveTax: data.hasSelectiveTax,
        selectiveTaxRate: averageSelectiveTaxRate,
        cClassTrib: data.cClassTrib,
      };
    }
  );

  // 3. Montar o payload final
  const payload: OptimizedAIPayload = {
    objective: "Análise tributária estratégica da Reforma Tributária Brasileira",
    context: {
      taxRegime: params.taxRegime,
      parameters: {
        targetProfitMargin: params.profitMargin / 100,
        lossPercentage: params.lossPercentage / 100,
        variableExpensesPercentage: params.variableExpenses.reduce((acc, curr) => acc + curr.percentage, 0) / 100,
        totalFixedCosts: params.fixedCostsTotal || 0,
      },
    },
    financialSummary: {
      totalRevenue: summary.totalSelling,
      netProfit: summary.totalProfit,
      netProfitMargin: summary.profitMarginPercent / 100,
      breakEvenPoint: summary.breakEvenPoint,
    },
    productAnalysis: {
      ncmGroups,
    },
  };

  return payload;
};