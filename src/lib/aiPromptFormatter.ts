import { CalculationParams, CalculatedProduct, TaxRegime } from "@/types/pricing";
import { GlobalSummaryData } from "@/components/ProductsTable";
import { getClassificationDetails } from "./tax/taxClassificationService";

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
const formatPercent = (value: number) => `${(value || 0).toFixed(2)}%`;

export const formatDataForAI = (
  params: CalculationParams,
  summary: GlobalSummaryData,
  products: CalculatedProduct[],
): string => {
  
  const getVariableExpensesText = () => {
    if (!params.variableExpenses || params.variableExpenses.length === 0) {
      return "Nenhuma despesa variável informada (0.00%).";
    }
    const expenseDetails = params.variableExpenses
      .map(exp => `${exp.name}: ${formatPercent(exp.percentage)}`)
      .join(", ");
    const total = params.variableExpenses.reduce((acc, curr) => acc + curr.percentage, 0);
    return `${expenseDetails} (Total: ${formatPercent(total)})`;
  };

  let prompt = `
# ANÁLISE ESTRATÉGICA DE PRECIFICAÇÃO E TRIBUTAÇÃO (REFORMA TRIBUTÁRIA)

**OBJETIVO:** Atuar como um consultor financeiro e tributário sênior. Sua missão é analisar os dados de uma simulação de precificação e fornecer um parecer estratégico, apontando riscos, oportunidades e recomendações práticas. **Seja crítico e não apenas repita os dados.**

---

## 1. CONTEXTO DA SIMULAÇÃO (PARÂMETROS FORNECIDOS PELO USUÁRIO)

Esta seção resume as premissas que o usuário configurou. Use este contexto para fundamentar sua análise e, principalmente, para **questionar premissas que pareçam irrealistas.**

- **Regime Tributário:** **${params.taxRegime}**
${params.taxRegime === TaxRegime.SimplesNacional ? `
- **Anexo do Simples Nacional:** ${params.anexoSimples || "Não informado"}
- **Faturamento Anual (Base p/ Alíquota):** ${formatCurrency(params.faturamento12Meses)}
- **Alíquota Efetiva do Simples:** ${formatPercent(params.simplesNacionalRate)}
` : ""}
- **Custos Fixos Totais (Mensal):** ${formatCurrency(params.fixedCostsTotal)}
- **Margem de Lucro Alvo (Única):** ${formatPercent(params.profitMargin)}
- **Percentual de Perdas (Quebra):** ${formatPercent(params.lossPercentage)}
- **Despesas Variáveis sobre a Venda:** ${getVariableExpensesText()}

---

## 2. RESULTADOS FINANCEIROS GLOBAIS (CÁLCULO AUTOMÁTICO)

Estes são os resultados consolidados da simulação.

- **Venda Total (Faturamento):** ${formatCurrency(summary.totalSelling)}
- **Lucro Líquido Total:** ${formatCurrency(summary.totalProfit)} (${formatPercent(summary.profitMarginPercent)} do faturamento)
- **Ponto de Equilíbrio (Faturamento Mínimo para Cobrir Custos Fixos):** **${formatCurrency(summary.breakEvenPoint)}**

---

## 3. DETALHAMENTO POR PRODUTO

Análise individual de cada item na simulação.

`;

  products.forEach((p, index) => {
    const classificationDetails = p.cClassTrib ? getClassificationDetails(p.cClassTrib) : null;
    const cClassDescription = classificationDetails?.cClass?.name || "Não classificado";
    const productProfitMargin = p.sellingPrice > 0 ? (p.valueForProfit / p.sellingPrice) * 100 : 0;

    prompt += `
### Produto ${index + 1}: ${p.name}
- **NCM:** ${p.ncm || "N/A"}
- **Preço de Venda Unitário:** ${formatCurrency(p.sellingPrice)}
- **Lucro Líquido Unitário:** ${formatCurrency(p.valueForProfit)} (${formatPercent(productProfitMargin)})
- **Imposto Seletivo (IS):** ${p.taxAnalysis.incideIS ? `Sim. Alíquota calculada: ${formatPercent(p.selectiveTaxToPay > 0 && p.sellingPrice > 0 ? (p.selectiveTaxToPay / p.sellingPrice * 100) : 0)}.` : "Não"}
  - **Nota para IA:** Se o regime for Simples Nacional, o IS ser 0.00% está **CORRETO**. Não aponte isso como um erro.
- **Classificação IBS/CBS (Sistema):** \`${p.cClassTrib} - ${cClassDescription}\` (${p.taxAnalysis.wasNcmFound ? "NCM específico" : "Classificação Padrão"})
`;
  });

  prompt += `
---

## 4. SUA TAREFA COMO CONSULTOR DE IA (SEJA CRÍTICO E PROATIVO)

Com base em **todo o contexto fornecido**, elabore uma análise estratégica concisa e acionável.

**Responda seguindo estritamente esta estrutura:**

1.  **PARECER ESTRATÉGICO (3 a 4 parágrafos):** Comece com um resumo executivo. A operação é saudável? O Ponto de Equilíbrio é realista em relação ao faturamento? Aponte os principais riscos e oportunidades.

2.  **ANÁLISE CRÍTICA DOS PARÂMETROS (Use bullet points):**
    *   **Despesas Variáveis e Perdas:** Os valores de ${formatPercent(params.lossPercentage)} para perdas e 0.00% para despesas variáveis são realistas? **Alerte o usuário sobre o impacto de custos ocultos** como taxas de cartão (geralmente 2-4%), comissões ou fretes, que podem corroer drasticamente o lucro.
    *   **Mix de Margens de Lucro:** A margem de lucro única de ${formatPercent(params.profitMargin)} é adequada para **todos** os produtos listados? Se houver categorias muito diferentes (ex: alimentos vs. eletrônicos), discuta a viabilidade e a prática de mercado de aplicar margens diferentes por categoria para otimizar a competitividade e o lucro geral.
    *   **Validação Tributária e Sugestão de NCM:** A classificação tributária dos produtos parece correta? Se você identificar um produto com nome claro (ex: "Cerveja", "Refrigerante") mas com um NCM genérico ou ausente, **sugira o NCM correto** e comente sobre o impacto que a classificação correta teria nos impostos.

3.  **RECOMENDAÇÕES FINAIS:** Dê conselhos práticos e acionáveis baseados na sua análise.
`;

  return prompt.trim();
};
