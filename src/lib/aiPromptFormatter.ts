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
# INSTRUÇÕES DE ANÁLISE TRIBUTÁRIA (BASE: LC 214/2025 e LC 227/2026)

Você é um Especialista em Tributação Brasileira focado na Transição para o IVA Dual (IBS/CBS).
Sua tarefa é analisar os dados de precificação abaixo e validar se a classificação tributária e as margens estão corretas.

## BASE DE CONHECIMENTO (REGRAS DE REDUÇÃO):
1. **REDUÇÃO 100% (Alíquota Zero):** Cesta Básica Nacional (Arroz, feijão, carnes in natura, ovos, leite, frutas), Medicamentos específicos, Dispositivos médicos, Prouni, Transporte Público.
2. **REDUÇÃO 60% (Paga 40% da alíquota):** Educação/Saúde privada, Higiene Pessoal (Cesta estendida), Alimentos da Cesta Estendida, Insumos Agro.
3. **REDUÇÃO 30% (Paga 70% da alíquota):** Profissões Intelectuais (Contabilidade, Advocacia, Engenharia, etc).
4. **IMPOSTO SELETIVO (Adicional):** Bebidas alcoólicas, cigarros, veículos poluentes.
5. **SIMPLES NACIONAL:** Mantém regime unificado, mas permite transferência de crédito de IBS/CBS pelo valor pago no DAS.

---

## 1. Resumo Executivo da Operação

**Cenário Simulado:**
- **Regime Tributário:** ${params.taxRegime}${params.taxRegime === TaxRegime.SimplesNacional ? (params.generateIvaCredit ? " (Híbrido)" : " (Padrão)") : ""}
- **Margem de Lucro Alvo:** ${formatPercent(params.profitMargin)}
- **Custos Fixos Totais (CFT):** ${formatCurrency(totalFixedExpenses)}
- **Estoque Total de Unidades (ETU):** ${formatNumber(params.totalStockUnits)}
- **Custo Fixo por Unidade (CFU):** ${formatCurrency(cfu)}
- **Porcentagem de Perdas:** ${formatPercent(params.lossPercentage)}

**Resultados Globais:**
- **Venda Total Sugerida:** ${formatCurrency(summary.totalSelling)}
- **Impostos Líquidos Totais:** ${formatCurrency(summary.totalTax)} (${formatPercent(summary.totalTaxPercent)} da Venda)
- **Lucro Líquido Total:** ${formatCurrency(summary.totalProfit)}
- **Ponto de Equilíbrio (Mensal):** ${formatCurrency(summary.breakEvenPoint)}

---

## 2. Detalhamento dos Produtos

`;

  products.forEach((p, index) => {
    const fixedCostPerCommercialUnit = cfu * p.innerQuantity;
    const productProfit = p.sellingPrice - p.cost - p.taxToPay - p.valueForVariableExpenses - fixedCostPerCommercialUnit;
    const productProfitMargin = p.sellingPrice > 0 ? (productProfit / p.sellingPrice) * 100 : 0;

    prompt += `
### Produto ${index + 1}: ${p.name}
- **NCM:** ${p.ncm || "N/A"} | **CEST:** ${p.cest || "N/A"}
- **Classificação Atual:** ICMS: ${p.taxAnalysis.icms} | PIS/COFINS: ${p.taxAnalysis.pisCofins}
- **Custo Aquisição:** ${formatCurrency(p.cost)}
- **Preço Sugerido:** ${formatCurrency(p.sellingPrice)}
- **Lucro Líquido:** ${formatCurrency(productProfit)} (${formatPercent(productProfitMargin)})
---
`;
  });

  prompt += `
## TAREFA PARA A IA:
1. Valide se o NCM de cada produto se enquadra em alguma regra de REDUÇÃO (100%, 60%, 30%) ou IMPOSTO SELETIVO.
2. Identifique erros de classificação (ex: carne tributada integralmente quando deveria ser alíquota zero).
3. Sugira ajustes no preço de venda caso a carga tributária real mude após sua análise.
4. Forneça um parecer final sobre a saúde financeira da operação.

**FORMATO DE RESPOSTA:** Use Markdown com tabelas para os produtos que precisam de correção e uma seção de "Conclusão Estratégica".
`;

  return prompt.trim();
};