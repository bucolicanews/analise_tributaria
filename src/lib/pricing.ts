import { Product, CalculationParams, CalculatedProduct } from "@/types/pricing";

const CBS_RATE = 0.088; // 8.8%
const IBS_RATE = 0.177; // 17.7%
const IBS_CREDIT_RATE = 0.175; // 17.5%

export const calculatePricing = (
  product: Product,
  params: CalculationParams
): CalculatedProduct => {
  // 1. Créditos
  const cbsCredit = product.pisCredit + product.cofinsCredit;
  const ibsCredit = product.cost * IBS_CREDIT_RATE;
  const totalCredit = cbsCredit + ibsCredit;

  // 2. Custo efetivo
  const effectiveCost = product.cost - totalCredit;

  // 3. Markup divisor
  const totalVariableExpenses = params.variableExpenses.reduce(
    (sum, exp) => sum + exp.percentage,
    0
  );
  const markupDivisor =
    1 -
    (totalVariableExpenses + params.simplesNacional + params.profitMargin) /
      100;

  // 4. Preço de venda
  const sellingPrice = effectiveCost / markupDivisor;

  // 5. Débitos na venda
  const cbsDebit = sellingPrice * CBS_RATE;
  const ibsDebit = sellingPrice * IBS_RATE;

  // 6. Imposto a pagar
  const taxToPay = cbsDebit + ibsDebit - totalCredit;

  return {
    ...product,
    effectiveCost,
    sellingPrice,
    cbsCredit,
    ibsCredit,
    cbsDebit,
    ibsDebit,
    taxToPay: Math.max(0, taxToPay), // Não pode ser negativo
    cfop: "5102", // CFOP padrão para venda
    cst: "101", // CST padrão para Simples Nacional
  };
};
