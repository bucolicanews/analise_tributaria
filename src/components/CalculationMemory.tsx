import { Product, CalculationParams, CalculatedProduct, TaxRegime } from "@/types/pricing";
import { calculatePricing } from "@/lib/pricing";

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
  
  // Calcular para o cenário atual selecionado
  const calculated: CalculatedProduct = calculatePricing(firstProduct, params, cfu);

  // Calcular para o cenário alternativo do Simples Nacional, se aplicável
  let calculatedAlternative: CalculatedProduct | null = null;
  if (params.taxRegime === TaxRegime.SimplesNacional) {
    calculatedAlternative = calculatePricing(firstProduct, { ...params, generateIvaCredit: !params.generateIvaCredit }, cfu);
  }


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
  const cbsRate = params.cbsRate / 100;
  const ibsRate = params.ibsRate / 100;
  const selectiveTaxRate = params.selectiveTaxRate / 100;

  if (params.taxRegime === TaxRegime.LucroPresumido) {
    totalPercentageForMarkup =
      (totalVariableExpensesPercentage + params.irpjRate + params.csllRate + params.profitMargin) / 100 +
      cbsRate + ibsRate + selectiveTaxRate;
  } else { // Simples Nacional
    if (params.generateIvaCredit) { // Simples Nacional Híbrido (gera crédito de IVA)
      totalPercentageForMarkup =
        (totalVariableExpensesPercentage + params.simplesNacionalRate + params.profitMargin) / 100 +
        cbsRate + ibsRate + selectiveTaxRate;
    } else { // Simples Nacional Padrão (não gera crédito de IVA)
      totalPercentageForMarkup =
        (totalVariableExpensesPercentage + params.simplesNacionalRate + params.profitMargin) / 100 +
        selectiveTaxRate;
    }
  }

  const markupDivisor = 1 - totalPercentageForMarkup;

  // Custo Base para o Markup Divisor antes da perda
  let baseCostBeforeLoss = firstProduct.cost + cfu;
  // Custo Base para o Markup Divisor após a perda
  let baseCostForMarkupExample = baseCostBeforeLoss;
  if (params.lossPercentage > 0 && params.lossPercentage < 100) {
    baseCostForMarkupExample = baseCostBeforeLoss / (1 - params.lossPercentage / 100);
  } else if (params.lossPercentage >= 100) {
    baseCostForMarkupExample = Infinity;
  }


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
            <strong>Regime Tributário:</strong> {params.taxRegime}
            {params.taxRegime === TaxRegime.SimplesNacional && params.generateIvaCredit && " (Híbrido - Gerando Crédito IVA)"}
            {params.taxRegime === TaxRegime.SimplesNacional && !params.generateIvaCredit && " (Padrão - Sem Crédito IVA)"}
            <br/>
            <strong>Margem de Lucro Alvo:</strong> {formatPercent(params.profitMargin)}<br/>
            {params.taxRegime === TaxRegime.LucroPresumido ? (
              <>
                <strong>Alíquotas:</strong> CBS ({formatPercent(params.cbsRate)}), IBS ({formatPercent(params.ibsRate)}), IRPJ ({formatPercent(params.irpjRate)}), CSLL ({formatPercent(params.csllRate)}), IS ({formatPercent(params.selectiveTaxRate)})
              </>
            ) : (
              <>
                <strong>Alíquota Simples:</strong> {formatPercent(params.simplesNacionalRate)}
                {params.generateIvaCredit && (
                  <>
                    <br/><strong>Alíquotas IVA:</strong> CBS ({formatPercent(params.cbsRate)}), IBS ({formatPercent(params.ibsRate)})
                  </>
                )}
                <br/><strong>Alíquota IS:</strong> {formatPercent(params.selectiveTaxRate)}
              </>
            )}<br/>
            <strong>Custos Fixos Totais (CFT):</strong> {formatCurrency(totalFixedExpenses)}<br/>
            <strong>Estoque Total de Unidades (ETU):</strong> {params.totalStockUnits.toLocaleString('pt-BR')}<br/>
            <strong>Custo Fixo por Unidade (CFU):</strong> {formatCurrency(cfu)}<br/>
            <strong>Perdas e Quebras:</strong> {formatPercent(params.lossPercentage)}
          </p>
        </div>
      </div>

      {markupDivisor <= 0 || baseCostForMarkupExample === Infinity ? (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive-foreground">
          <p className="font-semibold mb-2">⚠️ Cálculo Inviável para este Produto</p>
          <p>
            A soma da Margem de Lucro ({formatPercent(params.profitMargin)}), {params.taxRegime === TaxRegime.SimplesNacional ? `Simples Nacional (${params.generateIvaCredit ? formatPercent(params.simplesNacionalRate) + ' + IVA' : formatPercent(params.simplesNacionalRate)})` : `IRPJ (${formatPercent(params.irpjRate)}), CSLL (${formatPercent(params.csllRate)}), CBS (${formatPercent(params.cbsRate)}), IBS (${formatPercent(params.ibsRate)})`}, Imposto Seletivo ({formatPercent(params.selectiveTaxRate)}) e Despesas Variáveis Percentuais ({formatPercent(totalVariableExpensesPercentage)}) é igual ou superior a 100%, ou a porcentagem de perdas e quebras é inviável.
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
          </div>

          <div>
            <p className="font-semibold mb-2">4. Ajuste do Custo Base para Perdas e Quebras</p>
            <p className="ml-4">
              • Custo Base antes das Perdas (Unid. Com.): Custo de Aquisição ({formatCurrency(firstProduct.cost)}) + CFU ({formatCurrency(cfu)}) = {formatCurrency(baseCostBeforeLoss)}
            </p>
            <p className="ml-4 font-semibold">
              • Custo Base para Markup (Unid. Com.) = Custo Base antes das Perdas ÷ (1 - Perdas%)
            </p>
            <p className="ml-4">
              {formatCurrency(baseCostBeforeLoss)} ÷ (1 - {formatPercent(params.lossPercentage)}) = {formatCurrency(baseCostForMarkupExample)}
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2">5. Markup Divisor (para Preço Sugerido)</p>
            <p className="ml-4">
              1 - (Despesas Variáveis% + {params.taxRegime === TaxRegime.SimplesNacional ? (params.generateIvaCredit ? `Simples% + CBS% + IBS%` : `Simples Nacional%`) : `IRPJ% + CSLL% + CBS% + IBS%`} + IS% + Lucro%)
            </p>
            <p className="ml-4">
              1 - ({formatPercent(totalVariableExpensesPercentage)} + {params.taxRegime === TaxRegime.SimplesNacional ? (params.generateIvaCredit ? `${formatPercent(params.simplesNacionalRate)} + ${formatPercent(params.cbsRate)} + ${formatPercent(params.ibsRate)}` : formatPercent(params.simplesNacionalRate)) : `${formatPercent(params.irpjRate)} + ${formatPercent(params.csllRate)} + ${formatPercent(params.cbsRate)} + ${formatPercent(params.ibsRate)}`} + {formatPercent(params.selectiveTaxRate)} + {formatPercent(params.profitMargin)})
            </p>
            <p className="ml-4 font-semibold">
              = {markupDivisor.toFixed(4)}
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2">6. Preço de Venda Sugerido Unitário</p>
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
            <p className="font-semibold mb-2">7. Menor Preço de Venda Unitário (Cobre Custos Variáveis e Impostos Diretos)</p>
            <p className="ml-4">
              Custo Base para Markup por Unid. Com. ÷ (1 - (Despesas Variáveis% + {params.taxRegime === TaxRegime.SimplesNacional ? (params.generateIvaCredit ? `Simples% + CBS% + IBS%` : `Simples Nacional%`) : `CBS% + IBS%`} + IS%))
            </p>
            <p className="ml-4">
              {formatCurrency(baseCostForMarkupExample)} ÷ (1 - ({formatPercent(totalVariableExpensesPercentage)} + {params.taxRegime === TaxRegime.SimplesNacional ? (params.generateIvaCredit ? `${formatPercent(params.simplesNacionalRate)} + ${formatPercent(params.cbsRate)} + ${formatPercent(params.ibsRate)}` : formatPercent(params.simplesNacionalRate)) : `${formatPercent(params.cbsRate)} + ${formatPercent(params.ibsRate)}`} + {formatPercent(params.selectiveTaxRate)}))
            </p>
            <p className="ml-4 font-semibold text-yellow-500">
              = {formatCurrency(calculated.minSellingPrice)} (por Unid. Com.)
            </p>
            <p className="ml-4 text-muted-foreground">
              Menor Preço de Venda por Unid. Interna: {formatCurrency(calculated.minSellingPricePerInnerUnit)}
            </p>
          </div>

          <div>
            <p className="font-semibold mb-2">8. Detalhamento do Preço de Venda (Unid. Com.)</p>
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
            <p className="font-semibold mb-2">9. Imposto a Pagar (Líquido)</p>
            {params.taxRegime === TaxRegime.LucroPresumido ? (
              <>
                <p className="ml-4">
                  • CBS a Pagar por Unid. Com.: Débito CBS - Crédito CBS = {formatCurrency(calculated.cbsDebit)} - {formatCurrency(calculated.cbsCredit)} = {formatCurrency(calculated.cbsTaxToPay)}
                </p>
                <p className="ml-4">
                  • IBS a Pagar por Unid. Com.: Débito IBS - Crédito IBS = {formatCurrency(calculated.ibsDebit)} - {formatCurrency(calculated.ibsCredit)} = {formatCurrency(calculated.ibsTaxToPay)}
                </p>
                <p className="ml-4 font-semibold text-destructive">
                  Total Imposto a Pagar por Unid. Com.: {formatCurrency(calculated.cbsTaxToPay + calculated.ibsTaxToPay + calculated.irpjToPay + calculated.csllToPay + calculated.selectiveTaxToPay)}
                </p>
                <p className="ml-4 text-muted-foreground">
                  Total Imposto a Pagar por Unid. Interna: {formatCurrency(calculated.cbsTaxToPayPerInnerUnit + calculated.ibsTaxToPayPerInnerUnit + calculated.irpjToPayPerInnerUnit + calculated.csllToPayPerInnerUnit + calculated.selectiveTaxToPayPerInnerUnit)}
                </p>
              </>
            ) : (
              <>
                {params.generateIvaCredit && (
                  <>
                    <p className="ml-4">
                      • Simples a Pagar por Unid. Com.: {formatCurrency(calculated.simplesToPay)}
                    </p>
                    <p className="ml-4">
                      • CBS a Pagar por Unid. Com.: Débito CBS - Crédito CBS = {formatCurrency(calculated.cbsDebit)} - {formatCurrency(calculated.cbsCredit)} = {formatCurrency(calculated.cbsTaxToPay)}
                    </p>
                    <p className="ml-4">
                      • IBS a Pagar por Unid. Com.: Débito IBS - Crédito IBS = {formatCurrency(calculated.ibsDebit)} - {formatCurrency(calculated.ibsCredit)} = {formatCurrency(calculated.ibsTaxToPay)}
                    </p>
                    <p className="ml-4">
                      • Imposto Seletivo a Pagar por Unid. Com.: {formatCurrency(calculated.selectiveTaxToPay)}
                    </p>
                    <p className="ml-4 font-semibold text-destructive">
                      Total Imposto a Pagar por Unid. Com.: {formatCurrency(calculated.simplesToPay + calculated.cbsTaxToPay + calculated.ibsTaxToPay + calculated.selectiveTaxToPay)}
                    </p>
                    <p className="ml-4 text-muted-foreground">
                      Total Imposto a Pagar por Unid. Interna: {formatCurrency(calculated.simplesToPayPerInnerUnit + calculated.cbsTaxToPayPerInnerUnit + calculated.ibsTaxToPayPerInnerUnit + calculated.selectiveTaxToPayPerInnerUnit)}
                    </p>
                  </>
                )}
                {!params.generateIvaCredit && (
                  <>
                    <p className="ml-4 font-semibold text-destructive">
                      Total Imposto a Pagar por Unid. Com.: {formatCurrency(calculated.simplesToPay + calculated.selectiveTaxToPay)}
                    </p>
                    <p className="ml-4 text-muted-foreground">
                      Total Imposto a Pagar por Unid. Interna: {formatCurrency(calculated.simplesToPayPerInnerUnit + calculated.selectiveTaxToPayPerInnerUnit)}
                    </p>
                  </>
                )}
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
            <p className="ml-4">
              • Crédito de IVA para o Cliente por Unid. Com.: {formatCurrency(calculated.ivaCreditForClient)}
            </p>
            {calculatedAlternative && (
              <p className="ml-4 font-semibold text-yellow-500">
                • Custo da Opção Híbrida por Unid. Com.: {formatCurrency(calculatedAlternative.taxToPay - calculated.taxToPay)}
              </p>
            )}
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
          Esta é uma simulação baseada nas propostas da Reforma Tributária. Os valores e regras finais dependem da aprovação das Leis Complementares.
        </p>
      </div>
    </div>
  );
};