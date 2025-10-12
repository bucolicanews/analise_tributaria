import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalculatedProduct } from "@/types/pricing";

interface ProductRetailInfoProps {
  product: CalculatedProduct;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const ProductRetailInfo: React.FC<ProductRetailInfoProps> = ({ product }) => {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg">Detalhes de Varejo por Unidade Interna</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Custo por Unidade Interna</span>
          <span className="text-base font-semibold">{formatCurrency(product.costPerInnerUnit)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Preço Mínimo de Venda (Unid. Interna)</span>
          <span className="text-base font-semibold text-yellow-500">{formatCurrency(product.minSellingPricePerInnerUnit)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Preço Sugerido de Venda (Unid. Interna)</span>
          <span className="text-base font-semibold text-primary">{formatCurrency(product.sellingPricePerInnerUnit)}</span>
        </div>
      </CardContent>
    </Card>
  );
};