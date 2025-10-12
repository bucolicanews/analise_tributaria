import { Product, CalculationParams, CalculatedProduct, TaxRegime } from "@/types/pricing";
import { calculatePricing, CBS_RATE, IBS_RATE } from "@/lib/pricing";

interface CalculationMemoryProps {
  products: Product[];
  params: CalculationParams;
}

export const CalculationMemory = ({ products, params }: CalculationMemoryProps) => {
  // 1. Consolidar Custos Fixos Totais (CFT)
  const totalFixedExpenses = params.fixedExpenses.reduce((sum, exp) => sum + exp.value, 0) + params.payroll;

  // 2. Calcular Custo Fixo por Unidade (CFU)
  let cfu = 0;
  if (params.totalStockUnits > 0) {
    cfu = totalFixedExpenses / params.totalStockUnits;
  }

  if (products.length === 0) return null;

  const firstProduct = products[0];
  const calculated: CalculatedProduct = calculatePricing(firstProduct, params, cfu);

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

  let totalPercentageForMarkup = 0;
  if (params.taxRegime === TaxRegime.LucroPresumido) {
    totalPercentageForMarkup =
      (totalVariableExpensesPercentage + params.irpjRate + params.csllRate + params.profitMargin) / 100 +
      CBS_RATE + IBS_RATE;
  } else { // Simples Nacional
    totalPercentageForMarkup =
      (totalVariableExpensesPercentage + params.simplesNacionalRate + params.profitMargin) / 100;
  }

  const markupDivisor = 1 - totalPercentageForMarkup;

  const baseCostForMarkupExample = firstProduct.cost + cfu;


  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Memória de Cálculo Detalhada</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Exemplo: {firstProduct.name} (Cód. {firstProduct.code}) - {firstProduct.quantity} {firstProduct.unit} ({firstProduct.innerQuantity} unidades internas)
        </p>
        <div className="summary rounded-lg bg-muted/30 border border-border p-4 mb-4">
          <h4 className="text-md font-semibold mb-2">Parâmetros Aplicados</h4>
          <p className="text-xs text-muted-foreground">
            <strong>Regime Tributário:</strong> {params.taxRegime}<br/>
            <strong>Margem de Lucro Alvo:</strong> {formatPercent(params.profitMargin)}<br/>
            {params.taxRegime === TaxRegime.LucroPresumido ? (
              <>
                <strong>Alíquotas:</strong> CBS ({formatPercent(CBS_RATE * 100)}), IBS ({formatPercent(IBS_RATE * 100)}), IRPJ ({formatPercent(params.irpjRate)}), CSLL ({formatPercent(params.csllRate)})
              </>
            ) : (
              <>
                <strong>Alíquota:</strong> Simples Nacional ({formatPercent(params.simplesNacionalRate)})
              </>
            )}<br/>
            <strong>Custos Fixos Totais (CFT):</strong> {formatCurrency(totalFixedExpenses)}<br/>
            <strong>Estoque Total de Unidades (ETU):</strong> {params.totalStockUnits.toLocaleString('pt-BR')}<br/>
            <strong>Custo Fixo por Unidade (CFU):</strong> {formatCurrency(cfu)}
          </p>
        </div>
      </div>

      {markupDivisor <= 0 ? (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive-foreground">
          <p className="font-semibold mb-2">⚠️ Cálculo Inviável para este Produto</p>
          <p>
            A soma da Margem de Lucro ({formatPercent(params.profitMargin)}), {params.taxRegime === TaxRegime.SimplesNacional ? `Simples Nacional (${formatPercent(params.simplesNacionalRate)})` : `IRPJ (${formatPercent(params.irpjRate)}), CSLL (${formatPercent(params.csllRate)}), CBS (${formatPercent(CBS_RATE * 100)}), IBS (${formatPercent(IBS_RATE * 100)})`} e Despesas Variáveis Percentuais ({formatPercent(totalVariableExpensesPercentage)}) é igual ou superior a 100%.
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
            <p className="font-semibold mb-2">3. Custo Fixo por Unidade (CFU)</p>
            <p className="ml-4">
              • Custos Fixos Totais (CFT): {formatCurrency(totalFixedExpenses)}
            </p>
            <p className="ml-4">
              • Estoque Total de Unidades (ETU): {params.totalStockUnits.toLocaleString('pt-BR')}
            </p>
            <p className="ml-4 font-semibold">
              CFU = CFT ÷ ETU = {formatCurrency(totalFixedExpenses)} ÷ {params.totalStockUnits.toLocaleString('pt-BR')} = {formatCurrency(cfu)}
            </p>
            <p className="ml-4 mt-2 font-semibold">
              Custo Base para Markup (Unid. Com.): Custo de Aquisição ({formatCurrency(firstProduct.cost)}) + CFU ({formatCurrency(cfu)}) = {formatCurrency(baseCostForMarkupExample)}
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2">4. Markup Divisor (para Preço Sugerido)</p>
            <p className="ml-4">
              1 - (Despesas Variáveis% + {params.taxRegime === TaxRegime.SimplesNacional ? `Simples Nacional%` : `IRPJ% + CSLL% + CBS% + IBS%`} + Lucro%)
            </p>
            <p className="ml-4">
              1 - ({formatPercent(totalVariableExpensesPercentage)} + {params.taxRegime === TaxRegime.SimplesNacional ? formatPercent(params.simplesNacionalRate) : `${formatPercent(params.irpjRate)} + ${formatPercent(params.csllRate)} + ${formatPercent(CBS_RATE * 100)} + ${formatPercent(IBS_RATE * 100)}`} + {formatPercent(params.profitMargin)})
            </p>
            <p className="ml-4 font-semibold">
              = {markupDivisor.toFixed(4)}
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2">5. Preço de Venda Sugerido Unitário</p>
            <p className="ml-4">
              Custo Base para Markup por Unid. Com. ÷ Markup Divisor
            </p>
            <p className="ml-4">
              {formatCurrency(baseCostForMarkupExample)} ÷ {markupDivisor.toFixed(4)} = {formatCurrency(calculated.sellingPrice)} (por Unid. Com.)
            </p>
            <p className="ml-4 mt-2 font-semibold">
              Markup Aplicado: {formatPercent(calculated.markupPercentage)}
            </p>
            <p className="ml-4 text-muted-foreground">
              Preço de Venda Sugerido por Unid. Interna: {formatCurrency(calculated.sellingPricePerInnerUnit)}
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2">6. Menor Preço de Venda Unitário (Cobre Custos Variáveis e Impostos Diretos)</p>
            <p className="ml-4">
              Custo de Aquisição por Unid. Com. ÷ (1 - (Despesas Variáveis% + {params.taxRegime === TaxRegime.SimplesNacional ? `Simples Nacional%` : `CBS% + IBS%`}))
            </p>
            <p className="ml-4">
              {formatCurrency(firstProduct.cost)} ÷ (1 - ({formatPercent(totalVariableExpensesPercentage)} + {params.taxRegime === TaxRegime.SimplesNacional ? formatPercent(params.simplesNacionalRate) : `${formatPercent(CBS_RATE * 100)} + ${formatPercent(IBS_RATE * 100)}`}))
            </p>
            <p className="ml-4 font-semibold text-yellow-500">
              = {formatCurrency(calculated.minSellingPrice)} (por Unid. Com.)
            </p>
            <p className="ml-4 text-muted-foreground">
              Menor Preço de Venda por Unid. Interna: {formatCurrency(calculated.minSellingPricePerInnerUnit)}
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2">7. Detalhamento do Preço de Venda (Unid. Com.)</p>
            <p className="ml-4">
              • Valor para Impostos: {formatCurrency(calculated.valueForTaxes)}
            </p>
            <p className="ml-4">
              • Valor para Despesas Variáveis: {formatCurrency(calculated.valueForVariableExpenses)}
            </p>
            <p className="ml-4">
              • Valor para Custo Fixo (CFU): {formatCurrency(calculated.valueForFixedCost)}
            </p>
            <p className="ml-4">
              • Valor para Lucro Líquido: {formatCurrency(calculated.valueForProfit)}
            </p>
            <p className="ml-4 mt-2 font-semibold">
              Margem de Contribuição (Unid. Com.): {formatCurrency(calculated.contributionMargin)}
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2">8. Imposto a Pagar (Líquido)</p>
            {params.taxRegime === TaxRegime.LucroPresumido ? (
              <>
                <p className="ml-4">
                  • CBS a Pagar por Unid. Com.: Débito CBS - Crédito CBS = {formatCurrency(calculated.cbsDebit)} - {formatCurrency(calculated.cbsCredit)} = {formatCurrency(calculated.cbsTaxToPay)}
                </p>
                <p className="ml-4">
                  • IBS a Pagar por Unid. Com.: Débito IBS - Crédito IBS = {formatCurrency(calculated.ibsDebit)} - {formatCurrency(calculated.ibsCredit)} = {formatCurrency(calculated.ibsTaxToPay)}
                </p>
                <p className="ml-4 font-semibold text-destructive">
                  Total Imposto a Pagar por Unid. Com.: {formatCurrency(calculated.cbsTaxToPay + calculated.ibsTaxToPay + calculated.irpjToPay + calculated.csllToPay)}
                </p>
                <p className="ml-4 text-muted-foreground">
                  Total Imposto a Pagar por Unid. Interna: {formatCurrency(calculated.cbsTaxToPayPerInnerUnit + calculated.ibsTaxToPayPerInnerUnit + calculated.irpjToPayPerInnerUnit + calculated.csllToPayPerInnerUnit)}
                </p>
              </>
            ) : (
              <>
                <p className="ml-4 font-semibold text-destructive">
                  Total Imposto a Pagar por Unid. Com.: {formatCurrency(calculated.simplesToPay)}
                </p>
                <p className="ml-4 text-muted-foreground">
                  Total Imposto a Pagar por Unid. Interna: {formatCurrency(calculated.simplesToPayPerInnerUnit)}
                </p>
              </>
            )}
          </div>

          <div className="border-t border-border pt-4 mt-4">
            <p className="font-semibold mb-2">Resumo da Operação Unitária</p>
            <p className="ml-4">
              • Custo de Aquisição por Unid. Com.: {formatCurrency(firstProduct.cost)}
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
              • Custo de Aquisição por Unid. Interna: {formatCurrency(calculated.costPerInnerUnit)}
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