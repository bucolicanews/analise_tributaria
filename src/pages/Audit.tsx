"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Info, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Product } from "@/types/pricing";
import { findCClassByNcm } from '@/lib/tax/taxClassificationService';

const Audit = () => {
  const purchaseProducts: Product[] = JSON.parse(sessionStorage.getItem('jota-calc-purchase-products') || '[]');
  const salesProducts: Product[] = JSON.parse(sessionStorage.getItem('jota-calc-sales-products') || '[]');

  const processedResults = useMemo(() => {
    return salesProducts.map(sale => {
      const purchase = purchaseProducts.find(p => p.code === sale.code);
      const discrepancies: string[] = [];
      
      let riskType: 'overpayment' | 'underpayment' | 'generic' | 'none' = 'none';
      
      // Lógica de sugestão de códigos
      const ncm = purchase?.ncm || sale.ncm || '';
      const cstPurchase = purchase?.cst || '';
      const isST = ['10', '30', '60', '70', '201', '202', '203', '500'].includes(cstPurchase);
      const isMonofasico = ['04', '05', '06'].includes(purchase?.pisCst || '');

      let suggestedFix = {
        ncm: ncm,
        csosn: isST ? '500' : '102',
        cfop: isST ? '5405' : '5102',
        cstPisCofins: isMonofasico ? '04' : '01',
        cest: purchase?.cest || sale.cest || '---',
        cClass: findCClassByNcm(ncm) || 1,
        origem: '0',
        ean: purchase?.ean || sale.ean || '---'
      };

      if (purchase) {
        if (purchase.ncm !== sale.ncm) discrepancies.push('NCM');
        if (purchase.cst !== sale.cst) discrepancies.push('CST/CSOSN');

        const saleIsTributado = ['101', '102', '00', '20'].includes(sale.cst || "");
        
        if (isST && saleIsTributado) {
          riskType = 'overpayment';
        } else if (!isST && sale.cst === '500') {
          riskType = 'underpayment';
        } else if (discrepancies.length > 0) {
          riskType = 'generic';
        }
      }

      const status = !purchase 
        ? 'unassociated' 
        : discrepancies.length > 0 
          ? 'divergent' 
          : 'ok';

      return { sale, purchase, discrepancies, status, riskType, suggestedFix };
    });
  }, [purchaseProducts, salesProducts]);

  const divergentItems = processedResults.filter(r => r.status === 'divergent');
  const okItems = processedResults.filter(r => r.status === 'ok');
  const unassociatedItems = processedResults.filter(r => r.status === 'unassociated');

  const FixRow = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex justify-between border-b border-primary/10 py-0.5">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-bold text-primary">{value}</span>
    </div>
  );

  const AuditTable = ({ items }: { items: typeof processedResults }) => (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[200px]">Dados de Venda</TableHead>
            <TableHead>Confronto (Venda vs Compra)</TableHead>
            <TableHead>Análise de Risco</TableHead>
            <TableHead className="w-[280px] bg-primary/5">Correção Sugerida (Cadastro)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((result, idx) => (
            <TableRow key={idx} className="align-top">
              <TableCell>
                <div className="font-bold text-sm">{result.sale.name}</div>
                <div className="text-[10px] text-muted-foreground font-mono mt-1">Cód: {result.sale.code}</div>
                <div className="text-[10px] text-muted-foreground font-mono">EAN: {result.sale.ean || '---'}</div>
              </TableCell>
              
              <TableCell>
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="text-muted-foreground">NCM (V/C):</span>
                    <span className="font-mono">
                      <span className={result.discrepancies.includes('NCM') ? "text-destructive font-bold underline" : ""}>{result.sale.ncm}</span>
                      <span className="mx-1">/</span>
                      <span className="text-muted-foreground">{result.purchase?.ncm || '---'}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="text-muted-foreground">CST/CSOSN (V/C):</span>
                    <span className="font-mono">
                      <span className={result.discrepancies.includes('CST/CSOSN') ? "text-destructive font-bold underline" : ""}>{result.sale.cst}</span>
                      <span className="mx-1">/</span>
                      <span className="text-muted-foreground">{result.purchase?.cst || '---'}</span>
                    </span>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                {result.riskType === 'overpayment' && (
                  <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30 text-[10px] text-blue-500">
                    <div className="font-bold flex items-center gap-1 mb-1"><Info className="h-3 w-3" /> Pagamento a MAIOR</div>
                    Bitributação Identificada. A compra já veio com ST, mas você está tributando novamente na venda.
                  </div>
                )}
                {result.riskType === 'underpayment' && (
                  <div className="p-2 rounded bg-destructive/10 border border-destructive/30 text-[10px] text-destructive">
                    <div className="font-bold flex items-center gap-1 mb-1"><AlertTriangle className="h-3 w-3" /> Pagamento a MENOR</div>
                    Risco de Malha Fina! Você informou ST na venda sem ter o direito creditório da compra.
                  </div>
                )}
                {result.riskType === 'generic' && (
                  <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/30 text-[10px] text-yellow-600">
                    Divergência de Cadastro entre NF de Entrada e Saída.
                  </div>
                )}
                {result.status === 'ok' && (
                  <div className="text-xs text-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Cadastro OK</div>
                )}
                {result.status === 'unassociated' && (
                  <div className="text-[10px] text-muted-foreground italic">Sem NF de compra vinculada.</div>
                )}
              </TableCell>

              <TableCell className="bg-primary/5">
                <div className="space-y-1 text-[11px] font-mono">
                  <FixRow label="NCM" value={result.suggestedFix.ncm} />
                  <FixRow label="CSOSN / CST ICMS" value={result.suggestedFix.csosn} />
                  <FixRow label="CST PIS/COFINS" value={result.suggestedFix.cstPisCofins} />
                  <FixRow label="CFOP Venda" value={result.suggestedFix.cfop} />
                  <FixRow label="CEST" value={result.suggestedFix.cest} />
                  <FixRow label="Classe IBS/CBS" value={result.suggestedFix.cClass} />
                  <FixRow label="Origem" value={result.suggestedFix.origem} />
                </div>
                <div className="mt-2 pt-2 border-t border-primary/20 text-[9px] text-primary/70 italic text-center">
                  *Atualize seu ERP com estes dados.
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

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

        <TabsContent value="divergent">
          <Card><CardContent className="pt-6">
            <div className="mb-4 text-xs text-muted-foreground">Produtos com divergência entre a Nota de Entrada e o seu cadastro de venda.</div>
            <AuditTable items={divergentItems} />
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="ok">
          <Card><CardContent className="pt-6">
            <div className="mb-4 text-xs text-muted-foreground">Produtos com cadastro consistente com as notas de entrada.</div>
            <AuditTable items={okItems} />
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="unassociated">
          <Card><CardContent className="pt-6">
            <div className="mb-4 text-xs text-muted-foreground">Vendas realizadas sem uma nota de compra correspondente carregada no sistema.</div>
            <AuditTable items={unassociatedItems} />
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Audit;