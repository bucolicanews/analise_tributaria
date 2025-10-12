import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Product, CalculationParams, CalculatedProduct, TaxRegime } from "@/types/pricing";
import { calculatePricing, CBS_RATE, IBS_RATE } from "@/lib/pricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductsTableProps {
  products: Product[];
  params: CalculationParams;
}

interface GlobalSummaryData {
  totalSelling: number;
  totalTax: number;
  totalProfit: number;
  profitMarginPercent: number;
  breakEvenPoint: number;
  totalVariableExpensesValue: number;
  totalContributionMargin: number;
  totalTaxPercent: number;
  totalCbsCredit: number;
  totalIbsCredit: number;
  totalCbsDebit: number;
  totalIbsDebit: number;
  totalCbsTaxToPay: number;
  totalIbsTaxToPay: number;
  totalIvaCreditForClient: number;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({ products, params }) => {
  // 1. Consolidar Custos Fixos Totais (CFT)
  const totalFixedExpenses = params.fixedExpenses.reduce((sum, exp) => sum + exp.value, 0) + params.payroll;

  // 2. Calcular Custo Fixo por Unidade (CFU)
  let cfu = 0;
  if (params.totalStockUnits > 0) {
    cfu = totalFixedExpenses / params.totalStockUnits;
  } else {
    toast.warning("Estoque Total de Unidades (ETU) é zero.", {
      description: "O rateio de custos fixos não será aplicado. Por favor, insira um valor maior que zero para o ETU.",
      duration: 5000,
    });
  }

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

  // --- Cálculo dos Produtos para os Cenários ---
  let calculatedProductsStandard: CalculatedProduct[] = [];
  let calculatedProductsHybrid: CalculatedProduct[] = [];
  let calculatedProductsPresumido: CalculatedProduct[] = [];

  if (params.taxRegime === TaxRegime.SimplesNacional) {
    calculatedProductsStandard = products.map((product) =>
      calculatePricing(product, { ...params, generateIvaCredit: false }, cfu)
    );
    calculatedProductsHybrid = products.map((product) =>
      calculatePricing(product, { ...params, generateIvaCredit: true }, cfu)
    );
  } else { // Lucro Presumido
    calculatedProductsPresumido = products.map((product) =>
      calculatePricing(product, params, cfu)
    );
  }

  // --- Cálculos para o Resumo Global ---
  const totalVariableExpensesPercent = params.variableExpenses.reduce(
    (sum, exp) => sum + exp.percentage,
    0
  );

  let totalProductAcquisitionCost = products.reduce((sum, p) => sum + p.cost * p.quantity, 0);
  if (params.lossPercentage > 0 && params.lossPercentage < 100) {
    totalProductAcquisitionCost = totalProductAcquisitionCost / (1 - params.lossPercentage / 100);
  } else if (params.lossPercentage >= 100) {
    totalProductAcquisitionCost = Infinity;
  }

  // Default summary data for invalid calculations
  const defaultSummary: GlobalSummaryData = {
    totalSelling: 0,
    totalTax: 0,
    totalProfit: 0,
    profitMarginPercent: 0,
    breakEvenPoint: 0,
    totalVariableExpensesValue: 0,
    totalContributionMargin: 0,
    totalTaxPercent: 0,
    totalCbsCredit: 0,
    totalIbsCredit: 0,
    totalCbsDebit: 0,
    totalIbsDebit: 0,
    totalCbsTaxToPay: 0,
    totalIbsTaxToPay: 0,
    totalIvaCreditForClient: 0,
  };

  let summaryData: GlobalSummaryData = defaultSummary; // Initialize with default
  let totalOptionCost = 0;
  let isGlobalCalculationInviable = false;

  if (params.taxRegime === TaxRegime.SimplesNacional) {
    const summaryStandard = calculateGlobalSummary(calculatedProductsStandard, { ...params, generateIvaCredit: false });
    const summaryHybrid = calculateGlobalSummary(calculatedProductsHybrid, { ...params, generateIvaCredit: true });
    
    summaryData = params.generateIvaCredit ? summaryHybrid : summaryStandard;
    
    // Check if either scenario resulted in an inviable calculation
    if ((summaryStandard.totalSelling === 0 && summaryStandard.totalTax === 0 && summaryStandard.totalProfit === 0) ||
        (summaryHybrid.totalSelling === 0 && summaryHybrid.totalTax === 0 && summaryHybrid.totalProfit === 0)) {
        isGlobalCalculationInviable = true;
    }
    
    if (!isGlobalCalculationInviable && (summaryStandard.totalTax !== 0 || summaryHybrid.totalTax !== 0)) {
      totalOptionCost = summaryHybrid.totalTax - summaryStandard.totalTax;
    }
  } else { // Lucro Presumido
    summaryData = calculateGlobalSummary(calculatedProductsPresumido, params);
    if (summaryData.totalSelling === 0 && summaryData.totalTax === 0 && summaryData.totalProfit === 0) {
        isGlobalCalculationInviable = true;
    }
  }

  // If global calculation is inviable, render an error message
  if (isGlobalCalculationInviable) {
    return (
      <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive-foreground">
        <p className="font-semibold mb-2">⚠️ Cálculo Global Inviável</p>
        <p>
          A soma das despesas percentuais e margem de lucro é igual ou superior a 100%, ou a porcentagem de perdas é inviável. Ajuste os parâmetros para um cálculo global válido.
        </p>
      </div>
    );
  }

  // Otherwise, render the full table and summary
  return (
    <div className="space-y-6">
      <div className="summary rounded-lg bg-muted/30 border border-border p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Parâmetros da Simulação</h2>
        <p className="text-sm text-muted-foreground">
          <strong>Regime Tributário:</strong> {params.taxRegime}
          {params.taxRegime === TaxRegime.SimplesNacional && params.generateIvaCredit && " (Híbrido - Gerando Crédito IVA)"}
          {params.taxRegime === TaxRegime.SimplesNacional && !params.generateIvaCredit && " (Padrão - Sem Crédito IVA)"}
          <br/>
          <strong>Margem de Lucro Alvo:</strong> {formatPercent(params.profitMargin)}<br/>
          {params.taxRegime === TaxRegime.LucroPresumido ? (
            <>
              <strong>Alíquotas:</strong> CBS ({formatPercent(CBS_RATE * 100)}), IBS ({formatPercent(IBS_RATE * 100)}), IRPJ ({formatPercent(params.irpjRate)}), CSLL ({formatPercent(params.csllRate)})
            </>
          ) : (
            <>
              <strong>Alíquota Cheia Simples:</strong> {formatPercent(params.simplesNacionalRate)}
              {params.generateIvaCredit && (
                <>
                  <br/><strong>Alíquota Remanescente Simples:</strong> {formatPercent(params.simplesNacionalRemanescenteRate)}
                  <br/><strong>Alíquotas IVA:</strong> CBS ({formatPercent(CBS_RATE * 100)}), IBS ({formatPercent(IBS_RATE * 100)})
                </>
              )}
            </>
          )}<br/>
          <strong>Custos Fixos Totais (CFT):</strong> {formatCurrency(totalFixedExpenses)}<br/>
          <strong>Estoque Total de Unidades (ETU):</strong> {params.totalStockUnits.toLocaleString('pt-BR')}<br/>
          <strong>Custo Fixo por Unidade (CFU):</strong> {formatCurrency(cfu)}<br/>
          <strong>Perdas e Quebras:</strong> {formatPercent(params.lossPercentage)}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2}>Código</TableHead>
              <TableHead rowSpan={2}>Produto</TableHead>
              <TableHead rowSpan={2}>Unid. Com.</TableHead>
              <TableHead className="text-right" rowSpan={2}>Qtd. Estoque</TableHead>
              <TableHead className="text-right" rowSpan={2}>Custo Aquisição (Unit)</TableHead>
              <TableHead className="text-right" rowSpan={2}>Custo Fixo Rateado (Unit)</TableHead>
              <TableHead className="text-right" rowSpan={2}>Custo Total Base (Unit)</TableHead>
              <TableHead className="text-right" rowSpan={2}>Markup %</TableHead>
              
              {params.taxRegime === TaxRegime.SimplesNacional ? (
                <>
                  <TableHead colSpan={5} className="text-center border-l border-r">Simples Nacional Padrão</TableHead>
                  <TableHead colSpan={6} className="text-center border-l border-r">Simples Nacional Híbrido (IVA por Fora)</TableHead>
                  <TableHead rowSpan={2} className="text-right">Custo da Opção (R$)</TableHead>
                </>
              ) : (
                <TableHead colSpan={10} className="text-center">Lucro Presumido</TableHead>
              )}
            </TableRow>
            <TableRow>
              {params.taxRegime === TaxRegime.SimplesNacional ? (
                <>
                  {/* Simples Nacional Padrão */}
                  <TableHead className="text-right">Venda Sug. Com.</TableHead>
                  <TableHead className="text-right">Imposto Total</TableHead>
                  <TableHead className="text-right">Lucro Líq.</TableHead>
                  <TableHead className="text-right">Margem %</TableHead>
                  <TableHead className="text-right">Crédito Cliente</TableHead>
                  {/* Simples Nacional Híbrido */}
                  <TableHead className="text-right">Venda Sug. Com.</TableHead>
                  <TableHead className="text-right">Imposto Total</TableHead>
                  <TableHead className="text-right">Lucro Líq.</TableHead>
                  <TableHead className="text-right">Margem %</TableHead>
                  <TableHead className="text-right">Crédito Cliente</TableHead>
                  <TableHead className="text-right">Simples a Pagar</TableHead>
                </>
              ) : (
                <>
                  {/* Lucro Presumido */}
                  <TableHead className="text-right">Créd. CBS</TableHead>
                  <TableHead className="text-right">Créd. IBS</TableHead>
                  <TableHead className="text-right">Déb. CBS</TableHead>
                  <TableHead className="text-right">Déb. IBS</TableHead>
                  <TableHead className="text-right">IRPJ a Pagar</TableHead>
                  <TableHead className="text-right">CSLL a Pagar</TableHead>
                  <TableHead className="text-right">Imposto Líq.</TableHead>
                  <TableHead className="text-right">Venda Sug. Com.</TableHead>
                  <TableHead className="text-right">Margem %</TableHead>
                  <TableHead className="text-right">Crédito Cliente</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {params.taxRegime === TaxRegime.SimplesNacional ? (
              calculatedProductsStandard.map((productStandard, index) => {
                const productHybrid = calculatedProductsHybrid[index];
                const productProfitStandard = productStandard.sellingPrice - productStandard.cost - productStandard.taxToPay - (productStandard.sellingPrice * (totalVariableExpensesPercent / 100)) - cfu;
                const productProfitMarginStandard = productStandard.sellingPrice > 0 ? (productProfitStandard / productStandard.sellingPrice) * 100 : 0;

                const productProfitHybrid = productHybrid.sellingPrice - productHybrid.cost - productHybrid.taxToPay - (productHybrid.sellingPrice * (totalVariableExpensesPercent / 100)) - cfu;
                const productProfitMarginHybrid = productHybrid.sellingPrice > 0 ? (productProfitHybrid / productHybrid.sellingPrice) * 100 : 0;

                const optionCostPerProduct = productHybrid.taxToPay - productStandard.taxToPay;

                return (
                  <TableRow key={index} className={cn(
                    productStandard.status === "PREÇO CORRIGIDO" || productHybrid.status === "PREÇO CORRIGIDO" ? "bg-yellow-900/20" : ""
                  )}>
                    <TableCell className="font-mono text-xs">{productStandard.code}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{productStandard.name}</TableCell>
                    <TableCell className="font-mono text-xs">{productStandard.unit}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{productStandard.quantity}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(productStandard.cost)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {formatCurrency(cfu)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {formatCurrency(productStandard.cost + cfu)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-accent">
                      {formatPercent(productStandard.markupPercentage)}
                    </TableCell>

                    {/* Simples Nacional Padrão */}
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(productStandard.sellingPrice)}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {formatCurrency(productStandard.taxToPay)}
                    </TableCell>
                    <TableCell className="text-right text-success">
                      {formatCurrency(productProfitStandard)}
                    </TableCell>
                    <TableCell className="text-right text-success">
                      {formatPercent(productProfitMarginStandard)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(productStandard.ivaCreditForClient)}
                    </TableCell>

                    {/* Simples Nacional Híbrido */}
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(productHybrid.sellingPrice)}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {formatCurrency(productHybrid.taxToPay)}
                    </TableCell>
                    <TableCell className="text-right text-success">
                      {formatCurrency(productProfitHybrid)}
                    </TableCell>
                    <TableCell className="text-right text-success">
                      {formatPercent(productProfitMarginHybrid)}
                    </TableCell>
                    <TableCell className="text-right text-success">
                      {formatCurrency(productHybrid.ivaCreditForClient)}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {formatCurrency(productHybrid.simplesToPay)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-yellow-500">
                      {formatCurrency(optionCostPerProduct)}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              calculatedProductsPresumido.map((product, index) => {
                const productProfit = product.sellingPrice - product.cost - product.taxToPay - (product.sellingPrice * (totalVariableExpensesPercent / 100)) - cfu;
                const productProfitMargin = product.sellingPrice > 0 ? (productProfit / product.sellingPrice) * 100 : 0;
                
                return (
                  <TableRow key={index} className={cn(
                    product.status === "PREÇO CORRIGIDO" ? "bg-yellow-900/20" : ""
                  )}>
                    <TableCell className="font-mono text-xs">{product.code}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{product.name}</TableCell>
                    <TableCell className="font-mono text-xs">{product.unit}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{product.quantity}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(product.cost)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {formatCurrency(cfu)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {formatCurrency(product.cost + cfu)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-accent">
                      {formatPercent(product.markupPercentage)}
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
                    <TableCell className="text-right font-mono text-sm text-destructive">
                      {formatCurrency(product.irpjToPay)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-destructive">
                      {formatCurrency(product.csllToPay)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {formatCurrency(product.taxToPay)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-primary">
                      {formatCurrency(product.sellingPrice)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-success">
                      {formatPercent(productProfitMargin)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-success">
                      {formatCurrency(product.ivaCreditForClient)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Custo Total Aquisição</p>
          <p className="text-2xl font-bold">{formatCurrency(totalProductAcquisitionCost)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Despesas Fixas Totais</p>
          <p className="text-2xl font-bold">{formatCurrency(totalFixedExpenses)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Despesas Variáveis Totais</p>
          <p className="text-2xl font-bold">{formatCurrency(summaryData.totalVariableExpensesValue)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Margem de Contribuição Total</p>
          <p className="text-2xl font-bold text-accent">{formatCurrency(summaryData.totalContributionMargin)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Valor de Venda Total</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(summaryData.totalSelling)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Impostos Líquidos</p>
          <p className="text-2xl font-bold text-destructive">{formatCurrency(summaryData.totalTax)}</p>
          <p className="text-xs text-muted-foreground mt-1">{formatPercent(summaryData.totalTaxPercent)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Lucro Líquido</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(summaryData.totalProfit)}</p>
          <p className="text-xs text-muted-foreground mt-1">{formatPercent(summaryData.profitMarginPercent)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Ponto de Equilíbrio</p>
          <p className="text-2xl font-bold text-yellow-500">{formatCurrency(summaryData.breakEvenPoint)}</p>
        </div>

        {params.taxRegime === TaxRegime.LucroPresumido || (params.taxRegime === TaxRegime.SimplesNacional && params.generateIvaCredit) ? (
          <>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Crédito CBS Total</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(summaryData.totalCbsCredit)}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Débito CBS Total</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(summaryData.totalCbsDebit)}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-1">CBS a Pagar Total</p>
              <p className="text-2xl font-bold">{formatCurrency(summaryData.totalCbsTaxToPay)}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Crédito IBS Total</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(summaryData.totalIbsCredit)}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Débito IBS Total</p>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(summaryData.totalIbsDebit)}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-1">IBS a Pagar Total</p>
              <p className="text-2xl font-bold">{formatCurrency(summaryData.totalIbsTaxToPay)}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-1">IVA Crédito p/ Cliente</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(summaryData.totalIvaCreditForClient)}</p>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">IVA Crédito p/ Cliente</p>
            <p className="text-2xl font-bold text-muted-foreground">{formatCurrency(0)}</p>
          </div>
        )}
        {params.taxRegime === TaxRegime.SimplesNacional && (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Custo da Opção Híbrida</p>
            <p className="text-2xl font-bold text-yellow-500">{formatCurrency(totalOptionCost)}</p>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        *Esta é uma simulação baseada nas propostas da Reforma Tributária. Os valores e regras finais dependem da aprovação das Leis Complementares.
      </p>
    </div>
  );
};