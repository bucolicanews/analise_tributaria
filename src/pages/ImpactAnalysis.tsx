import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Calculator,
  TrendingUp, 
  MinusCircle, 
  PlusCircle, 
  Equal,
  Info,
  AlertTriangle,
  ArrowRight,
  CalculatorIcon,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Wallet
} from 'lucide-react';
import { Product, CalculationParams, TaxRegime } from '@/types/pricing';
import { calculatePricing } from '@/lib/pricing';
import { calculateLegacyPricing } from '@/lib/legacyPricing';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const formatCurrency = (value: number) => {
  const absValue = Math.abs(value);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(absValue);
};

const CalculationStep = ({ label, value, isNegative = false, color = "text-foreground", isSubItem = false }: { label: string, value: number, isNegative?: boolean, color?: string, isSubItem?: boolean }) => (
  <div className={cn("flex items-center justify-between py-2 border-b border-border/50 last:border-0", isSubItem && "ml-4 opacity-80 py-1")}>
    <div className="flex items-center gap-2">
      {isNegative ? <MinusCircle className={cn("h-4 w-4 text-destructive", isSubItem && "h-3 w-3")} /> : <PlusCircle className={cn("h-4 w-4 text-success", isSubItem && "h-3 w-3")} />}
      <span className={cn("text-xs font-medium text-muted-foreground", isSubItem && "text-[10px]")}>{label}</span>
    </div>
    <span className={cn("font-mono font-bold text-sm", color, isSubItem && "text-xs")}>{isNegative ? "-" : ""}{formatCurrency(value)}</span>
  </div>
);

