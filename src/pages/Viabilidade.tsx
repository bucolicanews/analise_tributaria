import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Sparkles, ChevronDown, RefreshCw, Building2, ShieldQuestion, Zap, AlertTriangle, Calendar, Table as TableIcon, ListChecks, Gavel, Loader2, Trash2, Plus } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const UFs = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const naturezasJuridicas = [
  "Empresário Individual (EI)",
  "Sociedade Limitada (LTDA)",
  "Sociedade Limitada Unipessoal (SLU)",
  "Sociedade Simples",
  "Não sei / Sugerir"
];

const classificacoesFiscais = [
  "Microempresa (ME)",
  "Empresa de Pequeno Porte (EPP)",
  "Médio/Grande Porte",
  "Sugerir com base no faturamento"
];

const anosBase = ["2022", "2023", "2024", "2025", "2026"];
const simNao = ["Sim", "Não"];
const simNaoNaoSei = ["Sim", "Não", "Não sei"];

interface CnaeEntry {
  id: string;
  code: string;
  description: string;
  isPrimary: boolean;
}

const SectionTitle = ({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) => (
  <div className="flex items-center gap-3 pb-3 border-b border-border mb-4">
    <div className="p-2 bg-accent/10 rounded-lg">
      <Icon className="h-4 w-4 text-accent" />
    </div>
    <div>
      <h3 className="font-semibold text-sm text-foreground">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
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

  const [honorariosLegalizacao, setHonorariosLegalizacao] = useState(() => getStored('viab-honorariosLegalizacao'));
  const [honorariosAssessoriaMensal, setHonorariosAssessoriaMensal] = useState(() => getStored('viab-honorariosAssessoriaMensal'));
  const [valorJuntaCartorio, setValorJuntaCartorio] = useState(() => getStored('viab-valorJuntaCartorio'));
  const [valorDpa, setValorDpa] = useState(() => getStored('viab-valorDpa'));
  const [valorBombeiro, setValorBombeiro] = useState(() => getStored('viab-valorBombeiro'));
  const [valorLicencasMunicipais, setValorLicencasMunicipais] = useState(() => getStored('viab-valorLicencasMunicipais'));

  const [aiReport, setAiReport] = useState<string | null>(() => localStorage.getItem('viab-aiReport'));
  const [isLoading, setIsLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const inssTables = useMemo(() => getInssTables(), []);
  const irpfTables = useMemo(() => getIrpfTables(), []);
  const minimumWages = useMemo(() => getMinimumWages(), []);
  
  const currentInssTables = useMemo(() => inssTables.filter(t => t.year === anoBase), [inssTables, anoBase]);

  const addCnae = () => {
    setCnaes([...cnaes, { id: Date.now().toString(), code: '', description: '', isPrimary: false }]);
  };

  const removeCnae = (id: string) => {
    if (cnaes.length > 1) {
      setCnaes(cnaes.filter(c => c.id !== id));
    }
  };

  const updateCnae = (id: string, field: keyof CnaeEntry, value: any) => {
    setCnaes(cnaes.map(c => {
      if (c.id === id) {
        if (field === 'isPrimary' && value === true) return { ...c, [field]: value };
        return { ...c, [field]: value };
      }
      if (field === 'isPrimary' && value === true) return { ...c, isPrimary: false };
      return c;
    }));
  };

  useEffect(() => {
    const data: Record<string, string> = {
      'viab-razaoSocial': razaoSocial, 'viab-naturezaJuridica': naturezaJuridica, 'viab-classificacaoFiscal': classificacaoFiscal, 'viab-capital': capital,
      'viab-atividades': atividades, 'viab-numSocios': numSocios, 'viab-numFuncionarios': numFuncionarios, 'viab-folhaPagamento': folhaPagamento, 
      'viab-municipio': municipio, 'viab-estado': estado, 'viab-tributacaoSugerida': tributacaoSugerida, 'viab-businessIdea': businessIdea,
      'viab-anoBase': anoBase, 'viab-faturamentoAnual': faturamentoAnual, 'viab-percentComercio': percentComercio,
      'viab-percentServico': percentServico, 'viab-fixosMensais': fixosMensais, 'viab-variaveisPercentual': variaveisPercentual,
      'viab-aliquotaIss': aliquotaIss, 'viab-aliquotaIcms': aliquotaIcms, 'viab-sociosRetiramValores': sociosRetiramValores, 
      'viab-sociosDeclaramProlabore': sociosDeclaramProlabore, 'viab-valorProlabore': valorProlabore, 'viab-sociosRecolhemInssIr': sociosRecolhemInssIr,
      'viab-recebeContaPF': recebeContaPF, 'viab-mesmaContaSocios': mesmaContaSocios, 'viab-honorariosLegalizacao': honorariosLegalizacao, 
      'viab-honorariosAssessoriaMensal': honorariosAssessoriaMensal, 'viab-valorJuntaCartorio': valorJuntaCartorio, 'viab-valorDpa': valorDpa, 
      'viab-valorBombeiro': valorBombeiro, 'viab-valorLicencasMunicipais': valorLicencasMunicipais,
      'viab-anexoComercio': anexoComercio, 'viab-anexoServico': anexoServico, 'viab-retiradaMensalLucro': retiradaMensalLucro
    };
    Object.entries(data).forEach(([key, val]) => { if (val !== undefined && val !== null) localStorage.setItem(key, val); });
    localStorage.setItem('viab-cnaes', JSON.stringify(cnaes));
    if (aiReport) localStorage.setItem('viab-aiReport', aiReport);
    else localStorage.removeItem('viab-aiReport');
  }, [
    razaoSocial, naturezaJuridica, classificacaoFiscal, capital, cnaes, atividades, numSocios, numFuncionarios,
    folhaPagamento, municipio, estado, tributacaoSugerida, businessIdea, anoBase, faturamentoAnual,
    percentComercio, percentServico, fixosMensais, variaveisPercentual, aliquotaIss, aliquotaIcms, 
    sociosRetiramValores, sociosDeclaramProlabore, valorProlabore, sociosRecolhemInssIr, recebeContaPF, 
    mesmaContaSocios, honorariosLegalizacao, honorariosAssessoriaMensal, valorJuntaCartorio, valorDpa, 
    valorBombeiro, valorLicencasMunicipais, anexoComercio, anexoServico, retiradaMensalLucro, aiReport
  ]);

  const handleSendToAI = async (environment: 'test' | 'production') => {
    if (!atividades.trim() || !municipio.trim()) {
      toast.error("Preencha pelo menos as Atividades e o Município.");
      return;
    }

    // CORREÇÃO: Usando as chaves de Webhook corretas da Configuração
    const webhookUrl = environment === 'test' 
      ? localStorage.getItem('jota-webhook-test') 
      : localStorage.getItem('jota-webhook-prod');

    if (!webhookUrl) {
      toast.error(`Webhook de ${environment} não configurado nas Configurações.`);
      return;
    }

    setIsLoading(true);
    const startTime = performance.now();
    const toastId = toast.loading(`Gerando Diagnóstico Profissional (${environment})...`);
    
    try {
      // REVERTENDO PARA PAYLOAD PLANO (COMO ESTAVA ANTES)
      const payload = {
        razaoSocial,
        naturezaJuridica,
        classificacaoFiscal,
        capital,
        numSocios,
        numFuncionarios,
        folhaPagamento,
        municipio,
        estado,
        atividades,
        tributacaoSugerida,
        businessIdea,
        anoBase,
        faturamentoAnual,
        percentComercio,
        percentServico,
        fixosMensais,
        variaveisPercentual,
        aliquotaIss,
        aliquotaIcms,
        sociosRetiramValores,
        sociosDeclaramProlabore,
        valorProlabore,
        sociosRecolhemInssIr,
        recebeContaPF,
        mesmaContaSocios,
        honorariosLegalizacao,
        honorariosAssessoriaMensal,
        valorJuntaCartorio,
        valorDpa,
        valorBombeiro,
        valorLicencasMunicipais,
        anexoComercio,
        anexoServico,
        retiradaMensalLucro,
        cnaes: cnaes.map(c => `${c.code} - ${c.description}`).join(' | ')
      };

      const response = await fetch(webhookUrl, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      
      const responseText = await response.text();

      if (!response.ok) {
        let errorMsg = "Erro na comunicação com a IA.";
        try {
          const errorJson = JSON.parse(responseText);
          errorMsg = errorJson.errorMessage || errorMsg;
        } catch { }
        throw new Error(errorMsg);
      }
      
      if (responseText) {
        const data = JSON.parse(responseText);
        const duration = (performance.now() - startTime) / 1000;
        setExecutionTime(duration);
        
        let reportText = data.report || (Array.isArray(data) ? data[0]?.report : null) || data.output || data.text;
        if (!reportText && data.content?.parts) reportText = data.content.parts.map((p: any) => p.text || "").join("\n\n");
        
        if (reportText) {
          setAiReport(reportText);
          toast.success(`Diagnóstico concluído!`, { id: toastId });
        } else {
          throw new Error("O servidor não retornou um relatório válido.");
        }
      }

    } catch (error: any) {
      toast.error("Falha na análise", { id: toastId, description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-primary">
            <Sparkles className="h-6 w-6" /> Análise de Viabilidade Profissional
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => { localStorage.clear(); window.location.reload(); }}><RefreshCw className="h-4 w-4 mr-2" /> Nova Consulta</Button>
        </CardHeader>
      </Card>

      {isLoading && (
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm flex flex-col items-center justify-center gap-4 animate-pulse">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <div className="text-center">
            <h3 className="text-lg font-bold text-primary">Processando Diagnóstico...</h3>
            <p className="text-sm text-muted-foreground">Aguarde enquanto nossa IA analisa os dados fiscais e societários.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <SectionTitle icon={Building2} title="Identificação e Classificação" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2"><Label>Razão Social / Nome do Projeto</Label><Input value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} placeholder="Ex: Top Motos Ltda" /></div>
                <div className="space-y-2"><Label>Ano Base</Label><Select value={anoBase} onValueChange={setAnoBase}><SelectTrigger><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent>{anosBase.map(ano => <SelectItem key={ano} value={ano}>{ano}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Natureza Jurídica</Label><Select value={naturezaJuridica} onValueChange={setNaturezaJuridica}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{naturezasJuridicas.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Classificação Fiscal Explícita</Label><Select value={classificacaoFiscal} onValueChange={setClassificacaoFiscal}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{classificacoesFiscais.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Capital Social (R$)</Label><Input type="number" value={capital} onChange={e => setCapital(e.target.value)} /></div>
                <div className="space-y-2"><Label>Município</Label><Input value={municipio} onChange={e => setMunicipio(e.target.value)} placeholder="Ex: Belém" /></div>
                <div className="space-y-2"><Label>Estado (UF)</Label><Select value={estado} onValueChange={setEstado}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UFs.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2 md:col-span-2"><Label>Tributação Pretendida</Label><Select value={tributacaoSugerida} onValueChange={setTributacaoSugerida}><SelectTrigger><SelectValue placeholder="Selecione ou deixe para a IA sugerir" /></SelectTrigger><SelectContent><SelectItem value="Simples Nacional">Simples Nacional</SelectItem><SelectItem value="Simples Nacional (Híbrido)">Simples Nacional (Híbrido)</SelectItem><SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem><SelectItem value="Lucro Real">Lucro Real</SelectItem><SelectItem value="Não sei / Sugerir">Não sei / Sugerir</SelectItem></SelectContent></Select></div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <SectionTitle icon={ListChecks} title="Estrutura de CNAEs" subtitle="Cadastre o CNAE principal e as atividades secundárias" />
              <div className="space-y-4">
                {cnaes.map((cnae, idx) => (
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
                <Button variant="outline" size="sm" className="w-full border-dashed" onClick={addCnae}><Plus className="h-4 w-4 mr-2" /> Adicionar CNAE Secundário</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-card border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <SectionTitle icon={Gavel} title="Custos Operacionais e Faturamento" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2"><Label>Faturamento Anual Estimado (R$)</Label><Input type="number" value={faturamentoAnual} onChange={e => setFaturamentoAnual(e.target.value)} /></div>
                <div className="space-y-2"><Label>Custos Fixos Mensais (R$)</Label><Input type="number" value={fixosMensais} onChange={e => setFixosMensais(e.target.value)} className="font-bold text-primary" /></div>
                <div className="space-y-2"><Label>Custos Variáveis (%)</Label><Input type="number" value={variaveisPercentual} onChange={e => setVariaveisPercentual(e.target.value)} className="font-bold text-primary" /></div>
                <div className="space-y-2"><Label>Segregação: Comércio (%)</Label><Input type="number" value={percentComercio} onChange={e => { setPercentComercio(e.target.value); setPercentServico((100 - (parseFloat(e.target.value)||0)).toString()); }} /></div>
                <div className="space-y-2"><Label>Segregação: Serviço (%)</Label><Input type="number" value={percentServico} onChange={e => { setPercentServico(e.target.value); setPercentComercio((100 - (parseFloat(e.target.value)||0)).toString()); }} /></div>
                
                <div className="space-y-2"><Label>Anexo Comércio (Simples)</Label><Select value={anexoComercio} onValueChange={setAnexoComercio}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Anexo I">Anexo I (Comércio)</SelectItem><SelectItem value="Anexo II">Anexo II (Indústria)</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Anexo Serviço (Simples)</Label><Select value={anexoServico} onValueChange={setAnexoServico}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Anexo III">Anexo III (Serviços)</SelectItem><SelectItem value="Anexo IV">Anexo IV (Serviços)</SelectItem><SelectItem value="Anexo V">Anexo V (Serviços)</SelectItem></SelectContent></Select></div>
                
                <div className="space-y-2"><Label>Alíquota ISS Município (%)</Label><Input type="number" value={aliquotaIss} onChange={e => setAliquotaIss(e.target.value)} /></div>
                <div className="space-y-2"><Label>Alíquota ICMS Estado (%)</Label><Input type="number" value={aliquotaIcms} onChange={e => setAliquotaIcms(e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <SectionTitle icon={ShieldQuestion} title="Folha e Sócios (Distribuição)" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Folha Salarial Mensal (R$)</Label><Input type="number" value={folhaPagamento} onChange={e => setFolhaPagamento(e.target.value)} /></div>
                <div className="space-y-2"><Label>Número de Funcionários</Label><Input type="number" value={numFuncionarios} onChange={e => setNumFuncionarios(e.target.value)} /></div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Valor do Pró-labore (R$)</Label>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-accent" title="Tabelas INSS"><TableIcon className="h-3 w-3" /></Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader><DialogTitle>Tabelas INSS - Ano {anoBase}</DialogTitle></DialogHeader>
                          <div className="space-y-6 max-h-[400px] overflow-y-auto">
                            {currentInssTables.length > 0 ? currentInssTables.map(table => (
                              <div key={table.id} className="space-y-2">
                                <h4 className="text-xs font-bold text-accent uppercase">{table.label}</h4>
                                <Table>
                                  <TableHeader><TableRow><TableHead className="text-[10px]">De</TableHead><TableHead className="text-[10px]">Até</TableHead><TableHead className="text-[10px]">Aliq.</TableHead><TableHead className="text-[10px]">Dedução</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                    {table.ranges.map((r, i) => (
                                      <TableRow key={i} className="text-[10px]">
                                        <TableCell>{formatCurrency(r.min)}</TableCell>
                                        <TableCell>{r.max ? formatCurrency(r.max) : 'Teto'}</TableCell>
                                        <TableCell>{r.rate.toFixed(2)}%</TableCell>
                                        <TableCell>{formatCurrency(r.deduction)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )) : <p className="text-sm text-muted-foreground">Nenhuma tabela INSS cadastrada para este ano.</p>}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <Input type="number" value={valorProlabore} onChange={e => setValorProlabore(e.target.value)} placeholder="Mínimo 1.412,00" />
                </div>
                <div className="space-y-2"><Label>Declaram Pró-labore?</Label><Select value={sociosDeclaramProlabore} onValueChange={setSociosDeclaramProlabore}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{simNao.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
                
                <div className="space-y-2"><Label>Retirada Mensal de Lucro (R$)</Label><Input type="number" value={retiradaMensalLucro} onChange={e => setRetiradaMensalLucro(e.target.value)} className="border-emerald-200 bg-emerald-50/30" /></div>
                <div className="space-y-2"><Label>Retiram valores p/ conta PF?</Label><Select value={sociosRetiramValores} onValueChange={setSociosRetiramValores}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{simNao.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
                
                <div className="space-y-2"><Label>Recebe em conta PF ou PJ?</Label><Select value={recebeContaPF} onValueChange={setRecebeContaPF}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="Pessoa Física">Pessoa Física</SelectItem><SelectItem value="Pessoa Jurídica">Pessoa Jurídica</SelectItem><SelectItem value="Ambos">Ambos</SelectItem><SelectItem value="Não sei">Não sei</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Usa a mesma conta bancária?</Label><Select value={mesmaContaSocios} onValueChange={setMesmaContaSocios}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{simNaoNaoSei.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
                {mesmaContaSocios === 'Sim' && <div className="md:col-span-2"><p className="text-[10px] text-destructive font-bold mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> ALERTA: Risco de Confusão Patrimonial Identificado.</p></div>}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <SectionTitle icon={Zap} title="Custos de Abertura e Manutenção" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Honorários Legalização (R$)</Label><Input type="number" value={honorariosLegalizacao} onChange={e => setHonorariosLegalizacao(e.target.value)} /></div>
                <div className="space-y-2"><Label>Assessoria Mensal (R$)</Label><Input type="number" value={honorariosAssessoriaMensal} onChange={e => setHonorariosAssessoriaMensal(e.target.value)} /></div>
                <div className="space-y-2"><Label>Junta/Cartório (R$)</Label><Input type="number" value={valorJuntaCartorio} onChange={e => setValorJuntaCartorio(e.target.value)} /></div>
                <div className="space-y-2"><Label>Bombeiro/Licenças (R$)</Label><Input type="number" value={valorBombeiro} onChange={e => setValorBombeiro(e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 space-y-2"><Label className="font-semibold">Descrição Detalhada das Atividades</Label><Textarea value={atividades} onChange={(e) => setAtividades(e.target.value)} placeholder="Descreva detalhadamente o escopo do negócio..." className="min-h-[100px]" /></div>

      <div className="text-center pt-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button size="lg" disabled={isLoading} className="bg-accent hover:bg-accent/90 px-12">{isLoading ? "Processando Diagnóstico..." : "Gerar Diagnóstico com IA"}<ChevronDown className="h-4 w-4 ml-2" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56"><DropdownMenuItem onClick={() => handleSendToAI('test')} className="cursor-pointer"><Send className="h-4 w-4 mr-2" /> Ambiente de Teste</DropdownMenuItem><DropdownMenuItem onClick={() => handleSendToAI('production')} className="cursor-pointer"><Send className="h-4 w-4 mr-2" /> Ambiente de Produção</DropdownMenuItem></DropdownMenuContent>
        </DropdownMenu>
      </div>

      {aiReport && <div id="ai-report-section"><AiAnalysisReport report={aiReport} onClose={() => setAiReport(null)} executionTime={executionTime || undefined} clientName={razaoSocial} clientCity={municipio} clientState={estado} /></div>}
    </div>
  );
};

export default Viabilidade;