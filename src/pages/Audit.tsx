"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Info, XCircle, AlertTriangle, ShieldCheck, Package, Calculator } from 'lucide-react';
import { Product, CalculationParams, TaxRegime } from "@/types/pricing";
import { calculatePricing } from '@/lib/pricing';
import { findCClassByNcm, getClassificationDetails } from '@/lib/tax/taxClassificationService';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const MetricItem = ({ label, value, className }: { label: string; value: string; className?: string }) => (
  <div className="flex flex-col border-r border-border last:border-r-0 px-3 py-1 min-w-[100px]">
    <span className="text-[10px] text-muted-foreground uppercase font-semibold">{label}</span>
    <span className={cn("text-xs font-mono font-bold", className)}>{value}</span>
  </div>
);

const TaxBox = ({ label, value }: { label: string; value: string | number }) => (
  <div className="space-y-1 flex-1 min-w-[120px]">
    <div className="text-[10px] font-bold text-muted-foreground uppercase truncate text-center">{label}</div>
    <div className="text-sm font-mono font-bold text-primary bg-primary/5 p-2 rounded border border-primary/20 text-center">
      {value}
    </div>
  </div>
);

const MathBlock = ({ label, icon: Icon, values }: { label: string, icon: any, values: { label: string, val: number, color?: string, isResult?: boolean }[] }) => (
  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-3 border-b border-border last:border-b-0">
    <div className="flex items-center gap-2 font-bold text-xs uppercase min-w-[180px]">
      <Icon className="h-4 w-4" />
      {label}
    </div>
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 font-mono text-[10px] sm:text-xs">
      {values.map((v, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-muted-foreground uppercase">{v.label}</span>
            <span className={v.color || "font-bold"}>{formatCurrency(v.val)}</span>
          </div>
          {i < values.length - 1 && !values[i+1].isResult && <span className="text-muted-foreground"> - </span>}
          {i < values.length - 1 && values[i+1].isResult && <span className="text-muted-foreground"> = </span>}
        </React.Fragment>
      ))}
    </div>
  </div>
);

