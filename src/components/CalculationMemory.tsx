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
  // const minSellingDivisor = 1 - (totalVariableExpensesPercentage + params.simplesNacional) / 100; // Not directly used here, but kept for context

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Memória de Cálculo Detalhada</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Exemplo: {firstProduct.name} (Cód. {firstProduct.code}) - {firstProduct.quantity} {firstProduct.unit} ({firstProduct.innerQuantity} unidades internas)
        </p>
      </div>

      {markupDivisor <= 0 ? (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive-foreground">
          <p className="font-semibold mb-2">⚠️ Cálculo Inviável para este Produto</p>
          <p>
            A soma da Margem de Lucro ({formatPercent(params.profitMargin)}), Simples Nacional ({formatPercent(params.simplesNacional)}) e Despesas Variáveis Percentuais ({formatPercent(totalVariableExpensesPercentage)}) é igual ou superior a 100%.
            Isso torna a precificação inviável para este produto com os parâmetros atuais. Ajuste os valores para obter um resultado válido.
          </p>
        </div>
      ) : (
        <div className="space-y-4 rounded-lg bg-muted/30 p-6 font-mono text-sm">
          <div>
            <p className="font-semibold mb-2">1. Créditos de Tributos (Compra)</p>
            <p className="ml-4">
              • Crédito CBS (PIS + COFINS) por Unid. Com.: {formatCurrency(firstProduct.pisCredit)} + {formatCurrency(firstProduct.cofinsCredit)} = {formatCurrency(calculated.cbsCredit)}
            </p>
            <p className="ml-4">
              • Crédito IBS (ICMS do XML) por Unid. Com.: {formatCurrency(firstProduct.icmsCredit)}
            </p>
            <p className="ml-4 mt-2 font-semibold">
              Total de Créditos por Unid. Com.: {formatCurrency(calculated.cbsCredit + calculated.ibsCredit)}
            </p>
            <p className="ml-4 text-muted-foreground">
              Total de Créditos por Unid. Interna: {formatCurrency(calculated.cbsCreditPerInnerUnit + calculated.ibsCreditPerInnerUnit)}
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2">2. Custo Efetivo Unitário</p>
            <p className="ml-4">
              Custo de Compra por Unid. Com. - Créditos Totais por Unid. Com.
            </p>
            <p className="ml-4">
              {formatCurrency(firstProduct.cost)} - {formatCurrency(calculated.cbsCredit + calculated.ibsCredit)} = {formatCurrency(calculated.effectiveCost)} (por Unid. Com.)
            </p>
            <p className="ml-4 text-muted-foreground">
              Custo Efetivo por Unid. Interna: {formatCurrency(calculated.effectiveCostPerInnerUnit)}
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
              Custo Efetivo por Unid. Com. ÷ Markup Divisor
            </p>
            <p className="ml-4">
              {formatCurrency(calculated.effectiveCost)} ÷ {markupDivisor.toFixed(4)} = {formatCurrency(calculated.sellingPrice)} (por Unid. Com.)
            </p>
            <p className="ml-4 mt-2 font-semibold">
              Markup Aplicado: {formatPercent(calculated.markupPercentage)}
            </p>
            <p className="ml-4 text-muted-foreground">
              Preço de Venda Sugerido por Unid. Interna: {formatCurrency(calculated.sellingPricePerInnerUnit)}
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2">5. Menor Preço de Venda Unitário (Cobre Custos Variáveis e Simples Nacional)</p>
            <p className="ml-4">
              Custo Efetivo por Unid. Com. ÷ (1 - (Despesas Variáveis% + Simples Nacional%))
            </p>
            <p className="ml-4">
              {formatCurrency(calculated.effectiveCost)} ÷ (1 - ({formatPercent(totalVariableExpensesPercentage)} + {formatPercent(params.simplesNacional)}))
            </p>
            <p className="ml-4 font-semibold text-yellow-500">
              = {formatCurrency(calculated.minSellingPrice)} (por Unid. Com.)
            </p>
            <p className="ml-4 text-muted-foreground">
              Menor Preço de Venda por Unid. Interna: {formatCurrency(calculated.minSellingPricePerInnerUnit)}
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2">6. Débitos de Tributos (Venda)</p>
            <p className="ml-4">
              • Débito CBS (8,8% do preço) por Unid. Com.: {formatCurrency(calculated.sellingPrice)} × 8,8% = {formatCurrency(calculated.cbsDebit)}
            </p>
            <p className="ml-4">
              • Débito IBS (17,7% do preço) por Unid. Com.: {formatCurrency(calculated.sellingPrice)} × 17,7% = {formatCurrency(calculated.ibsDebit)}
            </p>
            <p className="ml-4 text-muted-foreground">
              Débito CBS por Unid. Interna: {formatCurrency(calculated.cbsDebitPerInnerUnit)}
            </p>
            <p className="ml-4 text-muted-foreground">
              Débito IBS por Unid. Interna: {formatCurrency(calculated.ibsDebitPerInnerUnit)}
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2">7. Imposto a Pagar (Líquido)</p>
            <p className="ml-4">
              • CBS a Pagar por Unid. Com.: Débito CBS - Crédito CBS = {formatCurrency(calculated.cbsDebit)} - {formatCurrency(calculated.cbsCredit)} = {formatCurrency(calculated.cbsTaxToPay)}
            </p>
            <p className="ml-4">
              • IBS a Pagar por Unid. Com.: Débito IBS - Crédito IBS = {formatCurrency(calculated.ibsDebit)} - {formatCurrency(calculated.ibsCredit)} = {formatCurrency(calculated.ibsTaxToPay)}
            </p>
            <p className="ml-4 font-semibold text-destructive">
              Total Imposto a Pagar por Unid. Com.: {formatCurrency(calculated.cbsTaxToPay + calculated.ibsTaxToPay)}
            </p>
            <p className="ml-4 text-muted-foreground">
              Total Imposto a Pagar por Unid. Interna: {formatCurrency(calculated.cbsTaxToPayPerInnerUnit + calculated.ibsTaxToPayPerInnerUnit)}
            </p>
          </div>

          <div className="border-t border-border pt-4 mt-4">
            <p className="font-semibold mb-2">Resumo da Operação Unitária</p>
            <p className="ml-4">
              • Custo de Compra por Unid. Com.: {formatCurrency(firstProduct.cost)}
            </p>
            <p className="ml-4">
              • Preço de Venda Sugerido por Unid. Com.: {formatCurrency(calculated.sellingPrice)}
            </p>
            <p className="ml-4">
              • Margem Bruta por Unid. Com.: {formatCurrency(calculated.sellingPrice - firstProduct.cost)}
            </p>
            <p className="ml-4">
              • Impostos Líquidos por Unid. Com.: {formatCurrency(calculated.taxToPay)}
            </p>
            <p className="ml-4 font-semibold text-success">
              • Lucro por Unid. Com.: {formatCurrency(calculated.sellingPrice - firstProduct.cost - calculated.taxToPay - (calculated.sellingPrice * (totalVariableExpensesPercentage / 100)))}
            </p>
            <p className="ml-4 mt-2 text-muted-foreground">
              • Custo de Compra por Unid. Interna: {formatCurrency(calculated.costPerInnerUnit)}
            </p>
            <p className="ml-4 text-muted-foreground">
              • Preço de Venda Sugerido por Unid. Interna: {formatCurrency(calculated.sellingPricePerInnerUnit)}
            </p>
            <p className="ml-4 text-muted-foreground">
              • Lucro por Unid. Interna: {formatCurrency(calculated.sellingPricePerInnerUnit - calculated.costPerInnerUnit - calculated.taxToPayPerInnerUnit - (calculated.sellingPricePerInnerUnit * (totalVariableExpensesPercentage / 100)))}
            </p>
          </div>
        </div>
      )}

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