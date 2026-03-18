import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Sparkles, ChevronDown, RefreshCw, Building2, ShieldQuestion, Gavel, Loader2, Trash2, Plus, ListChecks, Calendar } from 'lucide-react';
import { AiAnalysisReport } from '@/components/AiAnalysisReport';
import { getInssTables } from '@/lib/tax/inssData';
import { getIrpfTables } from '@/lib/tax/irpfData';
import { getMinimumWages } from '@/lib/tax/minimumWageData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

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
  const [sociosRetiramValores, setSociosRetiramValores] = useState(() => getStored('viab-sociosRetiramValores'));
  const [sociosDeclaramProlabore, setSociosDeclaramProlabore] = useState(() => getStored('viab-sociosDeclaramProlabore'));
  const [valorProlabore, setValorProlabore] = useState(() => getStored('viab-valorProlabore'));
  const [sociosRecolhemInssIr, setSociosRecolhemInssIr] = useState(() => getStored('viab-sociosRecolhemInssIr'));
  const [recebeContaPF, setRecebeContaPF] = useState(() => getStored('viab-recebeContaPF'));
  const [mesmaContaSocios, setMesmaContaSocios] = useState(() => getStored('viab-mesmaContaSocios'));
  const [anexoComercio, setAnexoComercio] = useState(() => getStored('viab-anexoComercio', 'Anexo I'));
  const [anexoServico, setAnexoServico] = useState(() => getStored('viab-anexoServico', 'Anexo III'));
  const [retiradaMensalLucro, setRetiradaMensalLucro] = useState(() => getStored('viab-retiradaMensalLucro', '0'));
  
  // Custos de Abertura (Guardados mas não no form principal por enquanto)
  const [honorariosLegalizacao] = useState(() => getStored('viab-honorariosLegalizacao', '1900'));
  const [assessoriaMensal] = useState(() => getStored('viab-honorariosAssessoriaMensal', '450'));
  const [juntaCartorio] = useState(() => getStored('viab-valorJuntaCartorio', '519'));
  const [bombeiroLicencas] = useState(() => getStored('viab-valorBombeiro', '650'));

  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  useEffect(() => {
    const data: Record<string, string> = {
      'viab-razaoSocial': razaoSocial, 'viab-naturezaJuridica': naturezaJuridica, 'viab-classificacaoFiscal': classificacaoFiscal, 'viab-capital': capital,
      'viab-atividades': atividades, 'viab-numSocios': numSocios, 'viab-numFuncionarios': numFuncionarios, 'viab-folhaPagamento': folhaPagamento, 
      'viab-municipio': municipio, 'viab-estado': estado, 'viab-tributacaoSugerida': tributacaoSugerida, 'viab-businessIdea': businessIdea,
      'viab-anoBase': anoBase, 'viab-faturamentoAnual': faturamentoAnual, 'viab-percentComercio': percentComercio,
      'viab-percentServico': percentServico, 'viab-fixosMensais': fixosMensais, 'viab-variaveisPercentual': variaveisPercentual,
      'viab-aliquotaIss': aliquotaIss, 'viab-aliquotaIcms': aliquotaIcms, 'viab-sociosRetiramValores': sociosRetiramValores, 
      'viab-sociosDeclaramProlabore': sociosDeclaramProlabore, 'viab-valorProlabore': valorProlabore, 'viab-sociosRecolhemInssIr': sociosRecolhemInssIr,
      'viab-recebeContaPF': recebeContaPF, 'viab-mesmaContaSocios': mesmaContaSocios, 'viab-anexoComercio': anexoComercio, 'viab-anexoServico': anexoServico, 'viab-retiradaMensalLucro': retiradaMensalLucro
    };
    Object.entries(data).forEach(([key, val]) => { if (val !== undefined && val !== null) localStorage.setItem(key, val); });
    localStorage.setItem('viab-cnaes', JSON.stringify(cnaes));
  }, [razaoSocial, naturezaJuridica, classificacaoFiscal, capital, cnaes, atividades, numSocios, numFuncionarios, folhaPagamento, municipio, estado, tributacaoSugerida, businessIdea, anoBase, faturamentoAnual, percentComercio, percentServico, fixosMensais, variaveisPercentual, aliquotaIss, aliquotaIcms, sociosRetiramValores, sociosDeclaramProlabore, valorProlabore, sociosRecolhemInssIr, recebeContaPF, mesmaContaSocios, anexoComercio, anexoServico, retiradaMensalLucro]);

  const handleSendToAI = async (environment: 'test' | 'production') => {
    if (!atividades.trim() || !municipio.trim()) {
      toast.error("Preencha Atividades e Município.");
      return;
    }
    const webhookUrl = environment === 'test' ? localStorage.getItem('jota-webhook-test') : localStorage.getItem('jota-webhook-prod');
    if (!webhookUrl) return toast.error("Webhook não configurado.");

    setIsLoading(true);
    const startTime = performance.now();

    const inssTables = getInssTables();
    const irpfTables = getIrpfTables();
    const minWages = getMinimumWages();
    const currentMinWage = minWages.find(w => w.year === anoBase)?.value || 1621;

    try {
      // PAYLOAD REESTRUTURADO CONFORME O PADRÃO QUE FUNCIONAVA
      const payload = {
        agentName: "Diagnóstico de Viabilidade e Estruturação de Negócios",
        contexto: {
          anoBase: anoBase,
          objetivo: "Análise de Viabilidade, Planejamento Tributário e Blindagem Patrimonial",
          ambiente: environment === 'production' ? 'production' : 'development'
        },
        tabelasReferencia: {
          inss: inssTables.filter(t => t.year === anoBase),
          irpf: irpfTables.filter(t => t.year === anoBase),
          salario_minimo: currentMinWage
        },
        empresa: {
          razaoSocial,
          naturezaJuridica,
          classificacaoFiscal,
          capitalSocial: parseFloat(capital) || 0,
          numSocios: parseInt(numSocios) || 1,
          localizacao: { municipio, estado },
          tributacaoPretendida: tributacaoSugerida
        },
        operacional: {
          cnaes: cnaes.map(c => ({ codigo: c.code, descricao: c.description, tipo: c.isPrimary ? 'Principal' : 'Secundário' })),
          descricaoAtividades: atividades,
          ideiaNegocio: businessIdea
        },
        financeiro: {
          faturamento: {
            anual_total: parseFloat(faturamentoAnual) || 0,
            mensal_medio: (parseFloat(faturamentoAnual) || 0) / 12,
            segregacao: {
              comercio_percent: parseFloat(percentComercio) || 0,
              servico_percent: parseFloat(percentServico) || 0
            }
          },
          custos_operacionais: {
            fixos_mensais: parseFloat(fixosMensais) || 0,
            variaveis_percentual: parseFloat(variaveisPercentual) || 0
          },
          tributos_locais: {
            iss_municipio: parseFloat(aliquotaIss) || 0,
            icms_estado: parseFloat(aliquotaIcms) || 0
          },
          custos_abertura: {
            honorarios_legalizacao: parseFloat(honorariosLegalizacao) || 0,
            assessoria_mensal: parseFloat(assessoriaMensal) || 0,
            junta_cartorio: parseFloat(juntaCartorio) || 0,
            bombeiro_licencas: parseFloat(bombeiroLicencas) || 0
          }
        },
        societario_trabalhista: {
          quadro_pessoal: {
            num_funcionarios: parseInt(numFuncionarios) || 0,
            folha_salarial_mensal: parseFloat(folhaPagamento) || 0
          },
          pro_labore: {
            declara_prolabore: sociosDeclaramProlabore === 'Sim',
            valor_declarado: parseFloat(valorProlabore) || 0,
            valor_estimado: currentMinWage,
            recolhe_inss_ir: sociosRecolhemInssIr === 'Sim',
            modo_calculo: sociosDeclaramProlabore === 'Sim' ? 'declarado' : 'estimado_para_simulacao'
          },
          retira_valores_pf: sociosRetiramValores === 'Sim'
        },
        conformidade_riscos: {
          recebe_vendas_conta_pf: recebeContaPF === 'Pessoa Física',
          mistura_patrimonial: mesmaContaSocios === 'Sim'
        },
        webhookUrl: webhookUrl,
        executionMode: environment
      };

      const response = await fetch(webhookUrl, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });

      const data = await response.json();
      setAiReport(data.report || data.output || data.text || "");
      setExecutionTime((performance.now() - startTime) / 1000);
      toast.success("Diagnóstico concluído!");
    } catch (error: any) {
      toast.error("Erro no envio: " + error.message);
    } finally { setIsLoading(false); }
  };

  const updateCnae = (id: string, field: keyof CnaeEntry, value: any) => {
    setCnaes(cnaes.map(c => {
      if (c.id === id) return { ...c, [field]: value };
      if (field === 'isPrimary' && value === true) return { ...c, isPrimary: false };
      return c;
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card className="shadow-card"><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-3 text-primary"><Sparkles className="h-6 w-6" /> Análise de Viabilidade</CardTitle><Button variant="outline" size="sm" onClick={() => { localStorage.clear(); window.location.reload(); }}><RefreshCw className="h-4 w-4 mr-2" /> Nova Consulta</Button></CardHeader></Card>

      {isLoading && <div className="p-12 text-center animate-pulse"><Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" /><h3 className="text-lg font-bold">Processando Viabilidade...</h3></div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="p-6"><SectionTitle icon={Building2} title="Identificação" /><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2 space-y-2"><Label>Razão Social</Label><Input value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} /></div><div className="space-y-2"><Label>Ano Base</Label><Select value={anoBase} onValueChange={setAnoBase}><SelectTrigger><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent>{anosBase.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Natureza Jurídica</Label><Select value={naturezaJuridica} onValueChange={setNaturezaJuridica}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{naturezasJuridicas.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Capital Social</Label><Input type="number" value={capital} onChange={e => setCapital(e.target.value)} /></div><div className="space-y-2"><Label>Município</Label><Input value={municipio} onChange={e => setMunicipio(e.target.value)} /></div><div className="space-y-2"><Label>Estado (UF)</Label><Select value={estado} onValueChange={setEstado}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UFs.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div></div></Card>
          <Card className="p-6"><SectionTitle icon={ListChecks} title="CNAEs" />{cnaes.map(c => (<div key={c.id} className="p-3 border rounded-md mb-2 bg-muted/20 space-y-2"><div className="flex justify-between"><Badge variant={c.isPrimary ? "default" : "outline"}>{c.isPrimary ? "PRINCIPAL" : "SECUNDÁRIO"}</Badge>{cnaes.length > 1 && <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setCnaes(cnaes.filter(x => x.id !== c.id))}><Trash2 className="h-4 w-4" /></Button>}</div><div className="grid grid-cols-3 gap-2"><Input value={c.code} onChange={e => updateCnae(c.id, 'code', e.target.value)} placeholder="Código" /><Input className="col-span-2" value={c.description} onChange={e => updateCnae(c.id, 'description', e.target.value)} placeholder="Atividade" /></div></div>))}<Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setCnaes([...cnaes, { id: Date.now().toString(), code: '', description: '', isPrimary: false }])}><Plus className="h-4 w-4 mr-2" /> Adicionar</Button></Card>
        </div>
        <div className="space-y-6">
          <Card className="p-6 bg-primary/5 border-primary/20"><SectionTitle icon={Gavel} title="Financeiro" /><div className="grid grid-cols-2 gap-4"><div className="col-span-2 space-y-2"><Label>Faturamento Anual</Label><Input type="number" value={faturamentoAnual} onChange={e => setFaturamentoAnual(e.target.value)} /></div><div className="space-y-2"><Label>Custos Fixos</Label><Input type="number" value={fixosMensais} onChange={e => setFixosMensais(e.target.value)} /></div><div className="space-y-2"><Label>Variáveis (%)</Label><Input type="number" value={variaveisPercentual} onChange={e => setVariaveisPercentual(e.target.value)} /></div></div></Card>
          <Card className="p-6"><SectionTitle icon={ShieldQuestion} title="Sócios e Folha" /><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Folha Salarial</Label><Input type="number" value={folhaPagamento} onChange={e => setFolhaPagamento(e.target.value)} /></div><div className="space-y-2"><Label>Pró-labore</Label><Input type="number" value={valorProlabore} onChange={e => setValorProlabore(e.target.value)} /></div></div></Card>
        </div>
      </div>
      <Textarea value={atividades} onChange={e => setAtividades(e.target.value)} placeholder="Descrição do negócio..." className="min-h-[100px]" />
      <div className="text-center"><DropdownMenu><DropdownMenuTrigger asChild><Button size="lg" className="bg-accent px-12">Gerar Diagnóstico IA <ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={() => handleSendToAI('test')}>Ambiente Teste</DropdownMenuItem><DropdownMenuItem onClick={() => handleSendToAI('production')}>Ambiente Produção</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
      {aiReport && <AiAnalysisReport report={aiReport} onClose={() => setAiReport(null)} executionTime={executionTime || undefined} clientName={razaoSocial} clientCity={municipio} clientState={estado} />}
    </div>
  );
};

export default Viabilidade;