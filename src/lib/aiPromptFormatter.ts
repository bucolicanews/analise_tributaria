import { CalculationParams, CalculatedProduct, TaxRegime } from "@/types/pricing";
import { GlobalSummaryData } from "@/components/ProductsTable";

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const formatPercent = (value: number) => `${value.toFixed(2)}%`;
const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(value);

export const formatDataForAI = (
  params: CalculationParams,
  summary: GlobalSummaryData,
  products: CalculatedProduct[],
  totalFixedExpenses: number,
  cfu: number
): string => {
  let prompt = `
# Análise de Precificação e Tributação

## 1. Resumo Executivo da Operação

**Cenário Simulado:**
- **Regime Tributário:** ${params.taxRegime}${params.taxRegime === TaxRegime.SimplesNacional ? (params.generateIvaCredit ? " (Híbrido)" : " (Padrão)") : ""}
- **Margem de Lucro Alvo:** ${formatPercent(params.profitMargin)}
- **Custos Fixos Totais (CFT):** ${formatCurrency(totalFixedExpenses)}
- **Estoque Total de Unidades (ETU):** ${formatNumber(params.totalStockUnits)}
- **Custo Fixo por Unidade (CFU):** ${formatCurrency(cfu)}
- **Porcentagem de Perdas:** ${formatPercent(params.lossPercentage)}

**Resultados Globais (Cenário Alvo para ${products.length} produtos selecionados):**
- **Venda Total Sugerida:** ${formatCurrency(summary.totalSelling)}
- **Impostos Líquidos Totais:** ${formatCurrency(summary.totalTax)} (${formatPercent(summary.totalTaxPercent)} da Venda)
- **Despesas Variáveis Totais:** ${formatCurrency(summary.totalVariableExpensesValue)}
- **Lucro Líquido Total:** ${formatCurrency(summary.totalProfit)}
- **Margem de Contribuição Total:** ${formatCurrency(summary.totalContributionMargin)}
- **Ponto de Equilíbrio (Mensal):** ${formatCurrency(summary.breakEvenPoint)}

---

## 2. Detalhamento dos Produtos Selecionados

`;

  products.forEach((p, index) => {
    const fixedCostPerCommercialUnit = cfu * p.innerQuantity;
    const productProfit = p.sellingPrice - p.cost - p.taxToPay - p.valueForVariableExpenses - fixedCostPerCommercialUnit;
    const productProfitMargin = p.sellingPrice > 0 ? (productProfit / p.sellingPrice) * 100 : 0;

    prompt += `
### Produto ${index + 1}: ${p.name} (Cód: ${p.code})

- **Análise Tributária (Classificação para sua empresa):**
  - **ICMS:** ${p.taxAnalysis.icms}
  - **PIS/COFINS:** ${p.taxAnalysis.pisCofins}

- **Dados da Nota (Fornecedor):**
  - **Quantidade:** ${p.quantity} ${p.unit}
  - **Unidades Internas por Unid. Comercial:** ${p.innerQuantity}
  - **Custo de Aquisição (Unitário Comercial):** ${formatCurrency(p.cost)}
  - **CFOP:** ${p.cfop || "N/A"}
  - **NCM:** ${p.ncm || "N/A"}
  - **CEST:** ${p.cest || "N/A"}
  - **CST/CSOSN ICMS:** ${p.cst || "N/A"}
  - **CST IPI:** ${p.ipiCst || "N/A"}
  - **PIS (CST: ${p.pisCst || "N/A"}, Alíq: ${p.pisRate ? formatPercent(p.pisRate) : "N/A"}) - Valor (Crédito):** ${formatCurrency(p.pisCredit)}
  - **COFINS (CST: ${p.cofinsCst || "N/A"}, Alíq: ${p.cofinsRate ? formatPercent(p.cofinsRate) : "N/A"}) - Valor (Crédito):** ${formatCurrency(p.cofinsCredit)}

- **Cálculo de Preço (Unitário Comercial):**
  - **Custo Fixo Rateado:** ${formatCurrency(fixedCostPerCommercialUnit)}
  - **Custo Total Base (com perdas e fixo):** ${formatCurrency(p.cost + fixedCostPerCommercialUnit)}
  - **Preço de Venda Mínimo:** ${formatCurrency(p.minSellingPrice)}
  - **Preço de Venda Sugerido:** ${formatCurrency(p.sellingPrice)}

- **Resultado (Unitário Comercial):**
  - **Imposto Líquido:** ${formatCurrency(p.taxToPay)}
  - **Lucro Líquido:** ${formatCurrency(productProfit)} (${formatPercent(productProfitMargin)} da Venda)
  - **Crédito de IVA p/ Cliente:** ${formatCurrency(p.ivaCreditForClient)}
---
`;
  });

  prompt += "\n**Fim da Análise.**";

  return prompt.trim();
};