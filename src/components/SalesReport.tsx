import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from 'lucide-react';
import { CalculatedProduct } from '@/types/pricing';
import { ProductTaxDetails } from './ProductTaxDetails';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generateSalesReportPdf } from '@/lib/pdfGenerator';

interface SalesReportProps {
  products: CalculatedProduct[];
}

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const formatPercent = (value: number) => new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100);

const MetricItem: React.FC<{ label: string; value: string | number; className?: string }> = ({ label, value, className }) => (
  <div className="flex flex-col">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={cn("font-mono font-semibold", className)}>{value}</span>
  </div>
);

export const SalesReport: React.FC<SalesReportProps> = ({ products }) => {
  if (!products || products.length === 0) {
    return (
      <div className="text-center p-8">
        <p>Nenhum produto selecionado para o relatório.</p>
      </div>
    );
  }

  return (
    <Card className="shadow-none border-none">
      <CardHeader className="flex-row items-center justify-between sticky top-0 bg-background z-10">
        <CardTitle>Relatório para Venda</CardTitle>
        <Button variant="outline" size="sm" onClick={() => generateSalesReportPdf(products)}>
          <Printer className="h-4 w-4 mr-2" />
          Gerar PDF
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {products.map((product) => {
            const fixedCostPerCommercialUnit = (product.valueForFixedCost / product.quantity) || 0;
            const productProfit = product.sellingPrice - product.cost - product.taxToPay - product.valueForVariableExpenses - fixedCostPerCommercialUnit;
            const productProfitMargin = product.sellingPrice > 0 ? (productProfit / product.sellingPrice) * 100 : 0;

            return (
              <div key={product.code} className="border border-border rounded-lg p-4 break-inside-avoid">
                <h3 className="font-bold text-lg mb-2">{product.name} ({product.code})</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-3 rounded-md bg-muted/50 mb-6">
                  <MetricItem label="Unid. Com." value={product.unit} />
                  <MetricItem label="Qtd. Estoque" value={product.quantity} />
                  <MetricItem label="Custo Aquisição" value={formatCurrency(product.cost)} />
                  <MetricItem label="Custo Fixo Rateado" value={formatCurrency(fixedCostPerCommercialUnit)} />
                  <MetricItem label="Custo Base Total" value={formatCurrency(product.cost + fixedCostPerCommercialUnit)} className="text-primary" />
                  <MetricItem label="Markup %" value={formatPercent(product.markupPercentage)} className="text-accent" />
                  <MetricItem label="Qtd. Interna" value={product.innerQuantity} />
                  <MetricItem label="Custo Unid. Int." value={formatCurrency(product.costPerInnerUnit)} />
                  <MetricItem label="Venda Mín. Unid. Int." value={formatCurrency(product.minSellingPricePerInnerUnit)} className="text-yellow-500" />
                  <MetricItem label="Venda Sug. Unid. Int." value={formatCurrency(product.sellingPricePerInnerUnit)} className="text-primary" />
                  <MetricItem label="Venda Mín. Com." value={formatCurrency(product.minSellingPrice)} className="text-yellow-500 font-bold" />
                  <MetricItem label="Venda Sug. Com." value={formatCurrency(product.sellingPrice)} className="text-primary font-bold" />
                  <MetricItem label="Imposto Líquido" value={formatCurrency(product.taxToPay)} className="text-destructive" />
                  <MetricItem label="Margem Lucro %" value={formatPercent(productProfitMargin)} className="text-success" />
                  <MetricItem label="Crédito Cliente" value={formatCurrency(product.ivaCreditForClient)} className="text-green-400" />
                </div>

                <ProductTaxDetails product={product} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};