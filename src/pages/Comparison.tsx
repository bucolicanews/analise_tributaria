import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { globalProducts, globalParams, globalSelectedProductCodes } from './Index';
import { calculatePricing } from '@/lib/pricing';
import { CalculatedProduct, TaxRegime, CalculationParams } from '@/types/pricing';
import { GlobalSummaryData } from '@/components/ProductsTable';
import { cn } from '@/lib/utils';

// Helper function to calculate global summary for a given set of products and parameters
const calculateGlobalSummaryForComparison = (
  productsToCalculate: CalculatedProduct[],
  currentParams: CalculationParams,
  globalFixedExpenses: number,
  totalVariableExpensesPercent: number,
  cfu: number,
  totalInnerUnitsInXML: number,
  profitMarginOverride: number
): GlobalSummaryData => {
  
  const productsToSummarize = productsToCalculate.map(p => {
    // Recalculate selling price and taxes based on the overridden profit margin (0% for min sale)
    const tempParams = { ...currentParams, profitMargin: profitMarginOverride };
    return calculatePricing(p, tempParams, cfu);
  });

  // Summing up values directly from the calculated products
  const totalSellingSum = productsToSummarize.reduce((sum, p) => sum + p.sellingPrice * p.quantity, 0);
  const totalTaxSum = productsToSummarize.reduce((sum, p) => sum + p.taxToPay * p.quantity, 0);
  const totalProfitSum = productsToSummarize.reduce((sum, p) => sum + p.valueForProfit * p.quantity, 0); 
  const totalVariableExpensesValueSum = productsToSummarize.reduce((sum, p) => sum + p.valueForVariableExpenses * p.quantity, 0);
  const totalContributionMarginSum = productsToSummarize.reduce((sum, p) => sum + p.contributionMargin * p.quantity, 0);

  const totalCbsCreditSum = productsToSummarize.reduce((sum, p) => sum + p.cbsCredit * p.quantity, 0);
  const totalIbsCreditSum = productsToSummarize.reduce((sum, p) => sum + p.ibsCredit * p.quantity, 0);
  const totalCbsDebitSum = productsToSummarize.reduce((sum, p) => sum + p.cbsDebit * p.quantity, 0);
  const totalIbsDebitSum = productsToSummarize.reduce((sum, p) => sum + p.ibsDebit * p.quantity, 0);
  const totalCbsTaxToPaySum = productsToSummarize.reduce((sum, p) => sum + p.cbsTaxToPay * p.quantity, 0);
  const totalIbsTaxToPaySum = productsToSummarize.reduce((sum, p) => sum + p.ibsTaxToPay * p.quantity, 0);
  const totalIrpjToPaySum = productsToSummarize.reduce((sum, p) => sum + p.irpjToPay * p.quantity, 0);
  const totalCsllToPaySum = productsToSummarize.reduce((sum, p) => sum + p.csllToPay * p.quantity, 0);
  const totalSimplesToPaySum = productsToSummarize.reduce((sum, p) => sum + p.simplesToPay * p.quantity, 0);
  const totalSelectiveTaxToPaySum = productsToSummarize.reduce((sum, p) => sum + p.selectiveTaxToPay * p.quantity, 0);
  const totalIvaCreditForClientSum = productsToSummarize.reduce((sum, p) => sum + p.ivaCreditForClient * p.quantity, 0);

  const totalTaxPercent = totalSellingSum > 0 ? (totalTaxSum / totalSellingSum) * 100 : 0;
  const profitMarginPercent = totalSellingSum > 0 ? (totalProfitSum / totalSellingSum) * 100 : 0;

  // Break-even point calculation (simplified for comparison, using the same logic as ProductsTable)
  let totalVariableCostsRatio = totalVariableExpensesPercent / 100;
  
  const cbsRateEffective = currentParams.useCbsDebit ? currentParams.cbsRate / 100 : 0;
  const ibsRateEffective = (currentParams.ibsRate / 100) * (currentParams.ibsDebitPercentage / 100);
  const selectiveTaxRateEffective = currentParams.useSelectiveTaxDebit ? currentParams.selectiveTaxRate / 100 : 0;

  if (currentParams.taxRegime === TaxRegime.LucroPresumido) {
    totalVariableCostsRatio += cbsRateEffective + ibsRateEffective + (currentParams.irpjRate / 100) + (currentParams.csllRate / 100) + selectiveTaxRateEffective;
  } else if (currentParams.taxRegime === TaxRegime.LucroReal) {
    totalVariableCostsRatio += cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective;
  } else { // Simples Nacional
    if (currentParams.generateIvaCredit) {
      totalVariableCostsRatio += (currentParams.simplesNacionalRate / 100) + cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective;
    } else {
      totalVariableCostsRatio += (currentParams.simplesNacionalRate / 100) + selectiveTaxRateEffective;
    }
  }

  const contributionMarginRatio = 1 - totalVariableCostsRatio;
  const breakEvenPoint = contributionMarginRatio > 0 ? globalFixedExpenses / contributionMarginRatio : 0;

  return {
    totalSelling: totalSellingSum,
    totalTax: totalTaxSum,
    totalProfit: totalProfitSum,
    profitMarginPercent: profitMarginPercent,
    breakEvenPoint: breakEvenPoint,
    totalVariableExpensesValue: totalVariableExpensesValueSum,
    totalContributionMargin: totalContributionMarginSum,
    totalTaxPercent: totalTaxPercent,
    totalCbsCredit: totalCbsCreditSum,
    totalIbsCredit: totalIbsCreditSum,
    totalCbsDebit: totalCbsDebitSum,
    totalIbsDebit: totalIbsDebitSum,
    totalCbsTaxToPay: totalCbsTaxToPaySum,
    totalIbsTaxToPay: totalIbsTaxToPaySum,
    totalIrpjToPay: totalIrpjToPaySum,
    totalCsllToPay: totalCsllToPaySum,
    totalSimplesToPay: totalSimplesToPaySum,
    totalSelectiveTaxToPay: totalSelectiveTaxToPaySum,
    totalIvaCreditForClient: totalIvaCreditForClientSum,
  };
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${value.toFixed(2)}%`;
};

const Comparison = () => {
  const products = globalProducts;
  const params = globalParams;
  const selectedProductCodes = globalSelectedProductCodes;

  const productsToCalculate = useMemo(() => {
    return products.filter(p => selectedProductCodes.has(p.code));
  }, [products, selectedProductCodes]);

  const comparisonData = useMemo(() => {
    if (!params || productsToCalculate.length === 0) {
      return null;
    }

    // 1. Consolidar Custos Fixos Totais (CFT)
    const inssPatronalValue = params.taxRegime !== TaxRegime.SimplesNacional
      ? params.payroll * (params.inssPatronalRate / 100)
      : 0;
    const totalFixedExpenses = params.fixedExpenses.reduce((sum, exp) => sum + exp.value, 0) + params.payroll + inssPatronalValue;
    const cfu = params.totalStockUnits > 0 ? totalFixedExpenses / params.totalStockUnits : 0;
    const totalVariableExpensesPercent = params.variableExpenses.reduce((sum, exp) => sum + exp.percentage, 0);
    const totalInnerUnitsInXML = productsToCalculate.reduce((sum, p) => sum + p.quantity * p.innerQuantity, 0);

    // 2. Calcular os 3 cenários (Simples Nacional Padrão, Lucro Presumido, Lucro Real)
    
    // --- Simples Nacional Padrão (SN) ---
    const paramsSN = { ...params, taxRegime: TaxRegime.SimplesNacional, generateIvaCredit: false };
    const calculatedProductsSN = productsToCalculate.map(p => calculatePricing(p, paramsSN, cfu));
    const summarySN = calculateGlobalSummaryForComparison(
      calculatedProductsSN,
      paramsSN,
      totalFixedExpenses,
      totalVariableExpensesPercent,
      cfu,
      totalInnerUnitsInXML,
      params.profitMargin
    );
    
    // --- Lucro Presumido (LP) ---
    const paramsLP = { ...params, taxRegime: TaxRegime.LucroPresumido };
    const calculatedProductsLP = productsToCalculate.map(p => calculatePricing(p, paramsLP, cfu));
    const summaryLP = calculateGlobalSummaryForComparison(
      calculatedProductsLP,
      paramsLP,
      totalFixedExpenses,
      totalVariableExpensesPercent,
      cfu,
      totalInnerUnitsInXML,
      params.profitMargin
    );

    // --- Lucro Real (LR) ---
    const paramsLR = { ...params, taxRegime: TaxRegime.LucroReal };
    const calculatedProductsLR = productsToCalculate.map(p => calculatePricing(p, paramsLR, cfu));
    const summaryLR = calculateGlobalSummaryForComparison(
      calculatedProductsLR,
      paramsLR,
      totalFixedExpenses,
      totalVariableExpensesPercent,
      cfu,
      totalInnerUnitsInXML,
      params.profitMargin
    );

    // --- Determinar o Vencedor (Maior Lucro Líquido Total) ---
    const results = [
      { regime: TaxRegime.SimplesNacional, label: "Simples Nacional (Padrão)", summary: summarySN, isApplicable: true },
      { regime: TaxRegime.LucroPresumido, label: "Lucro Presumido", summary: summaryLP, isApplicable: true },
      { regime: TaxRegime.LucroReal, label: "Lucro Real", summary: summaryLR, isApplicable: true },
    ];

    let bestResult = results[0];
    for (let i = 1; i < results.length; i++) {
      if (results[i].summary.totalProfit > bestResult.summary.totalProfit) {
        bestResult = results[i];
      }
    }

    return { results, bestResult };

  }, [params, productsToCalculate]);

  if (!params || productsToCalculate.length === 0 || !comparisonData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-card">
          <div className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <BarChart3 className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Dados insuficientes para comparação
            </h3>
            <p className="text-muted-foreground max-w-md">
              Por favor, volte para a página de Análise de Precificação, faça o upload dos arquivos XML e preencha todos os parâmetros de cálculo.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const { results, bestResult } = comparisonData;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Card className="shadow-elegant border-primary/50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-3">
            <TrendingUp className="h-6 w-6" />
            Resultado do Comparativo de Regimes
          </CardTitle>
          <Alert className="mt-4 bg-success/10 border-success text-success-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Regime Mais Vantajoso (Maior Lucro Líquido)</AlertTitle>
            <AlertDescription className="text-lg font-semibold">
              O regime mais vantajoso para esta simulação é: <span className="text-success font-extrabold">{bestResult.label}</span>, com um Lucro Líquido Total de <span className="font-extrabold">{formatCurrency(bestResult.summary.totalProfit)}</span>.
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            A comparação abaixo utiliza os **{productsToCalculate.length} produtos selecionados** e os **parâmetros de custo fixo e margem alvo** definidos na aba de Precificação.
          </p>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Métrica</TableHead>
                  {results.map((res) => (
                    <TableHead 
                      key={res.regime} 
                      className={cn(
                        "text-right font-bold",
                        res === bestResult ? "text-success" : "text-muted-foreground"
                      )}
                    >
                      {res.label}
                      {res === bestResult && <CheckCircle2 className="h-4 w-4 inline ml-2" />}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Linha 1: Venda Total */}
                <TableRow>
                  <TableCell className="font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Venda Total Sugerida</TableCell>
                  {results.map((res) => (
                    <TableCell key={res.regime} className={cn("text-right font-bold", res === bestResult && "text-success")}>
                      {formatCurrency(res.summary.totalSelling)}
                    </TableCell>
                  ))}
                </TableRow>
                
                {/* Linha 2: Impostos Totais */}
                <TableRow>
                  <TableCell className="font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-destructive" /> Impostos Líquidos Totais</TableCell>
                  {results.map((res) => (
                    <TableCell key={res.regime} className={cn("text-right text-destructive font-bold", res === bestResult && "text-success")}>
                      {formatCurrency(res.summary.totalTax)} ({formatPercent(res.summary.totalTaxPercent)})
                    </TableCell>
                  ))}
                </TableRow>
                
                {/* Linha 3: Despesas Variáveis */}
                <TableRow>
                  <TableCell className="font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-yellow-500" /> Despesas Variáveis Totais</TableCell>
                  {results.map((res) => (
                    <TableCell key={res.regime} className={cn("text-right text-yellow-500 font-bold", res === bestResult && "text-success")}>
                      {formatCurrency(res.summary.totalVariableExpensesValue)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Linha 4: Margem de Contribuição */}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" /> Margem de Contribuição Total</TableCell>
                  {results.map((res) => (
                    <TableCell key={res.regime} className={cn("text-right text-accent font-bold", res === bestResult && "text-success")}>
                      {formatCurrency(res.summary.totalContributionMargin)}
                    </TableCell>
                  ))}
                </TableRow>
                
                {/* Linha 5: Lucro Líquido Total */}
                <TableRow className="bg-success/10">
                  <TableCell className="font-extrabold flex items-center gap-2"><DollarSign className="h-4 w-4 text-success" /> LUCRO LÍQUIDO TOTAL</TableCell>
                  {results.map((res) => (
                    <TableCell 
                      key={res.regime} 
                      className={cn(
                        "text-right text-xl font-extrabold",
                        res.summary.totalProfit < 0 ? "text-destructive" : "text-success"
                      )}
                    >
                      {formatCurrency(res.summary.totalProfit)}
                    </TableCell>
                  ))}
                </TableRow>
                
                {/* Linha 6: Margem de Lucro Líquida % */}
                <TableRow>
                  <TableCell className="font-semibold">Margem de Lucro Líquida %</TableCell>
                  {results.map((res) => (
                    <TableCell key={res.regime} className={cn("text-right font-bold", res.summary.totalProfit < 0 ? "text-destructive" : "text-success")}>
                      {formatPercent(res.summary.profitMarginPercent)}
                    </TableCell>
                  ))}
                </TableRow>
                
                {/* Linha 7: Ponto de Equilíbrio */}
                <TableRow>
                  <TableCell className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-muted-foreground" /> Ponto de Equilíbrio (Mensal)</TableCell>
                  {results.map((res) => (
                    <TableCell key={res.regime} className="text-right text-muted-foreground font-bold">
                      {formatCurrency(res.summary.breakEvenPoint)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Alert variant="default" className="bg-muted/30">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Atenção: Simples Nacional Híbrido</AlertTitle>
        <AlertDescription>
          O Simples Nacional Híbrido (que gera crédito de IVA) não foi incluído diretamente na comparação principal, pois ele é uma variação do Simples Padrão. Se você deseja compará-lo, selecione-o na aba de Precificação e observe o "Custo da Opção Híbrida" no resumo de Impostos.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default Comparison;