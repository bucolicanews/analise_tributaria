import { CalculationParams, CalculatedProduct, TaxRegime } from "@/types/pricing";
import { GlobalSummaryData } from "@/components/ProductsTable";
import { getClassificationDetails } from "./tax/taxClassificationService";

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
# ANÁLISE TRIBUTÁRIA E DE PRECIFICAÇÃO (BASE: LC 214/2025 e LC 227/2026)

Você é um Especialista em Tributação e Estratégia de Negócios, focado na Reforma Tributária Brasileira (IVA Dual).
Sua tarefa é analisar os dados de precificação abaixo, validar a classificação tributária e fornecer um parecer estratégico sobre a saúde financeira da operação.

## 1. Resumo Executivo da Operação (Cenário Simulado)

- **Regime Tributário:** ${params.taxRegime}${params.taxRegime === TaxRegime.SimplesNacional ? (params.generateIvaCredit ? " (Híbrido)" : " (Padrão)") : ""}
- **Margem de Lucro Alvo:** ${formatPercent(params.profitMargin)}
- **Custos Fixos Totais (CFT):** ${formatCurrency(totalFixedExpenses)}
- **Estoque Total de Unidades (ETU):** ${formatNumber(params.totalStockUnits)}
- **Custo Fixo por Unidade (CFU):** ${formatCurrency(cfu)}
- **Porcentagem de Perdas:** ${formatPercent(params.lossPercentage)}

**Resultados Globais da Nota Fiscal:**
- **Venda Total Sugerida:** ${formatCurrency(summary.totalSelling)}
- **Impostos Líquidos Totais:** ${formatCurrency(summary.totalTax)} (${formatPercent(summary.totalTaxPercent)} da Venda)
- **Lucro Líquido Total:** ${formatCurrency(summary.totalProfit)} (${formatPercent(summary.profitMarginPercent)} da Venda)
- **Ponto de Equilíbrio (Faturamento Mensal Mínimo):** ${formatCurrency(summary.breakEvenPoint)}

---

## 2. Detalhamento dos Produtos Analisados

`;

  products.forEach((p, index) => {
    const classificationDetails = p.cClassTrib ? getClassificationDetails(p.cClassTrib) : null;
    const cClassDescription = classificationDetails?.cClass?.name || "Não classificado";

    // Recalculate cost breakdown for clarity in the prompt
    const fixedCostPerCommercialUnit = cfu * p.innerQuantity;
    const costBeforeLoss = p.cost + fixedCostPerCommercialUnit;
    const costAdjustedForLoss = params.lossPercentage > 0 && params.lossPercentage < 100 
      ? costBeforeLoss / (1 - params.lossPercentage / 100)
      : costBeforeLoss;
    const lossValue = costAdjustedForLoss - costBeforeLoss;

    const productProfit = p.sellingPrice - costAdjustedForLoss - p.taxToPay - p.valueForVariableExpenses;
    const productProfitMargin = p.sellingPrice > 0 ? (productProfit / p.sellingPrice) * 100 : 0;

    prompt += `
### Produto ${index + 1}: ${p.name} (Cód: ${p.code})
**Quantidade na Nota:** ${p.quantity} ${p.unit}

**A. Análise Tributária (Reforma):**
- **NCM:** ${p.ncm || "N/A"}
- **Imposto Seletivo (IS):** ${p.taxAnalysis.incideIS ? `Sim, alíquota de ${formatPercent(p.selectiveTaxToPay > 0 && p.sellingPrice > 0 ? (p.selectiveTaxToPay / p.sellingPrice * 100) : 0)} aplicada.` : "Não"}
- **Classificação IBS/CBS (cClassTrib):** \`${p.cClassTrib} - ${cClassDescription}\`
- **Validação da Classificação:** ${p.taxAnalysis.wasNcmFound ? "Automática (baseada no NCM)." : "Padrão (NCM não encontrado em listas de exceção)."}

**B. Composição do Custo Unitário (por ${p.unit}):**
- Custo de Aquisição (Bruto): ${formatCurrency(p.cost)}
- (+) Custo Fixo Rateado (CFU): ${formatCurrency(fixedCostPerCommercialUnit)}
- (+) Ajuste de Perdas (${formatPercent(params.lossPercentage)}): ${formatCurrency(lossValue)}
- **(=) Custo Total Base para Markup:** **${formatCurrency(costAdjustedForLoss)}**

**C. Composição do Preço de Venda Unitário (por ${p.unit}):**
- Preço de Venda Sugerido: ${formatCurrency(p.sellingPrice)}
- (-) Custo Total Base: ${formatCurrency(costAdjustedForLoss)}
- (-) Impostos Líquidos: ${formatCurrency(p.taxToPay)}
- (-) Despesas Variáveis: ${formatCurrency(p.valueForVariableExpenses)}
- **(=) Lucro Líquido Unitário:** **${formatCurrency(productProfit)}** (${formatPercent(productProfitMargin)})
---
`;
  });

  prompt += `
## TAREFA PARA A IA:

Com base em todos os dados fornecidos, realize uma análise estratégica completa:

1.  **Validação da Classificação Tributária:** Para cada produto, confirme se a \`cClassTrib\` atribuída está correta com base no NCM e nas regras da Reforma Tributária (Cesta Básica, Saúde, Educação, etc.). Se identificar uma classificação incorreta, aponte o erro e sugira a classificação correta.
2.  **Análise de Rentabilidade:** Avalie a saúde financeira da operação. O lucro líquido total e unitário é sustentável? A margem de lucro alvo está sendo atingida?
3.  **Impacto dos Custos:** Analise a composição dos custos. O Custo Fixo Rateado (CFU) ou o percentual de Perdas parecem excessivos? Eles estão impactando significativamente a margem?
4.  **Parecer Estratégico Final:** Forneça uma conclusão clara. A precificação está correta? Quais são os maiores riscos e oportunidades? Dê recomendações práticas para otimizar a carga tributária e aumentar a lucratividade.

**FORMATO DE RESPOSTA:** Use Markdown. Comece com um "Parecer Final" em destaque, seguido por uma tabela detalhando os produtos que necessitam de correção (se houver) e, por fim, a análise detalhada dos pontos de rentabilidade e custos.
`;

  return prompt.trim();
};