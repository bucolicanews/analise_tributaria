import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Printer, Tags } from 'lucide-react';
import { CalculatedProduct, CalculationParams, Product } from '@/types/pricing';
import { calculatePricing } from '@/lib/pricing';

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const ProductList = () => {
  const [products, setProducts] = useState<CalculatedProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    try {
      const storedRawProducts = sessionStorage.getItem('jota-calc-products');
      const storedParams = sessionStorage.getItem('jota-calc-params');

      if (storedRawProducts && storedParams) {
        const rawProducts: Product[] = JSON.parse(storedRawProducts);
        const params: CalculationParams = JSON.parse(storedParams);
        
        const totalFixedExpenses = params.fixedCostsTotal || 0;
        const cfu = params.totalStockUnits > 0 ? totalFixedExpenses / params.totalStockUnits : 0;

        const calculated = rawProducts.map(p => calculatePricing(p, params, cfu));
        setProducts(calculated);
      }
    } catch (error) {
      console.error("Erro ao carregar dados dos produtos:", error);
      setProducts([]);
    }
  }, []);

  const filteredProducts = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    if (!lowercasedFilter) {
      return products;
    }
    return products.filter(product =>
      product.name.toLowerCase().includes(lowercasedFilter) ||
      product.code.toLowerCase().includes(lowercasedFilter)
    );
  }, [searchTerm, products]);

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-card">
          <div className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Tags className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Nenhum produto para listar
            </h3>
            <p className="text-muted-foreground max-w-md">
              Por favor, realize uma análise na página principal primeiro. Os produtos calculados aparecerão aqui.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="shadow-card print:shadow-none print:border-none">
        <CardHeader className="flex-row items-center justify-between print:hidden">
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-6 w-6 text-primary" />
            Lista de Produtos para Cadastro
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir Lista
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 print:hidden">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome ou código..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Produto</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>NCM</TableHead>
                  <TableHead>CEST</TableHead>
                  <TableHead>CSOSN (Saída)</TableHead>
                  <TableHead>CST PIS/COFINS (Saída)</TableHead>
                  <TableHead className="text-right">Custo Base Total</TableHead>
                  <TableHead className="text-right">Custo Unid. Int.</TableHead>
                  <TableHead className="text-right">Venda Mín. Unid. Int.</TableHead>
                  <TableHead className="text-right">Venda Sug. Unid. Int.</TableHead>
                  <TableHead className="text-right">Venda Mín. Com.</TableHead>
                  <TableHead className="text-right">Venda Sug. Com.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(product => (
                  <TableRow key={product.code}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="font-mono">{product.code}</TableCell>
                    <TableCell className="font-mono">{product.ncm}</TableCell>
                    <TableCell className="font-mono">{product.cest}</TableCell>
                    <TableCell className="font-mono font-bold">{product.suggestedCodes.icmsCstOrCsosn}</TableCell>
                    <TableCell className="font-mono font-bold">{product.suggestedCodes.pisCofinsCst}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(product.cost + (product.valueForFixedCost / product.quantity))}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(product.costPerInnerUnit)}</TableCell>
                    <TableCell className="text-right font-mono text-yellow-500">{formatCurrency(product.minSellingPricePerInnerUnit)}</TableCell>
                    <TableCell className="text-right font-mono text-primary font-bold">{formatCurrency(product.sellingPricePerInnerUnit)}</TableCell>
                    <TableCell className="text-right font-mono text-yellow-500">{formatCurrency(product.minSellingPrice)}</TableCell>
                    <TableCell className="text-right font-mono text-primary font-bold">{formatCurrency(product.sellingPrice)}</TableCell>
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

export default ProductList;