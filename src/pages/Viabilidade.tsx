import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Sparkles, ChevronDown, RefreshCw, Building2, ShieldQuestion, Gavel, Loader2, Trash2, Plus, ListChecks, Calendar, Bot, AlertTriangle, Printer, FileDown } from 'lucide-react';
import { AiAnalysisReport } from '@/components/AiAnalysisReport';
import { AnalysisProgress, ProgressStep } from '@/components/AnalysisProgress';
import { getInssTables } from '@/lib/tax/inssData';
import { getIrpfTables } from '@/lib/tax/irpfData';
import { getMinimumWages } from '@/lib/tax/minimumWageData';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader as UIDialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { callGeminiAgent, DEFAULT_PRE_ANALYSIS_PROMPT } from '@/lib/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ViabilityReportPDF } from '@/components/ViabilityReportPDF';

const UFs = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
const naturezasJuridicas = ["Empresário Individual (EI)", "Sociedade Limitada (LTDA)", "Sociedade Limitada Unipessoal (SLU)", "Sociedade Simples", "Não sei / Sugerir"];
const classificacoesFiscais = ["Microempresa (ME)", "Empresa de Pequeno Porte (EPP)", "Médio/Grande Porte", "Sugerir com base no faturamento"];
const anosBase = ["2022", "2023", "2024", "2025", "2026"];
const simNao = ["Sim", "Não"];

interface CnaeEntry { id: string; code: string; description: string; isPrimary: boolean; }

