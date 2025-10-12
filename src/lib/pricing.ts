import { Product, CalculationParams, CalculatedProduct } from "@/types/pricing";

export const CBS_RATE = 0.088; // 8.8%
export const IBS_RATE = 0.177; // 17.7%

export const calculatePricing = (
  product: Product,
  params: CalculationParams
): CalculatedProduct => {
  // 1. Créditos (do XML) - por unidade comercial
  const cbsCredit = product.pisCredit + product.cofinsCredit;
  const ibsCredit = product.icmsCredit || 0;
  const totalCredit = cbsCredit + ibsCredit;

  // 2. Custo efetivo - por unidade comercial
  const effectiveCost = product.cost - totalCredit; // Este valor pode ser negativo se os créditos forem maiores que o custo.

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
    // O preço de venda deve ser no mínimo 0, mesmo que o custo efetivo seja negativo.
    sellingPrice = Math.max(0, effectiveCost);
    minSellingPrice = Math.max(0, effectiveCost);
  } else {
    // 4. Preço de venda sugerido - por unidade comercial
    // Garante que o preço de venda seja não-negativo, mesmo que o custo efetivo seja negativo.
    sellingPrice = Math.max(0, effectiveCost / markupDivisor);

    // 5. Menor valor a ser vendido (cobre custo efetivo + despesas variáveis + simples nacional) - por unidade comercial
    const minSellingDivisor = 1 - (totalVariableExpensesPercentage + params.simplesNacional) / 100;
    minSellingPrice = minSellingDivisor > 0 ? Math.max(0, effectiveCost / minSellingDivisor) : Math.max(0, effectiveCost);

    // 6. Débitos na venda - por unidade comercial
    // Calculado a partir do sellingPrice (que já é não-negativo)
    cbsDebit = sellingPrice * CBS_RATE;
    ibsDebit = sellingPrice * IBS_RATE;

    // 7. Imposto a pagar (líquido) - por unidade comercial
    cbsTaxToPay = cbsDebit - cbsCredit;
    ibsTaxToPay = ibsDebit - ibsCredit;
    taxToPay = cbsTaxToPay + ibsTaxToPay;

    // 8. Porcentagem de markup
    // O markup só é significativo se o custo efetivo for positivo.
    markupPercentage = effectiveCost > 0 ? ((sellingPrice - effectiveCost) / effectiveCost) * 100 : 0;
  }

  // Cálculos por Unidade Interna
  const innerQty = product.innerQuantity > 0 ? product.innerQuantity : 1;

  const costPerInnerUnit = product.cost / innerQty;
  const effectiveCostPerInnerUnit = effectiveCost / innerQty; // Pode ser negativo
  const sellingPricePerInnerUnit = sellingPrice / innerQty;
  const minSellingPricePerInnerUnit = minSellingPrice / innerQty;
  const cbsCreditPerInnerUnit = cbsCredit / innerQty;
  const ibsCreditPerInnerUnit = ibsCredit / innerQty;
  const cbsDebitPerInnerUnit = cbsDebit / innerQty;
  const ibsDebitPerInnerUnit = ibsDebit / innerQty;
  const cbsTaxToPayPerInnerUnit = cbsTaxToPay / innerQty;
  const ibsTaxToPayPerInnerUnit = ibsTaxToPay / innerQty;
  const taxToPayPerInnerUnit = taxToPay / innerQty;


  return {
    ...product,
    effectiveCost, // Mantém o valor real (pode ser negativo) para fins de análise de custo
    sellingPrice, // Já é Math.max(0, ...) acima
    minSellingPrice, // Já é Math.max(0, ...) acima
    cbsCredit,
    ibsCredit,
    cbsDebit: Math.max(0, cbsDebit), // Garante que o débito CBS não seja negativo
    ibsDebit: Math.max(0, ibsDebit), // Garante que o débito IBS não seja negativo
    taxToPay: Math.max(0, taxToPay), // Garante que o imposto líquido total não seja negativo
    cbsTaxToPay: Math.max(0, cbsTaxToPay), // Garante que o CBS a pagar não seja negativo
    ibsTaxToPay: Math.max(0, ibsTaxToPay), // Garante que o IBS a pagar não seja negativo
    markupPercentage,
    cfop: product.cfop || "5102",
    cst: product.cst || "101",

    // Valores por Unidade Interna
    costPerInnerUnit,
    effectiveCostPerInnerUnit, // Mantém o valor real (pode ser negativo)
    sellingPricePerInnerUnit, // Já é Math.max(0, ...) acima
    minSellingPricePerInnerUnit, // Já é Math.max(0, ...) acima
    cbsCreditPerInnerUnit,
    ibsCreditPerInnerUnit,
    cbsDebitPerInnerUnit: Math.max(0, cbsDebitPerInnerUnit), // Garante que o débito CBS por unidade interna não seja negativo
    ibsDebitPerInnerUnit: Math.max(0, ibsDebitPerInnerUnit), // Garante que o débito IBS por unidade interna não seja negativo
    taxToPayPerInnerUnit: Math.max(0, taxToPayPerInnerUnit),
    cbsTaxToPayPerInnerUnit: Math.max(0, cbsTaxToPayPerInnerUnit),
    ibsTaxToPayPerInnerUnit: Math.max(0, ibsTaxToPayPerInnerUnit),
  };
};