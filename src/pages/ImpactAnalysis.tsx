import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  CreditCard, 
  Wallet, 
  Percent,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
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
  const isCargaFiscalMenor = impact.tax < 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Card className="shadow-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <BarChart3 className="h-6 w-6" />
            Simulador de Impacto da Reforma Tributária
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Comparativo técnico entre o sistema atual (Legado) e o novo modelo (Reforma) baseado em {productCount} produtos selecionados.
          </p>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold">Alíquota IBS Estimada (Estado/Mun)</Label>
              <span className="font-mono font-bold text-primary">{futureIbsRate.toFixed(1)}%</span>
            </div>
            <Slider defaultValue={[17.7]} value={[futureIbsRate]} onValueChange={([val]) => setFutureIbsRate(val)} max={30} step={0.1} />
            <p className="text-[10px] text-muted-foreground">Substitui ICMS e ISS.</p>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold">Alíquota CBS Estimada (Federal)</Label>
              <span className="font-mono font-bold text-primary">{futureCbsRate.toFixed(1)}%</span>
            </div>
            <Slider defaultValue={[8.8]} value={[futureCbsRate]} onValueChange={([val]) => setFutureCbsRate(val)} max={15} step={0.1} />
            <p className="text-[10px] text-muted-foreground">Substitui PIS e COFINS.</p>
          </div>
        </CardContent>
      </Card>

      {/* BLOCO DE INSIGHTS ESTRATÉGICOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Insight 1: Receita */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Receita Sugerida</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              O sistema sugere uma receita de <span className="text-foreground font-bold">{formatCurrency(futureResult.totalRevenue)}</span>. 
              Isso representa o faturamento necessário para cobrir sua estrutura fixa e impostos, garantindo a lucratividade desejada.
            </p>
          </CardContent>
        </Card>

        {/* Insight 2: Impostos */}
        <Card className={cn("border-border", isCargaFiscalMenor ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("p-2 rounded-full", isCargaFiscalMenor ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Carga Tributária</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A carga cai para <span className="text-foreground font-bold">{formatCurrency(futureResult.totalTax)}</span>. 
              {isCargaFiscalMenor 
                ? " O ganho de créditos na Reforma compensa as novas alíquotas, reduzindo sua conta com o governo em " + formatPercent(Math.abs(impact.taxPercent)) + "."
                : " Atenção: as novas alíquotas superam os créditos recuperados neste lote específico."}
            </p>
          </CardContent>
        </Card>

        {/* Insight 3: Lucro */}
        <Card className={cn("border-border", impact.profit > 0 ? "bg-accent/5 border-accent/20" : "bg-destructive/5 border-destructive/20")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("p-2 rounded-full", impact.profit > 0 ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive")}>
                <Wallet className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Resultado Líquido</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {legacyResult.netProfit < 0 
                ? "Sua operação atual é deficitária. A Reforma, aliada à nova precificação, permite recuperar " + formatCurrency(impact.profit) + " de margem perdida."
                : "Seu lucro variará em " + formatCurrency(impact.profit) + ". O modelo de IVA Dual traz mais segurança jurídica para seu lucro."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-elegant border-border overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            Demonstrativo Comparativo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10">
                <TableHead className="w-[300px] pl-6 font-bold text-xs uppercase">Métrica da Operação</TableHead>
                <TableHead className="text-right font-bold text-xs uppercase">Cenário Atual (Legado)</TableHead>
                <TableHead className="text-right font-bold text-xs uppercase">Cenário Futuro (Reforma)</TableHead>
                <TableHead className="text-right font-bold text-xs uppercase">Impacto (R$)</TableHead>
                <TableHead className="text-right pr-6 font-bold text-xs uppercase">Impacto (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-muted/5">
                <TableCell className="font-medium pl-6">
                  <div className="flex flex-col">
                    <span>Receita Bruta Total</span>
                    <span className="text-[10px] text-muted-foreground">Faturamento projetado p/ o lote</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">{formatCurrency(legacyResult.totalRevenue)}</TableCell>
                <TableCell className="text-right font-mono text-sm font-bold text-primary">{formatCurrency(futureResult.totalRevenue)}</TableCell>
                <TableCell colSpan={2} className="text-right text-muted-foreground font-mono text-xs italic pr-6">Base de cálculo p/ impostos</TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/5 border-t">
                <TableCell className="font-medium pl-6">
                  <div className="flex flex-col">
                    <span>Carga Tributária Total</span>
                    <span className="text-[10px] text-muted-foreground">PIS+COFINS+ICMS vs CBS+IBS</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">{formatCurrency(legacyResult.totalTax)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatCurrency(futureResult.totalTax)}</TableCell>
                <TableCell className={cn("text-right font-mono text-sm font-bold", impact.tax > 0 ? "text-destructive" : "text-success")}>
                  {formatCurrency(impact.tax)}
                </TableCell>
                <TableCell className={cn("text-right font-mono text-sm font-bold pr-6", impact.tax > 0 ? "text-destructive" : "text-success")}>
                  {formatPercent(impact.taxPercent)}
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/5 border-t-2 border-border/80">
                <TableCell className="font-extrabold pl-6 text-foreground uppercase">
                  <div className="flex flex-col">
                    <span>Lucro Líquido Final</span>
                    <span className="text-[10px] text-muted-foreground normal-case font-normal">Sobra após custos e impostos</span>
                  </div>
                </TableCell>
                <TableCell className={cn("text-right font-mono text-sm font-bold", legacyResult.netProfit < 0 ? "text-destructive" : "")}>
                  {formatCurrency(legacyResult.netProfit)}
                </TableCell>
                <TableCell className={cn("text-right font-mono text-base font-black", futureResult.netProfit < 0 ? "text-destructive" : "text-success")}>
                  {formatCurrency(futureResult.netProfit)}
                </TableCell>
                <TableCell className={cn("text-right font-mono text-sm font-bold", impact.profit < 0 ? "text-destructive" : "text-success")}>
                  {formatCurrency(impact.profit)}
                </TableCell>
                <TableCell className={cn("text-right font-mono text-sm font-bold pr-6", impact.profit < 0 ? "text-destructive" : "text-success")}>
                  {legacyResult.netProfit < 0 ? "Recup. Operacional" : formatPercent(impact.profitPercent)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Alert className="bg-primary/5 border-primary/30">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-sm font-bold uppercase">Nota Explicativa</AlertTitle>
        <AlertDescription className="text-xs leading-relaxed opacity-80">
          O cenário de "Lucro Negativo" no modelo Legado ocorre porque a carga tributária atual aliada à estrutura de custos fixos informada consome toda a margem da operação. 
          A Reforma Tributária (IBS/CBS) atua como um catalisador de eficiência, permitindo a recuperação de créditos que hoje são perdidos, transformando o prejuízo em resultado positivo.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ImpactAnalysis;