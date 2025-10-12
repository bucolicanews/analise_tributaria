import { Product, CalculationParams, CalculatedProduct } from "@/types/pricing";

export const CBS_RATE = 0.088; // 8.8%
export const IBS_RATE = 0.177; // 17.7%

export const calculatePricing = (
  product: Product,
  params: CalculationParams
): CalculatedProduct => {
  // 1. Créditos (do XML)
  const cbsCredit = product.pisCredit + product.cofinsCredit;
  const ibsCredit = product.icmsCredit || 0; // Usar ICMS do XML
  const totalCredit = cbsCredit + ibsCredit;

  // 2. Custo efetivo
  const effectiveCost = product.cost - totalCredit;

  // 3. Markup divisor
  const totalVariableExpensesPercentage = params.variableExpenses.reduce(
    (sum, exp) => sum + exp.percentage,
    0
  );
  const markupDivisor =
    1 -
    (totalVariableExpensesPercentage + params.simplesNacional + params.profitMargin) /
      100;

  let sellingPrice = 0;
  let minSellingPrice = 0;
  let cbsDebit = 0;
  let ibsDebit = 0;
  let cbsTaxToPay = 0;
  let ibsTaxToPay = 0;
  let taxToPay = 0;
  let markupPercentage = 0;

  if (markupDivisor <= 0) {
    // Se o markupDivisor for inviável (<= 0), a operação não é lucrativa ou é impossível.
    // Definimos os valores dependentes como 0 para evitar NaN/Infinity na exibição.
    // Uma mensagem de erro mais abrangente será exibida no nível da tabela de produtos.
  } else {
    // 4. Preço de venda sugerido
    sellingPrice = effectiveCost / markupDivisor;

    // 5. Menor valor a ser vendido (cobre custo efetivo + despesas variáveis + simples nacional)
    const minSellingDivisor = 1 - (totalVariableExpensesPercentage + params.simplesNacional) / 100;
    minSellingPrice = minSellingDivisor > 0 ? effectiveCost / minSellingDivisor : effectiveCost;

    // 6. Débitos na venda
    cbsDebit = sellingPrice * CBS_RATE;
    ibsDebit = sellingPrice * IBS_RATE;

    // 7. Imposto a pagar (líquido)
    cbsTaxToPay = cbsDebit - cbsCredit;
    ibsTaxToPay = ibsDebit - ibsCredit;
    taxToPay = cbsTaxToPay + ibsTaxToPay;

    // 8. Porcentagem de markup
    markupPercentage = effectiveCost > 0 ? ((sellingPrice - effectiveCost) / effectiveCost) * 100 : 0;
  }

  return {
    ...product,
    effectiveCost,
    sellingPrice: Math.max(0, sellingPrice), // Garante que não seja negativo
    minSellingPrice: Math.max(0, minSellingPrice), // Garante que não seja negativo
    cbsCredit,
    ibsCredit,
    cbsDebit,
    ibsDebit,
    taxToPay: Math.max(0, taxToPay), // Garante que não seja negativo
    cbsTaxToPay: Math.max(0, cbsTaxToPay), // Garante que não seja negativo
    ibsTaxToPay: Math.max(0, ibsTaxToPay), // Garante que não seja negativo
    markupPercentage,
    cfop: product.cfop || "5102", // CFOP do XML ou padrão
    cst: product.cst || "101", // CST do XML ou padrão
  };
};