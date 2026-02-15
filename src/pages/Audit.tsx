import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, ShoppingCart, Search, FileWarning, XCircle } from 'lucide-react';
import { Product } from "@/types/pricing";

const Audit = () => {
  const purchaseProducts: Product[] = JSON.parse(sessionStorage.getItem('jota-calc-purchase-products') || '[]');
  const salesProducts: Product[] = JSON.parse(sessionStorage.getItem('jota-calc-sales-products') || '[]');

  const processedResults = useMemo(() => {
    return salesProducts.map(sale => {
      const purchase = purchaseProducts.find(p => p.code === sale.code);
      const discrepancies: string[] = [];
      
      if (purchase) {
        if (purchase.ncm !== sale.ncm) discrepancies.push('NCM');
        if (purchase.cst !== sale.cst) discrepancies.push('CST/CSOSN');
      }

      const status = !purchase 
        ? 'unassociated' 
        : discrepancies.length > 0 
          ? 'divergent' 
          : 'ok';

      return { sale, purchase, discrepancies, status };
    });
  }, [purchaseProducts, salesProducts]);

  const divergentItems = processedResults.filter(r => r.status === 'divergent');
  const okItems = processedResults.filter(r => r.status === 'ok');
  const unassociatedItems = processedResults.filter(r => r.status === 'unassociated');

  if (salesProducts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <Search className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
          <h2 className="text-2xl font-bold">Nenhum dado de venda para auditar</h2>
          <p className="text-muted-foreground">Importe suas notas de venda na página inicial para começar a auditoria.</p>
        </div>
      </div>
    );
  }

  const AuditTable = ({ items }: { items: typeof processedResults }) => (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto (Venda)</TableHead>
            <TableHead>NCM (Venda/Compra)</TableHead>
            <TableHead>CST (Venda/Compra)</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                Nenhum item nesta categoria.
              </TableCell>
            </TableRow>
          ) : (
            items.map((result, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <div className="font-medium">{result.sale.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">Cód: {result.sale.code}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={result.discrepancies.includes('NCM') ? "text-destructive font-bold" : ""}>
                      {result.sale.ncm || '---'}
                    </span>
                    {result.purchase && (
                      <>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-muted-foreground text-xs">{result.purchase.ncm || '---'}</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={result.discrepancies.includes('CST/CSOSN') ? "text-destructive font-bold" : ""}>
                      {result.sale.cst || '---'}
                    </span>
                    {result.purchase && (
                      <>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-muted-foreground text-xs">{result.purchase.cst || '---'}</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {result.status === 'unassociated' && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                      <FileWarning className="h-3 w-3 mr-1" /> Não encontrado
                    </Badge>
                  )}
                  {result.status === 'divergent' && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" /> Divergência
                    </Badge>
                  )}
                  {result.status === 'ok' && (
                    <Badge variant="outline" className="text-success border-success/30 bg-success/10">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Correto
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <AlertCircle className="h-8 w-8 text-primary" />
        Auditoria Fiscal de Vendas
      </h1>

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

        <TabsContent value="divergent">
          <Card className="shadow-elegant border-destructive/20">
            <CardHeader>
              <CardTitle className="text-lg">Itens com Divergência Fiscal</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditTable items={divergentItems} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ok">
          <Card className="shadow-elegant border-success/20">
            <CardHeader>
              <CardTitle className="text-lg">Itens em Conformidade</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditTable items={okItems} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unassociated">
          <Card className="shadow-elegant border-yellow-500/20">
            <CardHeader>
              <CardTitle className="text-lg">Produtos Vendidos sem Nota de Compra Correspondente</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditTable items={unassociatedItems} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Audit;