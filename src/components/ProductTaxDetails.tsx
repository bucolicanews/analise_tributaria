import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalculatedProduct } from "@/types/pricing";
import { FileText } from 'lucide-react';

interface ProductTaxDetailsProps {
  product: CalculatedProduct;
}

const DetailRow = ({ label, value, isBadge = false }: { label: string; value?: string; isBadge?: boolean }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between py-1 border-b border-border/50">
      <span className="text-muted-foreground">{label}:</span>
      {isBadge ? <Badge variant="outline">{value}</Badge> : <span className="font-mono">{value}</span>}
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
        </div>
        <div>
          <h3 className="font-semibold mb-2">COFINS</h3>
          <DetailRow label="CST" value={product.cofinsCst} isBadge />
        </div>
        <div>
          <h3 className="font-semibold mb-2">IPI</h3>
          <DetailRow label="CST" value={product.ipiCst} isBadge />
        </div>
      </CardContent>
    </Card>
  );
};