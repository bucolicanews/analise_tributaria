import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { calculatePricing } from '@/lib/pricing';
import { Product, CalculatedProduct, TaxRegime, CalculationParams } from '@/types/pricing';
import { GlobalSummaryData } from '@/components/ProductsTable';
import { cn } from '@/lib/utils';

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
  const selectiveTaxRateEffective = currentParams.useSelectiveTaxDebit ? currentParams.defaultSelectiveTaxRate / 100 : 0;

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

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const formatPercent = (value: number) => `${value.toFixed(2)}%`;

const Comparison = () => {
  const comparisonData = useMemo(() => {
    const storedParams = sessionStorage.getItem('jota-calc-params');
    const storedProducts = sessionStorage.getItem('jota-calc-purchase-products');
    const storedSelection = sessionStorage.getItem('jota-calc-selection');

    if (!storedParams || !storedProducts || !storedSelection) return null;

    try {
      const baseParams: CalculationParams = JSON.parse(storedParams);
      const products: Product[] = JSON.parse(storedProducts);
      const selectedProductCodes: Set<string> = new Set(JSON.parse(storedSelection));
      const productsToProcess = products.filter(p => selectedProductCodes.has(p.code));
      if (productsToProcess.length === 0) return null;

      const totalFixedCosts = (baseParams.fixedCostsTotal || 0);
      const totalVarPct = baseParams.variableExpenses.reduce((sum, exp) => sum + exp.percentage, 0);
      const totalInners = productsToProcess.reduce((sum, p) => sum + p.quantity * p.innerQuantity, 0);

      const regimes = [
        { label: "Simples Nacional (Padrão)", params: { ...baseParams, taxRegime: TaxRegime.SimplesNacional, generateIvaCredit: false } },
        { label: "Simples Nacional (Híbrido)", params: { ...baseParams, taxRegime: TaxRegime.SimplesNacional, generateIvaCredit: true } },
        { label: "Lucro Presumido", params: { ...baseParams, taxRegime: TaxRegime.LucroPresumido } },
        { label: "Lucro Real", params: { ...baseParams, taxRegime: TaxRegime.LucroReal } },
      ];

      const results = regimes.map(r => {
        const cfu = r.params.totalStockUnits > 0 ? totalFixedCosts / r.params.totalStockUnits : 0;
        const calculated = productsToProcess.map(p => calculatePricing(p, r.params, cfu));
        return {
          label: r.label,
          summary: calculateGlobalSummaryForComparison(calculated, r.params, totalFixedCosts, totalVarPct, cfu, totalInners, r.params.profitMargin)
        };
      });

      let bestResult = results[0];
      results.forEach(res => { if (res.summary.totalProfit > bestResult.summary.totalProfit) bestResult = res; });

      return { results, bestResult };
    } catch (error) { return null; }
  }, []);

  if (!comparisonData) return <div className="p-8 text-center">Dados insuficientes para comparação. Realize uma precificação primeiro.</div>;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Card className="shadow-elegant border-primary/50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-3"><BarChart3 className="h-6 w-6" />Comparativo de Regimes Tributários</CardTitle>
          <Alert className="mt-4 bg-success/10 border-success text-success-foreground">
            <CheckCircle2 className="h-4 w-4" /><AlertTitle>Regime Mais Vantajoso</AlertTitle>
            <AlertDescription className="text-lg font-semibold">O melhor regime é: <span className="font-extrabold">{comparisonData.bestResult.label}</span>, com Lucro de <span className="font-extrabold">{formatCurrency(comparisonData.bestResult.summary.totalProfit)}</span>.</AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Métrica</TableHead>
                  {comparisonData.results.map(res => <TableHead key={res.label} className="text-right">{res.label}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell className="font-semibold">Venda Sugerida</TableCell>{comparisonData.results.map(res => <TableCell key={res.label} className="text-right">{formatCurrency(res.summary.totalSelling)}</TableCell>)}</TableRow>
                <TableRow><TableCell className="font-semibold">Impostos Líquidos</TableCell>{comparisonData.results.map(res => <TableCell key={res.label} className="text-right text-destructive">{formatCurrency(res.summary.totalTax)} ({formatPercent(res.summary.totalTaxPercent)})</TableCell>)}</TableRow>
                <TableRow className="bg-success/10"><TableCell className="font-extrabold">LUCRO LÍQUIDO</TableCell>{comparisonData.results.map(res => <TableCell key={res.label} className="text-right text-xl font-extrabold text-success">{formatCurrency(res.summary.totalProfit)}</TableCell>)}</TableRow>
                <TableRow><TableCell className="font-semibold">Ponto de Equilíbrio</TableCell>{comparisonData.results.map(res => <TableCell key={res.label} className="text-right">{formatCurrency(res.summary.breakEvenPoint)}</TableCell>)}</TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Comparison;