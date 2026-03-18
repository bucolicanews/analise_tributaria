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
import { getInssTables } from '@/lib/tax/inssData';
import { getIrpfTables } from '@/lib/tax/irpfData';
import { getMinimumWages } from '@/lib/tax/minimumWageData';

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

  const companyName = localStorage.getItem('jota-razaoSocial') || 'Sua Empresa';
  const accountantName = localStorage.getItem('jota-contador-nome') || '';
  const accountantCrc = localStorage.getItem('jota-contador-crc') || '';

  useEffect(() => {
    const storedP = sessionStorage.getItem('jota-calc-purchase-products');
    const storedS = sessionStorage.getItem('jota-calc-params');
    const storedSel = sessionStorage.getItem('jota-calc-selection');
    if (storedP) setPurchaseProducts(JSON.parse(storedP));
    if (storedS) setParams(JSON.parse(storedS));
    if (storedSel) setSelectedProductCodes(new Set(JSON.parse(storedSel)));
  }, []);

  const getFullStructuredPayload = (environment: 'test' | 'production', webhookUrl: string) => {
    if (!params || !summary) return null;
    
    const ano = params.anoBase || "2025";
    const inssTables = getInssTables();
    const irpfTables = getIrpfTables();
    const currentMinWage = getMinimumWages().find(w => w.year === ano)?.value || 1621;

    // Recupera dados de viabilidade
    const cnaesRaw = localStorage.getItem('viab-cnaes');
    const cnaesList = cnaesRaw ? JSON.parse(cnaesRaw) : [];

    const faturamentoNum = parseFloat(localStorage.getItem('viab-faturamentoAnual') || "0");
    const percComercioNum = parseFloat(localStorage.getItem('viab-percentComercio') || "100");
    const percServicoNum = parseFloat(localStorage.getItem('viab-percentServico') || "0");
    
    const folhaNum = params.payroll || 0;
    const proLaboreNum = parseFloat(localStorage.getItem('viab-valorProlabore') || "0");
    const folha12Meses = (folhaNum + proLaboreNum) * 12;
    const percentualFatorR = faturamentoNum > 0 ? (folha12Meses / faturamentoNum) * 100 : 0;
    const fatorROk = percentualFatorR >= 28;

    return {
      meta: {
        webhookUrl: webhookUrl,
        executionMode: environment
      },
      agentName: "Diagnóstico de Viabilidade e Estruturação de Negócios",
      engine: {
        analises_requeridas: [
          "enquadramento_simples",
          "calculo_carga_tributaria",
          "analise_fator_r",
          "diagnostico_risco",
          "viabilidade_financeira",
          "planejamento_tributario"
        ],
        simulacoes_pro_labore: [
          { nome: "cenario_atual", descricao: "Situação atual conforme preenchido" },
          { nome: "cenario_minimo", valor: currentMinWage, descricao: "Obrigatório legal mínimo (1 SM)" },
          { nome: "cenario_otimizado_fator_r", descricao: "Pró-labore ideal para atingir 28% do Fator R (se Anexo V)" }
        ],
        output_config: {
          formato: "relatorio_consultivo",
          secoes: [
            "diagnostico_geral",
            "carga_tributaria",
            "analise_fator_r",
            "riscos_identificados",
            "economia_potencial",
            "recomendacoes_praticas"
          ]
        }
      },
      contexto: {
        anoBase: ano,
        objetivo: "Análise de Viabilidade, Planejamento Tributário e Precificação"
      },
      tabelasReferencia: {
        inss: inssTables.filter(t => t.year === ano),
        irpf: irpfTables.filter(t => t.year === ano),
        salario_minimo: currentMinWage
      },
      empresa: {
        razaoSocial: localStorage.getItem('viab-razaoSocial') || companyName,
        naturezaJuridica: localStorage.getItem('viab-naturezaJuridica') || "",
        classificacaoFiscal: localStorage.getItem('viab-classificacaoFiscal') || "ME",
        capitalSocial: parseFloat(localStorage.getItem('viab-capital') || "0"),
        numSocios: parseInt(localStorage.getItem('viab-numSocios') || "1"),
        localizacao: { 
          municipio: localStorage.getItem('viab-municipio') || "", 
          estado: localStorage.getItem('viab-estado') || "SP" 
        },
        tributacaoPretendida: params.taxRegime
      },
      operacional: {
        cnaes: cnaesList.map((c: any) => ({ codigo: c.code, descricao: c.description, tipo: c.isPrimary ? 'Principal' : 'Secundário' })),
        descricaoAtividades: localStorage.getItem('viab-atividades') || "",
        ideiaNegocio: localStorage.getItem('viab-businessIdea') || ""
      },
      financeiro: {
        faturamento: {
          anual_total: faturamentoNum,
          mensal_medio: faturamentoNum / 12,
          segregacao: {
            comercio_percent: percComercioNum,
            servico_percent: percServicoNum,
            comercio_valor: (faturamentoNum * percComercioNum) / 100,
            servico_valor: (faturamentoNum * percServicoNum) / 100
          },
          anexo_simples_sugerido: {
            comercio: percComercioNum > 0 ? "Anexo I" : null,
            servico: percServicoNum > 0 ? (fatorROk ? "Anexo III" : "Anexo V") : null
          }
        },
        fator_r: {
          sujeito_fator_r: percServicoNum > 0,
          folha_12_meses: folha12Meses,
          faturamento_12_meses: faturamentoNum,
          percentual_atual: percentualFatorR,
          resultado: fatorROk ? "Anexo III" : "Anexo V",
          valor_ideal_folha_mensal: faturamentoNum > 0 ? (faturamentoNum * 0.28) / 12 : 0
        },
        custos_operacionais: {
          fixos_mensais: params.fixedCostsTotal || 0,
          variaveis_percentual: params.variableExpenses.reduce((s,e)=>s+e.percentage, 0)
        },
        tributos_locais: {
          iss_municipio: parseFloat(localStorage.getItem('viab-aliquotaIss') || "5"),
          icms_estado: parseFloat(localStorage.getItem('viab-aliquotaIcms') || "18")
        },
        custos_abertura: {
          honorarios_legalizacao: parseFloat(localStorage.getItem('viab-honorariosLegalizacao') || "1900"),
          assessoria_mensal: parseFloat(localStorage.getItem('viab-honorariosAssessoriaMensal') || "450"),
          junta_cartorio: parseFloat(localStorage.getItem('viab-valorJuntaCartorio') || "519"),
          bombeiro_licencas: parseFloat(localStorage.getItem('viab-valorBombeiro') || "650")
        },
        precificacao_detalhada: {
          lucro_liquido_nota: summary.totalProfit,
          margem_liquida_percent: summary.profitMarginPercent,
          carga_tributaria_efetiva: summary.totalTaxPercent,
          ponto_equilibrio: summary.breakEvenPoint,
          amostra_produtos: calculatedProducts.slice(0, 10)
        }
      },
      societario_trabalhista: {
        quadro_pessoal: {
          num_funcionarios: parseInt(localStorage.getItem('viab-numFuncionarios') || "0"),
          folha_salarial_mensal: params.payroll
        },
        pro_labore: {
          declara_prolabore: localStorage.getItem('viab-sociosDeclaramProlabore') === 'Sim',
          valor_declarado: proLaboreNum,
          valor_estimado: currentMinWage,
          recolhe_inss_ir: localStorage.getItem('viab-sociosRecolhemInssIr') === 'Sim',
          modo_calculo: localStorage.getItem('viab-sociosDeclaramProlabore') === 'Sim' ? 'declarado' : 'estimado_para_simulacao'
        },
        retira_valores_pf: localStorage.getItem('viab-sociosRetiramValores') === 'Sim'
      },
      conformidade_riscos: {
        alertas_criticos: {
          confusao_patrimonial: localStorage.getItem('viab-mesmaContaSocios') === 'Sim' || localStorage.getItem('viab-recebeContaPF') === 'Sim',
          retirada_informal: localStorage.getItem('viab-sociosRetiramValores') === 'Sim' && localStorage.getItem('viab-sociosDeclaramProlabore') !== 'Sim',
          risco_previdenciario: localStorage.getItem('viab-sociosDeclaramProlabore') !== 'Sim' || localStorage.getItem('viab-sociosRecolhemInssIr') !== 'Sim'
        }
      }
    };
  };

  const handleRunAgents = async () => {
    const payload = getFullStructuredPayload('production', '');
    if (!payload) return toast.error("Calcule a precificação primeiro.");
    
    const agentConfigs = loadAgentsFromStorage();
    if (agentConfigs.length === 0) return;

    setAgentStatuses(agentConfigs.map(a => ({ id: a.id, nome: a.nome, systemPrompt: a.systemPrompt, status: 'idle', report: null })));
    setIsAgentsRunning(true);
    
    const previousReports: Record<string, string> = {};
    const apiKey = localStorage.getItem('jota-gemini-key') || '';

    const userContent = JSON.stringify(payload, null, 2);

    for (const agent of agentConfigs.sort((a,b) => (a.order||0)-(b.order||0))) {
      setAgentStatuses(prev => prev.map(s => s.id === agent.id ? { ...s, status: 'loading' } : s));
      try {
        const report = agent.webhookUrl?.trim() 
          ? await callAgentWebhook(agent, userContent, previousReports)
          : await callGeminiAgent(agent.systemPrompt, userContent + "\n\nRelatórios anteriores: " + JSON.stringify(previousReports), apiKey);
        
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
      breakEvenPoint: (params.fixedCostsTotal || 0) / 0.3,
      totalVariableExpensesValue: 0, totalContributionMargin: 0, totalCbsCredit: 0, totalIbsCredit: 0, totalCbsDebit: 0, totalIbsDebit: 0, totalCbsTaxToPay: 0, totalIbsTaxToPay: 0, totalIrpjToPay: 0, totalCsllToPay: 0, totalSimplesToPay: 0, totalSelectiveTaxToPay: 0, totalIvaCreditForClient: 0
    };
    return { summary, calculatedProducts: prods };
  }, [params, purchaseProducts, selectedProductCodes]);

  const { summary, calculatedProducts } = calculationResults;

  const handleSendToWebhook = async (env: 'test' | 'production') => {
    const url = env === 'test' ? localStorage.getItem('jota-webhook-test') : localStorage.getItem('jota-webhook-prod');
    if (!url) return toast.error(`Webhook de ${env} não configurado.`);
    
    const payload = getFullStructuredPayload(env, url);
    if (!payload) return;
    
    setIsSending(true);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`Erro de rede: ${res.status}`);
      const data = await res.json();
      setAiReport(data.report || data.output || data.text || "Relatório concluído com sucesso.");
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
                      <Button size="sm" disabled={isAgentsRunning} onClick={handleRunAgents} className="bg-indigo-600 text-white"><Bot className="h-4 w-4 mr-2" /> Agentes IA (Contexto Total)</Button>
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