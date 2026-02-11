import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalculatedProduct } from "@/types/pricing";
import { FileText, ArrowRight, Building, ShoppingCart } from 'lucide-react';

interface ProductTaxDetailsProps {
  product: CalculatedProduct;
}

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const formatPercent = (value: number) => `${value.toFixed(2)}%`;

const DetailRow = ({ label, value, isBadge = false, isSuggestion = false }: { label: string; value?: string | number; isBadge?: boolean; isSuggestion?: boolean }) => {
  if (value === undefined || value === null || value === '') return null;
  
  let displayValue = value;
  if (typeof value === 'number') {
    if (label.toLowerCase().includes('alíquota')) {
      displayValue = formatPercent(value);
    } else if (label.toLowerCase().includes('base') || label.toLowerCase().includes('valor')) {
      displayValue = formatCurrency(value);
    }
  }

  return (
    <div className="flex justify-between py-1.5 border-b border-border/50 items-center">
      <span className="text-muted-foreground">{label}:</span>
      {isBadge ? (
        <Badge variant={isSuggestion ? "default" : "outline"} className={isSuggestion ? "bg-primary hover:bg-primary" : ""}>
          {displayValue}
        </Badge>
      ) : (
        <span className="font-mono">{displayValue}</span>
      )}
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
      <CardContent className="text-sm space-y-6">
        
        {/* GERAL */}
        <div>
          <h3 className="font-semibold mb-2">Geral</h3>
          <DetailRow label="CFOP (Entrada)" value={product.cfop} isBadge />
          <DetailRow label="NCM" value={product.ncm} />
          <DetailRow label="CEST" value={product.cest} />
        </div>

        {/* ICMS */}
        <div className="space-y-3">
          <h3 className="font-semibold">ICMS</h3>
          <div className="p-3 rounded-md bg-muted/50 border border-border/50">
            <h4 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1"><Building className="h-3 w-3" /> Dados de Entrada (Fornecedor)</h4>
            <DetailRow label="CST/CSOSN" value={product.cst} isBadge />
          </div>
          <div className="p-3 rounded-md bg-primary/10 border border-primary/50">
            <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-1"><ShoppingCart className="h-3 w-3" /> Dados de Saída (Sua Empresa - Simples Nacional)</h4>
            <DetailRow label="Classificação" value={product.taxAnalysis.icms} />
            <DetailRow label="CSOSN Sugerido" value={product.suggestedCodes.icmsCstOrCsosn} isBadge isSuggestion />
          </div>
        </div>

        {/* PIS/COFINS */}
        <div className="space-y-3">
          <h3 className="font-semibold">PIS/COFINS</h3>
          <div className="p-3 rounded-md bg-muted/50 border border-border/50">
            <h4 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1"><Building className="h-3 w-3" /> Dados de Entrada (Fornecedor)</h4>
            <DetailRow label="CST PIS" value={product.pisCst} isBadge />
            <DetailRow label="CST COFINS" value={product.cofinsCst} isBadge />
            <DetailRow label="Valor Crédito PIS" value={product.pisCredit} />
            <DetailRow label="Valor Crédito COFINS" value={product.cofinsCredit} />
          </div>
          <div className="p-3 rounded-md bg-primary/10 border border-primary/50">
            <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-1"><ShoppingCart className="h-3 w-3" /> Dados de Saída (Sua Empresa - Simples Nacional)</h4>
            <DetailRow label="Classificação" value={product.taxAnalysis.pisCofins} />
            <DetailRow label="CST Sugerido" value={product.suggestedCodes.pisCofinsCst} isBadge isSuggestion />
          </div>
        </div>

        {/* IPI */}
        <div>
          <h3 className="font-semibold mb-2">IPI (Entrada)</h3>
          <DetailRow label="CST" value={product.ipiCst} isBadge />
        </div>

        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <p className="text-xs text-blue-500/90">
            <strong>Importante:</strong> Use os códigos sugeridos para cadastrar este produto em seu sistema de vendas. Isso garante que a receita de produtos com Substituição Tributária (ST) ou Monofásicos seja segregada, evitando o pagamento de impostos em duplicidade no PGDAS.
          </p>
        </div>

      </CardContent>
    </Card>
  );
};