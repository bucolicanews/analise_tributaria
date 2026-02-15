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
  AlertTriangle
} from 'lucide-react';
import { Product, CalculationParams, TaxRegime } from '@/types/pricing';
import { calculatePricing } from '@/lib/pricing';
import { calculateLegacyPricing } from '@/lib/legacyPricing';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const CalculationStep = ({ label, value, isNegative = false, color = "text-foreground" }: { label: string, value: number, isNegative?: boolean, color?: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
    <div className="flex items-center gap-2">
      {isNegative ? <MinusCircle className="h-4 w-4 text-destructive" /> : <PlusCircle className="h-4 w-4 text-success" />}
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
    <span className={cn("font-mono font-bold text-sm", color)}>{isNegative ? "-" : ""}{formatCurrency(value)}</span>
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

      const legacyResult = calculateLegacyPricing(productsToProcess, baseParams);

      const futureParams: CalculationParams = { ...baseParams, ibsRate: futureIbsRate, cbsRate: futureCbsRate };
      const totalFixedExpenses = futureParams.fixedCostsTotal || 0;
      const cfu = futureParams.totalStockUnits > 0 ? totalFixedCosts / futureParams.totalStockUnits : 0;
      
      const calculatedFuture = productsToProcess.map(p => calculatePricing(p, futureParams, cfu));
      
      const futureRevenue = calculatedFuture.reduce((sum, p) => sum + p.sellingPrice * p.quantity, 0);
      const futureTotalTax = calculatedFuture.reduce((sum, p) => sum + p.taxToPay * p.quantity, 0);
      const futureAcqCost = calculatedFuture.reduce((sum, p) => sum + p.cost * p.quantity, 0);
      const futureVarExp = calculatedFuture.reduce((sum, p) => sum + p.valueForVariableExpenses * p.quantity, 0);
      const futureFixedContrib = cfu * productsToProcess.reduce((sum, p) => sum + p.quantity * p.innerQuantity, 0);
      const futureNetProfit = futureRevenue - futureAcqCost - futureVarExp - futureFixedContrib - futureTotalTax;

      // Cálculo Seguro do BEP Futuro
      const totalVarPct = futureParams.variableExpenses.reduce((s, e) => s + e.percentage, 0);
      const cbsRateEff = futureParams.useCbsDebit ? futureParams.cbsRate : 0;
      const ibsRateEff = futureParams.ibsRate * (futureParams.ibsDebitPercentage / 100);
      const isRateEff = futureParams.useSelectiveTaxDebit ? futureParams.defaultSelectiveTaxRate : 0;
      
      let totalFutureTaxRate = 0;
      if (futureParams.taxRegime === TaxRegime.SimplesNacional) {
          totalFutureTaxRate = futureParams.generateIvaCredit 
            ? (futureParams.simplesNacionalRate + cbsRateEff + ibsRateEff + isRateEff) 
            : (futureParams.simplesNacionalRate + isRateEff);
      } else {
          totalFutureTaxRate = cbsRateEff + ibsRateEff + futureParams.irpjRate + futureParams.csllRate + isRateEff;
      }

      const costOfGoodsRatio = futureRevenue > 0 ? futureAcqCost / futureRevenue : 0;
      const futureContrMarginRatio = 1 - (costOfGoodsRatio + (totalVarPct / 100) + (totalFutureTaxRate / 100));
      const futureBEP = futureContrMarginRatio > 0.001 ? totalFixedExpenses / futureContrMarginRatio : 0;

      return {
        legacyResult,
        futureResult: {
          totalRevenue: futureRevenue,
          totalTax: futureTotalTax,
          totalAcquisitionCost: futureAcqCost,
          totalVariableExpenses: futureVarExp,
          totalFixedCosts: futureFixedContrib,
          netProfit: futureNetProfit,
          breakEvenPoint: futureBEP,
          params: futureParams,
          isInviable: futureContrMarginRatio <= 0.001
        },
        impact: {
          profit: futureNetProfit - legacyResult.netProfit,
        }
      };
    } catch (error) { return null; }
  }, [futureIbsRate, futureCbsRate]);

  if (!analysisData) return <div className="p-12 text-center">Dados insuficientes.</div>;

  const { legacyResult, futureResult, impact } = analysisData;

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
              <strong>Como este valor é calculado?</strong> A Receita Bruta abaixo é baseada no custo das suas <strong>Notas de Compra</strong>. O sistema projeta quanto você precisa vender hoje (Atual) vs amanhã (Reforma) para cobrir os impostos e despesas a partir do que você pagou ao fornecedor.
            </p>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          
          {/* COLUNA 1: CENÁRIO ATUAL */}
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
                  <p className="text-[10px] opacity-70">Impostos + Despesas + Custo Mercadoria excedem 100% da venda.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Custos (Base: Notas de Compra):</p>
                    <CalculationStep label="Custo de Aquisição (XML Compra)" value={legacyResult.totalAcquisitionCost} isNegative />
                    <CalculationStep label="Despesas Variáveis (Venda)" value={legacyResult.totalVariableExpenses} isNegative />
                    <CalculationStep label="Custos Fixos Totais" value={legacyResult.totalFixedCosts} isNegative />
                  </div>

                  <div className="mt-4 space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Impostos Atuais:</p>
                    {legacyResult.regime === TaxRegime.SimplesNacional ? (
                      <CalculationStep label={`Guia DAS (${futureResult.params.simplesNacionalRate}%)`} value={legacyResult.taxBreakdown.simples || 0} isNegative />
                    ) : (
                      <>
                        <CalculationStep label="PIS (0,65%)" value={legacyResult.taxBreakdown.pis || 0} isNegative />
                        <CalculationStep label="COFINS (3,00%)" value={legacyResult.taxBreakdown.cofins || 0} isNegative />
                        <CalculationStep label="ICMS (18,00% est.)" value={legacyResult.taxBreakdown.icms || 0} isNegative />
                        <CalculationStep label="IRPJ (Efetivo)" value={legacyResult.taxBreakdown.irpj || 0} isNegative />
                        <CalculationStep label="CSLL (Efetivo)" value={legacyResult.taxBreakdown.csll || 0} isNegative />
                      </>
                    )}
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

                  <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded flex items-center justify-between">
                    <div className="flex items-center gap-2 text-yellow-600">
                      <Target className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase">Faturamento Mínimo Mensal (Equilíbrio)</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-yellow-600">
                      {legacyResult.breakEvenPoint > 0 ? formatCurrency(legacyResult.breakEvenPoint) : "N/A"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* COLUNA 2: CENÁRIO FUTURO */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm bg-primary/10 p-2 rounded flex items-center justify-between uppercase text-primary">
              Cenário Futuro (Reforma)
              <span className="text-[10px] font-normal text-primary/70">Base: CBS/IBS (IVA Dual)</span>
            </h3>
            
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
              <div className="flex items-center justify-between mb-4 border-b border-primary/20 pb-2">
                <span className="text-sm font-bold">1. Receita Sugerida (Reforma)</span>
                <span className="font-mono text-primary font-bold">{futureResult.isInviable ? "INVIÁVEL" : formatCurrency(futureResult.totalRevenue)}</span>
              </div>

              {futureResult.isInviable ? (
                <div className="py-8 text-center text-destructive flex flex-col items-center gap-2">
                  <AlertTriangle className="h-8 w-8" />
                  <p className="text-xs font-bold uppercase">Operação Inviável na Reforma</p>
                  <p className="text-[10px] opacity-70">Custo Total de Operação supera o potencial de venda.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Custos (Base: Notas de Compra):</p>
                    <CalculationStep label="Custo Aquisição Ajustado (CUMP)" value={futureResult.totalAcquisitionCost} isNegative />
                    <CalculationStep label="Despesas Variáveis (Venda)" value={futureResult.totalVariableExpenses} isNegative />
                    <CalculationStep label="Rateio de Custo Fixo (CFU)" value={futureResult.totalFixedCosts} isNegative />
                  </div>

                  <div className="mt-4 space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Impostos da Reforma:</p>
                    <CalculationStep label="Impostos Líquidos (Débito - Crédito)" value={futureResult.totalTax} isNegative />
                    <div className="bg-success/10 p-2 rounded mt-2 border border-success/20 text-[10px] text-success font-bold text-center">
                      SISTEMA DE CRÉDITO FINANCEIRO ATIVO
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

                  <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary">
                      <Target className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase">Faturamento Mínimo Mensal (Equilíbrio)</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-primary">
                      {futureResult.breakEvenPoint > 0 ? formatCurrency(futureResult.breakEvenPoint) : "N/A"}
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
          <CardTitle className="text-lg mb-4">Ajuste as Alíquotas da Reforma</CardTitle>
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
          <p className="text-[10px] text-muted-foreground mt-1">Recuperação de margem na Reforma</p>
        </Card>
      </div>
    </div>
  );
};

export default ImpactAnalysis;