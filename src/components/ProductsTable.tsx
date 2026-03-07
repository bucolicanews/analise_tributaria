import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Product, CalculationParams, CalculatedProduct, TaxRegime, StrategicData } from "@/types/pricing";
import { calculatePricing } from "@/lib/pricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CostSummaryUnitary } from './summary/CostSummaryUnitary';
import { CostSummaryTotal } from './summary/CostSummaryTotal';
import { TaxSummary } from './summary/TaxSummary';
import { ExpenseSummary } from './summary/ExpenseSummary';
import { OverallResultSummary } from './summary/OverallResultSummary';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { SalesSummaryTotal } from './summary/SalesSummaryTotal';
import { SalesSummaryUnitary } from './summary/SalesSummaryUnitary';
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, AlertTriangle, FileText, BrainCircuit } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExecutiveSummary } from './summary/ExecutiveSummary';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ProductTaxDetails } from './ProductTaxDetails';
import { ProductStrategicDetails } from './ProductStrategicDetails';
import { getClassificationDetails } from '@/lib/tax/taxClassificationService';

interface ProductsTableProps {
  products: Product[];
  params: CalculationParams;
  selectedProductCodes: Set<string>;
  onSelectionChange: (newSelection: Set<string>) => void;
}

export interface GlobalSummaryData {
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
  totalIrpjToPay: number;
  totalCsllToPay: number;
  totalSimplesToPay: number;
  totalSelectiveTaxToPay: number;
  totalIvaCreditForClient: number;
}

