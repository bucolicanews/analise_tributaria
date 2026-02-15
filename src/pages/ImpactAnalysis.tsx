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
  Target,
  AlertTriangle,
  ArrowRight,
  CalculatorIcon,
  ChevronDown,
  ChevronUp
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
      const futureTotalTax = totalFutureDebits - totalFutureCredits;
      
      const futureNetProfit = futureRevenue - futureAcqCost - futureVarExp - fixedCostProportionalToNote - futureTotalTax;

      return {
        legacyResult,
        futureResult: {
          totalRevenue: futureRevenue,
          cbsDebit: totalFutureCbsDebit,
          ibsDebit: totalFutureIbsDebit,
          cbsCredit: totalFutureCbsCredit,
          ibsCredit: totalFutureIbsCredit,
          selectiveTax: totalFutureSelectiveDebit,
          simplesTax: totalFutureSimplesDebit,
          totalDebits: totalFutureDebits,
          totalCredits: totalFutureCredits,
          totalTax: futureTotalTax,
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

  if (!analysisData) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Card className="max-w-md mx-auto p-8 shadow-card flex flex-col items-center gap-4 border-dashed border-2 border-primary/20 bg-muted/30">
          <Calculator className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-bold">Simulação Não Iniciada</h2>
          <p className="text-sm text-muted-foreground">
            Para realizar a análise de impacto, você precisa primeiro carregar um XML e gerar o relatório na aba de Precificação.
          </p>
          <Button onClick={() => navigate('/')} className="mt-2">
            Ir para Precificação <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Card>
      </div>
    );
  }

  const { legacyResult, futureResult, impact, fixedCostProportionalToNote } = analysisData;
  const isSimplesPadrao = futureResult.params.taxRegime === TaxRegime.SimplesNacional && !futureResult.params.generateIvaCredit;

  const legacyTotalDeductions = legacyResult.totalAcquisitionCost + legacyResult.totalVariableExpenses + fixedCostProportionalToNote + legacyResult.totalTax;
  const futureTotalDeductions = futureResult.totalAcquisitionCost + futureResult.totalVariableExpenses + fixedCostProportionalToNote + futureResult.totalTax;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Card className="shadow-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Calculator className="h-6 w-6" />
            Memória de Cálculo Detalhada (Passo a Passo)
          </CardTitle>
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md mt-2">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-500/90 leading-relaxed">
              <strong>Análise Comparativa:</strong> Os custos de base estão alinhados pelo rateio proporcional. Abaixo, veja como os impostos da Reforma impactam o seu lucro.
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          
          <div className="space-y-4">
            <h3 className="font-bold text-sm bg-muted p-2 rounded flex items-center justify-between uppercase">
              Cenário Atual (Legado)
              <span className="text-[10px] font-normal text-muted-foreground">Base: {legacyResult.regime}</span>
            </h3>
            
            <div className="p-4 border rounded-lg bg-card/50">
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <span className="text-sm font-bold">1. Receita Bruta Projetada</span>
                <span className="font-mono text-primary font-bold">{legacyResult.isInviable ? "INVIÁVEL" : formatCurrency(legacyResult.totalRevenue)}</span>
              </div>

              {legacyResult.isInviable ? (
                <div className="py-8 text-center text-destructive flex flex-col items-center gap-2">
                  <AlertTriangle className="h-8 w-8" />
                  <p className="text-xs font-bold uppercase">Operação Inviável no Modelo Atual</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Custos:</p>
                    <CalculationStep label="Custo de Aquisição (XML Compra)" value={legacyResult.totalAcquisitionCost} isNegative />
                    <CalculationStep label="Despesas Variáveis (Venda)" value={legacyResult.totalVariableExpenses} isNegative />
                    <CalculationStep label="Custo Fixo Rateado" value={fixedCostProportionalToNote} isNegative />
                  </div>

                  <div className="mt-4 space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Impostos Atuais:</p>
                    <CalculationStep label="Total Impostos s/ Faturamento" value={legacyResult.totalTax} isNegative />
                  </div>

                  <div className="mt-6 pt-4 border-t-2 border-dashed flex items-center justify-between">
                    <span className="font-black text-sm uppercase">Lucro Líquido Final</span>
                    <span className={cn("text-xl font-black font-mono", legacyResult.netProfit < 0 ? "text-destructive" : "text-success")}>
                      {formatCurrency(legacyResult.netProfit)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-sm bg-primary/10 p-2 rounded flex items-center justify-between uppercase text-primary">
              Cenário Futuro (Reforma)
              <span className="text-[10px] font-normal text-primary/70">Base: {futureResult.params.taxRegime}</span>
            </h3>
            
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
              <div className="flex items-center justify-between mb-4 border-b border-primary/20 pb-2">
                <span className="text-sm font-bold">1. Receita Sugerida (Reforma)</span>
                <span className="font-mono text-primary font-bold">{futureResult.isInviable ? "INVIÁVEL" : formatCurrency(futureResult.totalRevenue)}</span>
              </div>

              {futureResult.isInviable ? (
                <div className="py-8 text-center text-destructive flex flex-col items-center gap-2">
                  <AlertTriangle className="h-8 w-8" />
                  <p className="text-xs font-bold uppercase">Operação Inviável</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Custos:</p>
                    <CalculationStep label="Custo Aquisição" value={futureResult.totalAcquisitionCost} isNegative />
                    <CalculationStep label="Despesas Variáveis" value={futureResult.totalVariableExpenses} isNegative />
                    <CalculationStep label="Custo Fixo Rateado" value={fixedCostProportionalToNote} isNegative />
                  </div>

                  <div className="mt-4 space-y-1">
                    <div 
                      className="flex items-center justify-between cursor-pointer hover:bg-primary/10 p-1 rounded transition-colors"
                      onClick={() => setShowTaxDetail(!showTaxDetail)}
                    >
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Impostos da Reforma:</p>
                      {showTaxDetail ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </div>
                    
                    {showTaxDetail ? (
                      <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                        {/* DÉBITOS */}
                        <CalculationStep label="(+) Débitos s/ Venda" value={futureResult.totalDebits} />
                        {futureResult.params.taxRegime === TaxRegime.SimplesNacional && (
                          <CalculationStep label="• Simples Nacional" value={futureResult.simplesTax} isSubItem />
                        )}
                        {!isSimplesPadrao && (
                          <>
                            <CalculationStep label="• CBS (Federal)" value={futureResult.cbsDebit} isSubItem />
                            <CalculationStep label="• IBS (Estadual/Mun)" value={futureResult.ibsDebit} isSubItem />
                          </>
                        )}
                        {futureResult.selectiveTax > 0 && (
                          <CalculationStep label="• Imposto Seletivo" value={futureResult.selectiveTax} isSubItem />
                        )}

                        {/* CRÉDITOS - Somente se não for Simples Padrão */}
                        {!isSimplesPadrao && (
                          <div className="mt-2">
                            <CalculationStep label="(-) Créditos s/ Compra" value={futureResult.totalCredits} isNegative color="text-success" />
                            <CalculationStep label="• Crédito CBS" value={futureResult.cbsCredit} isSubItem color="text-success" isNegative />
                            <CalculationStep label="• Crédito IBS" value={futureResult.ibsCredit} isSubItem color="text-success" isNegative />
                          </div>
                        )}

                        <div className="border-t border-primary/20 mt-1 pt-1">
                          <CalculationStep label="(=) Imposto Líquido a Pagar" value={futureResult.totalTax} isNegative={futureResult.totalTax < 0} color={futureResult.totalTax < 0 ? "text-success" : "text-destructive"} />
                        </div>
                      </div>
                    ) : (
                      <CalculationStep label="Impostos Líquidos (Saldo)" value={futureResult.totalTax} isNegative={futureResult.totalTax < 0} />
                    )}
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
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 shadow-card p-6">
          <CardTitle className="text-lg mb-4">Simulador de Alíquotas</CardTitle>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <Label className="text-xs">Alíquota IBS - {futureIbsRate.toFixed(1)}%</Label>
              <Slider value={[futureIbsRate]} onValueChange={([v]) => setFutureIbsRate(v)} max={30} step={0.1} />
            </div>
            <div className="space-y-4">
              <Label className="text-xs">Alíquota CBS - {futureCbsRate.toFixed(1)}%</Label>
              <Slider value={[futureCbsRate]} onValueChange={([v]) => setFutureCbsRate(v)} max={15} step={0.1} />
            </div>
          </div>
        </Card>

        <Card className="bg-success/10 border-success/30 p-6 text-center">
          <TrendingUp className="h-8 w-8 text-success mx-auto mb-2" />
          <h3 className="text-xs font-bold uppercase text-success">Impacto no Lucro</h3>
          <p className="text-2xl font-black text-success">{formatCurrency(impact.profit)}</p>
        </Card>
      </div>
    </div>
  );
};

export default ImpactAnalysis;