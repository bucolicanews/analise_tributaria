import React, { useState, useMemo, useEffect } from 'react';
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
import { CostSummaryUnitary } from './summary/CostSummaryUnitary';
import { CostSummaryTotal } from './summary/CostSummaryTotal';
import { TaxSummary } from './summary/TaxSummary';
import { ExpenseSummary } from './summary/ExpenseSummary';
import { OverallResultSummary } from './summary/OverallResultSummary';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { SalesSummaryTotal } from './summary/SalesSummaryTotal';
import { SalesSummaryUnitary } from './summary/SalesSummaryUnitary';
import { Input } from "@/components/ui/input"; // Importando Input
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExecutiveSummary } from './summary/ExecutiveSummary'; // Importando o novo resumo executivo
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Importando Alert

interface ProductsTableProps {
  products: Product[];
  params: CalculationParams;
  onSummaryCalculated: (summary: GlobalSummaryData) => void;
  selectedProductCodes: Set<string>;
  onSelectionChange: (newSelection: Set<string>) => void;
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
  globalFixedExpenses: number, // This is the total fixed expenses of the company
  xmlProductAcquisitionCostAdjusted: number, // This is the total acquisition cost of products in THIS XML (adjusted for loss)
  totalVariableExpensesPercent: number,
  cfu: number, // Custo Fixo por Unidade (per inner unit/stock unit)
  totalInnerUnitsInXML: number, // Total quantity of INNER units in THIS XML (used for fixed cost allocation)
  profitMarginOverride?: number // New parameter to allow overriding profit margin for min sale
): GlobalSummaryData => {

  const effectiveProfitMargin = profitMarginOverride !== undefined ? profitMarginOverride : currentParams.profitMargin;

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

  if (productsToSummarize.length === 0) {
    return defaultSummary;
  }

  // Summing up values directly from the calculated products
  // Note: All calculated values (sellingPrice, taxToPay, valueForProfit, etc.) are per COMMERCIAL unit.
  // We multiply by product.quantity (commercial units) to get the total value for the note.
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
  const totalIvaCreditForClientSum = productsToSummarize.reduce((sum, p) => sum + p.ivaCreditForClient * p.quantity, 0);

  const profitMarginPercent = totalSellingSum > 0 ? (totalProfitSum / totalSellingSum) * 100 : 0;
  const totalTaxPercent = totalSellingSum > 0 ? (totalTaxSum / totalSellingSum) * 100 : 0;

  // Recalculate total variable expenses ratio including taxes that vary with sales
  let totalVariableCostsRatio = totalVariableExpensesPercent / 100;
  if (currentParams.taxRegime === TaxRegime.LucroPresumido) {
    totalVariableCostsRatio += CBS_RATE + IBS_RATE + (currentParams.irpjRate / 100) + (currentParams.csllRate / 100);
  } else { // Simples Nacional
    if (currentParams.generateIvaCredit) {
      totalVariableCostsRatio += (currentParams.simplesNacionalRemanescenteRate / 100) + CBS_RATE + IBS_RATE;
    } else {
      totalVariableCostsRatio += currentParams.simplesNacionalRate / 100;
    }
  }

  // Contribution Margin Ratio (CMR)
  const contributionMarginRatio = 1 - totalVariableCostsRatio;

  // Break-even point calculation (using global fixed expenses and company-wide contribution margin ratio)
  const breakEvenPoint = contributionMarginRatio > 0 ? globalFixedExpenses / contributionMarginRatio : 0;


  return {
    totalSelling: totalSellingSum,
    totalTax: totalTaxSum,
    totalProfit: totalProfitSum,
    profitMarginPercent: profitMarginPercent,
    breakEvenPoint: breakEvenPoint,
    totalVariableExpensesValue: totalVariableExpensesValueSum,
    totalContributionMargin: totalContributionMarginSum,
    totalTaxPercent: totalTaxPercent,
    totalCbsCredit: totalCbsCreditSum,
    totalIbsCredit: totalIbsCreditSum,
    totalCbsDebit: totalCbsDebitSum,
    totalIbsDebit: totalIbsDebitSum,
    totalCbsTaxToPay: totalCbsTaxToPaySum,
    totalIbsTaxToPay: totalIbsTaxToPaySum,
    totalIrpjToPay: totalIrpjToPaySum,
    totalCsllToPay: totalCsllToPaySum,
    totalSimplesToPay: totalSimplesToPaySum,
    totalIvaCreditForClient: totalIvaCreditForClientSum,
  };
};

