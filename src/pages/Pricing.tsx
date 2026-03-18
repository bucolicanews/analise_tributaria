"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Upload, FileText, Calculator, Bot, ChevronDown, RefreshCw, BookOpen, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XmlUploader } from "@/components/XmlUploader";
import { ParametersForm } from "@/components/ParametersForm";
import { ProductsTable, GlobalSummaryData } from "@/components/ProductsTable";
import { Product, CalculationParams, CalculatedProduct, TaxRegime } from "@/types/pricing";
import { calculatePricing } from "@/lib/pricing";
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
import { PDFViewer } from '@react-pdf/renderer';
import { SalesReportPDF } from '@/components/SalesReportPDF';
import { AgentsTimeline } from '@/components/AgentsTimeline';
import { AgentReportPDF } from '@/components/AgentReportPDF';
import { AgentStatus, callGeminiAgent, callAgentWebhook, loadAgentsFromStorage } from '@/lib/geminiService';
import { useAuth } from '@/contexts/AuthContext';

const Pricing = () => {
  const { autenticado } = useAuth();
  const [purchaseProducts, setPurchaseProducts] = useState<Product[]>([]);
  const [salesProducts, setSalesProducts] = useState<Product[]>([]);
  const [params, setParams] = useState<CalculationParams | null>(null);
  const [selectedProductCodes, setSelectedProductCodes] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [isAgentsRunning, setIsAgentsRunning] = useState(false);
  const [selectedAgentReport, setSelectedAgentReport] = useState<AgentStatus | null>(null);
  const [isPdfAgentOpen, setIsPdfAgentOpen] = useState(false);
  const [isSalesReportOpen, setIsSalesReportOpen] = useState(false);

  useEffect(() => {
    const storedP = sessionStorage.getItem('jota-calc-purchase-products');
    const storedS = sessionStorage.getItem('jota-calc-params');
    const storedSel = sessionStorage.getItem('jota-calc-selection');
    if (storedP) setPurchaseProducts(JSON.parse(storedP));
    if (storedS) setParams(JSON.parse(storedS));
    if (storedSel) setSelectedProductCodes(new Set(JSON.parse(storedSel)));
  }, []);

  const getFullContextPayload = () => {
    if (!params || !summary) return null;
    
    // COLETA TUDO QUE FOI PREENCHIDO NA TELA DE VIABILIDADE (Local Storage)
    const viabilityContext = {
      razaoSocial: localStorage.getItem('viab-razaoSocial'),
      municipio: localStorage.getItem('viab-municipio'),
      estado: localStorage.getItem('viab-estado'),
      atividades: localStorage.getItem('viab-atividades'),
      faturamentoAnual: localStorage.getItem('viab-faturamentoAnual'),
      cnaes: localStorage.getItem('viab-cnaes'),
      folhaPagamento_viab: localStorage.getItem('viab-folhaPagamento'),
      prolabore_viab: localStorage.getItem('viab-valorProlabore'),
      naturezaJuridica: localStorage.getItem('viab-naturezaJuridica'),
      classificacaoFiscal: localStorage.getItem('viab-classificacaoFiscal'),
      capitalSocial: localStorage.getItem('viab-capital'),
    };

    // COMBINA COM OS DADOS CALCULADOS DA PRECIFICAÇÃO
    return {
      ...viabilityContext,
      prec_faturamentoMensal: summary.totalSelling,
      prec_lucroLiquido: summary.totalProfit,
      prec_margemLiquida: summary.profitMarginPercent,
      prec_regimeTributario: params.taxRegime,
      prec_cargaTributariaEfetiva: summary.totalTaxPercent,
      prec_pontoEquilibrio: summary.breakEvenPoint,
      prec_amostraProdutos: JSON.stringify(calculatedProducts.slice(0, 10))
    };
  };

  const handleRunAgents = async () => {
    const payload = getFullContextPayload();
    if (!payload) return toast.error("Calcule a precificação primeiro.");
    const agentConfigs = loadAgentsFromStorage();
    if (agentConfigs.length === 0) return;

    setAgentStatuses(agentConfigs.map(a => ({ id: a.id, nome: a.nome, systemPrompt: a.systemPrompt, status: 'idle', report: null })));
    setIsAgentsRunning(true);
    const previousReports: Record<string, string> = {};
    const userContent = JSON.stringify(payload, null, 2);
    const apiKey = localStorage.getItem('jota-gemini-key') || '';

    for (const agent of agentConfigs.sort((a,b) => (a.order||0)-(b.order||0))) {
      setAgentStatuses(prev => prev.map(s => s.id === agent.id ? { ...s, status: 'loading' } : s));
      try {
        const report = agent.webhookUrl?.trim() 
          ? await callAgentWebhook(agent, userContent, previousReports)
          : await callGeminiAgent(agent.systemPrompt, userContent + "\n\nRelatórios: " + JSON.stringify(previousReports), apiKey);
        previousReports[agent.nome] = report;
        setAgentStatuses(prev => prev.map(s => s.id === agent.id ? { ...s, status: 'done', report } : s));
      } catch (err: any) {
        setAgentStatuses(prev => prev.map(s => s.id === agent.id ? { ...s, status: 'error', errorMessage: err.message } : s));
      }
    }
    setIsAgentsRunning(false);
  };

  const calculationResults = useMemo(() => {
    if (!params || purchaseProducts.length === 0) return { summary: null, calculatedProducts: [] };
    const cfu = params.totalStockUnits > 0 ? (params.fixedCostsTotal || 0) / params.totalStockUnits : 0;
    const prods = purchaseProducts.filter(p => selectedProductCodes.has(p.code)).map(p => calculatePricing(p, params, cfu));
    const sell = prods.reduce((s, x) => s + x.sellingPrice * x.quantity, 0);
    const profit = prods.reduce((s, x) => s + x.valueForProfit * x.quantity, 0);
    const tax = prods.reduce((s, x) => s + x.taxToPay * x.quantity, 0);
    
    const summary: GlobalSummaryData = { 
      totalSelling: sell, totalTax: tax, totalProfit: profit, 
      profitMarginPercent: sell > 0 ? (profit/sell)*100 : 0, 
      totalTaxPercent: sell > 0 ? (tax/sell)*100 : 0,
      breakEvenPoint: (params.fixedCostsTotal || 0) / 0.3, // estimativa simples
      totalVariableExpensesValue: 0, totalContributionMargin: 0, totalCbsCredit: 0, totalIbsCredit: 0, totalCbsDebit: 0, totalIbsDebit: 0, totalCbsTaxToPay: 0, totalIbsTaxToPay: 0, totalIrpjToPay: 0, totalCsllToPay: 0, totalSimplesToPay: 0, totalSelectiveTaxToPay: 0, totalIvaCreditForClient: 0
    };
    return { summary, calculatedProducts: prods };
  }, [params, purchaseProducts, selectedProductCodes]);

  const { summary, calculatedProducts } = calculationResults;

  const handleSendToWebhook = async (env: 'test' | 'production') => {
    const payload = getFullContextPayload();
    if (!payload) return;
    setIsSending(true);
    const url = env === 'test' ? localStorage.getItem('jota-webhook-test') : localStorage.getItem('jota-webhook-prod');
    try {
      const res = await fetch(url!, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      setAiReport(data.report || data.output || data.text || "");
      toast.success("Análise concluída!");
    } catch (err: any) { toast.error("Erro: " + err.message); } finally { setIsSending(false); }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6"><h2 className="text-lg font-semibold mb-4">1. Compras</h2><XmlUploader onXmlParsed={p => { setPurchaseProducts(p); setSelectedProductCodes(new Set(p.map(x=>x.code))); sessionStorage.setItem('jota-calc-purchase-products', JSON.stringify(p)); }} uploadType="purchase" /></Card>
          <Card className="p-6"><h2 className="text-lg font-semibold mb-4">Parâmetros</h2><ParametersForm onCalculate={p => { setParams(p); sessionStorage.setItem('jota-calc-params', JSON.stringify(p)); }} disabled={purchaseProducts.length === 0} /></Card>
        </div>
        <div className="lg:col-span-2 space-y-6">
          {aiReport && <AiAnalysisReport report={aiReport} onClose={() => setAiReport(null)} clientName="Sua Empresa" clientCity="" clientState="" />}
          {agentStatuses.length > 0 && <AgentsTimeline agents={agentStatuses} onViewReport={a => { setSelectedAgentReport(a); setIsPdfAgentOpen(true); }} onPrintReport={a => { setSelectedAgentReport(a); setIsPdfAgentOpen(true); }} onRunSingle={() => {}} />}
          {purchaseProducts.length > 0 && params ? (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Relatório</h2>
                <div className="flex gap-2">
                  {autenticado && (
                    <>
                      <Button size="sm" disabled={isAgentsRunning} onClick={handleRunAgents} className="bg-indigo-600"><Bot className="h-4 w-4 mr-2" /> Agentes IA (Contexto Total)</Button>
                      <DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="outline" disabled={isSending}><Sparkles className="h-4 w-4 mr-2" /> Auditoria IA</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={() => handleSendToWebhook('test')}>Teste</DropdownMenuItem><DropdownMenuItem onClick={() => handleSendToWebhook('production')}>Produção</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                    </>
                  )}
                </div>
              </div>
              <ProductsTable products={purchaseProducts} params={params} selectedProductCodes={selectedProductCodes} onSelectionChange={s => setSelectedProductCodes(s)} />
            </Card>
          ) : <Card className="p-12 text-center text-muted-foreground"><Calculator className="h-12 w-12 mx-auto mb-4 opacity-20" /><h3 className="text-xl font-semibold">Aguardando Importação</h3></Card>}
        </div>
      </div>
      <Dialog open={isPdfAgentOpen} onOpenChange={setIsPdfAgentOpen}><DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0"><div className="flex-1"><PDFViewer width="100%" height="100%" className="border-none"><AgentReportPDF agentName={selectedAgentReport?.nome || ''} reportMarkdown={selectedAgentReport?.report || ''} companyName={localStorage.getItem('jota-razaoSocial')||''} /></PDFViewer></div></DialogContent></Dialog>
    </div>
  );
};

export default Pricing;