const SectionTitle = ({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) => (
  <div className="flex items-center gap-3 pb-3 border-b border-border mb-4">
    <div className="p-2 bg-accent/10 rounded-lg"><Icon className="h-4 w-4 text-accent" /></div>
    <div><h3 className="font-semibold text-sm text-foreground">{title}</h3>{subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}</div>
  </div>
);

const formatCityName = (city: string) => {
  if (!city) return "";
  return city.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
};

const Viabilidade = () => {
  const getStored = (key: string, fallback: string = '') => localStorage.getItem(key) ?? fallback;

  const [razaoSocial, setRazaoSocial] = useState(() => getStored('viab-razaoSocial'));
  const [naturezaJuridica, setNaturezaJuridica] = useState(() => getStored('viab-naturezaJuridica'));
  const [classificacaoFiscal, setClassificacaoFiscal] = useState(() => getStored('viab-classificacaoFiscal', 'Microempresa (ME)'));
  const [capital, setCapital] = useState(() => getStored('viab-capital'));
  const [cnaes, setCnaes] = useState<CnaeEntry[]>(() => {
    const saved = localStorage.getItem('viab-cnaes');
    return saved ? JSON.parse(saved) : [{ id: '1', code: '', description: '', isPrimary: true }];
  });
  const [atividades, setAtividades] = useState(() => getStored('viab-atividades'));
  const [numSocios, setNumSocios] = useState(() => getStored('viab-numSocios', '1'));
  const [numFuncionarios, setNumFuncionarios] = useState(() => getStored('viab-numFuncionarios', '0'));
  const [folhaPagamento, setFolhaPagamento] = useState(() => getStored('viab-folhaPagamento'));
  const [folha12Meses, setFolha12Meses] = useState(() => getStored('viab-folha12Meses'));
  const [municipio, setMunicipio] = useState(() => getStored('viab-municipio'));
  const [estado, setEstado] = useState(() => getStored('viab-estado', 'SP'));
  const [tributacaoSugerida, setTributacaoSugerida] = useState(() => getStored('viab-tributacaoSugerida'));
  const [businessIdea, setBusinessIdea] = useState(() => getStored('viab-businessIdea'));
  const [anoBase, setAnoBase] = useState(() => getStored('viab-anoBase', '2025'));
  const [faturamentoAnual, setFaturamentoAnual] = useState(() => getStored('viab-faturamentoAnual'));
  const [percentComercio, setPercentComercio] = useState(() => getStored('viab-percentComercio', '100'));
  const [percentServico, setPercentServico] = useState(() => getStored('viab-percentServico', '0'));
  const [fixosMensais, setFixosMensais] = useState(() => getStored('viab-fixosMensais', '3000'));
  const [variaveisPercentual, setVariaveisPercentual] = useState(() => getStored('viab-variaveisPercentual', '35'));
  const [aliquotaIss, setAliquotaIss] = useState(() => getStored('viab-aliquotaIss', '5'));
  const [aliquotaIcms, setAliquotaIcms] = useState(() => getStored('viab-aliquotaIcms', '18'));
  const [sociosRetiramValores, setSociosRetiramValores] = useState(() => getStored('viab-sociosRetiramValores', 'Sim'));
  const [sociosDeclaramProlabore, setSociosDeclaramProlabore] = useState(() => getStored('viab-sociosDeclaramProlabore', 'Não'));
  const [valorProlabore, setValorProlabore] = useState(() => getStored('viab-valorProlabore'));
  const [sociosRecolhemInssIr, setSociosRecolhemInssIr] = useState(() => getStored('viab-sociosRecolhemInssIr', 'Não'));
  const [recebeContaPF, setRecebeContaPF] = useState(() => getStored('viab-recebeContaPF', 'Não'));
  const [mesmaContaSocios, setMesmaContaSocios] = useState(() => getStored('viab-mesmaContaSocios', 'Sim'));
  
  const [aiReport, setAiReport] = useState<string | null>(() => localStorage.getItem('viab-aiReport'));
  const [isLoading, setIsLoading] = useState(false);
  const [progressStep, setProgressStep] = useState<ProgressStep>('idle');
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const [isPreAnalyzing, setIsPreAnalyzing] = useState(false);
  const [preAnalysisReport, setPreAnalysisReport] = useState<string | null>(null);

  const handleFolhaMensalChange = (val: string) => {
    setFolhaPagamento(val);
    const num = parseFloat(val) || 0;
    setFolha12Meses((num * 12).toString());
  };

  useEffect(() => {
    const data: Record<string, string> = {
      'viab-razaoSocial': razaoSocial, 'viab-naturezaJuridica': naturezaJuridica, 'viab-classificacaoFiscal': classificacaoFiscal, 'viab-capital': capital,
      'viab-atividades': atividades, 'viab-numSocios': numSocios, 'viab-numFuncionarios': numFuncionarios, 'viab-folhaPagamento': folhaPagamento, 
      'viab-folha12Meses': folha12Meses, 'viab-municipio': municipio, 'viab-estado': estado, 'viab-tributacaoSugerida': tributacaoSugerida, 'viab-businessIdea': businessIdea,
      'viab-anoBase': anoBase, 'viab-faturamentoAnual': faturamentoAnual, 'viab-percentComercio': percentComercio,
      'viab-percentServico': percentServico, 'viab-fixosMensais': fixosMensais, 'viab-variaveisPercentual': variaveisPercentual,
      'viab-aliquotaIss': aliquotaIss, 'viab-aliquotaIcms': aliquotaIcms, 'viab-sociosRetiramValores': sociosRetiramValores, 
      'viab-sociosDeclaramProlabore': sociosDeclaramProlabore, 'viab-valorProlabore': valorProlabore, 'viab-sociosRecolhemInssIr': sociosRecolhemInssIr,
      'viab-recebeContaPF': recebeContaPF, 'viab-mesmaContaSocios': mesmaContaSocios
    };
    Object.entries(data).forEach(([key, val]) => { if (val !== undefined && val !== null) localStorage.setItem(key, val); });
    localStorage.setItem('viab-cnaes', JSON.stringify(cnaes));
    if (aiReport) localStorage.setItem('viab-aiReport', aiReport);
    else localStorage.removeItem('viab-aiReport');
  }, [razaoSocial, naturezaJuridica, classificacaoFiscal, capital, cnaes, atividades, numSocios, numFuncionarios, folhaPagamento, folha12Meses, municipio, estado, tributacaoSugerida, businessIdea, anoBase, faturamentoAnual, percentComercio, percentServico, fixosMensais, variaveisPercentual, aliquotaIss, aliquotaIcms, sociosRetiramValores, sociosDeclaramProlabore, valorProlabore, sociosRecolhemInssIr, recebeContaPF, mesmaContaSocios, aiReport]);

  const addCnae = () => setCnaes([...cnaes, { id: Date.now().toString(), code: '', description: '', isPrimary: false }]);
  const removeCnae = (id: string) => { if (cnaes.length > 1) setCnaes(cnaes.filter(c => c.id !== id)); };
  const updateCnae = (id: string, field: keyof CnaeEntry, value: any) => {
    setCnaes(cnaes.map(c => {
      if (c.id === id) return { ...c, [field]: value };
      if (field === 'isPrimary' && value === true) return { ...c, isPrimary: false };
      return c;
    }));
  };

  const buildPayload = (environment: 'test' | 'production', webhookUrl: string) => {
    const faturamentoNum = parseFloat(faturamentoAnual) || 0;
    const percComercioNum = parseFloat(percentComercio) || 0;
    const percServicoNum = parseFloat(percentServico) || 0;
    
    const folha12mNum = parseFloat(folha12Meses) || ((parseFloat(folhaPagamento) || 0) + (parseFloat(valorProlabore) || 0)) * 12;
    const percentualFatorR = faturamentoNum > 0 ? parseFloat(((folha12mNum / faturamentoNum) * 100).toFixed(2)) : 0;

    return {
      meta: { webhookUrl, executionMode: environment },
      agentName: "Diagnóstico de Viabilidade e Estruturação de Negócios",
      contexto: { anoBase, objetivo: "Análise de Viabilidade, Planejamento Tributário e Blindagem Patrimonial" },
      empresa: {
        razaoSocial: razaoSocial || "Não Informada",
        naturezaJuridica: naturezaJuridica || "Não Informada",
        classificacaoFiscal: classificacaoFiscal || "ME",
        capitalSocial: parseFloat(capital) || 0,
        numSocios: parseInt(numSocios) || 1,
        localizacao: { municipio: formatCityName(municipio), estado: estado || "PA" },
        tributacaoPretendida: tributacaoSugerida || "Simples Nacional"
      },
      operacional: {
        cnaes: cnaes.map(c => ({
          codigo_formatado: c.code.trim(),
          codigo_limpo: c.code.replace(/\D/g, ''),
          descricao: c.description.trim(),
          tipo: c.isPrimary ? 'Principal' : 'Secundário'
        })),
        descricaoAtividades: atividades || "",
      },
      financeiro: {
        faturamento: {
          anual_total: faturamentoNum,
          mensal_medio: parseFloat((faturamentoNum / 12).toFixed(2)),
          segregacao: { comercio_percent: percComercioNum, servico_percent: percServicoNum }
        },
        fator_r: {
          sujeito_fator_r: percServicoNum > 0 ? "A definir pela IA com base nos CNAEs" : false,
          folha_12_meses: folha12mNum,
          faturamento_12_meses: faturamentoNum,
          percentual_atual: percentualFatorR
        },
        custos_operacionais: {
          fixos_mensais: parseFloat(fixosMensais) || 0,
          variaveis_percentual: parseFloat(variaveisPercentual) || 0
        }
      },
      societario_trabalhista: {
        pro_labore: {
          declara_prolabore: sociosDeclaramProlabore === 'Sim',
          valor_declarado: parseFloat(valorProlabore) || 0,
          recolhe_inss_ir: sociosRecolhemInssIr === 'Sim',
        },
        retira_valores_pf: sociosRetiramValores === 'Sim'
      },
      conformidade_riscos: {
        confusao_patrimonial: mesmaContaSocios === 'Sim' || recebeContaPF === 'Sim',
        retirada_informal: sociosRetiramValores === 'Sim' && sociosDeclaramProlabore !== 'Sim',
        risco_previdenciario: sociosDeclaramProlabore !== 'Sim' || sociosRecolhemInssIr !== 'Sim'
      }
    };
  };

  const handlePreAnalysis = async () => {
    const apiKey = localStorage.getItem('jota-gemini-key');
    if (!apiKey) {
      toast.error("Chave API do Gemini não configurada.");
      return;
    }

    setIsPreAnalyzing(true);
    setProgressStep('validating_data');
    
    try {
      const payload = buildPayload('test', '');
      const systemPrompt = localStorage.getItem('jota-pre-analysis-prompt') || DEFAULT_PRE_ANALYSIS_PROMPT;

      await new Promise(r => setTimeout(r, 800));
      setProgressStep('analyzing');
      
      const result = await callGeminiAgent(systemPrompt, JSON.stringify(payload, null, 2), apiKey);
      
      setProgressStep('auditing');
      await new Promise(r => setTimeout(r, 1000));
      
      setProgressStep('completed');
      await new Promise(r => setTimeout(r, 500));
      
      setPreAnalysisReport(result);
    } catch (e: any) {
      toast.error("Erro na pré-análise: " + e.message);
    } finally {
      setIsPreAnalyzing(false);
      setProgressStep('idle');
    }
  };

  const handleSendToAI = async (environment: 'test' | 'production') => {
    if (!atividades.trim() || !municipio.trim()) return toast.error("Preencha Atividades e Município.");
    const webhookUrl = environment === 'test' ? localStorage.getItem('jota-webhook-test') : localStorage.getItem('jota-webhook-prod');
    if (!webhookUrl) return toast.error(`Webhook de ${environment} não configurado.`);

    setIsLoading(true);
    setProgressStep('validating_data');
    const startTime = performance.now();
    
    try {
      await new Promise(r => setTimeout(r, 800));
      setProgressStep('analyzing');
      
      const payload = buildPayload(environment, webhookUrl);
      const fullPayload = {
        ...payload,
        engine: {
          analises_requeridas: ["enquadramento_simples", "calculo_carga_tributaria", "analise_fator_r", "diagnostico_risco", "viabilidade_financeira", "planejamento_tributario"],
          output_config: { formato: "relatorio_consultivo" }
        }
      };

      const response = await fetch(webhookUrl, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, 
        body: JSON.stringify(fullPayload) 
      });
      
      if (!response.ok) throw new Error(`Erro n8n: ${response.status}`);
      
      setProgressStep('auditing');
      const data = await response.json();
      
      setProgressStep('validating_audit');
      await new Promise(r => setTimeout(r, 1200));

      let reportText = data.report || data.output || data.text || "";
      if (!reportText && data.content?.parts) reportText = data.content.parts.map((p: any) => p.text || "").join("\n\n");
      
      if (reportText) {
        setProgressStep('completed');
        await new Promise(r => setTimeout(r, 500));
        setAiReport(reportText);
        toast.success(`Diagnóstico concluído!`);
      } else {
        toast.info("Dados enviados, mas sem texto de resposta.");
      }
    } catch (error: any) {
      toast.error("Falha no envio. Erro: " + error.message);
    } finally {
      setIsLoading(false);
      setProgressStep('idle');
      setExecutionTime((performance.now() - startTime) / 1000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Dialog open={!!preAnalysisReport} onOpenChange={(open) => !open && setPreAnalysisReport(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col border-primary/20 bg-card p-0 overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/20">
            <UIDialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="flex items-center gap-2 text-primary">
                    <Bot className="h-5 w-5" /> Parecer Técnico Prévio (IA Local)
                  </DialogTitle>
                  <DialogDescription>Análise técnica preliminar baseada nos dados informados.</DialogDescription>
                </div>
                <div className="flex gap-2">
                  <PDFDownloadLink 
                    document={
                      <ViabilityReportPDF 
                        reportMarkdown={preAnalysisReport || ""}
                        clientName={razaoSocial || "Interessado"}
                        clientCity={municipio || ""}
                        clientState={estado || ""}
                        companyName={localStorage.getItem('jota-razaoSocial') || 'Jota Contabilidade'}
                        accountantName={localStorage.getItem('jota-contador-nome') || ''}
                        accountantCrc={localStorage.getItem('jota-contador-crc') || ''}
                        qrCodeDataUrl=""
                      />
                    } 
                    fileName={`parecer_previo_${(razaoSocial || 'viabilidade').toLowerCase()}.pdf`}
                  >
                    {({ loading }) => (
                      <Button variant="outline" size="sm" disabled={loading} className="text-primary border-primary/30 hover:bg-primary/10">
                        <Printer className="h-4 w-4 mr-2" />
                        {loading ? 'Gerando...' : 'Imprimir Parecer'}
                      </Button>
                    )}
                  </PDFDownloadLink>
                </div>
              </div>
            </UIDialogHeader>
          </div>
          <ScrollArea className="flex-1 p-6">
            <div className="prose prose-sm max-w-none prose-invert prose-p:leading-relaxed prose-li:marker:text-primary">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{preAnalysisReport || ""}</ReactMarkdown>
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreAnalysisReport(null)}>Corrigir Dados</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Gerar Diagnóstico Oficial <ChevronDown className="h-4 w-4 ml-2" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setPreAnalysisReport(null); handleSendToAI('test'); }}><Send className="h-4 w-4 mr-2" /> Ambiente Teste</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setPreAnalysisReport(null); handleSendToAI('production'); }}><Send className="h-4 w-4 mr-2" /> Ambiente Produção</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="shadow-card"><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-3 text-primary"><Sparkles className="h-6 w-6" /> Análise de Viabilidade</CardTitle><Button variant="outline" size="sm" onClick={() => { localStorage.clear(); window.location.reload(); }}><RefreshCw className="h-4 w-4 mr-2" /> Nova Consulta</Button></CardHeader></Card>

      {isLoading || isPreAnalyzing ? (
        <div className="py-12">
          <AnalysisProgress step={progressStep} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <SectionTitle icon={Building2} title="Identificação e Classificação" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2"><Label>Razão Social / Nome do Projeto</Label><Input value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Ano Base</Label><Select value={anoBase} onValueChange={setAnoBase}><SelectTrigger><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent>{anosBase.map(ano => <SelectItem key={ano} value={ano}>{ano}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Natureza Jurídica</Label><Select value={naturezaJuridica} onValueChange={setNaturezaJuridica}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{naturezasJuridicas.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Classificação Fiscal Explícita</Label><Select value={classificacaoFiscal} onValueChange={setClassificacaoFiscal}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{classificacoesFiscais.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Capital Social (R$)</Label><Input type="number" value={capital} onChange={e => setCapital(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Município</Label><Input value={municipio} onChange={e => setMunicipio(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Estado (UF)</Label><Select value={estado} onValueChange={setEstado}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UFs.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2 md:col-span-2"><Label>Tributação Pretendida</Label><Select value={tributacaoSugerida} onValueChange={setTributacaoSugerida}><SelectTrigger><SelectValue placeholder="Selecione ou deixe para a IA sugerir" /></SelectTrigger><SelectContent><SelectItem value="Simples Nacional">Simples Nacional</SelectItem><SelectItem value="Simples Nacional (Híbrido)">Simples Nacional (Híbrido)</SelectItem><SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem><SelectItem value="Lucro Real">Lucro Real</SelectItem><SelectItem value="Não sei / Sugerir">Não sei / Sugerir</SelectItem></SelectContent></Select></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <SectionTitle icon={ListChecks} title="Estrutura de CNAEs" />
                  <div className="space-y-4">
                    {cnaes.map((cnae) => (
                      <div key={cnae.id} className="p-3 border rounded-md bg-muted/20 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={cnae.isPrimary ? "default" : "outline"} className="text-[10px]">{cnae.isPrimary ? "PRINCIPAL" : "SECUNDÁRIO"}</Badge>
                            {!cnae.isPrimary && <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => updateCnae(cnae.id, 'isPrimary', true)}>Tornar Principal</Button>}
                          </div>
                          {cnaes.length > 1 && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeCnae(cnae.id)}><Trash2 className="h-4 w-4" /></Button>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1"><Label className="text-[10px] uppercase">Código CNAE</Label><Input value={cnae.code} onChange={e => updateCnae(cnae.id, 'code', e.target.value)} placeholder="0000-0/00" className="h-8 text-xs" /></div>
                          <div className="space-y-1 md:col-span-2"><Label className="text-[10px] uppercase">Descrição da Atividade</Label><Input value={cnae.description} onChange={e => updateCnae(cnae.id, 'description', e.target.value)} placeholder="Ex: Comércio varejista de..." className="h-8 text-xs" /></div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full border-dashed" onClick={addCnae}><Plus className="h-4 w-4 mr-2" /> Adicionar CNAE</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="shadow-card border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <SectionTitle icon={Gavel} title="Custos Operacionais e Faturamento" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2"><Label>Faturamento Anual (R$)</Label><Input type="number" value={faturamentoAnual} onChange={e => setFaturamentoAnual(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Custos Fixos Mensais (R$)</Label><Input type="number" value={fixosMensais} onChange={e => setFixosMensais(e.target.value)} className="font-bold text-primary" /></div>
                    <div className="space-y-2"><Label>Custos Variáveis (%)</Label><Input type="number" value={variaveisPercentual} onChange={e => setVariaveisPercentual(e.target.value)} className="font-bold text-primary" /></div>
                    <div className="space-y-2"><Label>Comércio (%)</Label><Input type="number" value={percentComercio} onChange={e => { setPercentComercio(e.target.value); setPercentServico((100 - (parseFloat(e.target.value)||0)).toString()); }} /></div>
                    <div className="space-y-2"><Label>Serviço (%)</Label><Input type="number" value={percentServico} onChange={e => { setPercentServico(e.target.value); setPercentComercio((100 - (parseFloat(e.target.value)||0)).toString()); }} /></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <SectionTitle icon={ShieldQuestion} title="Folha e Sócios" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Folha Mensal Estimada (R$)</Label><Input type="number" value={folhaPagamento} onChange={e => handleFolhaMensalChange(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Folha 12 Meses p/ Fator R (R$)</Label><Input type="number" value={folha12Meses} onChange={e => setFolha12Meses(e.target.value)} className="border-primary/50 bg-primary/5" /></div>
                    <div className="space-y-2"><Label>Número de Funcionários</Label><Input type="number" value={numFuncionarios} onChange={e => setNumFuncionarios(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Valor do Pró-labore (R$)</Label><Input type="number" value={valorProlabore} onChange={e => setValorProlabore(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Declaram Pró-labore?</Label><Select value={sociosDeclaramProlabore} onValueChange={setSociosDeclaramProlabore}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{simNao.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Recebe na conta PF?</Label><Select value={recebeContaPF} onValueChange={setRecebeContaPF}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{simNao.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Mistura Patrimonial?</Label><Select value={mesmaContaSocios} onValueChange={setMesmaContaSocios}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{simNao.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Sócios retiram lucros?</Label><Select value={sociosRetiramValores} onValueChange={setSociosRetiramValores}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{simNao.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Recolhe INSS/IR (Sócio)?</Label><Select value={sociosRecolhemInssIr} onValueChange={setSociosRecolhemInssIr}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{simNao.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-6 space-y-2"><Label className="font-semibold">Descrição Detalhada das Atividades</Label><Textarea value={atividades} onChange={(e) => setAtividades(e.target.value)} className="min-h-[100px]" /></div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button variant="outline" size="lg" onClick={handlePreAnalysis} disabled={isLoading || isPreAnalyzing} className="text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-50">
              <Bot className="h-5 w-5 mr-2" />
              {isPreAnalyzing ? 'Validando...' : 'Pré-Validação com IA Local'}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg" disabled={isLoading || isPreAnalyzing} className="bg-accent px-12 text-white">
                  {isLoading ? "Processando..." : "Gerar Diagnóstico Oficial"}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={() => handleSendToAI('test')}><Send className="h-4 w-4 mr-2" /> Ambiente Teste</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSendToAI('production')}><Send className="h-4 w-4 mr-2" /> Ambiente Produção</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}

      {aiReport && <div id="ai-report-section"><AiAnalysisReport report={aiReport} onClose={() => setAiReport(null)} executionTime={executionTime || undefined} clientName={razaoSocial} clientCity={municipio} clientState={estado} /></div>}
    </div>
  );
};

export default Viabilidade;