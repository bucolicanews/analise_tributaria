import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { Product, CalculationParams } from '@/types/pricing';
import { calculatePricing } from '@/lib/pricing';
import { calculateLegacyPricing } from '@/lib/legacyPricing';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const formatPercent = (value: number) => `${value.toFixed(2)}%`;

const ImpactAnalysis = () => {
  const [futureIbsRate, setFutureIbsRate] = useState(17.7);
  const [futureCbsRate, setFutureCbsRate] = useState(8.8);

  const analysisData = useMemo(() => {
    // CORREÇÃO: Usando as chaves corretas que definimos no Index.tsx
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

      // --- Cenário ATUAL (Legado - Lucro Presumido) ---
      const legacyResult = calculateLegacyPricing(productsToProcess, baseParams);

      // --- Cenário FUTURO (Reforma - IBS/CBS) ---
      const futureParams: CalculationParams = {
        ...baseParams,
        ibsRate: futureIbsRate,
        cbsRate: futureCbsRate,
      };
      
      const totalFixedExpenses = futureParams.fixedCostsTotal || 0;
      const cfu = futureParams.totalStockUnits > 0 ? totalFixedExpenses / futureParams.totalStockUnits : 0;
      
      const calculatedProductsFuture = productsToProcess.map(p => calculatePricing(p, futureParams, cfu));
      
      const futureRevenue = calculatedProductsFuture.reduce((sum, p) => sum + p.sellingPrice * p.quantity, 0);
      const futureTotalTax = calculatedProductsFuture.reduce((sum, p) => sum + p.taxToPay * p.quantity, 0);
      const futureNetProfit = calculatedProductsFuture.reduce((sum, p) => sum + p.valueForProfit * p.quantity, 0);

      const futureResult = {
        totalRevenue: futureRevenue,
        totalTax: futureTotalTax,
        netProfit: futureNetProfit,
      };

      // --- Cálculo do Impacto ---
      const taxImpact = futureResult.totalTax - legacyResult.totalTax;
      const profitImpact = futureResult.netProfit - legacyResult.netProfit;
      const taxImpactPercent = legacyResult.totalTax > 0 ? (taxImpact / legacyResult.totalTax) * 100 : 0;
      const profitImpactPercent = legacyResult.netProfit > 0 ? (profitImpact / legacyResult.netProfit) * 100 : 0;

      return {
        legacyResult,
        futureResult,
        impact: {
          tax: taxImpact,
          profit: profitImpact,
          taxPercent: taxImpactPercent,
          profitPercent: profitImpactPercent,
        },
        productCount: productsToProcess.length,
      };
    } catch (error) {
      console.error("Erro na análise de impacto:", error);
      return null;
    }
  }, [futureIbsRate, futureCbsRate]);

  if (!analysisData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-card">
          <div className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <BarChart3 className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Dados insuficientes para análise</h3>
            <p className="text-muted-foreground max-w-md">
              Realize o upload de um XML e defina os parâmetros na página de **Precificação** primeiro para habilitar esta comparação.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const { legacyResult, futureResult, impact, productCount } = analysisData;
  const isProfitNegative = impact.profit < 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Simulador de Impacto da Reforma Tributária
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Comparativo técnico entre o sistema atual (Legado) e o novo modelo (Reforma) baseado em {productCount} produtos.
          </p>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Label>Alíquota IBS Estimada: <span className="font-bold text-primary">{futureIbsRate.toFixed(1)}%</span></Label>
            <Slider defaultValue={[17.7]} value={[futureIbsRate]} onValueChange={([val]) => setFutureIbsRate(val)} max={30} step={0.1} />
          </div>
          <div className="space-y-4">
            <Label>Alíquota CBS Estimada: <span className="font-bold text-primary">{futureCbsRate.toFixed(1)}%</span></Label>
            <Slider defaultValue={[8.8]} value={[futureCbsRate]} onValueChange={([val]) => setFutureCbsRate(val)} max={15} step={0.1} />
          </div>
        </CardContent>
      </Card>

      <Alert variant={isProfitNegative ? "destructive" : "default"} className={!isProfitNegative ? "bg-success/10 border-success text-success-foreground" : ""}>
        {isProfitNegative ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
        <AlertTitle className="font-bold">Análise Prospectiva</AlertTitle>
        <AlertDescription>
          Com as alíquotas simuladas, seu Lucro Líquido variaria em <span className="font-extrabold">{formatCurrency(impact.profit)} ({formatPercent(impact.profitPercent)})</span>.
          A Carga Tributária total sofreria uma alteração de <span className="font-extrabold">{formatCurrency(impact.tax)} ({formatPercent(impact.taxPercent)})</span>.
        </AlertDescription>
      </Alert>

      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Demonstrativo Comparativo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Métrica da Operação</TableHead>
                <TableHead className="text-right">Cenário Atual (Legado)</TableHead>
                <TableHead className="text-right">Cenário Futuro (Reforma)</TableHead>
                <TableHead className="text-right">Impacto (R$)</TableHead>
                <TableHead className="text-right">Impacto (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold">Receita Bruta Total</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(legacyResult.totalRevenue)}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(futureResult.totalRevenue)}</TableCell>
                <TableCell colSpan={2} className="text-right text-muted-foreground font-mono">-</TableCell>
              </TableRow>
              <TableRow className="bg-destructive/5">
                <TableCell className="font-semibold">Carga Tributária Total</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(legacyResult.totalTax)}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(futureResult.totalTax)}</TableCell>
                <TableCell className={cn("text-right font-mono font-bold", impact.tax > 0 ? "text-destructive" : "text-success")}>{formatCurrency(impact.tax)}</TableCell>
                <TableCell className={cn("text-right font-mono font-bold", impact.tax > 0 ? "text-destructive" : "text-success")}>{formatPercent(impact.taxPercent)}</TableCell>
              </TableRow>
              <TableRow className="bg-success/5">
                <TableCell className="font-semibold">Lucro Líquido Final</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(legacyResult.netProfit)}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(futureResult.netProfit)}</TableCell>
                <TableCell className={cn("text-right font-mono font-bold", isProfitNegative ? "text-destructive" : "text-success")}>{formatCurrency(impact.profit)}</TableCell>
                <TableCell className={cn("text-right font-mono font-bold", isProfitNegative ? "text-destructive" : "text-success")}>{formatPercent(impact.profitPercent)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImpactAnalysis;