import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, BarChart3, Printer, FileDown, Package, Lock, Zap, Building2, User } from 'lucide-react';
import { calculatePricing } from '@/lib/pricing';
import { Product, CalculatedProduct, TaxRegime, CalculationParams } from '@/types/pricing';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader as UIHeader } from "@/components/ui/dialog";
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { ComparisonReportPDF } from '@/components/ComparisonReportPDF';
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface GlobalSummaryDataExt {
  totalSelling: number;
  totalAcquisitionCost: number; 
  totalTax: number;
  totalProfit: number;
  profitMarginPercent: number;
  breakEvenPoint: number;
  totalVariableExpensesValue: number;
  totalContributionMargin: number;
  totalTaxPercent: number;
  totalCbsCredit: number;
  totalIbsCredit: number;
  totalCbsDebit: number;
  totalIbsDebit: number;
  totalCbsTaxToPay: number;
  totalIbsTaxToPay: number;
  totalIrpjToPay: number;
  totalCsllToPay: number;
  totalSimplesToPay: number;
  totalSelectiveTaxToPay: number;
  totalIvaCreditForClient: number;
  totalInssPatronalRateado: number;
}

const calculateGlobalSummaryForComparison = (
  productsToSummarize: CalculatedProduct[],
  currentParams: CalculationParams,
  globalFixedExpenses: number,
  totalVariableExpensesPercent: number,
  cfu: number,
  totalInnerUnitsInXML: number
): GlobalSummaryDataExt => {
  const totalSellingSum = productsToSummarize.reduce((sum, p) => sum + p.sellingPrice * p.quantity, 0);
  const totalAcquisitionCostSum = productsToSummarize.reduce((sum, p) => sum + p.cost * p.quantity, 0);
  const totalTaxSum = productsToSummarize.reduce((sum, p) => sum + p.taxToPay * p.quantity, 0);
  const totalVariableExpensesValueSum = productsToSummarize.reduce((sum, p) => sum + p.valueForVariableExpenses * p.quantity, 0);
  const totalContributionMarginSum = productsToSummarize.reduce((sum, p) => sum + p.contributionMargin * p.quantity, 0);

  const totalFixedCostRateado = cfu * totalInnerUnitsInXML;
  
  // O LUCRO LÍQUIDO REAL AGORA É CALCULADO POR CIMA, GARANTINDO PRECISÃO NA SIMULAÇÃO DE MERCADO
  const totalProfitSum = totalSellingSum - totalAcquisitionCostSum - totalTaxSum - totalVariableExpensesValueSum - totalFixedCostRateado;
  const profitMarginPercent = totalSellingSum > 0 ? (totalProfitSum / totalSellingSum) * 100 : 0;

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
    totalAcquisitionCost: totalAcquisitionCostSum,
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
    totalInssPatronalRateado: 0,
  };
};

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const formatPercent = (value: number) => `${value.toFixed(2)}%`;

