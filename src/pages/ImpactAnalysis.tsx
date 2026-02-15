import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  BarChart3, 
  TrendingUp, 
  Info, 
  CreditCard, 
  Wallet, 
  Calculator,
  ArrowRight,
  MinusCircle,
  PlusCircle,
  Equal
} from 'lucide-react';
import { Product, CalculationParams, TaxRegime } from '@/types/pricing';
import { calculatePricing } from '@/lib/pricing';
import { calculateLegacyPricing } from '@/lib/legacyPricing';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const formatPercent = (value: number) => `${value.toFixed(2)}%`;

const CalculationStep = ({ label, value, icon: Icon, color = "text-foreground", isNegative = false }: { label: string, value: number, icon: any, color?: string, isNegative?: boolean }) => (
  <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
    <div className="flex items-center gap-2">
      {isNegative ? <MinusCircle className="h-4 w-4 text-destructive" /> : <PlusCircle className="h-4 w-4 text-success" />}
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className={cn("font-mono font-bold text-sm", color)}>{isNegative ? "-" : ""}{formatCurrency(value)}</span>
    </div>
  </div>
);

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

      // 1. Cenário ATUAL
      const legacyResult = calculateLegacyPricing(productsToProcess, baseParams);

      // 2. Cenário FUTURO
      const futureParams: CalculationParams = { ...baseParams, ibsRate: futureIbsRate, cbsRate: futureCbsRate };
      const totalFixedExpenses = futureParams.fixedCostsTotal || 0;
      const cfu = futureParams.totalStockUnits > 0 ? totalFixedExpenses / futureParams.totalStockUnits : 0;
      
      const calculatedFuture = productsToProcess.map(p => calculatePricing(p, futureParams, cfu));
      
      const futureRevenue = calculatedFuture.reduce((sum, p) => sum + p.sellingPrice * p.quantity, 0);
      const futureTotalTax = calculatedFuture.reduce((sum, p) => sum + p.taxToPay * p.quantity, 0);
      const futureAcqCost = calculatedFuture.reduce((sum, p) => sum + p.cost * p.quantity, 0);
      const futureVarExp = calculatedFuture.reduce((sum, p) => sum + p.valueForVariableExpenses * p.quantity, 0);
      const futureFixedContrib = cfu * productsToProcess.reduce((sum, p) => sum + p.quantity * p.innerQuantity, 0);
      const futureNetProfit = futureRevenue - futureAcqCost - futureVarExp - futureFixedContrib - futureTotalTax;

      const taxImpact = futureTotalTax - legacyResult.totalTax;
      const profitImpact = futureNetProfit - legacyResult.netProfit;

      return {
        legacyResult,
        futureResult: {
          totalRevenue: futureRevenue,
          totalTax: futureTotalTax,
          totalAcquisitionCost: futureAcqCost,
          totalVariableExpenses: futureVarExp,
          totalFixedCosts: futureFixedContrib,
          netProfit: futureNetProfit,
          cfu
        },
        impact: {
          tax: taxImpact,
          profit: profitImpact,
          taxPercent: legacyResult.totalTax > 0 ? (taxImpact / legacyResult.totalTax) * 100 : 0,
        },
        productCount: productsToProcess.length,
      };
    } catch (error) { return null; }
  }, [futureIbsRate, futureCbsRate]);

  if (!analysisData) return <div className="container mx-auto px-4 py-8"><Card className="p-12 text-center">Dados insuficientes. Realize a precificação primeiro.</Card></div>;

  const { legacyResult, futureResult, impact } = analysisData;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Card className="shadow-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Calculator className="h-6 w-6" />
            Memória de Cálculo Detalhada (Passo a Passo)
          </CardTitle>
          <p className="text-sm text-muted-foreground">Entenda como cada centavo é calculado até chegar ao Lucro Líquido.</p>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          {/* COLUNA 1: CENÁRIO ATUAL */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm bg-muted p-2 rounded flex items-center justify-between uppercase">
              Cenário Atual (Legado)
              <span className="text-[10px] font-normal text-muted-foreground">Base: Lucro Presumido</span>
            </h3>
            
            <div className="p-4 border rounded-lg bg-card/50">
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <span className="text-sm font-bold">1. Receita Bruta</span>
                <span className="font-mono text-primary font-bold">{formatCurrency(legacyResult.totalRevenue)}</span>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Deduções de Custo e Despesa:</p>
                <CalculationStep label="Custo de Aquisição (Compra)" value={legacyResult.totalAcquisitionCost} icon={MinusCircle} isNegative />
                <CalculationStep label="Despesas Variáveis (Venda)" value={legacyResult.totalVariableExpenses} icon={MinusCircle} isNegative />
                <CalculationStep label="Custos Fixos (Folha/Aluguel)" value={legacyResult.totalFixedCosts} icon={MinusCircle} isNegative />
              </div>

              <div className="mt-4 space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Impostos Calculados (Cascata):</p>
                <CalculationStep label="PIS (0,65%)" value={legacyResult.taxBreakdown.pis} icon={MinusCircle} isNegative />
                <CalculationStep label="COFINS (3,00%)" value={legacyResult.taxBreakdown.cofins} icon={MinusCircle} isNegative />
                <CalculationStep label="ICMS (18,00% est.)" value={legacyResult.taxBreakdown.icms} icon={MinusCircle} isNegative />
                <CalculationStep label="IRPJ (Efetivo)" value={legacyResult.taxBreakdown.irpj} icon={MinusCircle} isNegative />
                <CalculationStep label="CSLL (Efetivo)" value={legacyResult.taxBreakdown.csll} icon={MinusCircle} isNegative />
              </div>

              <div className="mt-6 pt-4 border-t-2 border-dashed flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Equal className="h-5 w-5 text-muted-foreground" />
                  <span className="font-black text-sm uppercase">Lucro Líquido Final</span>
                </div>
                <span className={cn("text-xl font-black font-mono", legacyResult.netProfit < 0 ? "text-destructive" : "text-success")}>
                  {formatCurrency(legacyResult.netProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* COLUNA 2: CENÁRIO FUTURO */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm bg-primary/10 p-2 rounded flex items-center justify-between uppercase text-primary">
              Cenário Futuro (Reforma)
              <span className="text-[10px] font-normal text-primary/70">Base: IBS/CBS (IVA Dual)</span>
            </h3>
            
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
              <div className="flex items-center justify-between mb-4 border-b border-primary/20 pb-2">
                <span className="text-sm font-bold">1. Receita Sugerida (Reforma)</span>
                <span className="font-mono text-primary font-bold">{formatCurrency(futureResult.totalRevenue)}</span>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Deduções Eficientes:</p>
                <CalculationStep label="Custo de Aquisição (CUMP)" value={futureResult.totalAcquisitionCost} icon={MinusCircle} isNegative />
                <CalculationStep label="Despesas Variáveis (Comissão/Taxas)" value={futureResult.totalVariableExpenses} icon={MinusCircle} isNegative />
                <CalculationStep label="Rateio Fixo (CFU x Unid)" value={futureResult.totalFixedCosts} icon={MinusCircle} isNegative />
              </div>

              <div className="mt-4 space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Impostos (Crédito x Débito):</p>
                <CalculationStep label="CBS a Pagar (Federal)" value={futureResult.totalTax * 0.33} icon={MinusCircle} isNegative />
                <CalculationStep label="IBS a Pagar (Estadual/Mun)" value={futureResult.totalTax * 0.67} icon={MinusCircle} isNegative />
                <div className="flex justify-between items-center bg-success/10 p-2 rounded mt-2 border border-success/20">
                  <span className="text-[10px] font-bold text-success uppercase">Créditos Recuperados</span>
                  <span className="text-xs font-mono font-bold text-success">Incumbência do IVA</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t-2 border-primary/20 border-dashed flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Equal className="h-5 w-5 text-primary" />
                  <span className="font-black text-sm uppercase text-primary">Lucro Líquido Final</span>
                </div>
                <span className="text-xl font-black font-mono text-success">
                  {formatCurrency(futureResult.netProfit)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BLOCO DE IMPACTO E CONTROLES */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 shadow-card p-6">
          <CardTitle className="text-lg mb-4">Simule as Alíquotas da Reforma</CardTitle>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label className="text-xs">Alíquota IBS (Estado/Mun) - {futureIbsRate.toFixed(1)}%</Label>
              <Slider value={[futureIbsRate]} onValueChange={([v]) => setFutureIbsRate(v)} max={30} step={0.1} />
            </div>
            <div className="space-y-4">
              <Label className="text-xs">Alíquota CBS (Federal) - {futureCbsRate.toFixed(1)}%</Label>
              <Slider value={[futureCbsRate]} onValueChange={([v]) => setFutureCbsRate(v)} max={15} step={0.1} />
            </div>
          </div>
        </Card>

        <Card className="bg-success/10 border-success/30 p-6 flex flex-col justify-center items-center text-center">
          <TrendingUp className="h-8 w-8 text-success mb-2" />
          <h3 className="text-xs font-bold uppercase text-success-foreground">Ganho de Eficiência</h3>
          <p className="text-2xl font-black text-success">{formatCurrency(impact.profit)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Diferença de lucro entre os modelos</p>
        </Card>
      </div>
    </div>
  );
};

export default ImpactAnalysis;