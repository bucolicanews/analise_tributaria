import React, { useState, useMemo, useEffect } from "react";
import { Upload, FileText, Calculator, Bot, ChevronDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XmlUploader } from "@/components/XmlUploader";
import { ParametersForm } from "@/components/ParametersForm";
import { ProductsTable, GlobalSummaryData } from "@/components/ProductsTable";
import { CalculationMemory } from "@/components/CalculationMemory";
import { Product, CalculationParams, CalculatedProduct, TaxRegime } from "@/types/pricing";
import { calculatePricing } from "@/lib/pricing";
import { formatDataForAI } from "@/lib/aiPromptFormatter";
import { toast } from "sonner";
import { AiAnalysisReport } from "@/components/AiAnalysisReport";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// These are now deprecated and will be removed in a future step.
// Data is now managed via sessionStorage.
export let globalProducts: Product[] = [];
export let globalParams: CalculationParams | null = null;
export let globalSelectedProductCodes: Set<string> = new Set();
export let globalSummary: GlobalSummaryData | null = null;

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [params, setParams] = useState<CalculationParams | null>(null);
  const [showMemory, setShowMemory] = useState(false);
  const [summary, setSummary] = useState<GlobalSummaryData | null>(null);
  const [selectedProductCodes, setSelectedProductCodes] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  // Load data from sessionStorage on initial render
  useEffect(() => {
    try {
      const storedProducts = sessionStorage.getItem('jota-calc-products');
      const storedParams = sessionStorage.getItem('jota-calc-params');
      const storedSelection = sessionStorage.getItem('jota-calc-selection');

      if (storedProducts) {
        const parsedProducts = JSON.parse(storedProducts);
        setProducts(parsedProducts);
        globalProducts = parsedProducts;
      }
      if (storedParams) {
        const parsedParams = JSON.parse(storedParams);
        setParams(parsedParams);
        globalParams = parsedParams;
      }
      if (storedSelection) {
        const parsedSelection = new Set(JSON.parse(storedSelection));
        setSelectedProductCodes(parsedSelection);
        globalSelectedProductCodes = parsedSelection;
      }
    } catch (error) {
      console.error("Failed to load data from session storage", error);
      sessionStorage.clear(); // Clear corrupted data
    }
  }, []);

  const handleNewConsultation = () => {
    setProducts([]);
    setParams(null);
    setSummary(null);
    setSelectedProductCodes(new Set());
    setAiReport(null);

    // Clear globals
    globalProducts = [];
    globalParams = null;
    globalSelectedProductCodes = new Set();
    globalSummary = null;

    // Clear session storage
    sessionStorage.removeItem('jota-calc-products');
    sessionStorage.removeItem('jota-calc-params');
    sessionStorage.removeItem('jota-calc-selection');

    toast.success("Nova consulta iniciada.", {
      description: "Todos os dados foram limpos.",
    });
  };

  const handleXmlParsed = (parsedProducts: Product[]) => {
    setProducts(parsedProducts);
    const initialSelection = new Set(parsedProducts.map(p => p.code));
    setSelectedProductCodes(initialSelection);
    
    // Update globals and session storage
    globalProducts = parsedProducts;
    globalSelectedProductCodes = initialSelection;
    sessionStorage.setItem('jota-calc-products', JSON.stringify(parsedProducts));
    sessionStorage.setItem('jota-calc-selection', JSON.stringify(Array.from(initialSelection)));
  };

  const handleCalculate = (calculationParams: CalculationParams) => {
    // Calculate total fixed costs and add it to the params object before saving
    const inss = calculationParams.taxRegime !== TaxRegime.SimplesNacional
      ? calculationParams.payroll * (calculationParams.inssPatronalRate / 100)
      : 0;
    const totalFixed = calculationParams.fixedExpenses.reduce((sum, exp) => sum + exp.value, 0) + calculationParams.payroll + inss;
    
    const paramsToSave = {
      ...calculationParams,
      fixedCostsTotal: totalFixed // Add the calculated total
    };

    setParams(paramsToSave);
    
    // Update globals and session storage
    globalParams = paramsToSave;
    sessionStorage.setItem('jota-calc-params', JSON.stringify(paramsToSave));
  };

  const handleSummaryCalculated = (newSummary: GlobalSummaryData) => {
    setSummary(newSummary);
    globalSummary = newSummary; // Keep global for now if needed elsewhere
  };

  const handleSelectionChange = (newSelection: Set<string>) => {
    setSelectedProductCodes(newSelection);
    
    // Update globals and session storage
    globalSelectedProductCodes = newSelection;
    sessionStorage.setItem('jota-calc-selection', JSON.stringify(Array.from(newSelection)));
  };

  const { cfu, totalFixedExpenses, calculatedProducts, productsToDisplay } = useMemo(() => {
    if (!params) return { cfu: 0, totalFixedExpenses: 0, calculatedProducts: [], productsToDisplay: [] };
    const inss = params.taxRegime !== TaxRegime.SimplesNacional ? params.payroll * (params.inssPatronalRate / 100) : 0;
    const fixedExpenses = params.fixedExpenses.reduce((sum, exp) => sum + exp.value, 0) + params.payroll + inss;
    const calculatedCfu = params.totalStockUnits > 0 ? fixedExpenses / params.totalStockUnits : 0;
    const prodsToCalc = products.filter(p => selectedProductCodes.has(p.code));
    const allCalculated = prodsToCalc.map(p => calculatePricing(p, params, calculatedCfu));
    return { cfu: calculatedCfu, totalFixedExpenses: fixedExpenses, calculatedProducts: allCalculated, productsToDisplay: prodsToCalc };
  }, [params, products, selectedProductCodes]);

  const firstCalculatedProduct = calculatedProducts.length > 0 ? calculatedProducts[0] : null;

  const handleSendToWebhook = async (environment: 'test' | 'production') => {
    if (!params || !summary || calculatedProducts.length === 0) {
      toast.error("Dados insuficientes para enviar.");
      return;
    }

    setIsSending(true);
    setAiReport(null);
    const toastId = toast.loading(`Aguardando análise da IA (${environment})...`);

    try {
      const promptText = formatDataForAI(params, summary, calculatedProducts);
      
      const webhooks = {
        test: localStorage.getItem('jota-webhook-test') || 'https://jota-empresas-n8n.ubjifz.easypanel.host/webhook-test/e50090ba-ffc9-45e7-86f5-9a0467f4f794',
        production: localStorage.getItem('jota-webhook-prod')
      };

      const webhookUrl = webhooks[environment];

      if (!webhookUrl) {
        throw new Error(`URL do webhook de ${environment} não configurada. Por favor, verifique a página de Configurações.`);
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: { analise: promptText } }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.errorMessage || data.message || `Erro ${response.status}`;
        throw new Error(errorMsg);
      }
      
      const reportText = data.output || data.text || data.response || (typeof data === 'string' ? data : JSON.stringify(data, null, 2));
      
      setAiReport(reportText);
      toast.success("Análise concluída com sucesso!", { id: toastId });
      
      setTimeout(() => {
        document.getElementById('ai-report-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error: any) {
      console.error("Erro na requisição:", error);
      toast.error("Erro ao enviar para análise", { 
        id: toastId,
        description: error.message || "Verifique a URL do webhook e a conexão com o n8n."
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
            <span className="font-semibold">Mínimo Operacional Mensal:</span>{" "}
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
                <h2 className="text-lg font-semibold">Upload de XML</h2>
              </div>
              <Button variant="outline" size="sm" onClick={handleNewConsultation}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Nova Consulta
              </Button>
            </div>
            <XmlUploader onXmlParsed={handleXmlParsed} />
          </Card>

          <Card className="shadow-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Parâmetros de Cálculo</h2>
            </div>
            <ParametersForm onCalculate={handleCalculate} disabled={products.length === 0} />
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {aiReport && (
            <div id="ai-report-section">
              <AiAnalysisReport report={aiReport} onClose={() => setAiReport(null)} />
            </div>
          )}

          {products.length > 0 && params ? (
            <React.Fragment>
              <Card className="shadow-elegant p-6">
                <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-xl font-semibold">
                    Relatório de Precificação ({productsToDisplay.length} de {products.length} produtos)
                  </h2>
                  <div className="flex gap-2">
                    <Button variant={showMemory ? "default" : "outline"} size="sm" onClick={() => setShowMemory(!showMemory)}>
                      {showMemory ? "Ocultar" : "Exibir"} Memória
                    </Button>
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
                  products={products} 
                  params={params} 
                  onSummaryCalculated={handleSummaryCalculated} 
                  selectedProductCodes={selectedProductCodes}
                  onSelectionChange={handleSelectionChange}
                />
              </Card>

              {showMemory && firstCalculatedProduct && (
                <Card className="shadow-card p-6">
                  <CalculationMemory products={[firstCalculatedProduct]} params={params} />
                </Card>
              )}
            </React.Fragment>
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

export default Index;