const ImpactAnalysis = () => {
  const navigate = useNavigate();
  const [futureIbsRate, setFutureIbsRate] = useState(17.7);
  const [futureCbsRate, setFutureCbsRate] = useState(8.8);
  const [showTaxDetail, setShowTaxDetail] = useState(true);

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

      const totalGlobalFixedExpenses = baseParams.fixedCostsTotal || 0;
      const cfu = baseParams.totalStockUnits > 0 ? totalGlobalFixedExpenses / baseParams.totalStockUnits : 0;
      const totalInnerUnitsInNote = productsToProcess.reduce((sum, p) => sum + p.quantity * p.innerQuantity, 0);
      
      const fixedCostProportionalToNote = cfu * totalInnerUnitsInNote;

      const legacyParams = { ...baseParams, fixedCostsTotal: fixedCostProportionalToNote };
      const legacyResult = calculateLegacyPricing(productsToProcess, legacyParams);

      const futureParams: CalculationParams = { ...baseParams, ibsRate: futureIbsRate, cbsRate: futureCbsRate };
      const calculatedFuture = productsToProcess.map(p => calculatePricing(p, futureParams, cfu));
      
      const futureRevenue = calculatedFuture.reduce((sum, p) => sum + p.sellingPrice * p.quantity, 0);
      const futureAcqCost = calculatedFuture.reduce((sum, p) => sum + p.cost * p.quantity, 0);
      const futureVarExp = calculatedFuture.reduce((sum, p) => sum + p.valueForVariableExpenses * p.quantity, 0);
      
      const totalFutureCbsDebit = calculatedFuture.reduce((sum, p) => sum + p.cbsDebit * p.quantity, 0);
      const totalFutureIbsDebit = calculatedFuture.reduce((sum, p) => sum + p.ibsDebit * p.quantity, 0);
      const totalFutureSelectiveDebit = calculatedFuture.reduce((sum, p) => sum + p.selectiveTaxToPay * p.quantity, 0);
      const totalFutureSimplesDebit = calculatedFuture.reduce((sum, p) => sum + p.simplesToPay * p.quantity, 0);
      
      const totalFutureCbsCredit = calculatedFuture.reduce((sum, p) => sum + p.cbsCredit * p.quantity, 0);
      const totalFutureIbsCredit = calculatedFuture.reduce((sum, p) => sum + p.ibsCredit * p.quantity, 0);

      const totalFutureDebits = totalFutureCbsDebit + totalFutureIbsDebit + totalFutureSelectiveDebit + totalFutureSimplesDebit;
      const totalFutureCredits = totalFutureCbsCredit + totalFutureIbsCredit;
      
      // IMPOSTO LÍQUIDO: Se os créditos forem maiores que os débitos, o imposto a pagar é ZERO.
      // O excedente é um "Ativo Tributário" (Saldo Credor) e não lucro imediato.
      const futureTotalTaxEffective = Math.max(0, totalFutureDebits - totalFutureCredits);
      const taxCreditSaldo = Math.max(0, totalFutureCredits - totalFutureDebits);
      
      // Lucro Líquido = Receita - Custos - Despesas - Imposto Efetivo (que nunca é menor que zero)
      const futureNetProfit = futureRevenue - futureAcqCost - futureVarExp - fixedCostProportionalToNote - futureTotalTaxEffective;

      return {
        legacyResult,
        futureResult: {
          totalRevenue: futureRevenue,
          totalDebits: totalFutureDebits,
          totalCredits: totalFutureCredits,
          totalTaxEffective: futureTotalTaxEffective,
          taxCreditSaldo: taxCreditSaldo,
          totalAcquisitionCost: futureAcqCost,
          totalVariableExpenses: futureVarExp,
          totalFixedCosts: fixedCostProportionalToNote,
          netProfit: futureNetProfit,
          params: futureParams,
          isInviable: futureRevenue <= 0
        },
        impact: {
          profit: futureNetProfit - legacyResult.netProfit,
        },
        fixedCostProportionalToNote
      };
    } catch (error) { return null; }
  }, [futureIbsRate, futureCbsRate]);

  if (!analysisData) return <div className="p-8 text-center">Simulação não iniciada.</div>;

  const { legacyResult, futureResult, impact, fixedCostProportionalToNote } = analysisData;
  const hasSaldoCredor = futureResult.taxCreditSaldo > 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Card className="shadow-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Calculator className="h-6 w-6" />
            Memória de Cálculo (Passo a Passo)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          
          <div className="space-y-4">
            <h3 className="font-bold text-sm bg-muted p-2 rounded uppercase">Cenário Atual</h3>
            <div className="p-4 border rounded-lg bg-card/50">
               <CalculationStep label="Receita Bruta" value={legacyResult.totalRevenue} />
               <CalculationStep label="Custo Aquisição" value={legacyResult.totalAcquisitionCost} isNegative />
               <CalculationStep label="Impostos Atuais" value={legacyResult.totalTax} isNegative />
               <div className="mt-6 pt-4 border-t-2 border-dashed flex justify-between">
                 <span className="font-bold">LUCRO LÍQUIDO</span>
                 <span className={cn("text-xl font-bold", legacyResult.netProfit < 0 ? "text-destructive" : "text-success")}>
                   {formatCurrency(legacyResult.netProfit)}
                 </span>
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-sm bg-primary/10 p-2 rounded text-primary uppercase">Cenário Reforma</h3>
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
               <CalculationStep label="Receita Sugerida" value={futureResult.totalRevenue} />
               <CalculationStep label="Custo Aquisição" value={futureResult.totalAcquisitionCost} isNegative />
               <CalculationStep label="Despesas Variáveis" value={futureResult.totalVariableExpenses} isNegative />
               <CalculationStep label="Custo Fixo Rateado" value={futureResult.totalFixedCosts} isNegative />
               
               <div className="mt-4 pt-4 border-t border-border/50">
                 <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowTaxDetail(!showTaxDetail)}>
                   <span className="text-[10px] font-bold text-muted-foreground uppercase">Impostos da Reforma</span>
                   {showTaxDetail ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                 </div>
                 
                 {showTaxDetail && (
                   <div className="mt-2 space-y-1 animate-in fade-in">
                     <CalculationStep label="(+) Débitos s/ Venda" value={futureResult.totalDebits} />
                     <CalculationStep label="(-) Créditos s/ Compra" value={futureResult.totalCredits} isNegative color="text-success" />
                   </div>
                 )}

                 <CalculationStep 
                   label="Imposto Líquido Efetivo" 
                   value={futureResult.totalTaxEffective} 
                   isNegative={futureResult.totalTaxEffective > 0}
                   color={futureResult.totalTaxEffective > 0 ? "text-destructive" : "text-success"} 
                 />

                 {hasSaldoCredor && (
                    <div className="mt-2 p-2 bg-success/10 border border-success/20 rounded-md flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-success" />
                          <span className="text-[10px] font-bold text-success uppercase">Saldo Credor p/ Futuro</span>
                       </div>
                       <span className="font-mono font-bold text-success text-xs">+{formatCurrency(futureResult.taxCreditSaldo)}</span>
                    </div>
                 )}
               </div>

               <div className="mt-6 pt-4 border-t-2 border-primary/20 border-dashed flex justify-between">
                 <div className="flex items-center gap-2">
                    <Equal className="h-5 w-5 text-primary" />
                    <span className="font-black text-sm uppercase text-primary">LUCRO LÍQUIDO FINAL</span>
                 </div>
                 <span className={cn("text-xl font-black font-mono", futureResult.netProfit < 0 ? "text-destructive" : "text-success")}>
                   {formatCurrency(futureResult.netProfit)}
                 </span>
               </div>
               {hasSaldoCredor && (
                 <p className="text-[9px] text-muted-foreground italic mt-2 text-center">
                   *O lucro não excede a receita. O saldo credor de {formatCurrency(futureResult.taxCreditSaldo)} será usado para abater impostos em operações futuras.
                 </p>
               )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 shadow-card p-6">
           <CardTitle className="text-sm mb-4">Simulador de Alíquotas</CardTitle>
           <div className="grid grid-cols-2 gap-8">
             <div className="space-y-4">
               <Label className="text-[10px]">IBS - {futureIbsRate.toFixed(1)}%</Label>
               <Slider value={[futureIbsRate]} onValueChange={([v]) => setFutureIbsRate(v)} max={30} step={0.1} />
             </div>
             <div className="space-y-4">
               <Label className="text-[10px]">CBS - {futureCbsRate.toFixed(1)}%</Label>
               <Slider value={[futureCbsRate]} onValueChange={([v]) => setFutureCbsRate(v)} max={15} step={0.1} />
             </div>
           </div>
        </Card>
        <Card className="bg-success/10 border-success/30 p-6 text-center flex flex-col justify-center">
          <TrendingUp className="h-8 w-8 text-success mx-auto mb-2" />
          <h3 className="text-[10px] font-bold text-success uppercase">Aumento de Lucratividade</h3>
          <p className="text-2xl font-black text-success">{formatCurrency(impact.profit)}</p>
        </Card>
      </div>
    </div>
  );
};

export default ImpactAnalysis;