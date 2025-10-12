import { Product, CalculationParams, CalculatedProduct, TaxRegime } from "@/types/pricing";

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

  // 3. Soma das alíquotas percentuais (variável por regime)
  const totalVariableExpensesPercentage = params.variableExpenses.reduce(
    (sum, exp) => sum + exp.percentage,
    0
  );
  
  let totalPercentageForMarkup = 0;
  let irpjToPay = 0;
  let csllToPay = 0;
  let simplesToPay = 0;
  let cbsDebit = 0;
  let ibsDebit = 0;

  if (params.taxRegime === TaxRegime.LucroPresumido) {
    totalPercentageForMarkup =
      (totalVariableExpensesPercentage + params.irpjRate + params.csllRate + params.profitMargin) / 100 +
      CBS_RATE + IBS_RATE; // CBS e IBS são fixos para Lucro Presumido
  } else { // Simples Nacional
    totalPercentageForMarkup =
      (totalVariableExpensesPercentage + params.simplesNacionalRate + params.profitMargin) / 100;
  }

  // 4. Markup divisor
  const markupDivisor = 1 - totalPercentageForMarkup;

  let sellingPrice = 0;
  let minSellingPrice = 0;
  let cbsTaxToPay = 0;
  let ibsTaxToPay = 0;
  let taxToPay = 0;
  let markupPercentage = 0;
  let status: "OK" | "PREÇO CORRIGIDO" = "OK";

  if (markupDivisor <= 0) {
    // Se o markupDivisor for inviável (<= 0), a operação não é lucrativa ou é impossível.
    // Definimos os valores dependentes como 0 para evitar NaN/Infinity na exibição.
    sellingPrice = 0;
    minSellingPrice = 0;
    status = "PREÇO CORRIGIDO"; // Indica que o preço original seria inviável
  } else {
    // 5. Preço de venda sugerido - por unidade comercial
    sellingPrice = effectiveCost / markupDivisor;
    
    // Se o preço de venda calculado for negativo, significa que o custo efetivo é muito baixo (ou negativo)
    // e o markup divisor é muito pequeno. Limitamos a 0 para evitar vendas com preço negativo.
    if (sellingPrice < 0) {
      sellingPrice = 0;
      status = "PREÇO CORRIGIDO";
    }

    // 6. Menor valor a ser vendido (cobre custo efetivo + despesas variáveis + impostos diretos) - por unidade comercial
    let minSellingDivisor = 0;
    if (params.taxRegime === TaxRegime.LucroPresumido) {
      minSellingDivisor = 1 - (totalVariableExpensesPercentage / 100 + CBS_RATE + IBS_RATE);
    } else { // Simples Nacional
      minSellingDivisor = 1 - (totalVariableExpensesPercentage / 100 + params.simplesNacionalRate / 100);
    }
    
    minSellingPrice = minSellingDivisor > 0 ? effectiveCost / minSellingDivisor : effectiveCost;
    if (minSellingPrice < 0) {
      minSellingPrice = 0;
    }

    // 7. Débitos na venda - por unidade comercial (calculados com base no sellingPrice final)
    if (params.taxRegime === TaxRegime.LucroPresumido) {
      cbsDebit = sellingPrice * CBS_RATE;
      ibsDebit = sellingPrice * IBS_RATE;
      irpjToPay = sellingPrice * (params.irpjRate / 100);
      csllToPay = sellingPrice * (params.csllRate / 100);
    } else { // Simples Nacional
      simplesToPay = sellingPrice * (params.simplesNacionalRate / 100);
      // CBS e IBS não são aplicáveis diretamente no Simples Nacional, mas podem ser considerados no custo
      // Para simplificar, vamos zerar os débitos de CBS/IBS para o Simples Nacional na saída
      cbsDebit = 0;
      ibsDebit = 0;
    }

    // 8. Imposto a pagar (líquido) - por unidade comercial
    cbsTaxToPay = cbsDebit - cbsCredit;
    ibsTaxToPay = ibsDebit - ibsCredit;
    
    if (params.taxRegime === TaxRegime.LucroPresumido) {
      taxToPay = cbsTaxToPay + ibsTaxToPay + irpjToPay + csllToPay;
    } else { // Simples Nacional
      taxToPay = simplesToPay;
    }

    // 9. Porcentagem de markup
    markupPercentage = effectiveCost > 0 ? ((sellingPrice - effectiveCost) / effectiveCost) * 100 : 0;
  }

  // Cálculos por Unidade Interna
  const innerQty = product.innerQuantity > 0 ? product.innerQuantity : 1;

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
  const irpjToPayPerInnerUnit = irpjToPay / innerQty;
  const csllToPayPerInnerUnit = csllToPay / innerQty;
  const simplesToPayPerInnerUnit = simplesToPay / innerQty;
  const taxToPayPerInnerUnit = taxToPay / innerQty;


  return {
    ...product,
    effectiveCost, // Mantém o valor real (pode ser negativo) para fins de análise de custo
    sellingPrice: Math.max(0, sellingPrice), // Garante que não seja negativo
    minSellingPrice: Math.max(0, minSellingPrice), // Garante que não seja negativo
    cbsCredit,
    ibsCredit,
    cbsDebit: Math.max(0, cbsDebit), // Garante que o débito CBS não seja negativo
    ibsDebit: Math.max(0, ibsDebit), // Garante que o débito IBS não seja negativo
    taxToPay: Math.max(0, taxToPay), // Garante que o imposto líquido total não seja negativo
    cbsTaxToPay: Math.max(0, cbsTaxToPay), // Garante que o CBS a pagar não seja negativo
    ibsTaxToPay: Math.max(0, ibsTaxToPay), // Garante que o IBS a pagar não seja negativo
    irpjToPay: Math.max(0, irpjToPay),
    csllToPay: Math.max(0, csllToPay),
    simplesToPay: Math.max(0, simplesToPay),
    markupPercentage,
    cfop: product.cfop || "5102",
    cst: product.cst || "101",
    status,

    // Valores por Unidade Interna
    costPerInnerUnit,
    effectiveCostPerInnerUnit, // Mantém o valor real (pode ser negativo)
    sellingPricePerInnerUnit: Math.max(0, sellingPricePerInnerUnit), // Garante que não seja negativo
    minSellingPricePerInnerUnit: Math.max(0, minSellingPricePerInnerUnit), // Garante que não seja negativo
    cbsCreditPerInnerUnit,
    ibsCreditPerInnerUnit,
    cbsDebitPerInnerUnit: Math.max(0, cbsDebitPerInnerUnit), // Garante que o débito CBS por unidade interna não seja negativo
    ibsDebitPerInnerUnit: Math.max(0, ibsDebitPerInnerUnit), // Garante que o débito IBS por unidade interna não seja negativo
    taxToPayPerInnerUnit: Math.max(0, taxToPayPerInnerUnit),
    cbsTaxToPayPerInnerUnit: Math.max(0, cbsTaxToPayPerInnerUnit),
    ibsTaxToPayPerInnerUnit: Math.max(0, ibsTaxToPayPerInnerUnit),
    irpjToPayPerInnerUnit: Math.max(0, irpjToPayPerInnerUnit),
    csllToPayPerInnerUnit: Math.max(0, csllToPayPerInnerUnit),
    simplesToPayPerInnerUnit: Math.max(0, simplesToPayPerInnerUnit),
  };
};