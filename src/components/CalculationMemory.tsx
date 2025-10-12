import { Product, CalculationParams, CalculatedProduct } from "@/types/pricing";
import { calculatePricing } from "@/lib/pricing";

interface CalculationMemoryProps {
  products: Product[];
  params: CalculationParams;
}

export const CalculationMemory = ({ products, params }: CalculationMemoryProps) => {
  if (products.length === 0) return null;

  const firstProduct = products[0];
  const calculated: CalculatedProduct = calculatePricing(firstProduct, params);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const totalVariableExpensesPercentage = params.variableExpenses.reduce(
    (sum, exp) => sum + exp.percentage,
    0
  );

  const markupDivisor = 1 - (totalVariableExpensesPercentage + params.simplesNacional + params.profitMargin) / 100;
  const minSellingDivisor = 1 - (totalVariableExpensesPercentage + params.simplesNacional) / 100;


  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Memória de Cálculo Detalhada</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Exemplo: {firstProduct.name} (Cód. {firstProduct.code}) - {firstProduct.quantity} {firstProduct.unit}
        </p>
      </div>

      <div className="space-y-4 rounded-lg bg-muted/30 p-6 font-mono text-sm">
        <div>
          <p className="font-semibold mb-2">1. Créditos de Tributos (Compra)</p>
          <p className="ml-4">
            • Crédito CBS (PIS + COFINS): {formatCurrency(firstProduct.pisCredit)} + {formatCurrency(firstProduct.cofinsCredit)} = {formatCurrency(calculated.cbsCredit)}
          </p>
          <p className="ml-4">
            • Crédito IBS (ICMS do XML): {formatCurrency(firstProduct.icmsCredit)}
          </p>
          <p className="ml-4 mt-2 font-semibold">
            Total de Créditos: {formatCurrency(calculated.cbsCredit + calculated.ibsCredit)}
          </p>
        </div>

        <div>
          <p className="font-semibold mb-2">2. Custo Efetivo Unitário</p>
          <p className="ml-4">
            Custo de Compra - Créditos Totais
          </p>
          <p className="ml-4">
            {formatCurrency(firstProduct.cost)} - {formatCurrency(calculated.cbsCredit + calculated.ibsCredit)} = {formatCurrency(calculated.effectiveCost)}
          </p>
        </div>

        <div>
          <p className="font-semibold mb-2">3. Markup Divisor (para Preço Sugerido)</p>
          <p className="ml-4">
            1 - (Despesas Variáveis% + Simples Nacional% + Lucro%)
          </p>
          <p className="ml-4">
            1 - ({formatPercent(totalVariableExpensesPercentage)} + {formatPercent(params.simplesNacional)} + {formatPercent(params.profitMargin)})
          </p>
          <p className="ml-4 font-semibold">
            = {markupDivisor.toFixed(4)}
          </p>
        </div>

        <div>
          <p className="font-semibold mb-2">4. Preço de Venda Sugerido Unitário</p>
          <p className="ml-4">
            Custo Efetivo ÷ Markup Divisor
          </p>
          <p className="ml-4">
            {formatCurrency(calculated.effectiveCost)} ÷ {markupDivisor.toFixed(4)} = {formatCurrency(calculated.sellingPrice)}
          </p>
          <p className="ml-4 mt-2 font-semibold">
            Markup Aplicado: {formatPercent(calculated.markupPercentage)}
          </p>
        </div>

        <div>
          <p className="font-semibold mb-2">5. Menor Preço de Venda Unitário (Cobre Custos Variáveis e Simples Nacional)</p>
          <p className="ml-4">
            Custo Efetivo ÷ (1 - (Despesas Variáveis% + Simples Nacional%))
          </p>
          <p className="ml-4">
            {formatCurrency(calculated.effectiveCost)} ÷ (1 - ({formatPercent(totalVariableExpensesPercentage)} + {formatPercent(params.simplesNacional)}))
          </p>
          <p className="ml-4 font-semibold text-yellow-500">
            = {formatCurrency(calculated.minSellingPrice)}
          </p>
        </div>

        <div>
          <p className="font-semibold mb-2">6. Débitos de Tributos (Venda)</p>
          <p className="ml-4">
            • Débito CBS (8,8% do preço): {formatCurrency(calculated.sellingPrice)} × 8,8% = {formatCurrency(calculated.cbsDebit)}
          </p>
          <p className="ml-4">
            • Débito IBS (17,7% do preço): {formatCurrency(calculated.sellingPrice)} × 17,7% = {formatCurrency(calculated.ibsDebit)}
          </p>
        </div>

        <div>
          <p className="font-semibold mb-2">7. Imposto a Pagar (Líquido)</p>
          <p className="ml-4">
            • CBS a Pagar: Débito CBS - Crédito CBS = {formatCurrency(calculated.cbsDebit)} - {formatCurrency(calculated.cbsCredit)} = {formatCurrency(calculated.cbsTaxToPay)}
          </p>
          <p className="ml-4">
            • IBS a Pagar: Débito IBS - Crédito IBS = {formatCurrency(calculated.ibsDebit)} - {formatCurrency(calculated.ibsCredit)} = {formatCurrency(calculated.ibsTaxToPay)}
          </p>
          <p className="ml-4 font-semibold text-destructive">
            Total Imposto a Pagar: {formatCurrency(calculated.cbsTaxToPay + calculated.ibsTaxToPay)}
          </p>
        </div>

        <div className="border-t border-border pt-4 mt-4">
          <p className="font-semibold mb-2">Resumo da Operação Unitária</p>
          <p className="ml-4">
            • Custo de Compra: {formatCurrency(firstProduct.cost)}
          </p>
          <p className="ml-4">
            • Preço de Venda Sugerido: {formatCurrency(calculated.sellingPrice)}
          </p>
          <p className="ml-4">
            • Margem Bruta: {formatCurrency(calculated.sellingPrice - firstProduct.cost)}
          </p>
          <p className="ml-4">
            • Impostos Líquidos: {formatCurrency(calculated.taxToPay)}
          </p>
          <p className="ml-4 font-semibold text-success">
            • Lucro Unitário: {formatCurrency(calculated.sellingPrice - firstProduct.cost - calculated.taxToPay)}
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-primary/5 p-4 text-sm">
        <p className="font-semibold mb-2">📋 Base Legal: Lei Complementar 214/2025</p>
        <p className="text-muted-foreground">
          Os cálculos seguem as regras da Reforma Tributária brasileira, considerando o sistema não-cumulativo
          de IBS e CBS, onde os créditos da compra são compensados com os débitos da venda.
        </p>
      </div>
    </div>
  );
};