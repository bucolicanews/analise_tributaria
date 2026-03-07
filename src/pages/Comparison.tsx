import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, BarChart3, Printer, FileDown, Loader2, Package } from 'lucide-react';
import { calculatePricing } from '@/lib/pricing';
import { Product, CalculatedProduct, TaxRegime, CalculationParams } from '@/types/pricing';
import { GlobalSummaryData } from '@/components/ProductsTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { ComparisonReportPDF } from '@/components/ComparisonReportPDF';

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
  const [isPdfOpen, setIsPdfOpen] = useState(false);

  const companyName = localStorage.getItem('jota-razaoSocial') || 'Sua Empresa';
  const accountantName = localStorage.getItem('jota-contador-nome') || '';
  const accountantCrc = localStorage.getItem('jota-contador-crc') || '';

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
        { 
          label: "Simples Nacional (Padrão)", 
          params: { 
            ...baseParams, 
            taxRegime: TaxRegime.SimplesNacional, 
            generateIvaCredit: false,
            usePisCofins: false,
            icmsPercentage: 0,
            useCbsDebit: false,
            ibsDebitPercentage: 0,
          } 
        },
        { 
          label: "Simples Nacional (Híbrido)", 
          params: { 
            ...baseParams, 
            taxRegime: TaxRegime.SimplesNacional, 
            generateIvaCredit: true,
            usePisCofins: true,
            icmsPercentage: 100,
            useCbsDebit: true,
            ibsDebitPercentage: 100,
          } 
        },
        { 
          label: "Lucro Presumido", 
          params: { 
            ...baseParams, 
            taxRegime: TaxRegime.LucroPresumido,
            usePisCofins: true,
            icmsPercentage: 100,
            useCbsDebit: true,
            ibsDebitPercentage: 100,
          } 
        },
        { 
          label: "Lucro Real", 
          params: { 
            ...baseParams, 
            taxRegime: TaxRegime.LucroReal,
            usePisCofins: true,
            icmsPercentage: 100,
            useCbsDebit: true,
            ibsDebitPercentage: 100,
          } 
        },
      ];

      const results = regimes.map(r => {
        const cfu = r.params.totalStockUnits > 0 ? totalFixedCosts / r.params.totalStockUnits : 0;
        const calculated = productsToProcess.map(p => calculatePricing(p, r.params, cfu));
        return {
          label: r.label,
          summary: calculateGlobalSummaryForComparison(calculated, r.params, totalFixedCosts, totalVarPct, cfu, totalInners, r.params.profitMargin),
          products: calculated
        };
      });

      let bestResult = results[0];
      results.forEach(res => { if (res.summary.totalProfit > bestResult.summary.totalProfit) bestResult = res; });

      return { results, bestResult, originalProducts: productsToProcess };
    } catch (error) { return null; }
  }, []);

  if (!comparisonData) return <div className="p-8 text-center">Dados insuficientes para comparação. Realize uma precificação primeiro.</div>;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Card className="shadow-elegant border-primary/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-primary flex items-center gap-3"><BarChart3 className="h-6 w-6" />Comparativo de Regimes Tributários</CardTitle>
            
            <div className="flex gap-2">
              <Dialog open={isPdfOpen} onOpenChange={setIsPdfOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    Visualizar PDF
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col gap-0">
                  <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                    <DialogTitle>Visualizar Comparativo de Regimes</DialogTitle>
                    <DialogDescription className="sr-only">Pré-visualização do comparativo de regimes tributários em formato PDF.</DialogDescription>
                  </div>
                  <div className="flex-1 w-full bg-slate-100 overflow-hidden">
                    <PDFViewer width="100%" height="100%" className="border-none w-full h-full">
                      <ComparisonReportPDF 
                        results={comparisonData.results}
                        bestResult={comparisonData.bestResult}
                        companyName={companyName}
                        accountantName={accountantName}
                        accountantCrc={accountantCrc}
                      />
                    </PDFViewer>
                  </div>
                </DialogContent>
              </Dialog>

              <PDFDownloadLink
                document={
                  <ComparisonReportPDF 
                    results={comparisonData.results}
                    bestResult={comparisonData.bestResult}
                    companyName={companyName}
                    accountantName={accountantName}
                    accountantCrc={accountantCrc}
                  />
                }
                fileName={`comparativo_regimes_${new Date().toISOString().split('T')[0]}.pdf`}
              >
                {({ loading }) => (
                  <Button size="sm" disabled={loading}>
                    <FileDown className="h-4 w-4 mr-2" />
                    {loading ? 'Gerando...' : 'Baixar PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          </div>
          
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

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <Package className="h-5 w-5" />
            Análise de Preços por Produto (B2C vs B2B)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Produto / Custo</TableHead>
                  {comparisonData.results.map(res => <TableHead key={res.label} className="text-center">{res.label}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonData.originalProducts.map((originalProduct, index) => {
                  return (
                    <TableRow key={originalProduct.code}>
                      <TableCell>
                        <div className="font-bold text-sm">{originalProduct.name}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-1">Cód: {originalProduct.code} | Custo Aq.: {formatCurrency(originalProduct.cost)}</div>
                      </TableCell>
                      {comparisonData.results.map(res => {
                        const prod = res.products[index];
                        const precoB2C = prod.sellingPrice;
                        // Para empresas (B2B), o custo efetivo do produto descontará o IVA que ela vai receber de crédito
                        const precoB2B = prod.sellingPrice - prod.ivaCreditForClient;
                        return (
                          <TableCell key={res.label} className="text-center align-top">
                            <div className="flex flex-col gap-1.5 items-center justify-center">
                              <div className="text-xs bg-primary/10 text-primary px-2 py-1.5 rounded border border-primary/20 w-full max-w-[130px]">
                                <span className="text-[9px] uppercase font-semibold block mb-0.5 opacity-80">Consumidor (B2C)</span>
                                <span className="font-extrabold text-sm">{formatCurrency(precoB2C)}</span>
                              </div>
                              <div className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1.5 rounded border border-blue-500/20 w-full max-w-[130px]">
                                <span className="text-[9px] uppercase font-semibold block mb-0.5 opacity-80">Empresa (B2B)</span>
                                <span className="font-extrabold text-sm">{formatCurrency(precoB2B)}</span>
                              </div>
                            </div>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Comparison;