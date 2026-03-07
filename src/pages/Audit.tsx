"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertCircle, CheckCircle2, Info, XCircle, AlertTriangle, ShieldCheck, Package, Calculator,
  TrendingUp, TrendingDown, Check, ArrowRightLeft, Printer, FileDown, Loader2
} from 'lucide-react';
import { Product, CalculationParams, TaxRegime } from "@/types/pricing";
import { calculatePricing } from '@/lib/pricing';
import { getClassificationDetails } from '@/lib/tax/taxClassificationService';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { AuditReportPDF } from '@/components/AuditReportPDF';

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const MetricItem = ({ label, value, className }: { label: string; value: string; className?: string }) => (
  <div className="flex flex-col border-r border-border last:border-r-0 px-3 py-1 min-w-[100px]">
    <span className="text-[10px] text-muted-foreground uppercase font-semibold">{label}</span>
    <span className={cn("text-xs font-mono font-bold", className)}>{value}</span>
  </div>
);

const TaxBox = ({ label, value, variant = 'suggested' }: { label: string; value: string | React.ReactNode, variant?: 'current' | 'suggested' }) => (
  <div className="space-y-1 flex-1 min-w-[120px]">
    <div className="text-[9px] font-bold text-muted-foreground uppercase truncate text-center">{label}</div>
    <div className={cn(
      "text-xs font-mono font-bold p-2 rounded border text-center",
      variant === 'suggested' 
        ? "text-primary bg-primary/5 border-primary/20" 
        : "text-muted-foreground bg-muted/50 border-border"
    )}>
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
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [isPdfViewerMounted, setIsPdfViewerMounted] = useState(false);
  
  const purchaseProducts: Product[] = JSON.parse(sessionStorage.getItem('jota-calc-purchase-products') || '[]');
  const salesProducts: Product[] = JSON.parse(sessionStorage.getItem('jota-calc-sales-products') || '[]');
  const params: CalculationParams | null = JSON.parse(sessionStorage.getItem('jota-calc-params') || 'null');

  const companyName = localStorage.getItem('jota-razaoSocial') || 'Sua Empresa';
  const accountantName = localStorage.getItem('jota-contador-nome') || '';
  const accountantCrc = localStorage.getItem('jota-contador-crc') || '';

  const handlePdfOpenChange = (open: boolean) => {
    if (open) {
      setIsPdfOpen(true);
      setTimeout(() => setIsPdfViewerMounted(true), 100);
    } else {
      setIsPdfViewerMounted(false);
      setTimeout(() => setIsPdfOpen(false), 300);
    }
  };

  const auditResults = useMemo(() => {
    if (!params) return [];

    const totalFixedCosts = params.fixedCostsTotal || 0;
    const cfu = params.totalStockUnits > 0 ? totalFixedCosts / params.totalStockUnits : 0;

    return salesProducts.map(sale => {
      const purchase = purchaseProducts.find(p => p.code === sale.code);
      const discrepancies: string[] = [];
      
      let riskType: 'overpayment' | 'underpayment' | 'generic' | 'none' = 'none';
      
      const baseProduct = purchase || sale;
      const calculated = calculatePricing(baseProduct, params, cfu);
      const classification = calculated.cClassTrib ? getClassificationDetails(calculated.cClassTrib) : null;

      if (purchase) {
        if (purchase.ncm !== sale.ncm) discrepancies.push('NCM');
        if (purchase.cst !== sale.cst) discrepancies.push('CST/CSOSN');
        
        const isST = ['10', '30', '60', '70', '201', '202', '203', '500'].includes(purchase.cst || "");
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
        cfu
      };
    });
  }, [purchaseProducts, salesProducts, params]);

  const divergentItems = auditResults.filter(r => r.status === 'divergent');
  const okItems = auditResults.filter(r => r.status === 'ok');
  const unassociatedItems = auditResults.filter(r => r.status === 'unassociated');

  if (!params || purchaseProducts.length === 0 || salesProducts.length === 0) {
    let title = "Dados Insuficientes";
    let message = "Para realizar a auditoria, primeiro importe as notas de compra, as notas de venda e configure os parâmetros na página de Precificação.";
    let Icon = Calculator;

    if (params && purchaseProducts.length > 0 && salesProducts.length === 0) {
      title = "Nenhuma Nota de Venda Carregada";
      message = "Importe as notas fiscais de venda na página de Precificação para que a auditoria possa ser realizada.";
      Icon = Package;
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-card">
          <div className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Icon className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground max-w-md">
              {message} <a href="/" className="text-primary underline">Voltar para Precificação</a>.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const AuditList = ({ items }: { items: typeof auditResults }) => (
    <div className="space-y-6">
      {items.map((result, idx) => {
        const { calculated, cfu, classification } = result;
        
        const cstFormat = classification?.cst?.code?.toString().padStart(2, '0') || '00';
        const classFormat = calculated.cClassTrib?.toString().padStart(6, '0') || '000001';

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
        const unitVarExp = (calculated.valueForVariableExpenses / (calculated.quantity || 1)) / innerQty;
        const unitNetProfit = unitGrossProfit - unitTax - unitVarExp;

        return (
          <div key={idx} className="rounded-lg border border-border overflow-hidden shadow-sm bg-card animate-in fade-in slide-in-from-bottom-2 duration-300">
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

            {result.riskType !== 'none' && (
              <div className={cn(
                "px-4 py-3 border-b text-xs flex items-center gap-3",
                result.riskType === 'overpayment' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : 
                result.riskType === 'underpayment' ? "bg-destructive/10 text-destructive border-destructive/20" :
                "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
              )}>
                <div className="shrink-0">
                  {result.riskType === 'overpayment' ? <TrendingUp className="h-5 w-5" /> : 
                   result.riskType === 'underpayment' ? <TrendingDown className="h-5 w-5" /> :
                   <AlertTriangle className="h-5 w-5" />}
                </div>
                <div className="space-y-0.5">
                  <div className="font-bold uppercase tracking-tight">
                    {result.riskType === 'overpayment' ? "Ineficiência Fiscal: Bitributação (Pagamento a MAIOR)" : 
                     result.riskType === 'underpayment' ? "Inconformidade Fiscal: Risco de Passivo (Pagamento a MENOR)" :
                     "Divergência Cadastral Identificada"}
                  </div>
                  <div className="opacity-90 leading-normal">
                    {result.riskType === 'overpayment' ? 
                      "O produto teve o ICMS retido por Substituição Tributária (ST) na entrada, mas está sendo tributado novamente no seu cadastro de venda." : 
                     result.riskType === 'underpayment' ? 
                      "O item está sendo vendido com segregação de ST/Monofásico, porém a nota de entrada indica que ele é tributado integralmente." :
                      "Existem códigos (NCM ou CST) na venda que não condizem com a Nota de Entrada do fornecedor."}
                  </div>
                </div>
              </div>
            )}

            {result.status === 'ok' && (
              <div className="px-4 py-2 border-b bg-success/10 text-success text-xs flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span className="font-bold uppercase">Conformidade Tributária Identificada</span>
                <span className="opacity-80">- Cadastro alinhado com a entrada fiscal.</span>
              </div>
            )}

            <div className="flex flex-wrap bg-muted/10 border-b border-border py-2 px-1">
              <MetricItem label="Custo Total Base" value={formatCurrency(comTotalBaseCost)} />
              <MetricItem label="Custo Unid. Int." value={formatCurrency(unitTotalBaseCost)} />
              <MetricItem label="Venda Mín. Unid. Int." value={formatCurrency(calculated.minSellingPricePerInnerUnit)} className="text-yellow-500" />
              <MetricItem label="Venda Sug. Unid. Int." value={formatCurrency(unitSelling)} className="text-primary" />
              <MetricItem label="Venda Sug. Com." value={formatCurrency(calculated.sellingPrice)} className="text-primary" />
              <MetricItem label="Imposto Líq. Com." value={formatCurrency(calculated.taxToPay)} className="text-destructive" />
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-3">
                <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <XCircle className="h-3 w-3" /> Situação Atual (Extraída da Venda)
                </div>
                <div className="flex flex-wrap gap-4 opacity-70">
                  <TaxBox variant="current" label="CSOSN / CST ICMS" value={result.sale.cst || '---'} />
                  <TaxBox variant="current" label="CST PIS/COFINS" value={result.sale.pisCst || '---'} />
                  <TaxBox variant="current" label="CFOP Venda" value={result.sale.cfop || '---'} />
                  <TaxBox variant="current" label="NCM" value={result.sale.ncm || '---'} />
                  <TaxBox variant="current" label="CEST" value={result.sale.cest || '---'} />
                  <TaxBox variant="current" label="CST / cClassTrib" value="--- / ---" />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border/50">
                <div className="text-[10px] font-bold text-primary uppercase flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3" /> Sugestão p/ Correção (Baseada na Compra)
                </div>
                <div className="flex flex-wrap gap-4">
                  <TaxBox label="CSOSN / CST ICMS" value={calculated.suggestedCodes.icmsCstOrCsosn} />
                  <TaxBox label="CST PIS/COFINS" value={calculated.suggestedCodes.pisCofinsCst} />
                  <TaxBox label="CFOP Venda" value={calculated.suggestedCodes.icmsCstOrCsosn === '500' ? '5405' : '5102'} />
                  <TaxBox label="NCM" value={calculated.ncm || '---'} />
                  <TaxBox label="CEST" value={calculated.cest || '---'} />
                  <TaxBox label="CST / cClassTrib (Ref.)" value={<span><span className="opacity-50">{cstFormat}</span> / {classFormat}</span>} />
                </div>
              </div>
            </div>

            <div className="px-4 bg-success/5 border-b border-border border-t">
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
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          Auditoria Fiscal de Vendas
        </h1>
        <div className="flex gap-2">
          <Dialog open={isPdfOpen} onOpenChange={handlePdfOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Printer className="h-4 w-4 mr-2" />Visualizar PDF</Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col gap-0">
              <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                <DialogHeader>
                  <DialogTitle>Visualizar Relatório de Auditoria</DialogTitle>
                  <DialogDescription className="sr-only">Pré-visualização do relatório de auditoria fiscal em formato PDF.</DialogDescription>
                </DialogHeader>
                <Button variant="outline" size="sm" onClick={() => handlePdfOpenChange(false)}>Fechar</Button>
              </div>
              <div className="flex-1 w-full bg-slate-100 overflow-hidden">
                {isPdfViewerMounted ? (
                  <PDFViewer width="100%" height="100%" className="border-none w-full h-full">
                    <AuditReportPDF 
                      divergentItems={divergentItems}
                      okItems={okItems}
                      unassociatedItems={unassociatedItems}
                      companyName={companyName}
                      accountantName={accountantName}
                      accountantCrc={accountantCrc}
                    />
                  </PDFViewer>
                ) : (
                  <div className="flex h-full items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <p className="text-sm">Carregando visualização...</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <PDFDownloadLink
            document={
              <AuditReportPDF 
                divergentItems={divergentItems}
                okItems={okItems}
                unassociatedItems={unassociatedItems}
                companyName={companyName}
                accountantName={accountantName}
                accountantCrc={accountantCrc}
              />
            }
            fileName={`relatorio_auditoria_${new Date().toISOString().split('T')[0]}.pdf`}
          >
            {({ loading }) => (
              <Button size="sm" disabled={loading}><FileDown className="h-4 w-4 mr-2" />{loading ? 'Gerando...' : 'Baixar PDF'}</Button>
            )}
          </PDFDownloadLink>
        </div>
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