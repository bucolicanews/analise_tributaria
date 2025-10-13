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
import { SummarySection } from './summary/SummarySection';
import { CostSummary } from './summary/CostSummary';
import { SalesSummary } from './summary/SalesSummary';
import { TaxSummary } from './summary/TaxSummary';
import { ExpenseSummary } from './summary/ExpenseSummary';
import { OverallResultSummary } from './summary/OverallResultSummary';

interface ProductsTableProps {
  products: Product[];
  params: CalculationParams;
}

// Define a type for the summary data to ensure consistency
export interface GlobalSummaryData {
  totalSelling: number;
  totalTax: number;
  totalProfit: number;
  profitMarginPercent: number;
  breakEvenPoint: number;
  totalVariableExpensesValue: number;
  totalContributionMargin: number;
  totalTaxPercent: number;

  // Detailed Tax Info
  totalCbsCredit: number;
  totalIbsCredit: number;
  totalCbsDebit: number;
  totalIbsDebit: number;
  totalCbsTaxToPay: number;
  totalIbsTaxToPay: number;
  totalIrpjToPay: number;
  totalCsllToPay: number;
  totalSimplesToPay: number;
  totalIvaCreditForClient: number;
}

// Helper function to calculate global summary for a given set of products and parameters
const calculateGlobalSummary = (
  productsToSummarize: CalculatedProduct[],
  currentParams: CalculationParams,
  totalFixedExpenses: number,
  totalProductAcquisitionCost: number,
  totalVariableExpensesPercent: number,
  profitMarginOverride?: number // New parameter to allow overriding profit margin for min sale
): GlobalSummaryData => {
  const effectiveProfitMargin = profitMarginOverride !== undefined ? profitMarginOverride : currentParams.profitMargin;

  let totalPercentageForGlobalMarkup = 0;
  if (currentParams.taxRegime === TaxRegime.LucroPresumido) {
    totalPercentageForGlobalMarkup =
      (totalVariableExpensesPercent + currentParams.irpjRate + currentParams.csllRate + effectiveProfitMargin) / 100 +
      CBS_RATE + IBS_RATE;
  } else { // Simples Nacional
    if (currentParams.generateIvaCredit) {
      totalPercentageForGlobalMarkup =
        (totalVariableExpensesPercent + currentParams.simplesNacionalRemanescenteRate + effectiveProfitMargin) / 100 +
        CBS_RATE + IBS_RATE;
    } else {
      totalPercentageForGlobalMarkup =
        (totalVariableExpensesPercent + currentParams.simplesNacionalRate + effectiveProfitMargin) / 100;
    }
  }
  const globalMarkupDivisor = 1 - totalPercentageForGlobalMarkup;

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
    totalIrpjToPay: 0,
    totalCsllToPay: 0,
    totalSimplesToPay: 0,
    totalIvaCreditForClient: 0,
  };

  if (globalMarkupDivisor <= 0 || totalProductAcquisitionCost === Infinity) {
    return defaultSummary;
  } else {
    const totalSelling = (totalFixedExpenses + totalProductAcquisitionCost) / globalMarkupDivisor;

    let totalCbsDebit = 0;
    let totalIbsDebit = 0;
    let totalIrpjToPay = 0;
    let totalCsllToPay = 0;
    let totalSimplesToPay = 0;
    let totalIvaCreditForClient = 0;

    if (totalSelling > 0) {
      if (currentParams.taxRegime === TaxRegime.LucroPresumido) {
        totalCbsDebit = totalSelling * CBS_RATE;
        totalIbsDebit = totalSelling * IBS_RATE;
        totalIrpjToPay = totalSelling * (currentParams.irpjRate / 100);
        totalCsllToPay = totalSelling * (currentParams.csllRate / 100);
        totalIvaCreditForClient = totalCbsDebit + totalIbsDebit;
      } else { // Simples Nacional
        if (currentParams.generateIvaCredit) {
          totalSimplesToPay = totalSelling * (currentParams.simplesNacionalRemanescenteRate / 100);
          totalCbsDebit = totalSelling * CBS_RATE;
          totalIbsDebit = totalSelling * IBS_RATE;
          totalIvaCreditForClient = totalCbsDebit + totalIbsDebit;
        } else {
          totalSimplesToPay = totalSelling * (currentParams.simplesNacionalRate / 100);
        }
      }
    }

    const totalCbsCredit = productsToSummarize.reduce((sum, p) => sum + p.cbsCredit * p.quantity, 0);
    const totalIbsCredit = productsToSummarize.reduce((sum, p) => sum + p.ibsCredit * p.quantity, 0);
    
    const totalCbsTaxToPay = totalCbsDebit - totalCbsCredit;
    const totalIbsTaxToPay = totalIbsDebit - totalIbsCredit;
    
    let totalTax = 0;
    if (currentParams.taxRegime === TaxRegime.LucroPresumido) {
      totalTax = Math.max(0, totalCbsTaxToPay + totalIbsTaxToPay + totalIrpjToPay + totalCsllToPay);
    } else { // Simples Nacional
      if (currentParams.generateIvaCredit) {
        totalTax = Math.max(0, totalSimplesToPay + totalCbsTaxToPay + totalIbsTaxToPay);
      } else {
        totalTax = Math.max(0, totalSimplesToPay);
      }
    }

    const totalVariableExpensesValue = totalSelling * (totalVariableExpensesPercent / 100);
    const totalProfit = totalSelling - totalFixedExpenses - totalProductAcquisitionCost - totalTax - totalVariableExpensesValue;
    const profitMarginPercent = totalSelling > 0 ? (totalProfit / totalSelling) * 100 : 0;

    const totalVariableCostsForBEP = totalProductAcquisitionCost + totalVariableExpensesValue;
    const variableCostRatioForBEP = totalSelling > 0 ? totalVariableCostsForBEP / totalSelling : 0;
    
    let taxRatioForBEP = 0;
    if (currentParams.taxRegime === TaxRegime.LucroPresumido) {
      taxRatioForBEP = CBS_RATE + IBS_RATE + (currentParams.irpjRate / 100) + (currentParams.csllRate / 100);
    } else { // Simples Nacional
      if (currentParams.generateIvaCredit) {
        taxRatioForBEP = (currentParams.simplesNacionalRemanescenteRate / 100) + CBS_RATE + IBS_RATE;
      } else {
        taxRatioForBEP = currentParams.simplesNacionalRate / 100;
      }
    }

    const denominatorBEP = 1 - (variableCostRatioForBEP + taxRatioForBEP);
    const breakEvenPoint = denominatorBEP > 0 ? totalFixedExpenses / denominatorBEP : 0;

    const totalContributionMargin = totalSelling - totalProductAcquisitionCost - totalVariableExpensesValue;
    const totalTaxPercent = totalSelling > 0 ? (totalTax / totalSelling) * 100 : 0;

    return {
      totalSelling: totalSelling,
      totalTax: totalTax,
      totalProfit: totalProfit,
      profitMarginPercent: profitMarginPercent,
      breakEvenPoint: breakEvenPoint,
      totalVariableExpensesValue: totalVariableExpensesValue,
      totalContributionMargin: totalContributionMargin,
      totalTaxPercent: totalTaxPercent,
      totalCbsCredit: totalCbsCredit,
      totalIbsCredit: totalIbsCredit,
      totalCbsDebit: totalCbsDebit,
      totalIbsDebit: totalIbsDebit,
      totalCbsTaxToPay: totalCbsTaxToPay,
      totalIbsTaxToPay: totalIbsTaxToPay,
      totalIrpjToPay: totalIrpjToPay,
      totalCsllToPay: totalCsllToPay,
      totalSimplesToPay: totalSimplesToPay,
      totalIvaCreditForClient: 0, // This is calculated per product, not globally in this summary
    };
  }
};

export const ProductsTable: React.FC<ProductsTableProps> = ({ products, params }) => {
  // Early return if no products to display
  if (!products || products.length === 0) {
    return null;
  }

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

  // Calculate summary for "Best Sale" (with target profit margin)
  let summaryDataBestSale: GlobalSummaryData;
  let calculatedProductsForBestSale: CalculatedProduct[];

  if (params.taxRegime === TaxRegime.SimplesNacional) {
    calculatedProductsForBestSale = params.generateIvaCredit ? calculatedProductsHybrid : calculatedProductsStandard;
  } else {
    calculatedProductsForBestSale = calculatedProductsPresumido;
  }
  summaryDataBestSale = calculateGlobalSummary(calculatedProductsForBestSale, params, totalFixedExpenses, totalProductAcquisitionCost, totalVariableExpensesPercent, params.profitMargin);

  // Calculate summary for "Minimum Sale" (with 0% profit margin)
  const paramsForMinSale = { ...params, profitMargin: 0 };
  let calculatedProductsForMinSale: CalculatedProduct[];

  if (params.taxRegime === TaxRegime.SimplesNacional) {
    calculatedProductsForMinSale = params.generateIvaCredit ? 
      products.map((product) => calculatePricing(product, { ...paramsForMinSale, generateIvaCredit: true }, cfu)) :
      products.map((product) => calculatePricing(product, { ...paramsForMinSale, generateIvaCredit: false }, cfu));
  } else {
    calculatedProductsForMinSale = products.map((product) => calculatePricing(product, paramsForMinSale, cfu));
  }
  const summaryDataMinSale = calculateGlobalSummary(calculatedProductsForMinSale, paramsForMinSale, totalFixedExpenses, totalProductAcquisitionCost, totalVariableExpensesPercent, 0);

  // Calculate totalOptionCost only if both Simples Nacional scenarios are valid
  let totalOptionCost = 0;
  if (params.taxRegime === TaxRegime.SimplesNacional) {
    const summaryStandard = calculateGlobalSummary(calculatedProductsStandard, { ...params, generateIvaCredit: false }, totalFixedExpenses, totalProductAcquisitionCost, totalVariableExpensesPercent);
    const summaryHybrid = calculateGlobalSummary(calculatedProductsHybrid, { ...params, generateIvaCredit: true }, totalFixedExpenses, totalProductAcquisitionCost, totalVariableExpensesPercent);
    
    if (summaryStandard.totalTax !== 0 || summaryHybrid.totalTax !== 0) {
      totalOptionCost = summaryHybrid.totalTax - summaryStandard.totalTax;
    }
  }

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
            <React.Fragment>
              <strong>Alíquotas:</strong> CBS ({formatPercent(CBS_RATE * 100)}), IBS ({formatPercent(IBS_RATE * 100)}), IRPJ ({formatPercent(params.irpjRate)}), CSLL ({formatPercent(params.csllRate)})
            </React.Fragment>
          ) : (
            <React.Fragment>
              <strong>Alíquota Cheia Simples:</strong> {formatPercent(params.simplesNacionalRate)}
              {params.generateIvaCredit && (
                <React.Fragment>
                  <br/><strong>Alíquota Remanescente Simples:</strong> {formatPercent(params.simplesNacionalRemanescenteRate)}
                  <br/><strong>Alíquotas IVA:</strong> CBS ({formatPercent(CBS_RATE * 100)}), IBS ({formatPercent(IBS_RATE * 100)})
                </React.Fragment>
              )}
            </React.Fragment>
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
              {/* Novas colunas para unidade interna */}
              <TableHead className="text-right" rowSpan={2}>Qtd. Interna</TableHead>
              <TableHead className="text-right" rowSpan={2}>Custo Unid. Int.</TableHead>
              <TableHead className="text-right" rowSpan={2}>Venda Mín. Unid. Int.</TableHead>
              <TableHead className="text-right" rowSpan={2}>Venda Sug. Unid. Int.</TableHead>
              
              {params.taxRegime === TaxRegime.SimplesNacional ? (
                <React.Fragment>
                  <TableHead colSpan={5} className="text-center border-l border-r">Simples Nacional Padrão</TableHead> {/* 5 colunas */}
                  <TableHead colSpan={6} className="text-center border-l border-r">Simples Nacional Híbrido (IVA por Fora)</TableHead> {/* 6 colunas */}
                  <TableHead rowSpan={2} className="text-right">Custo da Opção (R$)</TableHead>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <TableHead colSpan={10} className="text-center">Lucro Presumido</TableHead> {/* 10 colunas */}
                </React.Fragment>
              )}
            </TableRow>
            <TableRow>
              {params.taxRegime === TaxRegime.SimplesNacional ? (
                <React.Fragment>
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
                </React.Fragment>
              ) : (
                <React.Fragment>
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
                </React.Fragment>
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
                    {/* Dados de unidade interna */}
                    <TableCell className="text-right font-mono text-xs">{productStandard.innerQuantity}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(productStandard.costPerInnerUnit)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-yellow-500">
                      {formatCurrency(productStandard.minSellingPricePerInnerUnit)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-primary">
                      {formatCurrency(productStandard.sellingPricePerInnerUnit)}
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
                    {/* Dados de unidade interna */}
                    <TableCell className="text-right font-mono text-xs">{product.innerQuantity}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(product.costPerInnerUnit)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-yellow-500">
                      {formatCurrency(product.minSellingPricePerInnerUnit)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-primary">
                      {formatCurrency(product.sellingPricePerInnerUnit)}
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

      {/* New Summary Sections - now stacked vertically */}
      <div className="space-y-6"> {/* Removed grid classes here */}
        <CostSummary
          totalProductAcquisitionCost={totalProductAcquisitionCost}
          totalFixedExpenses={totalFixedExpenses}
          cfu={cfu}
        />
        <SalesSummary
          totalSellingBestSale={summaryDataBestSale.totalSelling}
          totalSellingMinSale={summaryDataMinSale.totalSelling}
          breakEvenPoint={summaryDataBestSale.breakEvenPoint}
        />
        <ExpenseSummary
          totalFixedExpenses={totalFixedExpenses}
          totalVariableExpensesValueBestSale={summaryDataBestSale.totalVariableExpensesValue}
          totalVariableExpensesValueMinSale={summaryDataMinSale.totalVariableExpensesValue}
        />
        <TaxSummary
          params={params}
          summaryDataBestSale={summaryDataBestSale}
          summaryDataMinSale={summaryDataMinSale}
          totalOptionCost={totalOptionCost}
        />
      </div>

      <OverallResultSummary
        totalProductAcquisitionCost={totalProductAcquisitionCost}
        totalFixedExpenses={totalFixedExpenses}
        totalVariableExpensesPercent={totalVariableExpensesPercent}
        summaryDataBestSale={summaryDataBestSale}
        summaryDataMinSale={summaryDataMinSale}
      />

      <p className="text-xs text-muted-foreground mt-4">
        *Esta é uma simulação baseada nas propostas da Reforma Tributária. Os valores e regras finais dependem da aprovação das Leis Complementares.
      </p>
    </div>
  );
};