"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Upload, FileText, Calculator, Bot, ChevronDown, RefreshCw, BookOpen, AlertTriangle, ArrowRight, Sparkles, FileDown, Loader2 } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { SalesReportPDF } from '@/components/SalesReportPDF';
import { AgentsTimeline } from '@/components/AgentsTimeline';
import { AgentReportPDF } from '@/components/AgentReportPDF';
import { AgentStatus, callGeminiAgent, callAgentWebhook, loadAgentsFromStorage } from '@/lib/geminiService';
import { useAuth } from '@/contexts/AuthContext';

const Pricing = () => {
  const navigate = useNavigate();
  const { autenticado } = useAuth();
  const [purchaseProducts, setPurchaseProducts] = useState<Product[]>([]);
  const [salesProducts, setSalesProducts] = useState<Product[]>([]);
  const [params, setParams] = useState<CalculationParams | null>(null);
  const [showMemory, setShowMemory] = useState(false);
  const [selectedProductCodes, setSelectedProductCodes] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [isAgentsRunning, setIsAgentsRunning] = useState(false);
  const [selectedAgentReport, setSelectedAgentReport] = useState<AgentStatus | null>(null);
  const [isPdfAgentOpen, setIsPdfAgentOpen] = useState(false);
  const [isSalesReportOpen, setIsSalesReportOpen] = useState(false);

  const companyName = localStorage.getItem('jota-razaoSocial') || 'Sua Empresa';
  const accountantName = localStorage.getItem('jota-contador-nome') || '';
  const accountantCrc = localStorage.getItem('jota-contador-crc') || '';

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

  const getFullContextPayload = () => {
    if (!params || !summary) return null;
    
    // Coleta dados de viabilidade salvos
    const viabData = {
      viab_razaoSocial: localStorage.getItem('viab-razaoSocial'),
      viab_municipio: localStorage.getItem('viab-municipio'),
      viab_estado: localStorage.getItem('viab-estado'),
      viab_atividades: localStorage.getItem('viab-atividades'),
      viab_faturamentoAnual: localStorage.getItem('viab-faturamentoAnual'),
      viab_cnaes: localStorage.getItem('viab-cnaes'),
      viab_folhaPagamento: localStorage.getItem('viab-folhaPagamento'),
      viab_prolabore: localStorage.getItem('viab-valorProlabore'),
    };

    // Payload unificado e plano para facilitar o n8n
    return {
      ...viabData,
      prec_razaoSocial: companyName,
      prec_cnpj: params.companyCnpj,
      prec_faturamentoMensal: summary.totalSelling,
      prec_lucroLiquido: summary.totalProfit,
      prec_margemLiquida: summary.profitMarginPercent,
      prec_regimeTributario: params.taxRegime,
      prec_cargaTributariaEfetiva: summary.totalTaxPercent,
      prec_amostraProdutos: JSON.stringify(calculatedProducts.slice(0, 10))
    };
  };

  const handleRunAgents = async () => {
    const payload = getFullContextPayload();
    if (!payload) {
      toast.error("Realize a precificação antes.");
      return;
    }

    const agentConfigs = loadAgentsFromStorage();
    if (agentConfigs.length === 0) {
      toast.error("Nenhum agente configurado.");
      return;
    }

    const sorted = [...agentConfigs].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    setAgentStatuses(sorted.map(a => ({ id: a.id, nome: a.nome, systemPrompt: a.systemPrompt, status: 'idle', report: null })));
    setIsAgentsRunning(true);

    const previousReports: Record<string, string> = {};
    const userContent = JSON.stringify(payload, null, 2);
    const apiKey = localStorage.getItem('jota-gemini-key') || '';

    for (const agent of sorted) {
      setAgentStatuses(prev => prev.map(s => s.id === agent.id ? { ...s, status: 'loading' } : s));
      try {
        const report = agent.webhookUrl?.trim()
          ? await callAgentWebhook(agent, userContent, previousReports)
          : await callGeminiAgent(agent.systemPrompt, userContent + (Object.keys(previousReports).length > 0 ? "\n\nRelatórios anteriores:\n" + JSON.stringify(previousReports) : ""), apiKey);

        previousReports[agent.nome] = report;
        setAgentStatuses(prev => prev.map(s => s.id === agent.id ? { ...s, status: 'done', report } : s));
      } catch (err: any) {
        setAgentStatuses(prev => prev.map(s => s.id === agent.id ? { ...s, status: 'error', errorMessage: err.message } : s));
      }
    }
    setIsAgentsRunning(false);
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
    toast.info(`${parsedProducts.length} notas de venda importadas.`);
  };

  const handleCalculate = (calculationParams: CalculationParams) => {
    const inss = calculationParams.taxRegime !== TaxRegime.SimplesNacional ? calculationParams.payroll * (calculationParams.inssPatronalRate / 100) : 0;
    const totalFixed = calculationParams.fixedExpenses.reduce((sum, exp) => sum + exp.value, 0) + calculationParams.payroll + inss;
    const finalParams = { ...calculationParams, fixedCostsTotal: totalFixed, companyName: localStorage.getItem('jota-razaoSocial') || "", companyCnpj: localStorage.getItem('jota-cnpj') || "", companyState: localStorage.getItem('jota-uf') || "SP" };
    setParams(finalParams);
    sessionStorage.setItem('jota-calc-params', JSON.stringify(finalParams));
  };

  const calculationResults = useMemo(() => {
    if (!params || purchaseProducts.length === 0) return { summary: null, calculatedProducts: [] };
    const cfu = params.totalStockUnits > 0 ? (params.fixedCostsTotal || 0) / params.totalStockUnits : 0;
    const productsToDisplay = purchaseProducts.filter(p => selectedProductCodes.has(p.code));
    const calculatedProducts = productsToDisplay.map(p => calculatePricing(p, params, cfu));
    const totalVar = params.variableExpenses.reduce((sum, exp) => sum + exp.percentage, 0);
    const totalInners = productsToDisplay.reduce((sum, p) => sum + p.quantity * p.innerQuantity, 0);
    const summary = calculateGlobalSummary(calculatedProducts, params, params.fixedCostsTotal || 0, totalVar, cfu, totalInners);
    return { summary, calculatedProducts };
  }, [params, purchaseProducts, selectedProductCodes]);

  const { summary, calculatedProducts } = calculationResults;

  const handleSendToWebhook = async (environment: 'test' | 'production') => {
    const payload = getFullContextPayload();
    if (!payload) return;
    setIsSending(true);
    const webhookUrl = environment === 'test' ? localStorage.getItem('jota-webhook-test') : localStorage.getItem('jota-webhook-prod');
    try {
      const response = await fetch(webhookUrl!, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      let text = data.report || data.output || data.text || "";
      if (!text && data.content?.parts) text = data.content.parts.map((p: any) => p.text || "").join("\n\n");
      setAiReport(text);
      toast.success("Análise concluída!");
    } catch (err: any) {
      toast.error("Erro no envio", { description: err.message });
    } finally { setIsSending(false); }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> 1. Compras</h2>
              <Button variant="outline" size="sm" onClick={() => { setPurchaseProducts([]); setParams(null); sessionStorage.clear(); }}><RefreshCw className="h-4 w-4 mr-2" /> Novo</Button>
            </div>
            <XmlUploader onXmlParsed={handlePurchaseXmlParsed} uploadType="purchase" />
          </Card>
          <Card className="p-6"><h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><Upload className="h-5 w-5 text-accent" /> 2. Vendas</h2><XmlUploader onXmlParsed={handleSalesXmlParsed} uploadType="sales" /></Card>
          <Card className="p-6"><h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><FileText className="h-5 w-5 text-primary" /> Parâmetros</h2><ParametersForm onCalculate={handleCalculate} disabled={purchaseProducts.length === 0} /></Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {aiReport && <AiAnalysisReport report={aiReport} onClose={() => setAiReport(null)} clientName={companyName} clientCity="" clientState="" />}
          {agentStatuses.length > 0 && (
            <AgentsTimeline 
              agents={agentStatuses} 
              onViewReport={(a) => { setSelectedAgentReport(a); setIsPdfAgentOpen(true); }} 
              onPrintReport={(a) => { setSelectedAgentReport(a); setIsPdfAgentOpen(true); }} 
              onRunSingle={() => {}} 
            />
          )}

          {purchaseProducts.length > 0 && params ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-xl font-semibold">Relatório de Precificação</h2>
                <div className="flex gap-2">
                  <Dialog open={isSalesReportOpen} onOpenChange={setIsSalesReportOpen}>
                    <DialogTrigger asChild><Button variant="outline" size="sm"><BookOpen className="h-4 w-4 mr-2" /> Relatório Venda (PDF)</Button></DialogTrigger>
                    <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col"><div className="flex-1 bg-slate-100"><PDFViewer width="100%" height="100%" className="border-none"><SalesReportPDF products={calculatedProducts} companyName={companyName} accountantName={accountantName} accountantCrc={accountantCrc} /></PDFViewer></div></DialogContent>
                  </Dialog>
                  {autenticado && (
                    <div className="flex gap-2">
                      <Button size="sm" disabled={isAgentsRunning} onClick={handleRunAgents} className="bg-indigo-600 text-white"><Bot className="h-4 w-4 mr-2" /> Agentes IA</Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button size="sm" variant="outline" disabled={isSending}><Sparkles className="h-4 w-4 mr-2" /> Auditoria IA <ChevronDown className="h-4 w-4 ml-1" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent><DropdownMenuItem onClick={() => handleSendToWebhook('test')}>Ambiente Teste</DropdownMenuItem><DropdownMenuItem onClick={() => handleSendToWebhook('production')}>Ambiente Produção</DropdownMenuItem></DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </div>
              <ProductsTable products={purchaseProducts} params={params} selectedProductCodes={selectedProductCodes} onSelectionChange={(s) => { setSelectedProductCodes(s); sessionStorage.setItem('jota-calc-selection', JSON.stringify(Array.from(s))); }} />
            </Card>
          ) : <Card className="p-12 text-center text-muted-foreground"><Calculator className="h-12 w-12 mx-auto mb-4 opacity-20" /><h3 className="text-xl font-semibold">Aguardando Importação</h3></Card>}
        </div>
      </div>

      <Dialog open={isPdfAgentOpen} onOpenChange={setIsPdfAgentOpen}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
          <div className="p-4 border-b flex justify-between items-center bg-muted/20">
            <h3 className="font-bold">{selectedAgentReport?.nome}</h3>
            {selectedAgentReport?.report && <PDFDownloadLink document={<AgentReportPDF agentName={selectedAgentReport.nome} reportMarkdown={selectedAgentReport.report} companyName={companyName} accountantName={accountantName} accountantCrc={accountantCrc} />} fileName="relatorio.pdf"><Button size="sm">Baixar PDF</Button></PDFDownloadLink>}
          </div>
          <div className="flex-1"><PDFViewer width="100%" height="100%" className="border-none"><AgentReportPDF agentName={selectedAgentReport?.nome || ''} reportMarkdown={selectedAgentReport?.report || ''} companyName={companyName} accountantName={accountantName} accountantCrc={accountantCrc} /></PDFViewer></div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const calculateGlobalSummary = (prods: CalculatedProduct[], p: CalculationParams, fix: number, varPct: number, cfu: number, inners: number): GlobalSummaryData => {
  const sell = prods.reduce((s, x) => s + x.sellingPrice * x.quantity, 0);
  const tax = prods.reduce((s, x) => s + x.taxToPay * x.quantity, 0);
  const profit = prods.reduce((s, x) => s + x.valueForProfit * x.quantity, 0);
  return { totalSelling: sell, totalTax: tax, totalProfit: profit, profitMarginPercent: sell > 0 ? (profit/sell)*100 : 0, breakEvenPoint: 0, totalVariableExpensesValue: sell*(varPct/100), totalContributionMargin: sell - (prods.reduce((s,x)=>s+x.cost*x.quantity,0) + sell*(varPct/100)), totalTaxPercent: sell>0?(tax/sell)*100:0, totalCbsCredit: 0, totalIbsCredit: 0, totalCbsDebit: 0, totalIbsDebit: 0, totalCbsTaxToPay: 0, totalIbsTaxToPay: 0, totalIrpjToPay: 0, totalCsllToPay: 0, totalSimplesToPay: 0, totalSelectiveTaxToPay: 0, totalIvaCreditForClient: 0 };
};

export default Pricing;