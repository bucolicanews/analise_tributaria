import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { calculatePricing } from '@/lib/pricing';
import { Product, CalculatedProduct, TaxRegime, CalculationParams } from '@/types/pricing';
import { GlobalSummaryData } from '@/components/ProductsTable';
import { cn } from '@/lib/utils';

// Helper function to calculate global summary for a given set of products and parameters
const calculateGlobalSummaryForComparison = (
  productsToSummarize: CalculatedProduct[],
  currentParams: CalculationParams,
  globalFixedExpenses: number,
  totalVariableExpensesPercent: number,
  cfu: number,
  totalInnerUnitsInXML: number,
  profitMarginOverride: number
): GlobalSummaryData => {
  
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

  let totalVariableCostsRatio = totalVariableExpensesPercent / 100;
  
  const cbsRateEffective = currentParams.useCbsDebit ? currentParams.cbsRate / 100 : 0;
  const ibsRateEffective = (currentParams.ibsRate / 100) * (currentParams.ibsDebitPercentage / 100);
  const selectiveTaxRateEffective = currentParams.useSelectiveTaxDebit ? currentParams.defaultSelectiveTaxRate / 100 : 0; // Note: Simplified for comparison summary

  if (currentParams.taxRegime === TaxRegime.LucroPresumido) {
    totalVariableCostsRatio += cbsRateEffective + ibsRateEffective + (currentParams.irpjRate / 100) + (currentParams.csllRate / 100) + selectiveTaxRateEffective;
  } else if (currentParams.taxRegime === TaxRegime.LucroReal) {
    totalVariableCostsRatio += cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective;
  } else {
    if (currentParams.generateIvaCredit) {
      totalVariableCostsRatio += (currentParams.simplesNacionalRate / 100) + cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective;
    } else {
      totalVariableCostsRatio += (currentParams.simplesNacionalRate / 100) + selectiveTaxRateEffective;
    }
  }

  const contributionMarginRatio = totalContributionMarginSum / totalSellingSum;
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
  const comparisonData = useMemo(() => {
    const storedParams = sessionStorage.getItem('jota-calc-params');
    const storedProducts = sessionStorage.getItem('jota-calc-products');
    const storedSelection = sessionStorage.getItem('jota-calc-selection');

    if (!storedParams || !storedProducts || !storedSelection) {
      return null;
    }

    try {
      const baseParams: CalculationParams = JSON.parse(storedParams);
      const products: Product[] = JSON.parse(storedProducts);
      const selectedProductCodes: Set<string> = new Set(JSON.parse(storedSelection));
      
      const productsToProcess = products.filter(p => selectedProductCodes.has(p.code));

      if (productsToProcess.length === 0) return null;

      const totalVariableExpensesPercent = baseParams.variableExpenses.reduce((sum, exp) => sum + exp.percentage, 0);
      const totalInnerUnitsInXML = productsToProcess.reduce((sum, p) => sum + p.quantity * p.innerQuantity, 0);

      // --- SIMPLES NACIONAL (PADRÃO) ---
      const paramsSN = { ...baseParams, taxRegime: TaxRegime.SimplesNacional, generateIvaCredit: false };
      const fixedExpensesSN = paramsSN.fixedCostsTotal || 0;
      const cfuSN = paramsSN.totalStockUnits > 0 ? fixedExpensesSN / paramsSN.totalStockUnits : 0;
      const calculatedProductsSN = productsToProcess.map(p => calculatePricing(p, paramsSN, cfuSN));
      const summarySN = calculateGlobalSummaryForComparison(calculatedProductsSN, paramsSN, fixedExpensesSN, totalVariableExpensesPercent, cfuSN, totalInnerUnitsInXML, paramsSN.profitMargin);
      
      // --- SIMPLES NACIONAL (HÍBRIDO) ---
      const paramsSNH = { ...baseParams, taxRegime: TaxRegime.SimplesNacional, generateIvaCredit: true };
      const fixedExpensesSNH = paramsSNH.fixedCostsTotal || 0;
      const cfuSNH = paramsSNH.totalStockUnits > 0 ? fixedExpensesSNH / paramsSNH.totalStockUnits : 0;
      const calculatedProductsSNH = productsToProcess.map(p => calculatePricing(p, paramsSNH, cfuSNH));
      const summarySNH = calculateGlobalSummaryForComparison(calculatedProductsSNH, paramsSNH, fixedExpensesSNH, totalVariableExpensesPercent, cfuSNH, totalInnerUnitsInXML, paramsSNH.profitMargin);
      
      // --- LUCRO PRESUMIDO ---
      const paramsLP = { ...baseParams, taxRegime: TaxRegime.LucroPresumido };
      const fixedExpensesLP = paramsLP.fixedCostsTotal || 0;
      const cfuLP = paramsLP.totalStockUnits > 0 ? fixedExpensesLP / paramsLP.totalStockUnits : 0;
      const calculatedProductsLP = productsToProcess.map(p => calculatePricing(p, paramsLP, cfuLP));
      const summaryLP = calculateGlobalSummaryForComparison(calculatedProductsLP, paramsLP, fixedExpensesLP, totalVariableExpensesPercent, cfuLP, totalInnerUnitsInXML, paramsLP.profitMargin);

      // --- LUCRO REAL ---
      const paramsLR = { ...baseParams, taxRegime: TaxRegime.LucroReal };
      const fixedExpensesLR = paramsLR.fixedCostsTotal || 0;
      const cfuLR = paramsLR.totalStockUnits > 0 ? fixedExpensesLR / paramsLR.totalStockUnits : 0;
      const calculatedProductsLR = productsToProcess.map(p => calculatePricing(p, paramsLR, cfuLR));
      const summaryLR = calculateGlobalSummaryForComparison(calculatedProductsLR, paramsLR, fixedExpensesLR, totalVariableExpensesPercent, cfuLR, totalInnerUnitsInXML, paramsLR.profitMargin);

      const results = [
        { regime: TaxRegime.SimplesNacional, label: "Simples Nacional (Padrão)", summary: summarySN, isApplicable: true },
        { regime: TaxRegime.SimplesNacional, label: "Simples Nacional (Híbrido)", summary: summarySNH, isApplicable: true },
        { regime: TaxRegime.LucroPresumido, label: "Lucro Presumido", summary: summaryLP, isApplicable: true },
        { regime: TaxRegime.LucroReal, label: "Lucro Real", summary: summaryLR, isApplicable: true },
      ];

      let bestResult = results[0];
      for (let i = 1; i < results.length; i++) {
        if (results[i].summary.totalProfit > bestResult.summary.totalProfit) {
          bestResult = results[i];
        }
      }

      return { results, bestResult, productsToCalculateCount: productsToProcess.length };
    } catch (error) {
      console.error("Failed to process comparison data", error);
      return null;
    }
  }, []);

  if (!comparisonData) {
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
              Por favor, volte para a página de Análise de Precificação, faça o upload dos arquivos XML, preencha todos os parâmetros de cálculo e clique em "Gerar Relatório".
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const { results, bestResult, productsToCalculateCount } = comparisonData;

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
            A comparação abaixo utiliza os **{productsToCalculateCount} produtos selecionados** e os **parâmetros de custo fixo e margem alvo** definidos na aba de Precificação.
          </p>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Métrica</TableHead>
                  {results.map((res) => (
                    <TableHead 
                      key={res.label}
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
                <TableRow>
                  <TableCell className="font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Venda Total Sugerida</TableCell>
                  {results.map((res) => (
                    <TableCell key={res.label} className={cn("text-right font-bold", res === bestResult && "text-success")}>
                      {formatCurrency(res.summary.totalSelling)}
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-destructive" /> Impostos Líquidos Totais</TableCell>
                  {results.map((res) => (
                    <TableCell key={res.label} className={cn("text-right text-destructive font-bold", res === bestResult && "text-success")}>
                      {formatCurrency(res.summary.totalTax)} ({formatPercent(res.summary.totalTaxPercent)})
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-yellow-500" /> Despesas Variáveis Totais</TableCell>
                  {results.map((res) => (
                    <TableCell key={res.label} className={cn("text-right text-yellow-500 font-bold", res === bestResult && "text-success")}>
                      {formatCurrency(res.summary.totalVariableExpensesValue)}
                    </TableCell>
                  ))}
                </TableRow>

                <TableRow className="bg-muted/50">
                  <TableCell className="font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" /> Margem de Contribuição Total</TableCell>
                  {results.map((res) => (
                    <TableCell key={res.label} className={cn("text-right text-accent font-bold", res === bestResult && "text-success")}>
                      {formatCurrency(res.summary.totalContributionMargin)}
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow className="bg-success/10">
                  <TableCell className="font-extrabold flex items-center gap-2"><DollarSign className="h-4 w-4 text-success" /> LUCRO LÍQUIDO TOTAL</TableCell>
                  {results.map((res) => (
                    <TableCell 
                      key={res.label} 
                      className={cn(
                        "text-right text-xl font-extrabold",
                        res.summary.totalProfit < 0 ? "text-destructive" : "text-success"
                      )}
                    >
                      {formatCurrency(res.summary.totalProfit)}
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-semibold">Margem de Lucro Líquida %</TableCell>
                  {results.map((res) => (
                    <TableCell key={res.label} className={cn("text-right font-bold", res.summary.totalProfit < 0 ? "text-destructive" : "text-success")}>
                      {formatPercent(res.summary.profitMarginPercent)}
                    </TableCell>
                  ))}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-muted-foreground" /> Ponto de Equilíbrio (Mensal)</TableCell>
                  {results.map((res) => (
                    <TableCell key={res.label} className="text-right text-muted-foreground font-bold">
                      {formatCurrency(res.summary.breakEvenPoint)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Comparison;