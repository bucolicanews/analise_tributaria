import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Product, CalculationParams, CalculatedProduct, TaxRegime } from "@/types/pricing";
import { calculatePricing, CBS_RATE, IBS_RATE } from "@/lib/pricing"; // Import CBS_RATE and IBS_RATE
import { toast } from "sonner"; // Import toast for error messages
import { cn } from "@/lib/utils"; // Import cn for conditional classnames

interface ProductsTableProps {
  products: Product[];
  params: CalculationParams;
}

export const ProductsTable = ({ products, params }: ProductsTableProps) => {
  // 1. Consolidar Custos Fixos Totais (CFT)
  const totalFixedExpenses = params.fixedExpenses.reduce((sum, exp) => sum + exp.value, 0) + params.payroll;

  // 2. Calcular Custo Fixo por Unidade (CFU)
  let cfu = 0;
  if (params.totalStockUnits > 0) {
    cfu = totalFixedExpenses / params.totalStockUnits;
  } else {
    toast.warning("Estoque Total de Unidades (ETU) é zero.", {
      description: "O rateio de custos fixos não será aplicado. Por favor, insira um valor maior que zero para o ETU.",
      duration: 5000,
    });
  }

  const calculatedProducts: CalculatedProduct[] = products.map((product) =>
    calculatePricing(product, params, cfu) // Passar CFU
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  // Soma das alíquotas percentuais para o cálculo global
  const totalVariableExpensesPercent = params.variableExpenses.reduce(
    (sum, exp) => sum + exp.percentage,
    0
  );
  
  let totalPercentageForGlobalMarkup = 0;
  if (params.taxRegime === TaxRegime.LucroPresumido) {
    totalPercentageForGlobalMarkup =
      (totalVariableExpensesPercent + params.irpjRate + params.csllRate + params.profitMargin) / 100 +
      CBS_RATE + IBS_RATE;
  } else { // Simples Nacional
    totalPercentageForGlobalMarkup =
      (totalVariableExpensesPercent + params.simplesNacionalRate + params.profitMargin) / 100;
  }

  // Markup Divisor Global
  const globalMarkupDivisor = 1 - totalPercentageForGlobalMarkup;

  let totalSelling = 0;
  let totalTax = 0;
  let totalProfit = 0;
  let profitMarginPercent = 0;
  let breakEvenPoint = 0;

  // Custo Total dos Produtos (apenas custo de aquisição)
  let totalProductAcquisitionCost = products.reduce((sum, p) => sum + p.cost * p.quantity, 0);

  // Ajustar o custo total de aquisição globalmente pela porcentagem de perdas
  if (params.lossPercentage > 0 && params.lossPercentage < 100) {
    totalProductAcquisitionCost = totalProductAcquisitionCost / (1 - params.lossPercentage / 100);
  } else if (params.lossPercentage >= 100) {
    totalProductAcquisitionCost = Infinity; // Torna o cálculo inviável
  }


  if (globalMarkupDivisor <= 0 || totalProductAcquisitionCost === Infinity) {
    toast.error("Cálculo Global Inviável", {
      description: "A soma das despesas percentuais e margem de lucro é igual ou superior a 100%, ou a porcentagem de perdas é inviável. Ajuste os parâmetros para um cálculo global válido.",
      duration: 5000,
    });
    // Os valores de resumo permanecerão 0 como inicializados
  } else {
    // 4. Calcular o Preço de Venda Total (Método de Markup Divisor)
    // A base para o cálculo global agora inclui o custo total de aquisição dos produtos e as despesas fixas totais
    totalSelling = (totalFixedExpenses + totalProductAcquisitionCost) / globalMarkupDivisor;

    // Calcular Impostos Líquidos (CBS e IBS a pagar)
    let totalCbsDebit = 0;
    let totalIbsDebit = 0;
    let totalIrpjToPay = 0;
    let totalCsllToPay = 0;
    let totalSimplesToPay = 0;

    if (params.taxRegime === TaxRegime.LucroPresumido) {
      totalCbsDebit = totalSelling * CBS_RATE;
      totalIbsDebit = totalSelling * IBS_RATE;
      totalIrpjToPay = totalSelling * (params.irpjRate / 100);
      totalCsllToPay = totalSelling * (params.csllRate / 100);
    } else { // Simples Nacional
      totalSimplesToPay = totalSelling * (params.simplesNacionalRate / 100);
    }

    const totalCbsCredit = calculatedProducts.reduce((sum, p) => sum + p.cbsCredit * p.quantity, 0);
    const totalIbsCredit = calculatedProducts.reduce((sum, p) => sum + p.ibsCredit * p.quantity, 0);
    
    const totalCbsTaxToPay = totalCbsDebit - totalCbsCredit;
    const totalIbsTaxToPay = totalIbsDebit - totalIbsCredit;
    
    if (params.taxRegime === TaxRegime.LucroPresumido) {
      totalTax = Math.max(0, totalCbsTaxToPay + totalIbsTaxToPay + totalIrpjToPay + totalCsllToPay);
    } else { // Simples Nacional
      totalTax = Math.max(0, totalSimplesToPay);
    }

    // Calcular Despesas Variáveis em valor (baseado no totalSelling)
    const totalVariableExpensesValue = totalSelling * (totalVariableExpensesPercent / 100);

    // Calcular Lucro Líquido
    totalProfit = totalSelling - totalFixedExpenses - totalProductAcquisitionCost - totalTax - totalVariableExpensesValue;
    profitMarginPercent = totalSelling > 0 ? (totalProfit / totalSelling) * 100 : 0;

    // Ponto de Equilíbrio (usando a fórmula do prompt)
    const totalVariableCostsForBEP = totalProductAcquisitionCost + totalVariableExpensesValue;
    const variableCostRatioForBEP = totalSelling > 0 ? totalVariableCostsForBEP / totalSelling : 0;
    
    let taxRatioForBEP = 0;
    if (params.taxRegime === TaxRegime.LucroPresumido) {
      taxRatioForBEP = CBS_RATE + IBS_RATE;
    } else { // Simples Nacional
      taxRatioForBEP = params.simplesNacionalRate / 100;
    }

    const denominatorBEP = 1 - (variableCostRatioForBEP + taxRatioForBEP);
    breakEvenPoint = denominatorBEP > 0 ? totalFixedExpenses / denominatorBEP : 0;
  }

  // Novas métricas para o resumo
  const totalVariableExpensesValue = totalSelling * (totalVariableExpensesPercent / 100);
  const totalContributionMargin = totalSelling - totalProductAcquisitionCost - totalVariableExpensesValue;
  const totalTaxPercent = totalSelling > 0 ? (totalTax / totalSelling) * 100 : 0;

  // Totais de CBS e IBS
  const totalCbsCredit = calculatedProducts.reduce((sum, p) => sum + p.cbsCredit * p.quantity, 0);
  const totalIbsCredit = calculatedProducts.reduce((sum, p) => sum + p.ibsCredit * p.quantity, 0);
  const totalCbsDebit = calculatedProducts.reduce((sum, p) => sum + p.cbsDebit * p.quantity, 0);
  const totalIbsDebit = calculatedProducts.reduce((sum, p) => sum + p.ibsDebit * p.quantity, 0);
  const totalCbsTaxToPay = calculatedProducts.reduce((sum, p) => sum + p.cbsTaxToPay * p.quantity, 0);
  const totalIbsTaxToPay = calculatedProducts.reduce((sum, p) => sum + p.ibsTaxToPay * p.quantity, 0);


  return (
    <div className="space-y-6">
      <div className="summary rounded-lg bg-muted/30 border border-border p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Parâmetros da Simulação</h2>
        <p className="text-sm text-muted-foreground">
          <strong>Regime Tributário:</strong> {params.taxRegime}<br/>
          <strong>Margem de Lucro Alvo:</strong> {formatPercent(params.profitMargin)}<br/>
          {params.taxRegime === TaxRegime.LucroPresumido ? (
            <>
              <strong>Alíquotas Aplicadas:</strong> CBS ({formatPercent(CBS_RATE * 100)}), IBS ({formatPercent(IBS_RATE * 100)}), IRPJ ({formatPercent(params.irpjRate)}), CSLL ({formatPercent(params.csllRate)})
            </>
          ) : (
            <>
              <strong>Alíquota Aplicada:</strong> Simples Nacional ({formatPercent(params.simplesNacionalRate)})
            </>
          )}<br/>
          <strong>Custos Fixos Totais (CFT):</strong> {formatCurrency(totalFixedExpenses)}<br/>
          <strong>Estoque Total de Unidades (ETU):</strong> {params.totalStockUnits.toLocaleString('pt-BR')}<br/>
          <strong>Custo Fixo por Unidade (CFU):</strong> {formatCurrency(cfu)}<br/>
          <strong>Perdas e Quebras:</strong> {formatPercent(params.lossPercentage)}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Unid. Com.</TableHead>
              <TableHead className="text-right">Qtd. Estoque</TableHead> {/* Nova Coluna */}
              <TableHead className="text-right">Qtd. Int.</TableHead>
              <TableHead>CFOP</TableHead>
              <TableHead>CST</TableHead>
              <TableHead className="text-right">Custo Aquisição (Unit)</TableHead> {/* Renomeado */}
              <TableHead className="text-right">Custo Fixo Rateado (Unit)</TableHead> {/* Nova Coluna */}
              <TableHead className="text-right">Custo Total Base (Unit)</TableHead> {/* Nova Coluna */}
              <TableHead className="text-right">Créd. CBS</TableHead>
              <TableHead className="text-right">Créd. IBS</TableHead>
              <TableHead className="text-right">Custo Efetivo Com.</TableHead>
              <TableHead className="text-right">Custo Efetivo Int.</TableHead>
              <TableHead className="text-right">Markup %</TableHead>
              {params.taxRegime === TaxRegime.LucroPresumido ? (
                <>
                  <TableHead className="text-right">Déb. CBS</TableHead>
                  <TableHead className="text-right">Déb. IBS</TableHead>
                  <TableHead className="text-right">CBS a Pagar</TableHead>
                  <TableHead className="text-right">IBS a Pagar</TableHead>
                  <TableHead className="text-right">IRPJ a Pagar</TableHead>
                  <TableHead className="text-right">CSLL a Pagar</TableHead>
                </>
              ) : (
                <TableHead className="text-right">Simples a Pagar</TableHead>
              )}
              <TableHead className="text-right">Imposto Líq.</TableHead>
              <TableHead className="text-right">Venda Mín. Com.</TableHead>
              <TableHead className="text-right">Venda Mín. Int.</TableHead>
              <TableHead className="text-right">Venda Sug. Com.</TableHead>
              <TableHead className="text-right">Venda Sug. Int.</TableHead>
              <TableHead className="text-right">Valor p/ Impostos (R$)</TableHead> {/* Nova Coluna */}
              <TableHead className="text-right">Valor p/ Desp. Variáveis (R$)</TableHead> {/* Nova Coluna */}
              <TableHead className="text-right">Valor p/ Custo Fixo (R$)</TableHead> {/* Nova Coluna */}
              <TableHead className="text-right">Valor p/ Lucro Líquido (R$)</TableHead> {/* Nova Coluna */}
              <TableHead className="text-right">Margem Contribuição (Unit)</TableHead> {/* Nova Coluna */}
              <TableHead className="text-right">Margem %</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calculatedProducts.map((product, index) => {
              // Margem de lucro por produto (baseada no preço de venda sugerido individual)
              const productProfit = product.sellingPrice - product.cost - product.taxToPay - (product.sellingPrice * (totalVariableExpensesPercent / 100));
              const productProfitMargin = product.sellingPrice > 0 ? (productProfit / product.sellingPrice) * 100 : 0;
              
              return (
                <TableRow key={index} className={cn(
                  product.status === "PREÇO CORRIGIDO" ? "bg-yellow-900/20" : ""
                )}>
                  <TableCell className="font-mono text-xs">{product.code}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{product.name}</TableCell>
                  <TableCell className="font-mono text-xs">{product.unit}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{product.quantity}</TableCell> {/* Qtd. Estoque */}
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">{product.innerQuantity}</TableCell>
                  <TableCell className="font-mono text-xs">{product.cfop}</TableCell>
                  <TableCell className="font-mono text-xs">{product.cst}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(product.cost)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {formatCurrency(cfu)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    {formatCurrency(product.cost + cfu)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-success">
                    {formatCurrency(product.cbsCredit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-success">
                    {formatCurrency(product.ibsCredit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {formatCurrency(product.effectiveCost)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {formatCurrency(product.effectiveCostPerInnerUnit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-accent">
                    {formatPercent(product.markupPercentage)}
                  </TableCell>
                  {params.taxRegime === TaxRegime.LucroPresumido ? (
                    <>
                      <TableCell className="text-right font-mono text-sm text-destructive">
                        {formatCurrency(product.cbsDebit)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-destructive">
                        {formatCurrency(product.ibsDebit)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-destructive">
                        {formatCurrency(product.cbsTaxToPay)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-destructive">
                        {formatCurrency(product.ibsTaxToPay)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-destructive">
                        {formatCurrency(product.irpjToPay)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-destructive">
                        {formatCurrency(product.csllToPay)}
                      </TableCell>
                    </>
                  ) : (
                    <TableCell className="text-right font-mono text-sm text-destructive">
                      {formatCurrency(product.simplesToPay)}
                    </TableCell>
                  )}
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    {formatCurrency(product.taxToPay)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-yellow-500">
                    {formatCurrency(product.minSellingPrice)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-yellow-500">
                    {formatCurrency(product.minSellingPricePerInnerUnit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-bold text-primary">
                    {formatCurrency(product.sellingPrice)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-bold text-primary">
                    {formatCurrency(product.sellingPricePerInnerUnit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(product.valueForTaxes)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(product.valueForVariableExpenses)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(product.valueForFixedCost)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(product.valueForProfit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    {formatCurrency(product.contributionMargin)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-success">
                    {formatPercent(productProfitMargin)}
                  </TableCell>
                  <TableCell className={cn(
                    "font-semibold",
                    product.status === "PREÇO CORRIGIDO" ? "text-yellow-500" : "text-success"
                  )}>
                    {product.status}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Custo Total Aquisição</p>
          <p className="text-2xl font-bold">{formatCurrency(totalProductAcquisitionCost)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Despesas Fixas Totais</p>
          <p className="text-2xl font-bold">{formatCurrency(totalFixedExpenses)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Despesas Variáveis Totais</p>
          <p className="text-2xl font-bold">{formatCurrency(totalVariableExpensesValue)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Margem de Contribuição Total</p>
          <p className="text-2xl font-bold text-accent">{formatCurrency(totalContributionMargin)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Valor de Venda Total</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalSelling)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Impostos Líquidos</p>
          <p className="text-2xl font-bold text-destructive">{formatCurrency(totalTax)}</p>
          <p className="text-xs text-muted-foreground mt-1">{formatPercent(totalTaxPercent)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Lucro Líquido</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(totalProfit)}</p>
          <p className="text-xs text-muted-foreground mt-1">{formatPercent(profitMarginPercent)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Ponto de Equilíbrio</p>
          <p className="text-2xl font-bold text-yellow-500">{formatCurrency(breakEvenPoint)}</p>
        </div>

        {/* Novos Cards para CBS e IBS */}
        {params.taxRegime === TaxRegime.LucroPresumido && (
          <>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Crédito CBS Total</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(totalCbsCredit)}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Débito CBS Total</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totalCbsDebit)}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-1">CBS a Pagar Total</p>
              <p className="text-2xl font-bold">{formatCurrency(totalCbsTaxToPay)}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Crédito IBS Total</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(totalIbsCredit)}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Débito IBS Total</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totalIbsDebit)}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-1">IBS a Pagar Total</p>
              <p className="text-2xl font-bold">{formatCurrency(totalIbsTaxToPay)}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};