const Audit = () => {
  const purchaseProducts: Product[] = JSON.parse(sessionStorage.getItem('jota-calc-purchase-products') || '[]');
  const salesProducts: Product[] = JSON.parse(sessionStorage.getItem('jota-calc-sales-products') || '[]');
  const params: CalculationParams | null = JSON.parse(sessionStorage.getItem('jota-calc-params') || 'null');

  const auditResults = useMemo(() => {
    if (!params) return [];

    const totalFixedCosts = params.fixedCostsTotal || 0;
    const cfu = params.totalStockUnits > 0 ? totalFixedCosts / params.totalStockUnits : 0;
    const totalVarPct = params.variableExpenses.reduce((sum, exp) => sum + exp.percentage, 0);

    return salesProducts.map(sale => {
      const purchase = purchaseProducts.find(p => p.code === sale.code);
      const discrepancies: string[] = [];
      
      let riskType: 'overpayment' | 'underpayment' | 'generic' | 'none' = 'none';
      
      const ncm = purchase?.ncm || sale.ncm || '';
      const cstPurchase = purchase?.cst || '';
      const isST = ['10', '30', '60', '70', '201', '202', '203', '500'].includes(cstPurchase);
      const isMonofasico = ['04', '05', '06'].includes(purchase?.pisCst || '');

      // Cálculo da Sugestão (usando os dados da compra como base de custo)
      const baseProduct = purchase || sale;
      const calculated = calculatePricing(baseProduct, params, cfu);
      const classification = calculated.cClassTrib ? getClassificationDetails(calculated.cClassTrib) : null;

      if (purchase) {
        if (purchase.ncm !== sale.ncm) discrepancies.push('NCM');
        if (purchase.cst !== sale.cst) discrepancies.push('CST/CSOSN');
        const saleIsTributado = ['101', '102', '00', '20'].includes(sale.cst || "");
        if (isST && saleIsTributado) riskType = 'overpayment';
        else if (!isST && sale.cst === '500') riskType = 'underpayment';
        else if (discrepancies.length > 0) riskType = 'generic';
      }

      const status = !purchase ? 'unassociated' : discrepancies.length > 0 ? 'divergent' : 'ok';

      return {
        sale,
        purchase,
        discrepancies,
        status,
        riskType,
        calculated,
        classification,
        cfu,
        totalVarPct
      };
    });
  }, [purchaseProducts, salesProducts, params]);

  const divergentItems = auditResults.filter(r => r.status === 'divergent');
  const okItems = auditResults.filter(r => r.status === 'ok');
  const unassociatedItems = auditResults.filter(r => r.status === 'unassociated');

  const AuditList = ({ items }: { items: typeof auditResults }) => (
    <div className="space-y-6">
      {items.map((result, idx) => {
        const { calculated, cfu, totalVarPct } = result;
        
        // Cálculos para o MathBlock
        const comFixedCost = cfu * (calculated.innerQuantity || 1);
        const comTotalBaseCost = calculated.cost + comFixedCost;
        const comGrossProfit = calculated.sellingPrice - comTotalBaseCost;
        const comNetProfit = comGrossProfit - calculated.taxToPay - calculated.valueForVariableExpenses;

        const innerQty = calculated.innerQuantity || 1;
        const unitSelling = calculated.sellingPricePerInnerUnit;
        const unitAcqCost = calculated.cost / innerQty;
        const unitFixedCost = comFixedCost / innerQty;
        const unitTotalBaseCost = unitAcqCost + unitFixedCost;
        const unitGrossProfit = unitSelling - unitTotalBaseCost;
        const unitTax = calculated.taxToPayPerInnerUnit;
        const unitVarExp = (calculated.valueForVariableExpenses / calculated.quantity) / innerQty;
        const unitNetProfit = unitGrossProfit - unitTax - unitVarExp;

        return (
          <div key={idx} className="rounded-lg border border-border overflow-hidden shadow-sm bg-card animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Cabeçalho */}
            <div className="bg-muted/30 p-4 border-b border-border flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{result.sale.name}</h3>
                  {result.status === 'divergent' && <Badge variant="destructive" className="text-[10px]">DIVERGENTE</Badge>}
                </div>
                <div className="flex gap-4 text-[10px] text-muted-foreground font-mono mt-1">
                  <span>Cód: {result.sale.code}</span>
                  <span>EAN: {result.sale.ean || '---'}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Venda Sugerida</div>
                <div className="text-xl font-extrabold text-primary">{formatCurrency(unitSelling)}</div>
              </div>
            </div>

            {/* Alertas de Risco */}
            {result.riskType !== 'none' && (
              <div className={cn(
                "px-4 py-2 border-b text-xs flex items-center gap-2",
                result.riskType === 'overpayment' ? "bg-blue-500/10 text-blue-500" : "bg-destructive/10 text-destructive"
              )}>
                <AlertTriangle className="h-4 w-4" />
                <span className="font-bold">
                  {result.riskType === 'overpayment' ? "Bitributação Identificada (Pagamento a MAIOR)" : "Risco de Malha Fina (Pagamento a MENOR)"}
                </span>
                <span className="opacity-80">
                  {result.riskType === 'overpayment' 
                    ? "- Produto com ST na compra está sendo tributado novamente na venda." 
                    : "- Produto informado como ST sem ter o direito creditório da compra."}
                </span>
              </div>
            )}

            {/* Métricas */}
            <div className="flex flex-wrap bg-muted/10 border-b border-border py-2 px-1">
              <MetricItem label="Custo Total Base" value={formatCurrency(comTotalBaseCost)} />
              <MetricItem label="Custo Unid. Int." value={formatCurrency(unitTotalBaseCost)} />
              <MetricItem label="Venda Mín. Unid. Int." value={formatCurrency(calculated.minSellingPricePerInnerUnit)} className="text-yellow-500" />
              <MetricItem label="Venda Sug. Unid. Int." value={formatCurrency(unitSelling)} className="text-primary" />
              <MetricItem label="Venda Sug. Com." value={formatCurrency(calculated.sellingPrice)} className="text-primary" />
              <MetricItem label="Imposto Líq. Com." value={formatCurrency(calculated.taxToPay)} className="text-destructive" />
            </div>

            {/* Correção Sugerida */}
            <div className="p-4 bg-card border-b border-border">
              <div className="text-[10px] font-bold text-primary uppercase mb-3 flex items-center gap-2">
                <ShieldCheck className="h-3 w-3" /> Correção Sugerida p/ Cadastro
              </div>
              <div className="flex flex-wrap gap-4">
                <TaxBox label="CSOSN / CST ICMS" value={calculated.suggestedCodes.icmsCstOrCsosn} />
                <TaxBox label="CST PIS/COFINS" value={calculated.suggestedCodes.pisCofinsCst} />
                <TaxBox label="CFOP Venda" value={calculated.suggestedCodes.icmsCstOrCsosn === '500' ? '5405' : '5102'} />
                <TaxBox label="NCM" value={calculated.ncm || '---'} />
                <TaxBox label="CEST" value={calculated.cest || '---'} />
                <TaxBox label="Classe IBS/CBS" value={calculated.cClassTrib || '1'} />
                <TaxBox label="Origem" value="0" />
              </div>
            </div>

            {/* Matemática */}
            <div className="px-4 bg-success/5 border-b border-border">
              <MathBlock 
                label="Cálculo Comercial (UN)"
                icon={Package}
                values={[
                  { label: "Venda", val: calculated.sellingPrice, color: "text-primary font-bold" },
                  { label: "Custo Base", val: comTotalBaseCost },
                  { label: "Lucro Bruto", val: comGrossProfit, color: "text-blue-500 font-bold", isResult: true },
                  { label: "Imposto", val: calculated.taxToPay, color: "text-destructive font-bold" },
                  { label: "Variáveis", val: calculated.valueForVariableExpenses, color: "text-destructive font-bold" },
                  { label: "Líquido", val: comNetProfit, color: "text-success font-extrabold", isResult: true }
                ]}
              />
              <MathBlock 
                label="Cálculo Unitário (Varejo)"
                icon={Calculator}
                values={[
                  { label: "Venda Unid.", val: unitSelling, color: "text-primary font-bold" },
                  { label: "Custo Base", val: unitTotalBaseCost },
                  { label: "Lucro Bruto", val: unitGrossProfit, color: "text-blue-500 font-bold", isResult: true },
                  { label: "Imposto", val: unitTax, color: "text-destructive font-bold" },
                  { label: "Variáveis", val: unitVarExp, color: "text-destructive font-bold" },
                  { label: "Líquido", val: unitNetProfit, color: "text-success font-extrabold", isResult: true }
                ]}
              />
            </div>

            {/* Info Reforma */}
            {result.classification && (
              <div className="p-3 bg-muted/20">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Info className="h-3 w-3 text-primary" />
                  <span className="font-bold text-foreground">Reforma Tributária (IBS/CBS):</span>
                  {result.classification.cClass.name}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  if (!params) return <div className="p-8 text-center">Configure os parâmetros na página inicial primeiro.</div>;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          Auditoria Fiscal de Vendas
        </h1>
      </div>

      <Tabs defaultValue="divergent" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="divergent" className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            Divergentes ({divergentItems.length})
          </TabsTrigger>
          <TabsTrigger value="ok" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Corretos ({okItems.length})
          </TabsTrigger>
          <TabsTrigger value="unassociated" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            Sem Vínculo ({unassociatedItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="divergent"><AuditList items={divergentItems} /></TabsContent>
        <TabsContent value="ok"><AuditList items={okItems} /></TabsContent>
        <TabsContent value="unassociated"><AuditList items={unassociatedItems} /></TabsContent>
      </Tabs>
    </div>
  );
};

// Componente Badge local simples
const Badge = ({ children, variant, className }: { children: React.ReactNode, variant: 'destructive' | 'success' | 'outline', className?: string }) => (
  <span className={cn(
    "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase",
    variant === 'destructive' ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success",
    className
  )}>
    {children}
  </span>
);

export default Audit;