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
import { Badge } from "@/components/ui/badge";
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
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const [isSalesReportOpen, setIsSalesReportOpen] = useState(false);
  const [isPdfAgentOpen, setIsPdfAgentOpen] = useState(false);

  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [isAgentsRunning, setIsAgentsRunning] = useState(false);
  const [selectedAgentReport, setSelectedAgentReport] = useState<AgentStatus | null>(null);

  // Dados da empresa para o Relatório
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

  const handleNewConsultation = () => {
    setPurchaseProducts([]);
    setSalesProducts([]);
    setParams(null);
    setSelectedProductCodes(new Set());
    setAiReport(null);
    setExecutionTime(null);
    setAgentStatuses([]);
    sessionStorage.clear();
    toast.success("Nova consulta iniciada.");
  };

  const buildViabilidadePayload = () => ({
    razaoSocial: localStorage.getItem('viab-razaoSocial') || 'Não informado',
    naturezaJuridica: localStorage.getItem('viab-naturezaJuridica') || 'Não informado / Sugerir',
    capital: localStorage.getItem('viab-capital') || 'Não informado',
    numSocios: localStorage.getItem('viab-numSocios') || 'Não informado',
    numFuncionarios: localStorage.getItem('viab-numFuncionarios') || 'Não informado',
    folhaPagamento: localStorage.getItem('viab-folhaPagamento') || 'Não informado',
    municipio: localStorage.getItem('viab-municipio') || 'Não informado',
    estado: localStorage.getItem('viab-estado') || 'Não informado',
    atividades: localStorage.getItem('viab-atividades') || 'Não informado',
    tributacaoSugerida: localStorage.getItem('viab-tributacaoSugerida') || 'Não informado / Sugerir',
    businessIdea: localStorage.getItem('viab-businessIdea') || 'Não informado',
    faturamentoAnual: localStorage.getItem('viab-faturamentoAnual') || 'Não informado',
    percentComercio: localStorage.getItem('viab-percentComercio') || '100',
    percentServico: localStorage.getItem('viab-percentServico') || '0',
    honorariosLegalizacao: localStorage.getItem('viab-honorariosLegalizacao') || 'Não informado',
    honorariosAssessoriaMensal: localStorage.getItem('viab-honorariosAssessoriaMensal') || 'Não informado',
    valorJuntaCartorio: localStorage.getItem('viab-valorJuntaCartorio') || 'Não informado',
    valorDpa: localStorage.getItem('viab-valorDpa') || 'Não informado',
    valorBombeiro: localStorage.getItem('viab-valorBombeiro') || 'Não informado',
    valorLicencasMunicipais: localStorage.getItem('viab-valorLicencasMunicipais') || 'Não informado',
    sociosRetiramValores: localStorage.getItem('viab-sociosRetiramValores') || 'Não informado',
    sociosDeclaramProlabore: localStorage.getItem('viab-sociosDeclaramProlabore') || 'Não informado',
    sociosRecolhemInssIr: localStorage.getItem('viab-sociosRecolhemInssIr') || 'Não informado',
    recebeContaPF: localStorage.getItem('viab-recebeContaPF') || 'Não informado',
    mesmaContaSocios: localStorage.getItem('viab-mesmaContaSocios') || 'Não informado',
  });

  const handleRunAgents = async () => {
    if (!params || !summary || calculatedProducts.length === 0) {
      toast.error("Realize a precificação antes de executar os agentes.");
      return;
    }

    const viabAtividades = localStorage.getItem('viab-atividades')?.trim() || '';
    const viabMunicipio = localStorage.getItem('viab-municipio')?.trim() || '';
    if (!viabAtividades || !viabMunicipio) {
      toast.error("Preencha a Análise de Viabilidade antes de usar os agentes.", {
        description: "Acesse a aba 'Análise de Viabilidade' e preencha pelo menos Atividades e Município."
      });
      return;
    }

    const agentConfigs = loadAgentsFromStorage();
    if (agentConfigs.length === 0) {
      toast.error("Nenhum agente cadastrado. Acesse Configurações para cadastrar agentes.");
      return;
    }

    const precificacaoPayload = createOptimizedAIPayload(params, summary, calculatedProducts);
    const viabilidadePayload = buildViabilidadePayload();
    const userContent = JSON.stringify({ ...precificacaoPayload, viabilidade: viabilidadePayload }, null, 2);

    const sorted = [...agentConfigs].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

    const initialStatuses: AgentStatus[] = sorted.map(a => ({
      id: a.id,
      nome: a.nome,
      systemPrompt: a.systemPrompt,
      status: 'idle',
      report: null,
    }));
    setAgentStatuses(initialStatuses);
    setIsAgentsRunning(true);
    setTimeout(() => document.getElementById('agents-timeline-section')?.scrollIntoView({ behavior: 'smooth' }), 300);

    const previousReports: Record<string, string> = {};
    const apiKey = localStorage.getItem('jota-gemini-key')?.trim() || '';

    for (const agent of sorted) {
      setAgentStatuses(prev =>
        prev.map(s => s.id === agent.id ? { ...s, status: 'loading' } : s)
      );

      try {
        const report = agent.webhookUrl?.trim()
          ? await callAgentWebhook(agent, userContent, previousReports)
          : await callGeminiAgent(
              agent.systemPrompt,
              Object.keys(previousReports).length > 0
                ? userContent + '\n\n---\nRELATÓRIOS ANTERIORES:\n' + Object.entries(previousReports).map(([nome, r]) => `## ${nome}\n${r}`).join('\n\n')
                : userContent,
              apiKey
            );

        previousReports[agent.nome] = report;

        setAgentStatuses(prev =>
          prev.map(s => s.id === agent.id ? { ...s, status: 'done', report } : s)
        );
      } catch (err: any) {
        setAgentStatuses(prev =>
          prev.map(s => s.id === agent.id ? { ...s, status: 'error', errorMessage: err.message } : s)
        );
      }
    }

    setIsAgentsRunning(false);
    toast.success("Todos os agentes concluíram a execução.");
  };

  const handleRunSingleAgent = async (agent: AgentStatus) => {
    if (!params || !summary || calculatedProducts.length === 0) {
      toast.error("Realize a precificação antes de executar os agentes.");
      return;
    }

    const agentConfigs = loadAgentsFromStorage();
    const agentConfig = agentConfigs.find(a => a.id === agent.id);
    if (!agentConfig) {
      toast.error("Configuração do agente não encontrada.");
      return;
    }

    const precificacaoPayload = createOptimizedAIPayload(params, summary, calculatedProducts);
    const viabilidadePayload = buildViabilidadePayload();
    const userContent = JSON.stringify({ ...precificacaoPayload, viabilidade: viabilidadePayload }, null, 2);

    const previousReports: Record<string, string> = {};
    agentStatuses
      .filter(s => s.status === 'done' && s.report && s.id !== agent.id)
      .forEach(s => { previousReports[s.nome] = s.report!; });

    setAgentStatuses(prev =>
      prev.map(s => s.id === agent.id ? { ...s, status: 'loading', report: null, errorMessage: undefined } : s)
    );

    const apiKey = localStorage.getItem('jota-gemini-key')?.trim() || '';
    try {
      const report = agentConfig.webhookUrl?.trim()
        ? await callAgentWebhook(agentConfig, userContent, previousReports)
        : await callGeminiAgent(
            agentConfig.systemPrompt,
            Object.keys(previousReports).length > 0
              ? userContent + '\n\n---\nRELATÓRIOS ANTERIORES:\n' + Object.entries(previousReports).map(([nome, r]) => `## ${nome}\n${r}`).join('\n\n')
              : userContent,
            apiKey
          );
      setAgentStatuses(prev =>
        prev.map(s => s.id === agent.id ? { ...s, status: 'done', report } : s)
      );
      toast.success(`Agente "${agent.nome}" concluído.`);
    } catch (err: any) {
      setAgentStatuses(prev =>
        prev.map(s => s.id === agent.id ? { ...s, status: 'error', errorMessage: err.message } : s)
      );
      toast.error(`Erro no agente "${agent.nome}"`, { description: err.message });
    }
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

    const viabAtividades = localStorage.getItem('viab-atividades')?.trim() || '';
    const viabMunicipio = localStorage.getItem('viab-municipio')?.trim() || '';
    if (!viabAtividades || !viabMunicipio) {
      toast.error("Preencha a Análise de Viabilidade antes de usar a Auditoria IA.", {
        description: "Acesse a aba 'Análise de Viabilidade' e preencha pelo menos Atividades e Município."
      });
      return;
    }

    const relayUrl = localStorage.getItem('jota-relay-url')?.trim() || 'http://localhost:3001';
    const agentConfigs = loadAgentsFromStorage();
    const useRelay = agentConfigs.length > 0;

    const startTime = performance.now();
    setIsSending(true);
    const toastId = toast.loading(`Gerando Diagnóstico Estratégico (${environment})...`);

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      const precificacaoPayload = createOptimizedAIPayload(params, summary, calculatedProducts);
      
      const payload = {
        agentName: "Auditoria Estratégica Global",
        systemPrompt: "Você é um auditor fiscal sênior...",
        empresa: {
          razaoSocial: companyName,
          cnpj: params.companyCnpj,
          cnaes: params.companyCnaes?.split(','),
          estado: params.companyState || "SP",
          municipio: viabMunicipio
        },
        financeiro: {
          faturamentoMensal: summary.totalSelling,
          faturamentoAnualEstimado: summary.totalSelling * 12,
          segregacaoAtividade: {
            comercioPercent: params.percentComercio || 0,
            servicoPercent: params.percentServico || 0
          },
          lucroLiquido: summary.totalProfit,
          margemLiquida: summary.profitMarginPercent / 100,
          pontoEquilibrio: summary.breakEvenPoint
        },
        folha: {
          folhaPagamentoMensal: params.payroll,
          inssPatronalRate: params.inssPatronalRate
        },
        tributos: {
          regimeAtual: params.taxRegime,
          cargaTributariaEfetiva: summary.totalTaxPercent / 100,
          totalImpostosLiquidos: summary.totalTax
        },
        viabilidade: buildViabilidadePayload(),
        agentes: agentConfigs.map(a => ({ nome: a.nome, systemPrompt: a.systemPrompt })),
        sessionId,
        relayUrl: `${relayUrl}/agent-result`,
      };

      const webhooks = {
        test: localStorage.getItem('jota-webhook-test') || 'https://jota-empresas-n8n.ubjifz.easypanel.host/webhook-test/e50090ba-ffc9-45e7-86f5-9a0467f4f794',
        production: localStorage.getItem('jota-webhook-prod') || 'https://jota-empresas-n8n.ubjifz.easypanel.host/webhook/e50090ba-ffc9-45e7-86f5-9a0467f4f794'
      };

      const webhookUrl = webhooks[environment];
      if (!webhookUrl) throw new Error(`Webhook de ${environment} não configurado.`);

      if (useRelay) {
        const initialStatuses: AgentStatus[] = agentConfigs.map(a => ({
          id: a.id,
          nome: a.nome,
          systemPrompt: a.systemPrompt,
          status: 'loading' as const,
          report: null,
        }));
        setAgentStatuses(initialStatuses);
        setTimeout(() => document.getElementById('agents-timeline-section')?.scrollIntoView({ behavior: 'smooth' }), 300);
      }

      let usedRelay = false;
      if (useRelay) {
        try {
          await fetch(`${relayUrl}/health`, { signal: AbortSignal.timeout(2000) });
          usedRelay = true;
        } catch {
          usedRelay = false;
        }
      }

      if (usedRelay) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});

        toast.loading(`Aguardando agentes responderem...`, { id: toastId });

        const pollStart = Date.now();
        const poll = async (): Promise<void> => {
          if (Date.now() - pollStart > 5 * 60 * 1000) {
            toast.error("Tempo limite atingido.", { id: toastId });
            setIsSending(false);
            return;
          }
          try {
            const res = await fetch(`${relayUrl}/agent-results/${sessionId}`);
            const json = await res.json();
            const arrived = json.agents || [];
            arrived.forEach((agent: any) => {
              setAgentStatuses(prev => prev.map(s => s.nome === agent.nome ? { ...s, status: 'done', report: agent.report } : s));
            });
            if (arrived.length >= agentConfigs.length) {
              toast.success("Concluído!", { id: toastId });
              setIsSending(false);
              return;
            }
          } catch { }
          setTimeout(poll, 2000);
        };
        setTimeout(poll, 2000);
        return;
      }

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

      const unwrapped = Array.isArray(data) && data[0]?.json ? data[0].json : data;
      let extractedReport = unwrapped.report || unwrapped.output || unwrapped.text || (typeof unwrapped === 'string' ? unwrapped : "");
      
      if (!extractedReport && unwrapped.content?.parts) {
        extractedReport = unwrapped.content.parts.map((p: any) => p.text || "").join("\n\n");
      }

      setAiReport(extractedReport);
      toast.success(`Análise Concluída!`, { id: toastId });

    } catch (error: any) {
      toast.error("Erro na Auditoria IA", { id: toastId, description: error.message });
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
              <AiAnalysisReport 
                report={aiReport} 
                onClose={() => setAiReport(null)} 
                executionTime={executionTime}
                clientName={companyName}
                clientCity={params?.companyState || "SP"}
                clientState=""
              />
            </div>
          )}

          {agentStatuses.length > 0 && (
            <div id="agents-timeline-section">
              <AgentsTimeline
                agents={agentStatuses}
                onViewReport={(agent) => {
                  setSelectedAgentReport(agent);
                  setIsPdfAgentOpen(true);
                }}
                onPrintReport={(agent) => {
                  setSelectedAgentReport(agent);
                  setIsPdfAgentOpen(true);
                }}
                onRunSingle={handleRunSingleAgent}
              />
            </div>
          )}

          <Dialog open={isPdfAgentOpen} onOpenChange={setIsPdfAgentOpen}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
              <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                <DialogHeader>
                  <DialogTitle className="text-sm">{selectedAgentReport?.nome || 'Relatório do Agente'}</DialogTitle>
                  <DialogDescription className="sr-only">Visualização do relatório gerado pelo agente IA.</DialogDescription>
                </DialogHeader>
                <div className="flex gap-2">
                  {selectedAgentReport?.report && (
                    <PDFDownloadLink
                      document={
                        <AgentReportPDF
                          agentName={selectedAgentReport.nome}
                          reportMarkdown={selectedAgentReport.report}
                          companyName={companyName}
                          accountantName={accountantName}
                          accountantCrc={accountantCrc}
                        />
                      }
                      fileName={`${selectedAgentReport.nome.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`}
                    >
                      {({ loading }) => (
                        <Button size="sm" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                          {loading ? 'Gerando...' : 'Baixar PDF'}
                        </Button>
                      )}
                    </PDFDownloadLink>
                  )}
                </div>
              </div>
              <div className="flex-1 w-full bg-slate-100 overflow-hidden">
                <PDFViewer width="100%" height="100%" className="border-none w-full h-full">
                  <AgentReportPDF
                    agentName={selectedAgentReport?.nome || ''}
                    reportMarkdown={selectedAgentReport?.report || ''}
                    companyName={companyName}
                    accountantName={accountantName}
                    accountantCrc={accountantCrc}
                  />
                </PDFViewer>
              </div>
            </DialogContent>
          </Dialog>

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
                        <Button variant="outline" size="sm" className="bg-primary/5 border-primary/20 hover:bg-primary/10">
                          <BookOpen className="h-4 w-4 mr-2 text-primary" />
                          Relatório Venda (PDF)
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
                        <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                          <DialogHeader>
                            <DialogTitle>Relatório Oficial de Precificação</DialogTitle>
                            <DialogDescription className="sr-only">Visualização do relatório de vendas.</DialogDescription>
                          </DialogHeader>
                          <div className="flex gap-2">
                             <PDFDownloadLink
                                document={
                                  <SalesReportPDF 
                                    products={calculatedProducts}
                                    companyName={companyName}
                                    accountantName={accountantName}
                                    accountantCrc={accountantCrc}
                                  />
                                }
                                fileName={`relatorio_vendas_${new Date().toISOString().split('T')[0]}.pdf`}
                              >
                                {({ loading }) => (
                                  <Button size="sm" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                    <FileDown className="h-4 w-4 mr-2" />
                                    {loading ? 'Gerando...' : 'Baixar PDF'}
                                  </Button>
                                )}
                              </PDFDownloadLink>
                          </div>
                        </div>
                        <div className="flex-1 w-full bg-slate-100 overflow-hidden">
                          <PDFViewer width="100%" height="100%" className="border-none w-full h-full">
                            <SalesReportPDF 
                              products={calculatedProducts}
                              companyName={companyName}
                              accountantName={accountantName}
                              accountantCrc={accountantCrc}
                            />
                          </PDFViewer>
                        </div>
                      </DialogContent>
                    </Dialog>
                     {autenticado && (
                                
                      <Button
                        size="sm"
                        disabled={isAgentsRunning}
                        onClick={handleRunAgents}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white relative"
                        title="Executar os agentes IA"
                      >
                        <Bot className="h-4 w-4 mr-2" />
                        {isAgentsRunning ? "Executando..." : "Agentes IA"}
  </Button> )}
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

export default Pricing;