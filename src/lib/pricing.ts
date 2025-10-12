import { Product, CalculationParams, CalculatedProduct } from "@/types/pricing";

const CBS_RATE = 0.088; // 8.8%
const IBS_RATE = 0.177; // 17.7%
// const IBS_CREDIT_RATE = 0.175; // This was previously used, but now we use icmsCredit from XML

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

  // 4. Preço de venda sugerido
  const sellingPrice = effectiveCost / markupDivisor;

  // 5. Menor valor a ser vendido (cobre custo efetivo + despesas variáveis + simples nacional)
  const minSellingDivisor = 1 - (totalVariableExpensesPercentage + params.simplesNacional) / 100;
  const minSellingPrice = minSellingDivisor > 0 ? effectiveCost / minSellingDivisor : effectiveCost;


  // 6. Débitos na venda
  const cbsDebit = sellingPrice * CBS_RATE;
  const ibsDebit = sellingPrice * IBS_RATE;

  // 7. Imposto a pagar (líquido)
  const cbsTaxToPay = cbsDebit - cbsCredit;
  const ibsTaxToPay = ibsDebit - ibsCredit;
  const taxToPay = cbsTaxToPay + ibsTaxToPay;

  // 8. Porcentagem de markup
  const markupPercentage = effectiveCost > 0 ? ((sellingPrice - effectiveCost) / effectiveCost) * 100 : 0;

  return {
    ...product,
    effectiveCost,
    sellingPrice,
    minSellingPrice: Math.max(0, minSellingPrice), // Não pode ser negativo
    cbsCredit,
    ibsCredit,
    cbsDebit,
    ibsDebit,
    taxToPay: Math.max(0, taxToPay), // Não pode ser negativo
    cbsTaxToPay: Math.max(0, cbsTaxToPay), // Não pode ser negativo
    ibsTaxToPay: Math.max(0, ibsTaxToPay), // Não pode ser negativo
    markupPercentage,
    cfop: product.cfop || "5102", // CFOP do XML ou padrão
    cst: product.cst || "101", // CST do XML ou padrão
  };
};