const calculateGlobalSummary = (
  productsToSummarize: CalculatedProduct[],
  currentParams: CalculationParams,
  globalFixedExpenses: number,
  totalVariableExpensesPercent: number,
  cfu: number,
  totalInnerUnitsInXML: number,
  profitMarginOverride?: number
): GlobalSummaryData => {
  const defaultSummary: GlobalSummaryData = { totalSelling: 0, totalTax: 0, totalProfit: 0, profitMarginPercent: 0, breakEvenPoint: 0, totalVariableExpensesValue: 0, totalContributionMargin: 0, totalTaxPercent: 0, totalCbsCredit: 0, totalIbsCredit: 0, totalCbsDebit: 0, totalIbsDebit: 0, totalCbsTaxToPay: 0, totalIbsTaxToPay: 0, totalIrpjToPay: 0, totalCsllToPay: 0, totalSimplesToPay: 0, totalSelectiveTaxToPay: 0, totalIvaCreditForClient: 0 };
  if (productsToSummarize.length === 0) return defaultSummary;

  const totalSellingSum = productsToSummarize.reduce((sum, p) => sum + p.sellingPrice * p.quantity, 0);
  const totalTaxSum = productsToSummarize.reduce((sum, p) => sum + p.taxToPay * p.quantity, 0);
  const totalProfitSum = productsToSummarize.reduce((sum, p) => sum + p.valueForProfit * p.quantity, 0);
  const totalVariableExpensesValueSum = productsToSummarize.reduce((sum, p) => sum + p.valueForVariableExpenses * p.quantity, 0);
  const totalContributionMarginSum = productsToSummarize.reduce((sum, p) => sum + p.contributionMargin * p.quantity, 0);
  const totalCbsCreditSum = productsToSummarize.reduce((sum, p) => sum + p.cbsCredit * p.quantity, 0);
  const totalIbsCreditSum = productsToSummarize.reduce((sum, p) => sum + p.ibsCredit * p.quantity, 0);
  const totalCbsDebitSum = productsToSummarize.reduce((sum, p) => sum + p.cbsDebit * p.quantity, 0);
  const totalIbsDebitSum = productsToSummarize.reduce((sum, p) => sum + p.ibsDebit * p.quantity, 0);
  const totalCbsTaxToPaySum = productsToSummarize.reduce((sum, p) => sum + p.cbsTaxToPay * p.quantity, 0);
  const totalIbsTaxToPaySum = productsToSummarize.reduce((sum, p) => sum + p.ibsTaxToPay * p.quantity, 0);
  const totalIrpjToPaySum = productsToSummarize.reduce((sum, p) => sum + p.irpjToPay * p.quantity, 0);
  const totalCsllToPaySum = productsToSummarize.reduce((sum, p) => sum + p.csllToPay * p.quantity, 0);
  const totalSimplesToPaySum = productsToSummarize.reduce((sum, p) => sum + p.simplesToPay * p.quantity, 0);
  const totalSelectiveTaxToPaySum = productsToSummarize.reduce((sum, p) => sum + p.selectiveTaxToPay * p.quantity, 0);
  const totalIvaCreditForClientSum = productsToSummarize.reduce((sum, p) => sum + p.ivaCreditForClient * p.quantity, 0);

  const profitMarginPercent = totalSellingSum > 0 ? (totalProfitSum / totalSellingSum) * 100 : 0;
  const totalTaxPercent = totalSellingSum > 0 ? (totalTaxSum / totalSellingSum) * 100 : 0;

  let totalVariableCostsRatio = totalVariableExpensesPercent / 100;
  const cbsRateEffective = currentParams.useCbsDebit ? currentParams.cbsRate / 100 : 0;
  const ibsRateEffective = (currentParams.ibsRate / 100) * (currentParams.ibsDebitPercentage / 100);
  const selectiveTaxRateEffective = currentParams.useSelectiveTaxDebit ? currentParams.defaultSelectiveTaxRate / 100 : 0;

  if (currentParams.taxRegime === TaxRegime.LucroPresumido) {
    totalVariableCostsRatio += cbsRateEffective + ibsRateEffective + (currentParams.irpjRate / 100) + (currentParams.csllRate / 100) + selectiveTaxRateEffective;
  } else if (currentParams.taxRegime === TaxRegime.LucroReal) {
    totalVariableCostsRatio += cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective;
  } else {
    if (currentParams.generateIvaCredit) {
      totalVariableCostsRatio += (currentParams.simplesNacionalRate / 100) + cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective;
    } else {
      totalVariableCostsRatio += (currentParams.simplesNacionalRate / 100) + selectiveTaxRateEffective;
    }
  }

  const contributionMarginRatio = 1 - totalVariableCostsRatio;
  const breakEvenPoint = contributionMarginRatio > 0 ? globalFixedExpenses / contributionMarginRatio : 0;

  return { totalSelling: totalSellingSum, totalTax: totalTaxSum, totalProfit: totalProfitSum, profitMarginPercent, breakEvenPoint, totalVariableExpensesValue: totalVariableExpensesValueSum, totalContributionMargin: totalContributionMarginSum, totalTaxPercent, totalCbsCredit: totalCbsCreditSum, totalIbsCredit: totalIbsCreditSum, totalCbsDebit: totalCbsDebitSum, totalIbsDebit: totalIbsDebitSum, totalCbsTaxToPay: totalCbsTaxToPaySum, totalIbsTaxToPay: totalIbsTaxToPaySum, totalIrpjToPay: totalIrpjToPaySum, totalCsllToPay: totalCsllToPaySum, totalSimplesToPay: totalSimplesToPaySum, totalSelectiveTaxToPay: totalSelectiveTaxToPaySum, totalIvaCreditForClient: totalIvaCreditForClientSum };
};

