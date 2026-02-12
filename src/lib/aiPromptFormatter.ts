import { CalculationParams, CalculatedProduct, TaxRegime } from "@/types/pricing";
import { GlobalSummaryData } from "@/components/ProductsTable";
import { getClassificationDetails } from "./tax/taxClassificationService";

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const formatPercent = (value: number) => `${(value || 0).toFixed(2)}%`;
const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(value);

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

**OBJETIVO:** Atuar como um consultor financeiro e tributário sênior. Sua missão é analisar os dados de uma simulação de precificação sob as novas regras da Reforma Tributária (IVA Dual) e fornecer um parecer estratégico claro, apontando riscos, oportunidades e fornecendo recomendações práticas.

---

## 1. CONTEXTO DA SIMULAÇÃO (PARÂMETROS FORNECIDOS PELO USUÁRIO)

Esta seção resume as premissas que o usuário configurou para gerar os resultados abaixo. Use este contexto para fundamentar sua análise.

- **Regime Tributário:** **${params.taxRegime}**
${params.taxRegime === TaxRegime.SimplesNacional ? `
- **Anexo do Simples Nacional:** ${params.anexoSimples || "Não informado"}
- **Faturamento Anual (Base p/ Alíquota):** ${formatCurrency(params.faturamento12Meses)}
- **Alíquota Efetiva do Simples:** ${formatPercent(params.simplesNacionalRate)}
` : ""}
${params.taxRegime === TaxRegime.LucroPresumido ? `
- **Alíquota IRPJ (Presumido):** ${formatPercent(params.irpjRate)}
- **Alíquota CSLL (Presumido):** ${formatPercent(params.csllRate)}
` : ""}
${params.taxRegime === TaxRegime.LucroReal ? `
- **Alíquota IRPJ (Real):** ${formatPercent(params.irpjRateLucroReal)}
- **Alíquota CSLL (Real):** ${formatPercent(params.csllRateLucroReal)}
` : ""}

- **Custos Fixos Totais (Mensal):** ${formatCurrency(params.fixedCosts)}
- **Margem de Lucro Alvo:** ${formatPercent(params.profitMargin)}
- **Percentual de Perdas (Quebra):** ${formatPercent(params.lossPercentage)}
- **Despesas Variáveis sobre a Venda:** ${getVariableExpensesText()}
- **Gera Crédito de IVA para Cliente (Simples Nacional)?** ${params.generateIvaCredit ? "Sim" : "Não"}

---

## 2. RESULTADOS FINANCEIROS GLOBAIS (CÁLCULO AUTOMÁTICO)

Estes são os resultados consolidados da simulação, com base nos parâmetros acima.

- **Venda Total (Faturamento):** ${formatCurrency(summary.totalSelling)}
- **Custo Total dos Produtos (Aquisição + Perdas + Custo Fixo Rateado):** ${formatCurrency(summary.totalCost)}
- **Impostos Totais:** ${formatCurrency(summary.totalTax)} (${formatPercent(summary.totalTaxPercent)} do faturamento)
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
### Produto ${index + 1}: ${p.name} (Cód: ${p.code})
- **NCM:** ${p.ncm || "N/A"}
- **Preço de Venda Unitário:** ${formatCurrency(p.sellingPrice)}
- **Custo de Aquisição Unitário:** ${formatCurrency(p.cost)}
- **Impostos Unitários:** ${formatCurrency(p.taxToPay)}
- **Lucro Líquido Unitário:** ${formatCurrency(p.valueForProfit)} (${formatPercent(productProfitMargin)})

**Análise Tributária do Produto:**
- **Imposto Seletivo (IS):** ${p.taxAnalysis.incideIS ? `Sim. Alíquota calculada: ${formatPercent(p.selectiveTaxToPay > 0 && p.sellingPrice > 0 ? (p.selectiveTaxToPay / p.sellingPrice * 100) : 0)}.` : "Não"}
  - **Observação para a IA:** Se o regime for Simples Nacional, o IS ser 0.00% está **CORRETO**, pois o imposto é monofásico (pago pela indústria). Não aponte isso como um erro.
- **Classificação IBS/CBS (cClassTrib):** \`${p.cClassTrib} - ${cClassDescription}\`
- **Validação da Classificação (Sistema):** ${p.taxAnalysis.wasNcmFound ? "NCM encontrado nas listas de exceção da Reforma." : "NCM não encontrado, aplicada classificação padrão."}

`;
  });

  prompt += `
---

## 4. SUA TAREFA COMO CONSULTOR DE IA

Com base em **todo o contexto fornecido (seções 1, 2 e 3)**, elabore uma análise estratégica concisa e acionável.

**Responda seguindo estritamente esta estrutura:**

1.  **PARECER ESTRATÉGICO (3 a 4 parágrafos):** Comece com um resumo executivo. A operação é saudável? O regime tributário escolhido parece adequado? Comente sobre o Ponto de Equilíbrio em relação ao faturamento total. Aponte os principais riscos e oportunidades (ex: margem de lucro, carga tributária, peso dos custos fixos).

2.  **PONTOS DE ATENÇÃO E RECOMENDAÇÕES (Use bullet points):**
    *   **Validação Tributária:** Com base nos NCMs e no regime, a classificação e as alíquotas parecem corretas? Há alguma oportunidade de otimização (ex: produto que poderia estar na cesta básica e não está)?
    *   **Precificação e Rentabilidade:** A margem de lucro alvo está sendo alcançada? Algum produto está com margem negativa ou muito baixa? Recomende ações se necessário (ex: renegociar custos, ajustar preço de venda).
    *   **Análise de Custos:** O custo fixo parece alto para o faturamento gerado? O percentual de perdas é realista para o tipo de produto?

3.  **TABELA DE SÍNTESE (Opcional):** Se identificar produtos com problemas claros (ex: margem negativa, classificação incorreta), crie uma tabela simples para destacá-los.

**IMPORTANTE:** Sua análise deve ser crítica e inteligente. Não apenas repita os dados. Conecte os parâmetros da seção 1 com os resultados da seção 2 para explicar *por que* os números são o que são. Por exemplo, se o Ponto de Equilíbrio é alto, relacione isso com o valor dos Custos Fixos. Se o lucro está baixo, verifique se a causa são os impostos, as perdas ou as despesas variáveis.
`;

  return prompt.trim();
};
