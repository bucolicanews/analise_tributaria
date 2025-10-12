import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Product, CalculationParams, CalculatedProduct } from "@/types/pricing";
import { calculatePricing } from "@/lib/pricing";

interface ProductsTableProps {
  products: Product[];
  params: CalculationParams;
}

export const ProductsTable = ({ products, params }: ProductsTableProps) => {
  const calculatedProducts: CalculatedProduct[] = products.map((product) =>
    calculatePricing(product, params)
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const totalCost = calculatedProducts.reduce((sum, p) => sum + p.cost, 0);
  const totalSelling = calculatedProducts.reduce((sum, p) => sum + p.sellingPrice, 0);
  const totalTax = calculatedProducts.reduce((sum, p) => sum + p.taxToPay, 0);
  const totalProfit = totalSelling - totalCost - totalTax;

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>CFOP</TableHead>
              <TableHead>CST</TableHead>
              <TableHead className="text-right">Custo</TableHead>
              <TableHead className="text-right">Créd. CBS</TableHead>
              <TableHead className="text-right">Créd. IBS</TableHead>
              <TableHead className="text-right">Déb. CBS</TableHead>
              <TableHead className="text-right">Déb. IBS</TableHead>
              <TableHead className="text-right">Imposto</TableHead>
              <TableHead className="text-right">Venda</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calculatedProducts.map((product, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono text-xs">{product.code}</TableCell>
                <TableCell className="max-w-[200px] truncate">{product.name}</TableCell>
                <TableCell className="font-mono text-xs">{product.cfop}</TableCell>
                <TableCell className="font-mono text-xs">{product.cst}</TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(product.cost)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-success">
                  {formatCurrency(product.cbsCredit)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-success">
                  {formatCurrency(product.ibsCredit)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-destructive">
                  {formatCurrency(product.cbsDebit)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-destructive">
                  {formatCurrency(product.ibsDebit)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold">
                  {formatCurrency(product.taxToPay)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-bold text-primary">
                  {formatCurrency(product.sellingPrice)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Custo Total</p>
          <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Valor de Venda</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalSelling)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Impostos</p>
          <p className="text-2xl font-bold text-destructive">{formatCurrency(totalTax)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Lucro Estimado</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(totalProfit)}</p>
        </div>
      </div>
    </div>
  );
};