const Comparison = () => {
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [localPassThrough, setLocalPassThrough] = useState<number>(0);
  const [b2bMix, setB2bMix] = useState<number>(0);

  const companyName = localStorage.getItem('jota-razaoSocial') || 'Sua Empresa';
  const accountantName = localStorage.getItem('jota-contador-nome') || '';
  const accountantCrc = localStorage.getItem('jota-contador-crc') || '';

  useEffect(() => {
    const savedPass = localStorage.getItem('jota-taxPassThrough');
    if (savedPass) setLocalPassThrough(parseFloat(savedPass));
    
    const savedMix = localStorage.getItem('jota-b2bMix');
    if (savedMix) setB2bMix(parseFloat(savedMix));
  }, []);

  const handlePassThroughChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setLocalPassThrough(clamped);
    localStorage.setItem('jota-taxPassThrough', clamped.toString());
  };

  const handleB2bMixChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setB2bMix(clamped);
    localStorage.setItem('jota-b2bMix', clamped.toString());
  };

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

      const totalVarPct = baseParams.variableExpenses.reduce((sum, exp) => sum + exp.percentage, 0);
      const totalInners = productsToProcess.reduce((sum, p) => sum + p.quantity * p.innerQuantity, 0);
      const baseOperationalFixed = baseParams.fixedExpenses.reduce((sum, exp) => sum + exp.value, 0) + baseParams.payroll;
      const reducedSimplesRate = baseParams.simplesNacionalRate * 0.5;
      
      const passThroughRatio = localPassThrough / 100;
      const mixB2B = b2bMix / 100;
      const mixB2C = 1 - mixB2B;

      // 1. CALCULA O CENÁRIO BASE (SIMPLES NACIONAL) PARA ANCORAR O PREÇO
      const baseRegimeParams: CalculationParams = { 
        ...baseParams, 
        taxRegime: TaxRegime.SimplesNacional, 
        generateIvaCredit: false,
        usePisCofins: false,
        icmsPercentage: 0,
        useCbsDebit: false,
        ibsDebitPercentage: 0,
      };
      const baseCfu = baseParams.totalStockUnits > 0 ? baseOperationalFixed / baseParams.totalStockUnits : 0;
      const baseCalculatedProducts = productsToProcess.map(p => calculatePricing(p, baseRegimeParams, baseCfu));

      const regimes = [
        { 
          label: "Simples Nacional (Padrão)", 
          hasInssPatronal: false,
          params: baseRegimeParams
        },
        { 
          label: "Simples Nacional (Híbrido)", 
          hasInssPatronal: false,
          params: { 
            ...baseParams, 
            taxRegime: TaxRegime.SimplesNacional, 
            simplesNacionalRate: reducedSimplesRate,
            generateIvaCredit: true,
            usePisCofins: true,
            icmsPercentage: 100,
            useCbsDebit: true,
            ibsDebitPercentage: 100,
          } 
        },
        { 
          label: "Lucro Presumido", 
          hasInssPatronal: true,
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
          hasInssPatronal: true,
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

      // 2. APLICA OS OUTROS REGIMES (ELASTICIDADE + EFEITO B2B)
      const results = regimes.map(r => {
        const inssPatronalMensal = r.hasInssPatronal ? baseParams.payroll * (baseParams.inssPatronalRate / 100) : 0;
        const totalFixedCosts = baseOperationalFixed + inssPatronalMensal;
        
        const cfu = baseParams.totalStockUnits > 0 ? totalFixedCosts / baseParams.totalStockUnits : 0;
        const inssPatronalRateado = baseParams.totalStockUnits > 0 ? (inssPatronalMensal / baseParams.totalStockUnits) * totalInners : 0;

        const dreProducts: CalculatedProduct[] = [];
        const displayPrices: any[] = [];

        productsToProcess.forEach((p, idx) => {
          const basePrice = baseCalculatedProducts[idx].sellingPrice;
          
          let clientCreditRate = 0;
          if (r.params.taxRegime === TaxRegime.LucroPresumido || r.params.taxRegime === TaxRegime.LucroReal || (r.params.taxRegime === TaxRegime.SimplesNacional && r.params.generateIvaCredit)) {
              const cbsRateEff = r.params.useCbsDebit ? r.params.cbsRate / 100 : 0;
              const ibsRateEff = (r.params.ibsRate / 100) * (r.params.ibsDebitPercentage / 100);
              clientCreditRate = cbsRateEff + ibsRateEff;
          }
          clientCreditRate = Math.min(0.99, clientCreditRate);
          
          const competitivePriceB2C = basePrice;
          const competitivePriceB2B = basePrice / (1 - clientCreditRate);

          const idealProduct = calculatePricing(p, r.params, cfu);
          const idealPrice = idealProduct.sellingPrice;
          
          const finalPriceB2C = competitivePriceB2C + (idealPrice - competitivePriceB2C) * passThroughRatio;
          const finalPriceB2B = competitivePriceB2B + (idealPrice - competitivePriceB2B) * passThroughRatio;
          
          const qtyB2C = p.quantity * mixB2C;
          const qtyB2B = p.quantity * mixB2B;
          
          if (qtyB2C > 0) {
              dreProducts.push(calculatePricing({ ...p, quantity: qtyB2C }, r.params, cfu, finalPriceB2C));
          }
          if (qtyB2B > 0) {
              dreProducts.push(calculatePricing({ ...p, quantity: qtyB2B }, r.params, cfu, finalPriceB2B));
          }
          
          displayPrices.push({
              priceB2C: finalPriceB2C,
              priceB2B: finalPriceB2B,
              netB2B: finalPriceB2B * (1 - clientCreditRate)
          });
        });
        
        const summary = calculateGlobalSummaryForComparison(dreProducts, r.params, totalFixedCosts, totalVarPct, cfu, totalInners);
        summary.totalInssPatronalRateado = inssPatronalRateado;

        return {
          label: r.label,
          summary,
          displayPrices
        };
      });

      let bestResult = results[0];
      results.forEach(res => { if (res.summary.totalProfit > bestResult.summary.totalProfit) bestResult = res; });

      const worstProfit = Math.min(...results.map(r => r.summary.totalProfit));

      return { results, bestResult, worstProfit, originalProducts: productsToProcess };
    } catch (error) { return null; }
  }, [localPassThrough, b2bMix]);

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
                    <UIHeader>
                      <DialogTitle>Visualizar Comparativo de Regimes</DialogTitle>
                      <DialogDescription className="sr-only">Pré-visualização do comparativo de regimes tributários em formato PDF.</DialogDescription>
                    </UIHeader>
                  </div>
                  <div className="flex-1 w-full bg-slate-100 overflow-hidden">
                    <PDFViewer width="100%" height="100%" className="border-none w-full h-full">
                      <ComparisonReportPDF 
                        results={comparisonData.results}
                        bestResult={comparisonData.bestResult}
                        worstProfit={comparisonData.worstProfit}
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
                    worstProfit={comparisonData.worstProfit}
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
          
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            {/* SLIDER 1: ELASTICIDADE */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                {localPassThrough === 0 ? (
                  <Lock className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                ) : (
                  <Zap className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-800">
                    {localPassThrough === 0 
                      ? "Mercado Travado (0% Repasse)" 
                      : `Simulação (${localPassThrough}% de Repasse)`}
                  </p>
                  <p className="text-[10px] text-blue-700 mt-1">
                    Controla o quanto da variação do imposto a sua empresa consegue empurrar para o preço de venda sem perder vendas.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 px-2 pt-2 border-t border-blue-500/20">
                <Slider 
                  value={[localPassThrough]} 
                  onValueChange={(v) => handlePassThroughChange(v[0])} 
                  max={100} step={1} className="flex-1 cursor-pointer"
                />
                <div className="w-[70px] flex items-center gap-1">
                  <Input 
                    type="number" value={localPassThrough} 
                    onChange={(e) => handlePassThroughChange(Number(e.target.value))} 
                    className="text-right h-8 text-sm bg-white/50 border-blue-500/30"
                  />
                  <span className="text-xs font-bold text-blue-800">%</span>
                </div>
              </div>
            </div>

            {/* SLIDER 2: MIX DE VENDAS B2B vs B2C */}
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                {b2bMix === 0 ? (
                  <User className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <Building2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-bold text-emerald-800">
                    Mix de Vendas: {b2bMix}% PJ (Empresas)
                  </p>
                  <p className="text-[10px] text-emerald-700 mt-1">
                    Na venda para CNPJ (B2B), você pode cobrar mais caro, pois o seu cliente desconta o IBS/CBS como crédito. 
                    Mova para a direita para ver o Lucro Real/Presumido ganharem vantagem.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 px-2 pt-2 border-t border-emerald-500/20">
                <span className="text-[10px] font-bold text-emerald-800 w-[20px]">B2C</span>
                <Slider 
                  value={[b2bMix]} 
                  onValueChange={(v) => handleB2bMixChange(v[0])} 
                  max={100} step={5} className="flex-1 cursor-pointer"
                />
                <span className="text-[10px] font-bold text-emerald-800 w-[20px] text-right">B2B</span>
                <div className="w-[70px] flex items-center gap-1 ml-2">
                  <Input 
                    type="number" value={b2bMix} 
                    onChange={(e) => handleB2bMixChange(Number(e.target.value))} 
                    className="text-right h-8 text-sm bg-white/50 border-emerald-500/30"
                  />
                  <span className="text-xs font-bold text-emerald-800">%</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[280px]">DRE Tributário (Como chegamos no imposto?)</TableHead>
                  {comparisonData.results.map(res => <TableHead key={res.label} className="text-right w-[150px]">{res.label}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Bases de Cálculo */}
                <TableRow className="bg-muted/10 border-b-0">
                  <TableCell className="font-semibold text-xs text-muted-foreground pt-4 pb-1">Base de Crédito (Custo Aquisição c/ Impostos)</TableCell>
                  {comparisonData.results.map(res => <TableCell key={res.label} className="text-right text-xs text-muted-foreground pt-4 pb-1">{formatCurrency(res.summary.totalAcquisitionCost)}</TableCell>)}
                </TableRow>
                <TableRow className="bg-muted/10">
                  <TableCell className="font-semibold text-primary text-base">Receita Bruta (Base do Débito)</TableCell>
                  {comparisonData.results.map(res => <TableCell key={res.label} className="text-right text-primary font-bold text-base">{formatCurrency(res.summary.totalSelling)}</TableCell>)}
                </TableRow>
                
                {/* 1. Apuração IBS / CBS */}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={5} className="font-bold text-xs uppercase text-muted-foreground pt-4 pb-2">1. Apuração do IVA (IBS / CBS)</TableCell>
                </TableRow>
                
                {/* IBS (ICMS) */}
                <TableRow className="bg-muted/5 border-b-0">
                  <TableCell className="text-xs pl-6">(+) Débito IBS (Gerado na Venda)</TableCell>
                  {comparisonData.results.map(res => <TableCell key={res.label} className="text-right text-xs text-muted-foreground">{formatCurrency(res.summary.totalIbsDebit)}</TableCell>)}
                </TableRow>
                <TableRow className="bg-muted/5">
                  <TableCell className="text-xs pl-6 text-success font-semibold border-l-2 border-success">
                    (-) Crédito IBS <span className="font-normal text-[10px] text-success/80">(Aproveitamento de ICMS da Compra)</span>
                  </TableCell>
                  {comparisonData.results.map(res => <TableCell key={res.label} className="text-right text-xs text-success font-semibold">{formatCurrency(res.summary.totalIbsCredit)}</TableCell>)}
                </TableRow>

                {/* CBS (PIS/COFINS) */}
                <TableRow className="bg-muted/5 border-b-0">
                  <TableCell className="text-xs pl-6">(+) Débito CBS (Gerado na Venda)</TableCell>
                  {comparisonData.results.map(res => <TableCell key={res.label} className="text-right text-xs text-muted-foreground">{formatCurrency(res.summary.totalCbsDebit)}</TableCell>)}
                </TableRow>
                <TableRow className="bg-muted/5">
                  <TableCell className="text-xs pl-6 text-success font-semibold border-l-2 border-success">
                    (-) Crédito CBS <span className="font-normal text-[10px] text-success/80">(Aproveitamento de PIS/COFINS da Compra)</span>
                  </TableCell>
                  {comparisonData.results.map(res => <TableCell key={res.label} className="text-right text-xs text-success font-semibold">{formatCurrency(res.summary.totalCbsCredit)}</TableCell>)}
                </TableRow>

                <TableRow className="bg-muted/20 border-b-border">
                  <TableCell className="text-xs font-bold pl-6 text-destructive">(=) Saldo Líquido IBS + CBS a Pagar</TableCell>
                  {comparisonData.results.map(res => <TableCell key={res.label} className="text-right text-xs font-bold text-destructive">{formatCurrency(res.summary.totalCbsTaxToPay + res.summary.totalIbsTaxToPay)}</TableCell>)}
                </TableRow>

                {/* 2. Demais Tributos */}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={5} className="font-bold text-xs uppercase text-muted-foreground pt-4 pb-2">2. Demais Tributos da Operação</TableCell>
                </TableRow>
                <TableRow className="bg-muted/5">
                  <TableCell className="text-xs pl-6">(+) IRPJ e CSLL</TableCell>
                  {comparisonData.results.map(res => <TableCell key={res.label} className="text-right text-xs text-muted-foreground">{formatCurrency(res.summary.totalIrpjToPay + res.summary.totalCsllToPay)}</TableCell>)}
                </TableRow>
                <TableRow className="bg-muted/5">
                  <TableCell className="text-xs pl-6">(+) Simples Nacional (DAS)</TableCell>
                  {comparisonData.results.map(res => <TableCell key={res.label} className="text-right text-xs text-muted-foreground">{formatCurrency(res.summary.totalSimplesToPay)}</TableCell>)}
                </TableRow>
                <TableRow className="bg-muted/5 border-b-border">
                  <TableCell className="text-xs pl-6">(+) Imposto Seletivo (IS)</TableCell>
                  {comparisonData.results.map(res => <TableCell key={res.label} className="text-right text-xs text-muted-foreground">{formatCurrency(res.summary.totalSelectiveTaxToPay)}</TableCell>)}
                </TableRow>

                {/* 3. Encargos sobre Folha */}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={5} className="font-bold text-xs uppercase text-muted-foreground pt-4 pb-2">3. Encargos sobre a Folha (Custo Fixo)</TableCell>
                </TableRow>
                <TableRow className="bg-muted/10 border-b-border">
                  <TableCell className="text-xs pl-6">(+) INSS Patronal Rateado</TableCell>
                  {comparisonData.results.map(res => <TableCell key={res.label} className="text-right text-xs text-muted-foreground">{formatCurrency(res.summary.totalInssPatronalRateado)}</TableCell>)}
                </TableRow>

                {/* TOTAIS */}
                <TableRow>
                  <TableCell className="font-bold pt-4 text-destructive uppercase">(=) Impostos Líquidos Totais</TableCell>
                  {comparisonData.results.map(res => <TableCell key={res.label} className="text-right pt-4 font-bold text-destructive">{formatCurrency(res.summary.totalTax)}</TableCell>)}
                </TableRow>

                <TableRow className="bg-destructive/10">
                  <TableCell className="font-bold text-destructive uppercase">Carga Total (Impostos + INSS)</TableCell>
                  {comparisonData.results.map(res => {
                    const cargaTotal = res.summary.totalTax + res.summary.totalInssPatronalRateado;
                    return (
                      <TableCell key={res.label} className="text-right font-bold text-destructive">
                        {formatCurrency(cargaTotal)}
                      </TableCell>
                    );
                  })}
                </TableRow>
                
                {/* NEW ROW: CARGA EFETIVA % */}
                <TableRow className="bg-destructive/5">
                  <TableCell className="font-semibold text-destructive text-xs pl-6">Carga Tributária Efetiva (%)</TableCell>
                  {comparisonData.results.map(res => {
                    const cargaTotal = res.summary.totalTax + res.summary.totalInssPatronalRateado;
                    const cargaPct = res.summary.totalSelling > 0 ? (cargaTotal / res.summary.totalSelling) * 100 : 0;
                    return (
                      <TableCell key={res.label} className="text-right font-semibold text-destructive text-xs">
                        {formatPercent(cargaPct)}
                      </TableCell>
                    );
                  })}
                </TableRow>
                
                <TableRow className="bg-success/10 border-b-0">
                  <TableCell className="font-extrabold text-lg text-success pt-4">LUCRO LÍQUIDO FINAL</TableCell>
                  {comparisonData.results.map(res => <TableCell key={res.label} className="text-right text-xl font-extrabold text-success pt-4">{formatCurrency(res.summary.totalProfit)}</TableCell>)}
                </TableRow>

                {/* NEW ROW: MARGEM LÍQUIDA % */}
                <TableRow className="bg-success/5 border-b-success/20 border-b-2">
                  <TableCell className="font-semibold text-success text-xs pl-6">Margem Líquida Operacional (%)</TableCell>
                  {comparisonData.results.map(res => <TableCell key={res.label} className="text-right font-semibold text-success text-xs">{formatPercent(res.summary.profitMarginPercent)}</TableCell>)}
                </TableRow>

                {/* NEW ROW: ECONOMIA VS PIOR REGIME */}
                <TableRow className="bg-blue-500/10 border-b-blue-500/20 border-b-2">
                  <TableCell className="font-bold text-blue-700 uppercase">Economia vs Pior Regime</TableCell>
                  {comparisonData.results.map(res => {
                    const economia = res.summary.totalProfit - comparisonData.worstProfit;
                    return (
                      <TableCell key={res.label} className="text-right font-bold text-blue-700">
                        {economia > 0 ? `+ ${formatCurrency(economia)}` : <span className="text-muted-foreground text-[10px] uppercase">Pior Cenário</span>}
                      </TableCell>
                    );
                  })}
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-semibold text-muted-foreground">Ponto de Equilíbrio Operacional</TableCell>
                  {comparisonData.results.map(res => <TableCell key={res.label} className="text-right text-muted-foreground">{formatCurrency(res.summary.breakEvenPoint)}</TableCell>)}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
            <Package className="h-5 w-5" />
            Análise de Preços por Produto (Varejo vs Atacado)
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
                        const prices = res.displayPrices[index];
                        return (
                          <TableCell key={res.label} className="text-center align-top">
                            <div className="flex flex-col gap-1.5 items-center justify-center">
                              <div className="text-xs bg-primary/10 text-primary px-2 py-1.5 rounded border border-primary/20 w-full max-w-[130px]">
                                <span className="text-[9px] uppercase font-semibold block mb-0.5 opacity-80">Consumidor (B2C)</span>
                                <span className="font-extrabold text-sm">{formatCurrency(prices.priceB2C)}</span>
                              </div>
                              <div className="text-xs bg-emerald-500/10 text-emerald-700 px-2 py-1.5 rounded border border-emerald-500/30 w-full max-w-[130px] relative">
                                <span className="text-[9px] uppercase font-semibold block mb-0.5 opacity-80">Empresa (B2B)</span>
                                <span className="font-extrabold text-sm">{formatCurrency(prices.priceB2B)}</span>
                                {prices.priceB2B > prices.priceB2C && (
                                  <div className="text-[8px] mt-0.5 opacity-80">Custo Líq. Cli: {formatCurrency(prices.netB2B)}</div>
                                )}
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