export const ProductsTable: React.FC<ProductsTableProps> = ({ products, params, onSummaryCalculated, selectedProductCodes, onSelectionChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100); // Novo estado para itens por página

  // Early return if no products to display
  if (!products || products.length === 0) {
    return null;
  }

  // --- Lógica de Seleção ---
  const allProductCodes = products.map(p => p.code);
  const isAllSelected = selectedProductCodes.size === products.length && products.length > 0;
  const isIndeterminate = selectedProductCodes.size > 0 && selectedProductCodes.size < products.length;

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(new Set(allProductCodes));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleToggleProduct = (code: string, checked: boolean) => {
    const newSelection = new Set(selectedProductCodes);
    if (checked) {
      newSelection.add(code);
    } else {
      newSelection.delete(code);
    }
    onSelectionChange(newSelection);
  };

  // 1. Filtrar produtos para cálculo e exibição (apenas os selecionados)
  const productsToCalculate = products.filter(p => selectedProductCodes.has(p.code));

  // 2. Consolidar Custos Fixos Totais (CFT)
  const totalFixedExpenses = params.fixedExpenses.reduce((sum, exp) => sum + exp.value, 0) + params.payroll;

  // 3. Calcular Custo Fixo por Unidade (CFU)
  let cfu = 0;
  if (params.totalStockUnits > 0) {
    cfu = totalFixedExpenses / params.totalStockUnits;
  } else {
    // Only show warning if products are present, otherwise it's noisy on initial load
    if (products.length > 0) {
      toast.warning("Estoque Total de Unidades (ETU) é zero.", {
        description: "O rateio de custos fixos não será aplicado. Por favor, insira um valor maior que zero para o ETU.",
        duration: 5000,
      });
    }
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

  // --- Cálculo dos Produtos para os Cenários (apenas produtos selecionados) ---
  let calculatedProductsStandard: CalculatedProduct[] = [];
  let calculatedProductsHybrid: CalculatedProduct[] = [];
  let calculatedProductsPresumido: CalculatedProduct[] = [];

  if (params.taxRegime === TaxRegime.SimplesNacional) {
    calculatedProductsStandard = productsToCalculate.map((product) =>
      calculatePricing(product, { ...params, generateIvaCredit: false }, cfu)
    );
    calculatedProductsHybrid = productsToCalculate.map((product) =>
      calculatePricing(product, { ...params, generateIvaCredit: true }, cfu)
    );
  } else { // Lucro Presumido
    calculatedProductsPresumido = productsToCalculate.map((product) =>
      calculatePricing(product, params, cfu)
    );
  }

  // --- Cálculos para o Resumo Global ---
  const totalVariableExpensesPercent = params.variableExpenses.reduce(
    (sum, exp) => sum + exp.percentage,
    0
  );

  // Custo Bruto Total (Acquisition Cost before loss adjustment) - APENAS DOS SELECIONADOS
  const totalProductAcquisitionCostBeforeLoss = productsToCalculate.reduce((sum, p) => sum + p.cost * p.quantity, 0);

  // Custo Ajustado Total (Acquisition Cost adjusted for loss) - APENAS DOS SELECIONADOS
  let totalProductAcquisitionCostAdjusted = totalProductAcquisitionCostBeforeLoss;
  if (params.lossPercentage > 0 && params.lossPercentage < 100) {
    if (totalProductAcquisitionCostBeforeLoss > 0) {
        totalProductAcquisitionCostAdjusted = totalProductAcquisitionCostBeforeLoss / (1 - params.lossPercentage / 100);
    } else {
        totalProductAcquisitionCostAdjusted = 0;
    }
  } else if (params.lossPercentage >= 100) {
    totalProductAcquisitionCostAdjusted = Infinity;
  }

  // Calculate total quantity of INNER units in the XML (APENAS DOS SELECIONADOS)
  const totalInnerUnitsInXML = productsToCalculate.reduce((sum, p) => sum + p.quantity * p.innerQuantity, 0);
  
  // Total units used for fixed cost allocation (CFU is per inner unit/stock unit)
  const totalUnitsForFixedCostAllocation = totalInnerUnitsInXML;


  // Determine the set of calculated products for the current regime/scenario
  let calculatedProductsForBestSale: CalculatedProduct[];
  if (params.taxRegime === TaxRegime.SimplesNacional) {
    calculatedProductsForBestSale = params.generateIvaCredit ? calculatedProductsHybrid : calculatedProductsStandard;
  } else {
    calculatedProductsForBestSale = calculatedProductsPresumido;
  }

  // Calculate summary for "Best Sale" (with target profit margin)
  const summaryDataBestSale = calculateGlobalSummary(
    calculatedProductsForBestSale,
    params,
    totalFixedExpenses,
    totalProductAcquisitionCostAdjusted, // Use adjusted cost for summary calculations
    totalVariableExpensesPercent,
    cfu,
    totalUnitsForFixedCostAllocation, // Pass total inner units
    params.profitMargin
  );

  // Use useEffect to call onSummaryCalculated when summaryDataBestSale changes
  useEffect(() => {
    if (summaryDataBestSale) {
      onSummaryCalculated(summaryDataBestSale);
    }
  }, [summaryDataBestSale, onSummaryCalculated]);


  // Calculate summary for "Minimum Sale" (with 0% profit margin)
  const paramsForMinSale = { ...params, profitMargin: 0 };
  let calculatedProductsForMinSale: CalculatedProduct[];

  if (params.taxRegime === TaxRegime.SimplesNacional) {
    calculatedProductsForMinSale = params.generateIvaCredit ? 
      productsToCalculate.map((product) => calculatePricing(product, { ...paramsForMinSale, generateIvaCredit: true }, cfu)) :
      productsToCalculate.map((product) => calculatePricing(product, { ...paramsForMinSale, generateIvaCredit: false }, cfu));
  } else {
    calculatedProductsForMinSale = productsToCalculate.map((product) => calculatePricing(product, paramsForMinSale, cfu));
  }
  const summaryDataMinSale = calculateGlobalSummary(
    calculatedProductsForMinSale,
    paramsForMinSale,
    totalFixedExpenses,
    totalProductAcquisitionCostAdjusted, // Use adjusted cost for summary calculations
    totalVariableExpensesPercent,
    cfu,
    totalUnitsForFixedCostAllocation, // Pass total inner units
    0
  );

  // Calculate totalOptionCost only if both Simples Nacional scenarios are valid
  let totalOptionCost = 0;
  if (params.taxRegime === TaxRegime.SimplesNacional) {
    const summaryStandard = calculateGlobalSummary(
      calculatedProductsStandard,
      { ...params, generateIvaCredit: false },
      totalFixedExpenses,
      totalProductAcquisitionCostAdjusted,
      totalVariableExpensesPercent,
      cfu,
      totalUnitsForFixedCostAllocation
    );
    const summaryHybrid = calculateGlobalSummary(
      calculatedProductsHybrid,
      { ...params, generateIvaCredit: true },
      totalFixedExpenses,
      totalProductAcquisitionCostAdjusted,
      totalVariableExpensesPercent,
      cfu,
      totalUnitsForFixedCostAllocation
    );
    
    if (summaryStandard.totalTax !== 0 || summaryHybrid.totalTax !== 0) {
      totalOptionCost = summaryHybrid.totalTax - summaryStandard.totalTax;
    }
  }

  // --- CÁLCULO DO CUSTO UNITÁRIO MÉDIO PONDERADO (CUMP) ---
  let cumpData = null;
  
  if (totalInnerUnitsInXML > 0) {
    // CUMP Bruto: Total Acquisition Cost / Total Inner Units
    const cumpBruto = totalProductAcquisitionCostBeforeLoss / totalInnerUnitsInXML;
    // CUMP Plus Loss: Total Adjusted Cost / Total Inner Units
    const cumpPlusLoss = totalProductAcquisitionCostAdjusted / totalInnerUnitsInXML;
    
    const cumpTotal = cumpPlusLoss + cfu; // CUMP Ajustado + CFU (CFU já é por unidade interna)
    
    cumpData = {
      cumpBruto,
      cumpPlusLoss,
      cumpTotal,
      cfu,
    };
  }

  // --- FILTRAGEM, PAGINAÇÃO E RENDERIZAÇÃO ---
  const lowerCaseSearchTerm = searchTerm.toLowerCase();
  
  const allCalculatedProducts = useMemo(() => {
    return products
      .map(product => calculatePricing(product, params, cfu))
      .filter(product => 
        product.code.toLowerCase().includes(lowerCaseSearchTerm) ||
        product.name.toLowerCase().includes(lowerCaseSearchTerm)
      );
  }, [products, params, cfu, lowerCaseSearchTerm]);

  // Lógica de Paginação
  const totalItems = allCalculatedProducts.length;
  
  // Se itemsPerPage for MAX_SAFE_INTEGER, tratamos como "Todos"
  const effectiveItemsPerPage = itemsPerPage === Number.MAX_SAFE_INTEGER ? totalItems : itemsPerPage;
  
  const totalPages = Math.ceil(totalItems / effectiveItemsPerPage);
  const startIndex = (currentPage - 1) * effectiveItemsPerPage;
  const endIndex = startIndex + effectiveItemsPerPage;
  
  const productsToRender = allCalculatedProducts.slice(startIndex, endIndex);

  // Reset page if search term changes or itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, products, itemsPerPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    // Usamos um valor especial para 'Todos'
    const newLimit = value === 'all' ? Number.MAX_SAFE_INTEGER : parseInt(value, 10);
    setItemsPerPage(newLimit);
  };

  // --- ALERTA DE LUCRO NEGATIVO ---
  const isProfitNegative = summaryDataBestSale.totalProfit < 0;
  const profitAlert = isProfitNegative && (
    <Alert variant="destructive" className="mt-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Alerta Crítico: Lucro Líquido Negativo</AlertTitle>
      <AlertDescription>
        O Lucro Líquido Total da Nota ({formatCurrency(summaryDataBestSale.totalProfit)}) está negativo no Cenário Alvo. Isso significa que o preço de venda sugerido não é suficiente para cobrir os custos (Aquisição + Fixo) e as despesas variáveis, mesmo antes de atingir a margem de lucro alvo.
        <br/>
        <strong>Ação Sugerida:</strong> Aumente o preço de venda, reduza custos de aquisição, ou diminua as despesas/alíquotas percentuais.
      </AlertDescription>
    </Alert>
  );

  // --- ALERTA DE CUSTO FIXO (CFU) ---
  const cfuAlert = cfu > 0 && (
    <Alert variant="destructive" className="mt-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Atenção: Custo Fixo Rateado (CFU) Crítico</AlertTitle>
      <AlertDescription>
        O Custo Fixo Rateado por Unidade Interna (CFU) é de <strong>{formatCurrency(cfu)}</strong>. Este valor é a contribuição mínima que cada unidade vendida deve gerar para cobrir as despesas fixas globais ({formatCurrency(totalFixedExpenses)}).
        <br/>
        <strong>Ação Sugerida:</strong> Revise o **Estoque Total de Unidades (ETU)** ou as **Despesas Fixas Globais** para garantir que o rateio seja realista e sustentável.
      </AlertDescription>
    </Alert>
  );

  // --- ALERTA DE IMPOSTO ALTO (Lucro Presumido) ---
  // Se o imposto líquido for maior que 30% da venda total (um ponto de atenção genérico)
  const TAX_THRESHOLD = 30;
  const isTaxHigh = summaryDataBestSale.totalTaxPercent > TAX_THRESHOLD;
  const taxAlert = isTaxHigh && (
    <Alert variant="destructive" className="mt-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Alerta: Carga Tributária Elevada</AlertTitle>
      <AlertDescription>
        A carga tributária líquida total ({summaryDataBestSale.totalTaxPercent.toFixed(2)}% da Venda) está acima do limite de atenção de {TAX_THRESHOLD}%.
        <br/>
        <strong>Ação Sugerida:</strong> Verifique se o regime tributário (Lucro Presumido) é o mais vantajoso ou se há créditos de impostos não capturados no XML.
      </AlertDescription>
    </Alert>
  );


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
      
      {/* NOVO RESUMO EXECUTIVO */}
      <ExecutiveSummary
        summaryDataBestSale={summaryDataBestSale}
        cumpData={cumpData}
        totalProductAcquisitionCostAdjusted={totalProductAcquisitionCostAdjusted}
        totalInnerUnitsInXML={totalUnitsForFixedCostAllocation}
        params={params}
      />
      {/* FIM NOVO RESUMO EXECUTIVO */}

      {/* Controles de Seleção e Busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleToggleAll(true)}
            disabled={isAllSelected}
          >
            Marcar Todos
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleToggleAll(false)}
            disabled={selectedProductCodes.size === 0}
          >
            Limpar Todos
          </Button>
        </div>
        <Input
          placeholder="Buscar produto por código ou nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]" rowSpan={2}>
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleToggleAll}
                  aria-label="Selecionar todos"
                  className={cn(isIndeterminate && "bg-primary")}
                />
              </TableHead>
              <TableHead rowSpan={2}>Código</TableHead>
              <TableHead rowSpan={2} className="min-w-[300px]">Produto</TableHead> {/* Aumentado para 300px */}
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
                  <TableHead colSpan={6} className="text-center border-l border-r">Simples Nacional Padrão</TableHead> {/* 6 colunas */}
                  <TableHead colSpan={6} className="text-center border-l border-r">Simples Nacional Híbrido (IVA por Fora)</TableHead> {/* 6 colunas */}
                  <TableHead rowSpan={2} className="text-right">Custo da Opção (R$)</TableHead>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <TableHead colSpan={11} className="text-center">Lucro Presumido</TableHead> {/* 11 colunas */}
                </React.Fragment>
              )}
            </TableRow>
            <TableRow>
              {params.taxRegime === TaxRegime.SimplesNacional ? (
                <React.Fragment>
                  {/* Simples Nacional Padrão */}
                  <TableHead className="text-right">Venda Mín. Com.</TableHead> {/* Nova coluna */}
                  <TableHead className="text-right">Venda Sug. Com.</TableHead>
                  <TableHead className="text-right">Imposto Total</TableHead>
                  <TableHead className="text-right">Lucro Líq.</TableHead>
                  <TableHead className="text-right">Margem %</TableHead>
                  <TableHead className="text-right">Crédito Cliente</TableHead>
                  {/* Simples Nacional Híbrido */}
                  <TableHead className="text-right">Venda Mín. Com.</TableHead> {/* Nova coluna */}
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
                  <TableHead className="text-right">Venda Mín. Com.</TableHead> {/* Nova célula */}
                  <TableHead className="text-right">Venda Sug. Com.</TableHead>
                  <TableHead className="text-right">Margem %</TableHead>
                  <TableHead className="text-right">Crédito Cliente</TableHead>
                </React.Fragment>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsToRender.map((product, index) => {
                const isSelected = selectedProductCodes.has(product.code);
                
                // Fixed cost contribution per COMMERCIAL unit
                const fixedCostPerCommercialUnit = cfu * product.innerQuantity;
                
                // Recalculamos o lucro e margem para exibição na tabela, usando o produto calculado
                const productProfit = product.sellingPrice - product.cost - product.taxToPay - (product.sellingPrice * (totalVariableExpensesPercent / 100)) - fixedCostPerCommercialUnit;
                const productProfitMargin = product.sellingPrice > 0 ? (productProfit / product.sellingPrice) * 100 : 0;

                const productStandard = calculatedProductsStandard.find(p => p.code === product.code);
                const productHybrid = calculatedProductsHybrid.find(p => p.code === product.code);
                
                const productProfitStandard = productStandard ? productStandard.sellingPrice - productStandard.cost - productStandard.taxToPay - (productStandard.sellingPrice * (totalVariableExpensesPercent / 100)) - fixedCostPerCommercialUnit : 0;
                const productProfitMarginStandard = productStandard && productStandard.sellingPrice > 0 ? (productProfitStandard / productStandard.sellingPrice) * 100 : 0;

                const productProfitHybrid = productHybrid ? productHybrid.sellingPrice - productHybrid.cost - productHybrid.taxToPay - (productHybrid.sellingPrice * (totalVariableExpensesPercent / 100)) - fixedCostPerCommercialUnit : 0;
                const productProfitMarginHybrid = productHybrid && productHybrid.sellingPrice > 0 ? (productProfitHybrid / productHybrid.sellingPrice) * 100 : 0;

                const optionCostPerProduct = productHybrid && productStandard ? productHybrid.taxToPay - productStandard.taxToPay : 0;


                return (
                  <TableRow key={index} className={cn(
                    product.status === "PREÇO CORRIGIDO" ? "bg-yellow-900/20" : "",
                    !isSelected && "opacity-50 hover:opacity-100 transition-opacity"
                  )}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleToggleProduct(product.code, !!checked)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{product.code}</TableCell>
                    <TableCell className="max-w-[300px] whitespace-normal text-left"> {/* Alterado aqui */}
                      {product.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{product.unit}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{product.quantity}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(product.cost)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {/* Display fixed cost per commercial unit */}
                      {formatCurrency(fixedCostPerCommercialUnit)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {/* Display total cost base per commercial unit */}
                      {formatCurrency(product.cost + fixedCostPerCommercialUnit)}
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

                    {params.taxRegime === TaxRegime.SimplesNacional ? (
                      <React.Fragment>
                        {/* Simples Nacional Padrão */}
                        <TableCell className="text-right font-bold text-yellow-500">
                          {productStandard ? formatCurrency(productStandard.minSellingPrice) : formatCurrency(0)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {productStandard ? formatCurrency(productStandard.sellingPrice) : formatCurrency(0)}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {productStandard ? formatCurrency(productStandard.taxToPay) : formatCurrency(0)}
                        </TableCell>
                        <TableCell className="text-right text-success">
                          {productStandard ? formatCurrency(productProfitStandard) : formatCurrency(0)}
                        </TableCell>
                        <TableCell className="text-right text-success">
                          {productStandard ? formatPercent(productProfitMarginStandard) : formatPercent(0)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {productStandard ? formatCurrency(productStandard.ivaCreditForClient) : formatCurrency(0)}
                        </TableCell>

                        {/* Simples Nacional Híbrido */}
                        <TableCell className="text-right font-bold text-yellow-500">
                          {productHybrid ? formatCurrency(productHybrid.minSellingPrice) : formatCurrency(0)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {productHybrid ? formatCurrency(productHybrid.sellingPrice) : formatCurrency(0)}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {productHybrid ? formatCurrency(productHybrid.taxToPay) : formatCurrency(0)}
                        </TableCell>
                        <TableCell className="text-right text-success">
                          {productHybrid ? formatCurrency(productProfitHybrid) : formatCurrency(0)}
                        </TableCell>
                        <TableCell className="text-right text-success">
                          {productHybrid ? formatPercent(productProfitMarginHybrid) : formatPercent(0)}
                        </TableCell>
                        <TableCell className="text-right text-success">
                          {productHybrid ? formatCurrency(productHybrid.ivaCreditForClient) : formatCurrency(0)}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {productHybrid ? formatCurrency(productHybrid.simplesToPay) : formatCurrency(0)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-yellow-500">
                          {formatCurrency(optionCostPerProduct)}
                        </TableCell>
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        {/* Lucro Presumido */}
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
                        <TableCell className="text-right font-mono text-sm font-bold text-yellow-500">
                          {formatCurrency(product.minSellingPrice)}
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
                      </React.Fragment>
                    )}
                  </TableRow>
                );
              })
            }
          </TableBody>
        </Table>
      </div>
      
      {/* Controles de Paginação */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between py-2 gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Itens por página:
            <Select value={String(itemsPerPage === Number.MAX_SAFE_INTEGER ? 'all' : itemsPerPage)} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="100" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="150">150</SelectItem>
                <SelectItem value="200">200</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages} ({totalItems} produtos)
          </div>
          
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Próxima <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* New Summary Sections - now stacked vertically */}
      <div className="space-y-6">
        {/* 1. Resumo de Custos Totais da Nota */}
        <CostSummaryTotal
          totalProductAcquisitionCostBeforeLoss={totalProductAcquisitionCostBeforeLoss}
          totalProductAcquisitionCostAdjusted={totalProductAcquisitionCostAdjusted}
          cfu={cfu}
          totalInnerUnitsInXML={totalUnitsForFixedCostAllocation}
        />
        
        {/* 2. Resumo de Custos Unitários (CUMP) - Só aparece se houver produtos selecionados */}
        {cumpData && (
          <CostSummaryUnitary
            cumpData={cumpData}
          />
        )}

        <SalesSummaryTotal
          totalSellingBestSale={summaryDataBestSale.totalSelling}
          totalSellingMinSale={summaryDataMinSale.totalSelling}
        />

        <SalesSummaryUnitary
          totalSellingBestSale={summaryDataBestSale.totalSelling}
          totalSellingMinSale={summaryDataMinSale.totalSelling}
          totalInnerUnitsInXML={totalUnitsForFixedCostAllocation}
        />

        <ExpenseSummary
          totalFixedExpenses={totalFixedExpenses}
          totalVariableExpensesValueBestSale={summaryDataBestSale.totalVariableExpensesValue}
          totalVariableExpensesValueMinSale={summaryDataMinSale.totalVariableExpensesValue}
          cfu={cfu}
          totalInnerUnitsInXML={totalUnitsForFixedCostAllocation}
        />
        
        {/* Alerta de Custo Fixo (CFU) */}
        {cfu > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção: Custo Fixo Rateado (CFU) Crítico</AlertTitle>
            <AlertDescription>
              O Custo Fixo Rateado por Unidade Interna (CFU) é de <strong>{formatCurrency(cfu)}</strong>. Este valor é a contribuição mínima que cada unidade vendida deve gerar para cobrir as despesas fixas globais ({formatCurrency(totalFixedExpenses)}).
              <br/>
              <strong>Ação Sugerida:</strong> Revise o **Estoque Total de Unidades (ETU)** ou as **Despesas Fixas Globais** para garantir que o rateio seja realista e sustentável.
            </AlertDescription>
          </Alert>
        )}

        <TaxSummary
          params={params}
          summaryDataBestSale={summaryDataBestSale}
          summaryDataMinSale={summaryDataMinSale}
          totalOptionCost={totalOptionCost}
        />
        
        {/* Alerta de Carga Tributária Alta (Lucro Presumido) */}
        {params.taxRegime === TaxRegime.LucroPresumido && taxAlert}

        {/* Alerta de Lucro Negativo */}
        {profitAlert}
      </div>

      <OverallResultSummary
        totalProductAcquisitionCost={totalProductAcquisitionCostAdjusted}
        totalFixedExpenses={totalFixedExpenses}
        totalVariableExpensesPercent={totalVariableExpensesPercent}
        summaryDataBestSale={summaryDataBestSale}
        summaryDataMinSale={summaryDataMinSale}
        cfu={cfu}
        totalInnerUnitsInXML={totalUnitsForFixedCostAllocation}
      />

      <p className="text-xs text-muted-foreground mt-4">
        *Esta é uma simulação baseada nas propostas da Reforma Tributária. Os valores e regras finais dependem da aprovação das Leis Complementares.
      </p>
    </div>
  );
};