export const ProductsTable: React.FC<ProductsTableProps> = ({ products, params, selectedProductCodes, onSelectionChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [editingProduct, setEditingProduct] = useState<CalculatedProduct | null>(null);
  const [strategicDataMap, setStrategicDataMap] = useState<Map<string, StrategicData>>(new Map());

  if (!products || products.length === 0) return null;

  const allProductCodes = products.map(p => p.code);
  const isAllSelected = selectedProductCodes.size === products.length && products.length > 0;
  const isIndeterminate = selectedProductCodes.size > 0 && selectedProductCodes.size < products.length;

  const handleToggleAll = (checked: boolean) => onSelectionChange(checked ? new Set(allProductCodes) : new Set());
  const handleToggleProduct = (code: string, checked: boolean) => {
    const newSelection = new Set(selectedProductCodes);
    if (checked) newSelection.add(code);
    else newSelection.delete(code);
    onSelectionChange(newSelection);
  };

  const handleSaveStrategicData = (productCode: string, data: StrategicData) => {
    const newMap = new Map(strategicDataMap);
    newMap.set(productCode, data);
    setStrategicDataMap(newMap);
  };

  const {
    summaryDataBestSale,
    summaryDataMinSale,
    cumpData,
    totalProductAcquisitionCostBeforeLoss,
    totalProductAcquisitionCostAdjusted,
    totalInnerUnitsInXML,
    totalFixedExpenses,
    totalVariableExpensesPercent,
    totalOptionCost,
    allCalculatedProducts,
    cfu
  } = useMemo(() => {
    const productsToCalculate = products.filter(p => selectedProductCodes.has(p.code));
    const totalFixedExpenses = params.fixedCostsTotal || 0;
    const cfu = params.totalStockUnits > 0 ? totalFixedExpenses / params.totalStockUnits : 0;

    const totalVariableExpensesPercent = params.variableExpenses.reduce((sum, exp) => sum + exp.percentage, 0);
    const totalProductAcquisitionCostBeforeLoss = productsToCalculate.reduce((sum, p) => sum + p.cost * p.quantity, 0);
    let totalProductAcquisitionCostAdjusted = totalProductAcquisitionCostBeforeLoss;
    if (params.lossPercentage > 0 && params.lossPercentage < 100) {
      totalProductAcquisitionCostAdjusted = totalProductAcquisitionCostBeforeLoss / (1 - params.lossPercentage / 100);
    } else if (params.lossPercentage >= 100) {
      totalProductAcquisitionCostAdjusted = Infinity;
    }
    const totalInnerUnitsInXML = productsToCalculate.reduce((sum, p) => sum + p.quantity * p.innerQuantity, 0);

    let calculatedProductsForBestSale: CalculatedProduct[];
    let calculatedProductsForMinSale: CalculatedProduct[];
    let totalOptionCost = 0;

    if (params.taxRegime === TaxRegime.SimplesNacional) {
      const standard = productsToCalculate.map(p => calculatePricing(p, { ...params, generateIvaCredit: false }, cfu));
      const hybrid = productsToCalculate.map(p => calculatePricing(p, { ...params, generateIvaCredit: true }, cfu));
      calculatedProductsForBestSale = params.generateIvaCredit ? hybrid : standard;
      
      const paramsForMinSale = { ...params, profitMargin: 0 };
      calculatedProductsForMinSale = params.generateIvaCredit
        ? productsToCalculate.map(p => calculatePricing(p, { ...paramsForMinSale, generateIvaCredit: true }, cfu))
        : productsToCalculate.map(p => calculatePricing(p, { ...paramsForMinSale, generateIvaCredit: false }, cfu));

      const summaryStandard = calculateGlobalSummary(standard, { ...params, generateIvaCredit: false }, totalFixedExpenses, totalVariableExpensesPercent, cfu, totalInnerUnitsInXML);
      const summaryHybrid = calculateGlobalSummary(hybrid, { ...params, generateIvaCredit: true }, totalFixedExpenses, totalVariableExpensesPercent, cfu, totalInnerUnitsInXML);
      totalOptionCost = summaryHybrid.totalTax - summaryStandard.totalTax;
    } else {
      calculatedProductsForBestSale = productsToCalculate.map(p => calculatePricing(p, params, cfu));
      calculatedProductsForMinSale = productsToCalculate.map(p => calculatePricing(p, { ...params, profitMargin: 0 }, cfu));
    }

    const summaryDataBestSale = calculateGlobalSummary(calculatedProductsForBestSale, params, totalFixedExpenses, totalVariableExpensesPercent, cfu, totalInnerUnitsInXML);
    const summaryDataMinSale = calculateGlobalSummary(calculatedProductsForMinSale, { ...params, profitMargin: 0 }, totalFixedExpenses, totalVariableExpensesPercent, cfu, totalInnerUnitsInXML);

    let cumpData = null;
    if (totalInnerUnitsInXML > 0) {
      cumpData = {
        cumpBruto: totalProductAcquisitionCostBeforeLoss / totalInnerUnitsInXML,
        cumpPlusLoss: totalProductAcquisitionCostAdjusted / totalInnerUnitsInXML,
        cumpTotal: (totalProductAcquisitionCostAdjusted / totalInnerUnitsInXML) + cfu,
        cfu,
      };
    }
    
    const allCalculatedProducts = products.map(p => {
      const calculated = calculatePricing(p, params, cfu);
      return { ...calculated, strategicData: strategicDataMap.get(p.code) };
    });

    return { summaryDataBestSale, summaryDataMinSale, cumpData, totalProductAcquisitionCostBeforeLoss, totalProductAcquisitionCostAdjusted, totalInnerUnitsInXML, totalFixedExpenses, totalVariableExpensesPercent, totalOptionCost, allCalculatedProducts, cfu };
  }, [products, params, selectedProductCodes, strategicDataMap]);

  useEffect(() => {
    if (products.length > 0 && params.totalStockUnits === 0) {
      toast.warning("Estoque Total de Unidades (ETU) é zero.", {
        description: "O rateio de custos fixos não será aplicado. Insira um valor maior que zero.",
        duration: 5000,
      });
    }
  }, [products.length, params.totalStockUnits]);

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  const formatPercent = (value: number) => new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100);

  const lowerCaseSearchTerm = searchTerm.toLowerCase();
  const filteredProducts = useMemo(() => allCalculatedProducts.filter(p => 
    p.code.toLowerCase().includes(lowerCaseSearchTerm) || p.name.toLowerCase().includes(lowerCaseSearchTerm)
  ), [allCalculatedProducts, lowerCaseSearchTerm]);

  const totalItems = filteredProducts.length;
  const effectiveItemsPerPage = itemsPerPage === Number.MAX_SAFE_INTEGER ? totalItems : itemsPerPage;
  const totalPages = Math.ceil(totalItems / effectiveItemsPerPage);
  const startIndex = (currentPage - 1) * effectiveItemsPerPage;
  const endIndex = startIndex + effectiveItemsPerPage;
  const productsToRender = filteredProducts.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, products, itemsPerPage]);

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const handlePreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const handleItemsPerPageChange = (value: string) => setItemsPerPage(value === 'all' ? Number.MAX_SAFE_INTEGER : parseInt(value, 10));

  const unitVariableExpensesBestSale = totalInnerUnitsInXML > 0 ? summaryDataBestSale.totalVariableExpensesValue / totalInnerUnitsInXML : 0;
  const isProfitNegative = summaryDataBestSale.totalProfit < 0;
  const isCfuCritical = cfu > unitVariableExpensesBestSale;
  const TAX_THRESHOLD = 30;
  const isTaxHigh = summaryDataBestSale.totalTaxPercent > TAX_THRESHOLD;

  const profitAlert = isProfitNegative && (
    <Alert variant="destructive" className="mt-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Alerta Crítico: Lucro Líquido Negativo</AlertTitle>
      <AlertDescription>O Lucro Líquido Total da Nota ({formatCurrency(summaryDataBestSale.totalProfit)}) está negativo. O preço de venda não cobre todos os custos e despesas.</AlertDescription>
    </Alert>
  );
  const cfuAlert = isCfuCritical && (
    <Alert variant="destructive" className="mt-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Atenção: Custo Fixo Rateado (CFU) Crítico</AlertTitle>
      <AlertDescription>O Custo Fixo por Unidade (CFU) de <strong>{formatCurrency(cfu)}</strong> é superior à Despesa Variável Unitária, indicando alta dependência de volume para cobrir custos fixos.</AlertDescription>
    </Alert>
  );
  const taxAlert = isTaxHigh && (
    <Alert variant="destructive" className="mt-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Alerta: Carga Tributária Elevada</AlertTitle>
      <AlertDescription>A carga tributária líquida ({summaryDataBestSale.totalTaxPercent.toFixed(2)}%) está acima do limite de atenção de {TAX_THRESHOLD}%. Verifique se o regime tributário é o mais vantajoso.</AlertDescription>
    </Alert>
  );

  return (
    <div className="space-y-6">
      <Dialog open={!!editingProduct} onOpenChange={(isOpen) => !isOpen && setEditingProduct(null)}>
        <DialogContent className="sm:max-w-lg">
          {editingProduct && <ProductStrategicDetails product={editingProduct} onSave={handleSaveStrategicData} />}
        </DialogContent>
      </Dialog>

      <ExecutiveSummary
        summaryDataBestSale={summaryDataBestSale}
        cumpData={cumpData}
        totalProductAcquisitionCostAdjusted={totalProductAcquisitionCostAdjusted}
        totalInnerUnitsInXML={totalInnerUnitsInXML}
        params={params}
        totalProductAcquisitionCostBeforeLoss={totalProductAcquisitionCostBeforeLoss}
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleToggleAll(true)} disabled={isAllSelected}>Marcar Todos</Button>
          <Button variant="outline" size="sm" onClick={() => handleToggleAll(false)} disabled={selectedProductCodes.size === 0}>Limpar Todos</Button>
        </div>
        <Input placeholder="Buscar produto por código ou nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1" />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"><Checkbox checked={isAllSelected} onCheckedChange={handleToggleAll} aria-label="Selecionar todos" className={cn(isIndeterminate && "bg-primary")} /></TableHead>
              <TableHead>Código</TableHead>
              <TableHead className="min-w-[300px]">Produto</TableHead>
              <TableHead>Ações</TableHead>
              <TableHead>CST / cClassTrib</TableHead>
              <TableHead>Unid. Com.</TableHead>
              <TableHead className="text-right">Qtd. Estoque</TableHead>
              <TableHead className="text-right">Custo Aquisição (Unit)</TableHead>
              <TableHead className="text-right">Custo Fixo Rateado (Unit)</TableHead>
              <TableHead className="text-right">Custo Total Base (Unit)</TableHead>
              <TableHead className="text-right">Markup %</TableHead>
              <TableHead className="text-right">Qtd. Interna</TableHead>
              <TableHead className="text-right">Custo Unid. Int.</TableHead>
              <TableHead className="text-right">Venda Mín. Unid. Int.</TableHead>
              <TableHead className="text-right">Venda Sug. Unid. Int.</TableHead>
              <TableHead className="text-right">Venda Mín. Com.</TableHead>
              <TableHead className="text-right">Venda Sug. Com.</TableHead>
              <TableHead className="text-right">Imposto Líq.</TableHead>
              <TableHead className="text-right">Margem %</TableHead>
              <TableHead className="text-right">Crédito Cliente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsToRender.map((product, index) => {
              const isSelected = selectedProductCodes.has(product.code);
              const fixedCostPerCommercialUnit = cfu * product.innerQuantity;
              const productProfit = product.sellingPrice - product.cost - product.taxToPay - (product.sellingPrice * (totalVariableExpensesPercent / 100)) - fixedCostPerCommercialUnit;
              const productProfitMargin = product.sellingPrice > 0 ? (productProfit / product.sellingPrice) * 100 : 0;
              
              const classification = product.cClassTrib ? getClassificationDetails(product.cClassTrib) : null;
              const cstFormat = classification?.cst?.code?.toString().padStart(2, '0') || '00';
              const classFormat = product.cClassTrib?.toString().padStart(6, '0') || '000001';

              return (
                <TableRow key={index} className={cn(!isSelected && "opacity-50 hover:opacity-100 transition-opacity")}>
                  <TableCell><Checkbox checked={isSelected} onCheckedChange={(checked) => handleToggleProduct(product.code, !!checked)} /></TableCell>
                  <TableCell className="font-mono text-xs">{product.code}</TableCell>
                  <TableCell className="max-w-[300px] whitespace-normal text-left">{product.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditingProduct(product)}><BrainCircuit className="h-4 w-4" /></Button>
                      <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="ghost" size="icon"><FileText className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
                           <ProductTaxDetails product={product} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[10px] whitespace-nowrap bg-primary/5 font-semibold border-x border-primary/10">
                    <span className="text-muted-foreground">{cstFormat}</span> / <span className="text-primary">{classFormat}</span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{product.unit}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{product.quantity}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(product.cost)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">{formatCurrency(fixedCostPerCommercialUnit)}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(product.cost + fixedCostPerCommercialUnit)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-accent">{formatPercent(product.markupPercentage)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{product.innerQuantity}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(product.costPerInnerUnit)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-yellow-500">{formatCurrency(product.minSellingPricePerInnerUnit)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-primary">{formatCurrency(product.sellingPricePerInnerUnit)}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-bold text-yellow-500">{formatCurrency(product.minSellingPrice)}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-bold text-primary">{formatCurrency(product.sellingPrice)}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(product.taxToPay)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-success">{formatPercent(productProfitMargin)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-success">{formatCurrency(product.ivaCreditForClient)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between py-2 gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Itens por página:
            <Select value={String(itemsPerPage === Number.MAX_SAFE_INTEGER ? 'all' : itemsPerPage)} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem><SelectItem value="30">30</SelectItem><SelectItem value="50">50</SelectItem><SelectItem value="100">100</SelectItem><SelectItem value="150">150</SelectItem><SelectItem value="200">200</SelectItem><SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">Página {currentPage} de {totalPages} ({totalItems} produtos)</div>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4 mr-1" /> Anterior</Button>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>Próxima <ChevronRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <CostSummaryTotal totalProductAcquisitionCostBeforeLoss={totalProductAcquisitionCostBeforeLoss} totalProductAcquisitionCostAdjusted={totalProductAcquisitionCostAdjusted} cfu={cfu} totalInnerUnitsInXML={totalInnerUnitsInXML} />
        {cumpData && <CostSummaryUnitary cumpData={cumpData} />}
        <SalesSummaryTotal totalSellingBestSale={summaryDataBestSale.totalSelling} totalSellingMinSale={summaryDataMinSale.totalSelling} />
        <SalesSummaryUnitary totalSellingBestSale={summaryDataBestSale.totalSelling} totalSellingMinSale={summaryDataMinSale.totalSelling} totalInnerUnitsInXML={totalInnerUnitsInXML} />
        <ExpenseSummary totalFixedExpenses={totalFixedExpenses} totalVariableExpensesValueBestSale={summaryDataBestSale.totalVariableExpensesValue} totalVariableExpensesValueMinSale={summaryDataMinSale.totalVariableExpensesValue} cfu={cfu} totalInnerUnitsInXML={totalInnerUnitsInXML} />
        {cfu > 0 && cfuAlert}
        <TaxSummary params={params} summaryDataBestSale={summaryDataBestSale} summaryDataMinSale={summaryDataMinSale} totalOptionCost={totalOptionCost} />
        {(params.taxRegime === TaxRegime.LucroPresumido || params.taxRegime === TaxRegime.LucroReal) && taxAlert}
        {profitAlert}
      </div>

      <OverallResultSummary totalProductAcquisitionCost={totalProductAcquisitionCostAdjusted} totalFixedExpenses={totalFixedExpenses} totalVariableExpensesPercent={totalVariableExpensesPercent} summaryDataBestSale={summaryDataBestSale} summaryDataMinSale={summaryDataMinSale} cfu={cfu} totalInnerUnitsInXML={totalInnerUnitsInXML} />

      <p className="text-xs text-muted-foreground mt-4">*Esta é uma simulação baseada nas propostas da Reforma Tributária. Os valores e regras finais dependem da aprovação das Leis Complementares.</p>
    </div>
  );
};