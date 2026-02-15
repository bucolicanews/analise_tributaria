import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Printer, Tags, Info, DollarSign, Calculator } from 'lucide-react';
import { CalculatedProduct, CalculationParams, Product } from '@/types/pricing';
import { calculatePricing } from '@/lib/pricing';
import { generateProductListPdf } from '@/lib/pdfGenerator';
import { getClassificationDetails } from '@/lib/tax/taxClassificationService';

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const MetricItem = ({ label, value, className }: { label: string; value: string; className?: string }) => (
  <div className="flex flex-col border-r border-border last:border-r-0 px-3 py-1">
    <span className="text-[10px] text-muted-foreground uppercase font-semibold">{label}</span>
    <span className={`text-sm font-mono font-bold ${className}`}>{value}</span>
  </div>
);

const ProductList = () => {
  const [products, setProducts] = useState<CalculatedProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    try {
      const storedRawProducts = sessionStorage.getItem('jota-calc-purchase-products');
      const storedParams = sessionStorage.getItem('jota-calc-params');
      const storedSelection = sessionStorage.getItem('jota-calc-selection');

      if (storedRawProducts && storedParams) {
        const rawProducts: Product[] = JSON.parse(storedRawProducts);
        const params: CalculationParams = JSON.parse(storedParams);
        const selectedCodes = new Set(JSON.parse(storedSelection || '[]'));
        
        const productsToProcess = selectedCodes.size > 0 
          ? rawProducts.filter(p => selectedCodes.has(p.code))
          : rawProducts;

        const totalFixedExpenses = params.fixedCostsTotal || 0;
        const cfu = params.totalStockUnits > 0 ? totalFixedExpenses / params.totalStockUnits : 0;

        const calculated = productsToProcess.map(p => calculatePricing(p, params, cfu));
        setProducts(calculated);
      }
    } catch (error) {
      console.error("Erro ao carregar dados dos produtos:", error);
      setProducts([]);
    }
  }, []);

  const filteredProducts = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    if (!lowercasedFilter) return products;
    
    return products.filter(product =>
      product.name.toLowerCase().includes(lowercasedFilter) ||
      product.code.toLowerCase().includes(lowercasedFilter) ||
      (product.ean && product.ean.toLowerCase().includes(lowercasedFilter))
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
            <h3 className="text-xl font-semibold mb-2">Nenhum produto na lista</h3>
            <p className="text-muted-foreground max-w-md">
              Realize o cálculo na página de Precificação e selecione os produtos para que eles apareçam aqui com os códigos de venda sugeridos.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-6 w-6 text-primary" />
              Guia de Cadastro para Venda
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Use estes códigos para atualizar o cadastro no seu ERP.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => generateProductListPdf(filteredProducts)}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir Lista
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome, código ou EAN..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-6">
            {filteredProducts.map(product => {
              const classificationDetails = product.cClassTrib ? getClassificationDetails(product.cClassTrib) : null;
              const fixedCostPerComUnit = product.valueForFixedCost / product.quantity;
              const totalBaseCostUnit = product.cost + fixedCostPerComUnit;
              const productProfit = product.sellingPrice - totalBaseCostUnit - product.taxToPay - product.valueForVariableExpenses;

              return (
                <div key={product.code} className="rounded-lg border border-border overflow-hidden shadow-sm">
                  {/* Cabeçalho do Produto */}
                  <div className="bg-muted/30 p-4 border-b border-border flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <div className="flex gap-4 text-xs text-muted-foreground font-mono mt-1">
                        <span>Cód: {product.code}</span>
                        <span>EAN: {product.ean || '---'}</span>
                        <span>NCM: {product.ncm}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Preço Sugerido (Varejo)</div>
                      <div className="text-xl font-extrabold text-primary">{formatCurrency(product.sellingPricePerInnerUnit)}</div>
                    </div>
                  </div>

                  {/* Métricas Financeiras */}
                  <div className="flex flex-wrap bg-muted/10 border-b border-border py-2 px-1">
                    <MetricItem label="Custo Total Base (Unit)" value={formatCurrency(totalBaseCostUnit)} className="text-foreground" />
                    <MetricItem label="Custo Unid. Int." value={formatCurrency(product.costPerInnerUnit)} className="text-foreground" />
                    <MetricItem label="Venda Mín. Unid. Int." value={formatCurrency(product.minSellingPricePerInnerUnit)} className="text-yellow-500" />
                    <MetricItem label="Venda Sug. Unid. Int." value={formatCurrency(product.sellingPricePerInnerUnit)} className="text-primary" />
                    <MetricItem label="Venda Mín. Com." value={formatCurrency(product.minSellingPrice)} className="text-yellow-500" />
                    <MetricItem label="Venda Sug. Com." value={formatCurrency(product.sellingPrice)} className="text-primary" />
                    <MetricItem label="Imposto Líq." value={formatCurrency(product.taxToPay)} className="text-destructive" />
                  </div>

                  {/* Detalhes de Cadastro (O que o usuário deve preencher) */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-card">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">CSOSN / CST ICMS</div>
                      <div className="text-lg font-mono font-bold text-primary bg-primary/5 p-2 rounded border border-primary/20 text-center">
                        {product.suggestedCodes.icmsCstOrCsosn}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">CST PIS/COFINS</div>
                      <div className="text-lg font-mono font-bold text-primary bg-primary/5 p-2 rounded border border-primary/20 text-center">
                        {product.suggestedCodes.pisCofinsCst}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">CFOP de Venda</div>
                      <div className="text-lg font-mono font-bold text-primary bg-primary/5 p-2 rounded border border-primary/20 text-center">
                        {product.suggestedCodes.icmsCstOrCsosn === '500' ? '5405' : '5102'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">Origem</div>
                      <div className="text-lg font-mono font-bold text-primary bg-primary/5 p-2 rounded border border-primary/20 text-center">
                        0 (Nacional)
                      </div>
                    </div>
                  </div>

                  {/* RESUMO DE LUCRO (MATEMÁTICA) */}
                  <div className="px-4 py-3 bg-success/5 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-success font-bold text-xs uppercase">
                      <Calculator className="h-4 w-4" />
                      Cálculo do Lucro (Unid. Com.)
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 font-mono text-xs sm:text-sm">
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-muted-foreground uppercase">Venda</span>
                        <span className="font-bold text-primary">{formatCurrency(product.sellingPrice)}</span>
                      </div>
                      <span className="text-muted-foreground">-</span>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-muted-foreground uppercase">Custo</span>
                        <span className="font-bold">{formatCurrency(totalBaseCostUnit)}</span>
                      </div>
                      <span className="text-muted-foreground">-</span>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-muted-foreground uppercase">Imposto</span>
                        <span className="font-bold text-destructive">{formatCurrency(product.taxToPay)}</span>
                      </div>
                      <span className="text-muted-foreground">-</span>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-muted-foreground uppercase">Variáv.</span>
                        <span className="font-bold text-destructive">{formatCurrency(product.valueForVariableExpenses)}</span>
                      </div>
                      <span className="text-muted-foreground">=</span>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-success uppercase">Líquido</span>
                        <span className="font-bold text-success text-base">{formatCurrency(productProfit)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Classificação Reforma Tributária (Opcional/Informativo) */}
                  {classificationDetails && (
                    <div className="p-4 border-t border-border bg-muted/10">
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Info className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <span className="font-bold text-foreground">Reforma Tributária (IBS/CBS):</span>{' '}
                          Classe {classificationDetails.cClass.code} - {classificationDetails.cClass.name} | 
                          CST Sugerido: {classificationDetails.cst?.code}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductList;