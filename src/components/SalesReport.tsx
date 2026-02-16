import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, FileDown, Eye } from 'lucide-react';
import { CalculatedProduct } from '@/types/pricing';
import { ProductTaxDetails } from './ProductTaxDetails';
import { cn } from '@/lib/utils';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { SalesReportPDF } from './SalesReportPDF';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

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
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // Recupera dados da empresa configurados
  const companyName = localStorage.getItem('jota-razaoSocial') || 'Sua Empresa';
  const accountantName = localStorage.getItem('jota-contador-nome') || '';
  const accountantCrc = localStorage.getItem('jota-contador-crc') || '';

  if (!products || products.length === 0) {
    return (
      <div className="text-center p-8">
        <p>Nenhum produto selecionado para o relatório.</p>
      </div>
    );
  }

  return (
    <Card className="shadow-none border-none">
      <CardHeader className="flex-row items-center justify-between sticky top-0 bg-background z-10 py-4 border-b border-border">
        <CardTitle className="text-xl">Relatório Gerencial de Venda</CardTitle>
        <div className="flex gap-2">
          {/* Botão de Visualizar PDF */}
          <Dialog open={showPdfPreview} onOpenChange={setShowPdfPreview}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Visualizar PDF
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col">
              <div className="flex-1 w-full bg-slate-100 rounded-md overflow-hidden">
                <PDFViewer width="100%" height="100%" className="border-none">
                  <SalesReportPDF 
                    products={products}
                    companyName={companyName}
                    accountantName={accountantName}
                    accountantCrc={accountantCrc}
                  />
                </PDFViewer>
              </div>
              <div className="p-4 bg-white border-t flex justify-end">
                <Button variant="outline" onClick={() => setShowPdfPreview(false)}>Fechar</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Botão de Download Direto */}
          <PDFDownloadLink
            document={
              <SalesReportPDF 
                products={products}
                companyName={companyName}
                accountantName={accountantName}
                accountantCrc={accountantCrc}
              />
            }
            fileName={`relatorio_precificacao_${new Date().toISOString().split('T')[0]}.pdf`}
          >
            {({ loading }) => (
              <Button size="sm" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <FileDown className="h-4 w-4 mr-2" />
                {loading ? 'Gerando...' : 'Baixar PDF Oficial'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-8">
          {products.map((product) => {
            const fixedCostPerCommercialUnit = (product.valueForFixedCost / product.quantity) || 0;
            const productProfit = product.sellingPrice - product.cost - product.taxToPay - product.valueForVariableExpenses - fixedCostPerCommercialUnit;
            const productProfitMargin = product.sellingPrice > 0 ? (productProfit / product.sellingPrice) * 100 : 0;

            return (
              <div key={product.code} className="border border-border rounded-lg p-4 break-inside-avoid shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-primary">{product.name}</h3>
                    <p className="text-sm text-muted-foreground font-mono">Cód: {product.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Venda Sugerida</p>
                    <p className="text-xl font-extrabold text-primary">{formatCurrency(product.sellingPrice)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-3 rounded-md bg-muted/30 mb-6 border border-border/50">
                  <MetricItem label="Unid. Com." value={product.unit} />
                  <MetricItem label="Qtd. Estoque" value={product.quantity} />
                  <MetricItem label="Custo Aquisição" value={formatCurrency(product.cost)} />
                  <MetricItem label="Custo Fixo Rateado" value={formatCurrency(fixedCostPerCommercialUnit)} />
                  <MetricItem label="Custo Base Total" value={formatCurrency(product.cost + fixedCostPerCommercialUnit)} className="text-foreground" />
                  <MetricItem label="Markup %" value={formatPercent(product.markupPercentage)} className="text-accent" />
                  <MetricItem label="Qtd. Interna" value={product.innerQuantity} />
                  <MetricItem label="Custo Unid. Int." value={formatCurrency(product.costPerInnerUnit)} />
                  <MetricItem label="Venda Mín. Unid. Int." value={formatCurrency(product.minSellingPricePerInnerUnit)} className="text-yellow-600" />
                  <MetricItem label="Venda Sug. Unid. Int." value={formatCurrency(product.sellingPricePerInnerUnit)} className="text-primary" />
                  <MetricItem label="Venda Mín. Com." value={formatCurrency(product.minSellingPrice)} className="text-yellow-600 font-bold" />
                  <MetricItem label="Venda Sug. Com." value={formatCurrency(product.sellingPrice)} className="text-primary font-bold" />
                  <MetricItem label="Imposto Líquido" value={formatCurrency(product.taxToPay)} className="text-destructive" />
                  <MetricItem label="Margem Lucro %" value={formatPercent(productProfitMargin)} className="text-success" />
                  <MetricItem label="Crédito Cliente" value={formatCurrency(product.ivaCreditForClient)} className="text-green-600" />
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