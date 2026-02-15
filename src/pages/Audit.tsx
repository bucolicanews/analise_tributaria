import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, ShoppingCart, Tag, Search, FileWarning } from 'lucide-react';
import { Product } from "@/types/pricing";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Audit = () => {
  const purchaseProducts: Product[] = JSON.parse(sessionStorage.getItem('jota-calc-purchase-products') || '[]');
  const salesProducts: Product[] = JSON.parse(sessionStorage.getItem('jota-calc-sales-products') || '[]');

  const comparisonResults = useMemo(() => {
    return salesProducts.map(sale => {
      const purchase = purchaseProducts.find(p => p.code === sale.code);
      const discrepancies = [];
      if (purchase) {
        if (purchase.ncm !== sale.ncm) discrepancies.push('NCM');
        if (purchase.cst !== sale.cst) discrepancies.push('CST/CSOSN');
      }
      return { sale, purchase, discrepancies, hasMatch: !!purchase };
    });
  }, [purchaseProducts, salesProducts]);

  const stats = useMemo(() => {
    const total = comparisonResults.length;
    const matches = comparisonResults.filter(r => r.hasMatch).length;
    const errors = comparisonResults.filter(r => r.discrepancies.length > 0).length;
    return { total, matches, errors };
  }, [comparisonResults]);

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

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-3">
        <AlertCircle className="h-8 w-8 text-primary" />
        Auditoria Fiscal de Vendas
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Itens Vendidos</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Localizados na Compra</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold text-success">{stats.matches}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Divergências</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold text-destructive">{stats.errors}</div></CardContent></Card>
      </div>
      <Card className="shadow-elegant">
        <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Confronto de Dados</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto (Venda)</TableHead>
                  <TableHead>NCM (Venda/Compra)</TableHead>
                  <TableHead>CST (Venda/Compra)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonResults.map((result, idx) => (
                  <TableRow key={idx}>
                    <TableCell><div className="font-medium">{result.sale.name}</div><div className="text-xs text-muted-foreground font-mono">Cód: {result.sale.code}</div></TableCell>
                    <TableCell><div className="flex items-center gap-2"><span className={result.discrepancies.includes('NCM') ? "text-destructive font-bold" : ""}>{result.sale.ncm}</span>{result.purchase && <><span className="text-muted-foreground">/</span><span className="text-muted-foreground text-xs">{result.purchase.ncm}</span></>}</div ></TableCell>
                    <TableCell><div className="flex items-center gap-2"><span className={result.discrepancies.includes('CST/CSOSN') ? "text-destructive font-bold" : ""}>{result.sale.cst}</span>{result.purchase && <><span className="text-muted-foreground">/</span><span className="text-muted-foreground text-xs">{result.purchase.cst}</span></>}</div ></TableCell>
                    <TableCell>
                      {!result.hasMatch ? <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50"><FileWarning className="h-3 w-3 mr-1" /> Não encontrado</Badge> : result.discrepancies.length > 0 ? <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Divergência</Badge> : <Badge variant="outline" className="text-success border-success/30 bg-success/10"><CheckCircle2 className="h-3 w-3 mr-1" /> Correto</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Audit;