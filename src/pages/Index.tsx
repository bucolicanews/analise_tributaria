import React, { useState, useMemo, useEffect } from "react";
import { Upload, FileText, Calculator, Bot, ChevronDown, RefreshCw, BookOpen, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XmlUploader } from "@/components/XmlUploader";
import { ParametersForm } from "@/components/ParametersForm";
import { ProductsTable, GlobalSummaryData } from "@/components/ProductsTable";
import { CalculationMemory } from "@/components/CalculationMemory";
import { Product, CalculationParams, CalculatedProduct, TaxRegime } from "@/types/pricing";
import { calculatePricing } from "@/lib/pricing";
import { createOptimizedAIPayload } from "@/lib/aiPromptFormatter";
import { toast } from "sonner";
import { AiAnalysisReport } from "@/components/AiAnalysisReport";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SalesReport } from "@/components/SalesReport";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Index = () => {
  const [purchaseProducts, setPurchaseProducts] = useState<Product[]>([]);
  const [salesProducts, setSalesProducts] = useState<Product[]>([]);
  const [params, setParams] = useState<CalculationParams | null>(null);
  const [showMemory, setShowMemory] = useState(false);
  const [selectedProductCodes, setSelectedProductCodes] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isSalesReportOpen, setIsSalesReportOpen] = useState(false);

  // Load data from sessionStorage on initial render
  useEffect(() => {
    try {
      const storedPurchaseProducts = sessionStorage.getItem('jota-calc-purchase-products');
      const storedSalesProducts = sessionStorage.getItem('jota-calc-sales-products');
      const storedParams = sessionStorage.getItem('jota-calc-params');
      const storedSelection = sessionStorage.getItem('jota-calc-selection');

      if (storedPurchaseProducts) setPurchaseProducts(JSON.parse(storedPurchaseProducts));
      if (storedSalesProducts) setSalesProducts(JSON.parse(storedSalesProducts));
      if (storedParams) setParams(JSON.parse(storedParams));
      if (storedSelection) setSelectedProductCodes(new Set(JSON.parse(storedSelection)));
      
    } catch (error) {
      console.error("Failed to load data from session storage", error);
      sessionStorage.clear(); // Clear corrupted data
    }
  }, []);

  const handleNewConsultation = () => {
    setPurchaseProducts([]);
    setSalesProducts([]);
    setParams(null);
    setSelectedProductCodes(new Set());
    setAiReport(null);
    sessionStorage.clear();
    toast.success("Nova consulta iniciada.", { description: "Todos os dados foram limpos." });
  };

  const handlePurchaseXmlParsed = (parsedProducts: Product[]) => {
    setPurchaseProducts(parsedProducts);
    const initialSelection = new Set(parsedProducts.map(p => p.code));
    setSelectedProductCodes(initialSelection);
    sessionStorage.setItem('jota-calc-purchase-products', JSON.stringify(parsedProducts));
    sessionStorage.setItem('jota-calc-selection', JSON.stringify(Array.from(initialSelection)));
  };

  const handleSalesXmlParsed = (parsedProducts: Product[]) => {
    setSalesProducts(parsedProducts);
    sessionStorage.setItem('jota-calc-sales-products', JSON.stringify(parsedProducts));
    toast.info(`${parsedProducts.length} produtos de venda carregados.`, {
      description: "O próximo passo será a página de auditoria para comparar com as compras."
    });
  };

  const handleCalculate = (calculationParams: CalculationParams) => {
    const inss = calculationParams.taxRegime !== TaxRegime.SimplesNacional
      ? calculationParams.payroll * (calculationParams.inssPatronalRate / 100)
      : 0;
    const totalFixed = calculationParams.fixedExpenses.reduce((sum, exp) => sum + exp.value, 0) + calculationParams.payroll + inss;
    
    const paramsToSave = { ...calculationParams, fixedCostsTotal: totalFixed };
    setParams(paramsToSave);
    sessionStorage.setItem('jota-calc-params', JSON.stringify(paramsToSave));
  };

  const handleSelectionChange = (newSelection: Set<string>) => {
    setSelectedProductCodes(newSelection);
    sessionStorage.setItem('jota-calc-selection', JSON.stringify(Array.from(newSelection)));
  };

  // Centralized calculation logic
  const calculationResults = useMemo(() => {
    if (!params || purchaseProducts.length === 0) {
      return {
        summary: null,
        calculatedProducts: [],
        productsToDisplay: [],
        totalFixedExpenses: 0,
        firstCalculatedProduct: null,
      };
    }

    const totalFixedExpenses = params.fixedCostsTotal || 0;
    const cfu = params.totalStockUnits > 0 ? totalFixedExpenses / params.totalStockUnits : 0;
    
    const productsToDisplay = purchaseProducts.filter(p => selectedProductCodes.has(p.code));
    const calculatedProducts = productsToDisplay.map(p => calculatePricing(p, params, cfu));
    
    const totalVariableExpensesPercent = params.variableExpenses.reduce((sum, exp) => sum + exp.percentage, 0);
    const totalInnerUnitsInXML = productsToDisplay.reduce((sum, p) => sum + p.quantity * p.innerQuantity, 0);

    const summary = calculateGlobalSummary(
      calculatedProducts,
      params,
      totalFixedExpenses,
      totalVariableExpensesPercent,
      cfu,
      totalInnerUnitsInXML
    );

    return {
      summary,
      calculatedProducts,
      productsToDisplay,
      totalFixedExpenses,
      firstCalculatedProduct: calculatedProducts.length > 0 ? calculatedProducts[0] : null,
    };
  }, [params, purchaseProducts, selectedProductCodes]);

  const { summary, calculatedProducts, productsToDisplay, firstCalculatedProduct } = calculationResults;

  const handleSendToWebhook = async (environment: 'test' | 'production') => {
    if (!params || !summary || calculatedProducts.length === 0) {
      toast.error("Dados insuficientes para enviar.");
      return;
    }

    setIsSending(true);
    setAiReport(null);
    const toastId = toast.loading(`Aguardando análise da IA (${environment})...`);

    try {
      const payload = createOptimizedAIPayload(params, summary, calculatedProducts);
      
      const webhooks = {
        test: localStorage.getItem('jota-webhook-test') || 'https://jota-empresas-n8n.ubjifz.easypanel.host/webhook-test/e50090ba-ffc9-45e7-86f5-9a0467f4f794',
        production: localStorage.getItem('jota-webhook-prod')
      };

      const webhookUrl = webhooks[environment];
      if (!webhookUrl) throw new Error(`URL do webhook de ${environment} não configurada.`);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.errorMessage || data.message || `Erro ${response.status}`);
      
      const reportText = data.output || data.text || data.response || (typeof data === 'string' ? data : JSON.stringify(data, null, 2));
      
      setAiReport(reportText);
      toast.success("Análise concluída com sucesso!", { id: toastId });
      
      setTimeout(() => document.getElementById('ai-report-section')?.scrollIntoView({ behavior: 'smooth' }), 100);

    } catch (error: any) {
      toast.error("Erro ao enviar para análise", { 
        id: toastId,
        description: error.message || "Verifique a URL do webhook e a conexão."
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <div className="container mx-auto px-4 py-8">
      {summary && summary.breakEvenPoint > 0 && (
        <div className="text-center mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <h1 className="text-lg text-muted-foreground">
            <span className="font-semibold">Ponto de Equilíbrio Operacional (Faturamento Mínimo Mensal):</span>{" "}
            <span className="text-xl text-yellow-500 font-extrabold">{formatCurrency(summary.breakEvenPoint)}</span>
          </h1>
        </div>
      )}
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-6">
            <Card className="shadow-card p-6">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">1. Upload de Notas de Compra (Entrada)</h2>
                </div>
                <Button variant="outline" size="sm" onClick={handleNewConsultation}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Nova Consulta
                </Button>
              </div>
              <XmlUploader onXmlParsed={handlePurchaseXmlParsed} uploadType="purchase" />
            </Card>
            <Card className="shadow-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-semibold">2. Upload de Notas de Venda (Saída)</h2>
              </div>
              <XmlUploader onXmlParsed={handleSalesXmlParsed} uploadType="sales" />
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Funcionalidade em Desenvolvimento</AlertTitle>
                <AlertDescription>
                  O upload de notas de venda é o primeiro passo para a nossa futura ferramenta de auditoria fiscal.
                </AlertDescription>
              </Alert>
            </Card>
          </div>

          <Card className="shadow-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Parâmetros de Cálculo</h2>
            </div>
            <ParametersForm onCalculate={handleCalculate} disabled={purchaseProducts.length === 0} />
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {aiReport && (
            <div id="ai-report-section">
              <AiAnalysisReport report={aiReport} onClose={() => setAiReport(null)} />
            </div>
          )}

          {purchaseProducts.length > 0 && params ? (
            <>
              <Card className="shadow-elegant p-6">
                <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-xl font-semibold">
                    Relatório de Precificação ({productsToDisplay.length} de {purchaseProducts.length} produtos)
                  </h2>
                  <div className="flex gap-2">
                    <Button variant={showMemory ? "default" : "outline"} size="sm" onClick={() => setShowMemory(!showMemory)}>
                      {showMemory ? "Ocultar" : "Exibir"} Memória
                    </Button>

                    <Dialog open={isSalesReportOpen} onOpenChange={setIsSalesReportOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={calculatedProducts.length === 0}>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Relatório para Venda
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-4xl max-h-[90dvh] overflow-y-auto">
                        <SalesReport products={calculatedProducts} />
                      </DialogContent>
                    </Dialog>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" disabled={isSending} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                          <Bot className="h-4 w-4 mr-2" />
                          {isSending ? "Analisando..." : "Enviar para Análise AI"}
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleSendToWebhook('test')}>Ambiente de Teste</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendToWebhook('production')}>Ambiente de Produção</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <ProductsTable 
                  products={purchaseProducts} 
                  params={params} 
                  selectedProductCodes={selectedProductCodes}
                  onSelectionChange={handleSelectionChange}
                />
              </Card>

              {showMemory && firstCalculatedProduct && (
                <Card className="shadow-card p-6">
                  <CalculationMemory products={[firstCalculatedProduct]} params={params} />
                </Card>
              )}
            </>
          ) : (
            <Card className="shadow-card flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Calculator className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhum cálculo realizado</h3>
              <p className="text-muted-foreground max-w-md">Faça o upload de arquivos XML e preencha os parâmetros para gerar o relatório.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function (can be moved to a separate file if needed)
const calculateGlobalSummary = (
  productsToSummarize: CalculatedProduct[],
  currentParams: CalculationParams,
  globalFixedExpenses: number,
  totalVariableExpensesPercent: number,
  cfu: number,
  totalInnerUnitsInXML: number
): GlobalSummaryData => {
  if (productsToSummarize.length === 0) {
    // Return a default empty summary
    return { totalSelling: 0, totalTax: 0, totalProfit: 0, profitMarginPercent: 0, breakEvenPoint: 0, totalVariableExpensesValue: 0, totalContributionMargin: 0, totalTaxPercent: 0, totalCbsCredit: 0, totalIbsCredit: 0, totalCbsDebit: 0, totalIbsDebit: 0, totalCbsTaxToPay: 0, totalIbsTaxToPay: 0, totalIrpjToPay: 0, totalCsllToPay: 0, totalSimplesToPay: 0, totalSelectiveTaxToPay: 0, totalIvaCreditForClient: 0 };
  }

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

export default Index;