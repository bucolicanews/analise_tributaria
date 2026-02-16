"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Upload, FileText, Calculator, Bot, ChevronDown, RefreshCw, BookOpen, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
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
import { useNavigate } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const navigate = useNavigate();
  const [purchaseProducts, setPurchaseProducts] = useState<Product[]>([]);
  const [salesProducts, setSalesProducts] = useState<Product[]>([]);
  const [params, setParams] = useState<CalculationParams | null>(null);
  const [showMemory, setShowMemory] = useState(false);
  const [selectedProductCodes, setSelectedProductCodes] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isSalesReportOpen, setIsSalesReportOpen] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

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
      console.error("Erro ao carregar sessão:", error);
    }
  }, []);

  const handleNewConsultation = () => {
    setPurchaseProducts([]);
    setSalesProducts([]);
    setParams(null);
    setSelectedProductCodes(new Set());
    setAiReport(null);
    setExecutionTime(null);
    sessionStorage.clear();
    toast.success("Nova consulta iniciada.");
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
    toast.info(`${parsedProducts.length} notas de venda importadas para auditoria.`);
  };

  const handleCalculate = (calculationParams: CalculationParams) => {
    const companyName = localStorage.getItem('jota-razaoSocial') || "";
    const companyCnpj = localStorage.getItem('jota-cnpj') || "";
    const companyCnaes = localStorage.getItem('jota-cnaes') || "";
    const companyState = localStorage.getItem('jota-uf') || "SP";

    const inss = calculationParams.taxRegime !== TaxRegime.SimplesNacional
      ? calculationParams.payroll * (calculationParams.inssPatronalRate / 100)
      : 0;
    
    const totalFixed = calculationParams.fixedExpenses.reduce((sum, exp) => sum + exp.value, 0) + calculationParams.payroll + inss;
    
    const paramsWithProfile = { 
      ...calculationParams, 
      fixedCostsTotal: totalFixed,
      companyName,
      companyCnpj,
      companyCnaes,
      companyState
    };

    setParams(paramsWithProfile);
    sessionStorage.setItem('jota-calc-params', JSON.stringify(paramsWithProfile));
  };

  const handleSelectionChange = (newSelection: Set<string>) => {
    setSelectedProductCodes(newSelection);
    sessionStorage.setItem('jota-calc-selection', JSON.stringify(Array.from(newSelection)));
  };

  const calculationResults = useMemo(() => {
    if (!params || purchaseProducts.length === 0) {
      return { summary: null, calculatedProducts: [], productsToDisplay: [], totalFixedExpenses: 0, firstCalculatedProduct: null };
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
      toast.error("Realize a precificação antes de enviar.");
      return;
    }

    const startTime = performance.now();
    setIsSending(true);
    const toastId = toast.loading(`Gerando Plano Tributário Estratégico (${environment})...`);

    try {
      const payload = createOptimizedAIPayload(params, summary, calculatedProducts);
      
      const webhooks = {
        test: localStorage.getItem('jota-webhook-test') || 'https://jota-empresas-n8n.ubjifz.easypanel.host/webhook-test/e50090ba-ffc9-45e7-86f5-9a0467f4f794',
        production: localStorage.getItem('jota-webhook-prod') || 'https://jota-empresas-n8n.ubjifz.easypanel.host/webhook/e50090ba-ffc9-45e7-86f5-9a0467f4f794'
      };

      const webhookUrl = webhooks[environment];
      if (!webhookUrl) throw new Error(`Webhook de ${environment} não configurado.`);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Erro na comunicação com a IA.");
      
      const data = await response.json();
      const endTime = performance.now();
      const durationInSeconds = (endTime - startTime) / 1000;
      setExecutionTime(durationInSeconds);
      
      let extractedReport = "";
      
      if (Array.isArray(data)) {
        const parts = data[0]?.content?.parts;
        if (Array.isArray(parts)) {
          extractedReport = parts.map((p: any) => p.text || "").join("\n\n---\n\n");
        }
      } else if (data.content?.parts) {
        const parts = data.content.parts;
        if (Array.isArray(parts)) {
          extractedReport = parts.map((p: any) => p.text || "").join("\n\n---\n\n");
        }
      }
      
      if (!extractedReport) {
        if (data.output) extractedReport = data.output;
        else if (data.text) extractedReport = data.text;
        else if (typeof data === 'string') extractedReport = data;
      }
      
      if (!extractedReport) {
        throw new Error("Formato de resposta da IA não reconhecido.");
      }
      
      setAiReport(extractedReport);
      toast.success(`Análise Estratégica Concluída em ${durationInSeconds.toFixed(2)}s!`, { id: toastId });
      
      setTimeout(() => document.getElementById('ai-report-section')?.scrollIntoView({ behavior: 'smooth' }), 300);

    } catch (error: any) {
      toast.error("Erro na Auditoria IA", { 
        id: toastId,
        description: error.message
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
            <span className="font-semibold">Ponto de Equilíbrio Operacional (Venda Mínima Mensal):</span>{" "}
            <span className="text-xl text-yellow-500 font-extrabold">{formatCurrency(summary.breakEvenPoint)}</span>
          </h1>
        </div>
      )}
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-card p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">1. Notas de Compra</h2>
              </div>
              <Button variant="outline" size="sm" onClick={handleNewConsultation}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Novo
              </Button>
            </div>
            <XmlUploader onXmlParsed={handlePurchaseXmlParsed} uploadType="purchase" />
          </Card>
          
          <Card className="shadow-card p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-semibold">2. Notas de Venda</h2>
              </div>
            </div>
            <XmlUploader onXmlParsed={handleSalesXmlParsed} uploadType="sales" />
          </Card>

          <Card className="shadow-card p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Parâmetros de Cálculo</h2>
            </div>
            <ParametersForm onCalculate={handleCalculate} disabled={purchaseProducts.length === 0} />
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {aiReport && (
            <div id="ai-report-section">
              <AiAnalysisReport report={aiReport} onClose={() => setAiReport(null)} executionTime={executionTime || undefined} />
            </div>
          )}

          {purchaseProducts.length > 0 && params ? (
            <>
              <Card className="shadow-elegant p-6">
                <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-xl font-semibold">Relatório de Precificação</h2>
                  <div className="flex gap-2">
                    <Button variant={showMemory ? "default" : "outline"} size="sm" onClick={() => setShowMemory(!showMemory)}>
                      {showMemory ? "Ocultar" : "Exibir"} Memória
                    </Button>

                    <Dialog open={isSalesReportOpen} onOpenChange={setIsSalesReportOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Relatório Venda
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-4xl max-h-[90dvh] overflow-y-auto">
                        <SalesReport products={calculatedProducts} />
                      </DialogContent>
                    </Dialog>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" disabled={isSending} className="bg-orange-600 hover:bg-orange-700 text-white relative">
                          <Sparkles className="h-4 w-4 mr-2" />
                          {isSending ? "Analisando..." : "Auditoria IA"}
                          <Badge className="absolute -top-2 -right-2 bg-white text-orange-600 border-orange-600 h-4 text-[8px]">Novo</Badge>
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleSendToWebhook('test')}>Sandbox (Teste)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendToWebhook('production')}>Live (Produção)</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <ProductsTable products={purchaseProducts} params={params} selectedProductCodes={selectedProductCodes} onSelectionChange={handleSelectionChange} />
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
              <h3 className="text-xl font-semibold mb-2">Aguardando Importação</h3>
              <p className="text-muted-foreground max-w-md">Importe suas notas fiscais de entrada para iniciar a análise estratégica de preços.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const calculateGlobalSummary = (
  productsToSummarize: CalculatedProduct[],
  currentParams: CalculationParams,
  globalFixedExpenses: number,
  totalVariableExpensesPercent: number,
  cfu: number,
  totalInnerUnitsInXML: number
): GlobalSummaryData => {
  if (productsToSummarize.length === 0) {
    return { totalSelling: 0, totalTax: 0, totalProfit: 0, profitMarginPercent: 0, breakEvenPoint: 0, totalVariableExpensesValue: 0, totalContributionMargin: 0, totalTaxPercent: 0, totalCbsCredit: 0, totalIbsCredit: 0, totalCbsDebit: 0, totalIbsDebit: 0, totalCbsTaxToPay: 0, totalIbsTaxToPay: 0, totalIrpjToPay: 0, totalCsllToPay: 0, totalSimplesToPay: 0, totalSelectiveTaxToPay: 0, totalIvaCreditForClient: 0 };
  }

  const totalSellingSum = productsToSummarize.reduce((sum, p) => sum + p.sellingPrice * p.quantity, 0);
  const totalTaxSum = productsToSummarize.reduce((sum, p) => sum + p.taxToPay * p.quantity, 0);
  const totalProfitSum = productsToSummarize.reduce((sum, p) => sum + p.valueForProfit * p.quantity, 0);
  const totalVariableExpensesValueSum = productsToSummarize.reduce((sum, p) => sum + p.valueForVariableExpenses * p.quantity, 0);
  const totalContributionMarginSum = productsToSummarize.reduce((sum, p) => sum + p.contributionMargin * p.quantity, 0);
  
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

  return { 
    totalSelling: totalSellingSum, 
    totalTax: totalTaxSum, 
    totalProfit: totalProfitSum, 
    profitMarginPercent, 
    breakEvenPoint, 
    totalVariableExpensesValue: totalVariableExpensesValueSum, 
    totalContributionMargin: totalContributionMarginSum, 
    totalTaxPercent, 
    totalCbsCredit: productsToSummarize.reduce((sum, p) => sum + p.cbsCredit * p.quantity, 0),
    totalIbsCredit: productsToSummarize.reduce((sum, p) => sum + p.ibsCredit * p.quantity, 0),
    totalCbsDebit: productsToSummarize.reduce((sum, p) => sum + p.cbsDebit * p.quantity, 0),
    totalIbsDebit: productsToSummarize.reduce((sum, p) => sum + p.ibsDebit * p.quantity, 0),
    totalCbsTaxToPay: totalCbsTaxToPaySum, 
    totalIbsTaxToPay: totalIbsTaxToPaySum, 
    totalIrpjToPay: totalIrpjToPaySum, 
    totalCsllToPay: totalCsllToPaySum, 
    totalSimplesToPay: totalSimplesToPaySum, 
    totalSelectiveTaxToPay: totalSelectiveTaxToPaySum, 
    totalIvaCreditForClient: totalIvaCreditForClientSum 
  };
};

export default Index;