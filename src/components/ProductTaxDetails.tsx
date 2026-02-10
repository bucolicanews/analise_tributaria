import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalculatedProduct } from "@/types/pricing";
import { FileText } from 'lucide-react';

interface ProductTaxDetailsProps {
  product: CalculatedProduct;
}

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const formatPercent = (value: number) => `${value.toFixed(2)}%`;

const DetailRow = ({ label, value, isBadge = false }: { label: string; value?: string | number; isBadge?: boolean }) => {
  if (value === undefined || value === null || value === '') return null;
  
  let displayValue = value;
  if (typeof value === 'number') {
    // Simple heuristic to decide formatting
    if (label.toLowerCase().includes('alíquota')) {
      displayValue = formatPercent(value);
    } else if (label.toLowerCase().includes('base') || label.toLowerCase().includes('valor')) {
      displayValue = formatCurrency(value);
    }
  }

  return (
    <div className="flex justify-between py-1 border-b border-border/50">
      <span className="text-muted-foreground">{label}:</span>
      {isBadge ? <Badge variant="outline">{displayValue}</Badge> : <span className="font-mono">{displayValue}</span>}
    </div>
  );
};

export const ProductTaxDetails = ({ product }: ProductTaxDetailsProps) => {
  return (
    <Card className="shadow-none border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Detalhes Tributários do Produto
        </CardTitle>
        <p className="text-sm text-muted-foreground pt-1">{product.name} ({product.code})</p>
      </CardHeader>
      <CardContent className="text-sm space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Geral</h3>
          <DetailRow label="CFOP" value={product.cfop} isBadge />
          <DetailRow label="NCM" value={product.ncm} />
          <DetailRow label="CEST" value={product.cest} />
        </div>
        <div>
          <h3 className="font-semibold mb-2">ICMS</h3>
          <DetailRow label="CST/CSOSN" value={product.cst} isBadge />
        </div>
        <div>
          <h3 className="font-semibold mb-2">PIS</h3>
          <DetailRow label="CST" value={product.pisCst} isBadge />
          <DetailRow label="Base de Cálculo" value={product.pisBase} />
          <DetailRow label="Alíquota" value={product.pisRate} />
          <DetailRow label="Valor (Crédito)" value={product.pisCredit} />
        </div>
        <div>
          <h3 className="font-semibold mb-2">COFINS</h3>
          <DetailRow label="CST" value={product.cofinsCst} isBadge />
          <DetailRow label="Base de Cálculo" value={product.cofinsBase} />
          <DetailRow label="Alíquota" value={product.cofinsRate} />
          <DetailRow label="Valor (Crédito)" value={product.cofinsCredit} />
        </div>
        <div>
          <h3 className="font-semibold mb-2">IPI</h3>
          <DetailRow label="CST" value={product.ipiCst} isBadge />
        </div>
      </CardContent>
    </Card>
  );
};