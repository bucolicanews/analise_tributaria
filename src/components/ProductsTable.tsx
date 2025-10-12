import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Product, CalculationParams, CalculatedProduct } from "@/types/pricing";
import { calculatePricing, CBS_RATE, IBS_RATE } from "@/lib/pricing"; // Import CBS_RATE and IBS_RATE
import { toast } from "sonner"; // Import toast for error messages

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

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  // 1. Consolidar Custos e Despesas Fixas
  const totalFixedExpenses = params.fixedExpenses.reduce((sum, exp) => sum + exp.value, 0) + params.payroll;

  // Custo do Produto (total dos produtos)
  const totalProductCost = calculatedProducts.reduce((sum, p) => sum + p.cost * p.quantity, 0);

  // Soma das alíquotas percentuais
  const totalVariableExpensesPercent = params.variableExpenses.reduce(
    (sum, exp) => sum + exp.percentage,
    0
  );
  const totalPercentageForGlobalCalc = (totalVariableExpensesPercent + params.simplesNacional + params.profitMargin) / 100;

  // Markup Divisor Global
  const globalMarkupDivisor = 1 - totalPercentageForGlobalCalc;

  let totalSelling = 0;
  let totalTax = 0;
  let totalProfit = 0;
  let profitMarginPercent = 0;
  let breakEvenPoint = 0;

  if (globalMarkupDivisor <= 0) {
    toast.error("Cálculo Global Inviável", {
      description: "A soma das despesas percentuais e margem de lucro é igual ou superior a 100%. Ajuste os parâmetros para um cálculo global válido.",
      duration: 5000,
    });
    // Os valores de resumo permanecerão 0 como inicializados
  } else {
    // 4. Calcular o Preço de Venda Total (Método de Markup Divisor)
    totalSelling = (totalFixedExpenses + totalProductCost) / globalMarkupDivisor;

    // Calcular Impostos Líquidos (CBS e IBS a pagar)
    const totalCbsDebit = totalSelling * CBS_RATE;
    const totalIbsDebit = totalSelling * IBS_RATE;
    const totalCbsCredit = calculatedProducts.reduce((sum, p) => sum + p.cbsCredit * p.quantity, 0);
    const totalIbsCredit = calculatedProducts.reduce((sum, p) => sum + p.ibsCredit * p.quantity, 0);
    
    const totalCbsTaxToPay = totalCbsDebit - totalCbsCredit;
    const totalIbsTaxToPay = totalIbsDebit - totalIbsCredit;
    totalTax = Math.max(0, totalCbsTaxToPay + totalIbsTaxToPay); // Garante que não seja negativo

    // Calcular Despesas Variáveis em valor (baseado no totalSelling)
    const totalVariableExpensesValue = totalSelling * (totalVariableExpensesPercent / 100);

    // Calcular Lucro Líquido
    totalProfit = totalSelling - totalFixedExpenses - totalProductCost - totalTax - totalVariableExpensesValue;
    profitMarginPercent = totalSelling > 0 ? (totalProfit / totalSelling) * 100 : 0;

    // Ponto de Equilíbrio (usando a fórmula do prompt)
    // Custo Variável Total para BEP = Custo do Produto Total + Despesas Variáveis em Valor
    const totalVariableCostsForBEP = totalProductCost + totalVariableExpensesValue;
    const variableCostRatioForBEP = totalSelling > 0 ? totalVariableCostsForBEP / totalSelling : 0;
    const simplesNacionalRatioForBEP = params.simplesNacional / 100;
    const denominatorBEP = 1 - (variableCostRatioForBEP + simplesNacionalRatioForBEP);
    breakEvenPoint = denominatorBEP > 0 ? totalFixedExpenses / denominatorBEP : 0;
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Unid.</TableHead>
              <TableHead className="text-right">Qtd.</TableHead>
              <TableHead>CFOP</TableHead>
              <TableHead>CST</TableHead>
              <TableHead className="text-right">Custo Un.</TableHead>
              <TableHead className="text-right">Créd. CBS</TableHead>
              <TableHead className="text-right">Créd. IBS</TableHead>
              <TableHead className="text-right">Custo Efetivo</TableHead>
              <TableHead className="text-right">Markup %</TableHead>
              <TableHead className="text-right">Déb. CBS</TableHead>
              <TableHead className="text-right">Déb. IBS</TableHead>
              <TableHead className="text-right">CBS a Pagar</TableHead>
              <TableHead className="text-right">IBS a Pagar</TableHead>
              <TableHead className="text-right">Imposto Líq.</TableHead>
              <TableHead className="text-right">Venda Mín.</TableHead>
              <TableHead className="text-right">Venda Sug.</TableHead>
              <TableHead className="text-right">Margem %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calculatedProducts.map((product, index) => {
              // Margem de lucro por produto (baseada no preço de venda sugerido individual)
              const productProfit = product.sellingPrice - product.cost - product.taxToPay - (product.sellingPrice * (totalVariableExpensesPercent / 100));
              const productProfitMargin = product.sellingPrice > 0 ? (productProfit / product.sellingPrice) * 100 : 0;
              
              return (
                <TableRow key={index}>
                  <TableCell className="font-mono text-xs">{product.code}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{product.name}</TableCell>
                  <TableCell className="font-mono text-xs">{product.unit}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{product.quantity}</TableCell>
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
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {formatCurrency(product.effectiveCost)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-accent">
                    {formatPercent(product.markupPercentage)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-destructive">
                    {formatCurrency(product.cbsDebit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-destructive">
                    {formatCurrency(product.ibsDebit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-destructive">
                    {formatCurrency(product.cbsTaxToPay)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-destructive">
                    {formatCurrency(product.ibsTaxToPay)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    {formatCurrency(product.taxToPay)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-yellow-500">
                    {formatCurrency(product.minSellingPrice)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-bold text-primary">
                    {formatCurrency(product.sellingPrice)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-success">
                    {formatPercent(productProfitMargin)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Custo Total Produtos</p>
          <p className="text-2xl font-bold">{formatCurrency(totalProductCost)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Valor de Venda Total</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalSelling)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Impostos Líquidos</p>
          <p className="text-2xl font-bold text-destructive">{formatCurrency(totalTax)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Ponto de Equilíbrio</p>
          <p className="text-2xl font-bold text-accent">{formatCurrency(breakEvenPoint)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Lucro Líquido</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(totalProfit)}</p>
          <p className="text-xs text-muted-foreground mt-1">{formatPercent(profitMarginPercent)}</p>
        </div>
      </div>
    </div>
  );
};