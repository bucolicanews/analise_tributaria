import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, ShoppingCart, Search, FileWarning, XCircle, AlertTriangle, ArrowRight, Info } from 'lucide-react';
import { Product } from "@/types/pricing";

const Audit = () => {
  const purchaseProducts: Product[] = JSON.parse(sessionStorage.getItem('jota-calc-purchase-products') || '[]');
  const salesProducts: Product[] = JSON.parse(sessionStorage.getItem('jota-calc-sales-products') || '[]');

  const processedResults = useMemo(() => {
    return salesProducts.map(sale => {
      const purchase = purchaseProducts.find(p => p.code === sale.code);
      const discrepancies: string[] = [];
      
      let riskType: 'overpayment' | 'underpayment' | 'generic' | 'none' = 'none';
      let suggestedFix = {
        ncm: purchase?.ncm || sale.ncm,
        csosn: '102',
        cfop: '5102',
        ean: purchase?.ean || sale.ean || '---'
      };

      if (purchase) {
        if (purchase.ncm !== sale.ncm) discrepancies.push('NCM');
        if (purchase.cst !== sale.cst) discrepancies.push('CST/CSOSN');

        // Lógica de Pagamento a MAIS (Bitributação)
        const purchaseIsST = ['10', '30', '60', '70', '201', '202', '203', '500'].includes(purchase.cst || "");
        const saleIsTributado = ['101', '102', '00', '20'].includes(sale.cst || "");
        
        if (purchaseIsST && saleIsTributado) {
          riskType = 'overpayment';
          suggestedFix.csosn = '500';
          suggestedFix.cfop = '5405';
        } 
        // Lógica de Pagamento a MENOR (Sonegação Involuntária/Risco)
        else if (!purchaseIsST && sale.cst === '500') {
          riskType = 'underpayment';
          suggestedFix.csosn = '102';
          suggestedFix.cfop = '5102';
        }
        else if (discrepancies.length > 0) {
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

  const AuditTable = ({ items }: { items: typeof processedResults }) => (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[200px]">Dados de Venda</TableHead>
            <TableHead>Confronto (Venda vs Compra)</TableHead>
            <TableHead>Análise de Risco</TableHead>
            <TableHead className="w-[250px] bg-primary/5">Correção Sugerida (Cadastro)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((result, idx) => (
            <TableRow key={idx} className="align-top">
              <TableCell>
                <div className="font-bold text-sm">{result.sale.name}</div>
                <div className="text-xs text-muted-foreground font-mono mt-1">Cód: {result.sale.code}</div>
                <div className="text-xs text-muted-foreground font-mono">EAN: {result.sale.ean || '---'}</div>
              </TableCell>
              
              <TableCell>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="text-muted-foreground">NCM:</span>
                    <span className="font-mono">
                      <span className={result.discrepancies.includes('NCM') ? "text-destructive font-bold underline" : ""}>{result.sale.ncm}</span>
                      <span className="mx-1">/</span>
                      <span className="text-muted-foreground">{result.purchase?.ncm || '---'}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-1">
                    <span className="text-muted-foreground">CST/CSOSN:</span>
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
                  <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30 text-xs text-blue-500">
                    <div className="font-bold flex items-center gap-1 mb-1"><Info className="h-3 w-3" /> Pagamento a MAIOR</div>
                    Você está pagando ICMS em duplicidade. A compra já veio com ST (CST {result.purchase?.cst}), mas você está tributando na venda.
                  </div>
                )}
                {result.riskType === 'underpayment' && (
                  <div className="p-2 rounded bg-destructive/10 border border-destructive/30 text-xs text-destructive">
                    <div className="font-bold flex items-center gap-1 mb-1"><AlertTriangle className="h-3 w-3" /> Pagamento a MENOR</div>
                    Risco de Multa! Você informou ST na venda, mas a compra foi tributada integralmente. Você não está pagando o ICMS devido.
                  </div>
                )}
                {result.riskType === 'generic' && (
                  <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-600">
                    <div className="font-bold mb-1">Divergência de Cadastro</div>
                    Os dados do XML de compra não batem com o seu sistema de venda.
                  </div>
                )}
                {result.status === 'ok' && (
                  <div className="text-xs text-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Cadastro Consistente</div>
                )}
                {result.status === 'unassociated' && (
                  <div className="text-xs text-muted-foreground italic">Sem nota de compra para confrontar.</div>
                )}
              </TableCell>

              <TableCell className="bg-primary/5">
                <div className="space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between"><span className="text-muted-foreground">NCM:</span> <span className="font-bold text-primary">{result.suggestedFix.ncm}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">CSOSN:</span> <span className="font-bold text-primary">{result.suggestedFix.csosn}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">CFOP:</span> <span className="font-bold text-primary">{result.suggestedFix.cfop}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">EAN:</span> <span>{result.suggestedFix.ean}</span></div>
                </div>
                <div className="mt-2 pt-2 border-t border-primary/20 text-[10px] text-primary/70 italic">
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
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <AlertCircle className="h-8 w-8 text-primary" />
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
            <FileWarning className="h-4 w-4 text-yellow-500" />
            Não Associados ({unassociatedItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="divergent"><Card><CardContent className="pt-6"><AuditTable items={divergentItems} /></CardContent></Card></TabsContent>
        <TabsContent value="ok"><Card><CardContent className="pt-6"><AuditTable items={okItems} /></CardContent></Card></TabsContent>
        <TabsContent value="unassociated"><Card><CardContent className="pt-6"><AuditTable items={unassociatedItems} /></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
};

export default Audit;