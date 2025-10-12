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
    // 4. Preço de venda sugerido - por unidade comercial
    sellingPrice = effectiveCost / markupDivisor;

    // 5. Menor valor a ser vendido (cobre custo efetivo + despesas variáveis + simples nacional) - por unidade comercial
    const minSellingDivisor = 1 - (totalVariableExpensesPercentage + params.simplesNacional) / 100;
    minSellingPrice = minSellingDivisor > 0 ? effectiveCost / minSellingDivisor : effectiveCost;

    // 6. Débitos na venda - por unidade comercial
    cbsDebit = sellingPrice * CBS_RATE;
    ibsDebit = sellingPrice * IBS_RATE;

    // 7. Imposto a pagar (líquido) - por unidade comercial
    cbsTaxToPay = cbsDebit - cbsCredit;
    ibsTaxToPay = ibsDebit - ibsCredit;
    taxToPay = cbsTaxToPay + ibsTaxToPay;

    // 8. Porcentagem de markup
    markupPercentage = effectiveCost > 0 ? ((sellingPrice - effectiveCost) / effectiveCost) * 100 : 0;
  }

  // Cálculos por Unidade Interna
  const innerQty = product.innerQuantity > 0 ? product.innerQuantity : 1; // Garante divisão por no mínimo 1

  const costPerInnerUnit = product.cost / innerQty;
  const effectiveCostPerInnerUnit = effectiveCost / innerQty;
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
    effectiveCost,
    sellingPrice: Math.max(0, sellingPrice),
    minSellingPrice: Math.max(0, minSellingPrice),
    cbsCredit,
    ibsCredit,
    cbsDebit,
    ibsDebit,
    taxToPay: Math.max(0, taxToPay),
    cbsTaxToPay: Math.max(0, cbsTaxToPay),
    ibsTaxToPay: Math.max(0, ibsTaxToPay),
    markupPercentage,
    cfop: product.cfop || "5102",
    cst: product.cst || "101",

    // Valores por Unidade Interna
    costPerInnerUnit,
    effectiveCostPerInnerUnit,
    sellingPricePerInnerUnit: Math.max(0, sellingPricePerInnerUnit),
    minSellingPricePerInnerUnit: Math.max(0, minSellingPricePerInnerUnit),
    cbsCreditPerInnerUnit,
    ibsCreditPerInnerUnit,
    cbsDebitPerInnerUnit,
    ibsDebitPerInnerUnit,
    taxToPayPerInnerUnit: Math.max(0, taxToPayPerInnerUnit),
    cbsTaxToPayPerInnerUnit: Math.max(0, cbsTaxToPayPerInnerUnit),
    ibsTaxToPayPerInnerUnit: Math.max(0, ibsTaxToPayPerInnerUnit),
  };
};