import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Sparkles, ChevronDown, RefreshCw, DollarSign, Building2, ShieldQuestion, Zap, AlertTriangle, Calendar, Table as TableIcon, Info } from 'lucide-react';
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

const anosBase = ["2022", "2023", "2024", "2025", "2026"];
const simNao = ["Sim", "Não"];
const simNaoNaoSei = ["Sim", "Não", "Não sei"];

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
  const [capital, setCapital] = useState(() => getStored('viab-capital'));
  const [cnaePrincipal, setCnaePrincipal] = useState(() => getStored('viab-cnaePrincipal'));
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
  
  const [aliquotaIss, setAliquotaIss] = useState(() => getStored('viab-aliquotaIss', '5'));
  const [aliquotaIcms, setAliquotaIcms] = useState(() => getStored('viab-aliquotaIcms', '18'));

  const [sociosRetiramValores, setSociosRetiramValores] = useState(() => getStored('viab-sociosRetiramValores'));
  const [sociosDeclaramProlabore, setSociosDeclaramProlabore] = useState(() => getStored('viab-sociosDeclaramProlabore'));
  const [valorProlabore, setValorProlabore] = useState(() => getStored('viab-valorProlabore'));
  const [sociosRecolhemInssIr, setSociosRecolhemInssIr] = useState(() => getStored('viab-sociosRecolhemInssIr'));
  const [recebeContaPF, setRecebeContaPF] = useState(() => getStored('viab-recebeContaPF'));
  const [mesmaContaSocios, setMesmaContaSocios] = useState(() => getStored('viab-mesmaContaSocios'));

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
  const currentIrpfTables = useMemo(() => irpfTables.filter(t => t.year === anoBase), [irpfTables, anoBase]);

  const handleComercioChange = (val: string) => {
    const n = Math.min(100, Math.max(0, parseFloat(val) || 0));
    setPercentComercio(n.toString());
    setPercentServico((100 - n).toString());
  };

  const handleServicoChange = (val: string) => {
    const n = Math.min(100, Math.max(0, parseFloat(val) || 0));
    setPercentServico(n.toString());
    setPercentComercio((100 - n).toString());
  };

  useEffect(() => {
    const data: Record<string, string> = {
      'viab-razaoSocial': razaoSocial, 'viab-naturezaJuridica': naturezaJuridica, 'viab-capital': capital,
      'viab-cnaePrincipal': cnaePrincipal, 'viab-atividades': atividades, 'viab-numSocios': numSocios,
      'viab-numFuncionarios': numFuncionarios, 'viab-folhaPagamento': folhaPagamento, 'viab-municipio': municipio,
      'viab-estado': estado, 'viab-tributacaoSugerida': tributacaoSugerida, 'viab-businessIdea': businessIdea,
      'viab-anoBase': anoBase, 'viab-faturamentoAnual': faturamentoAnual, 'viab-percentComercio': percentComercio,
      'viab-percentServico': percentServico, 'viab-aliquotaIss': aliquotaIss, 'viab-aliquotaIcms': aliquotaIcms,
      'viab-sociosRetiramValores': sociosRetiramValores, 'viab-sociosDeclaramProlabore': sociosDeclaramProlabore,
      'viab-valorProlabore': valorProlabore, 'viab-sociosRecolhemInssIr': sociosRecolhemInssIr,
      'viab-recebeContaPF': recebeContaPF, 'viab-mesmaContaSocios': mesmaContaSocios,
      'viab-honorariosLegalizacao': honorariosLegalizacao, 'viab-honorariosAssessoriaMensal': honorariosAssessoriaMensal,
      'viab-valorJuntaCartorio': valorJuntaCartorio, 'viab-valorDpa': valorDpa, 'viab-valorBombeiro': valorBombeiro,
      'viab-valorLicencasMunicipais': valorLicencasMunicipais
    };
    Object.entries(data).forEach(([key, val]) => { if (val !== undefined && val !== null) localStorage.setItem(key, val); });
    if (aiReport) localStorage.setItem('viab-aiReport', aiReport);
    else localStorage.removeItem('viab-aiReport');
  }, [
    razaoSocial, naturezaJuridica, capital, cnaePrincipal, atividades, numSocios, numFuncionarios,
    folhaPagamento, municipio, estado, tributacaoSugerida, businessIdea, anoBase, faturamentoAnual,
    percentComercio, percentServico, aliquotaIss, aliquotaIcms, sociosRetiramValores,
    sociosDeclaramProlabore, valorProlabore, sociosRecolhemInssIr, recebeContaPF, mesmaContaSocios,
    honorariosLegalizacao, honorariosAssessoriaMensal, valorJuntaCartorio, valorDpa, valorBombeiro, valorLicencasMunicipais,
    aiReport
  ]);

  const handleNewConsultation = () => {
    if (confirm("Deseja limpar todos os campos e iniciar uma nova consulta?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleSendToAI = async (environment: 'test' | 'production') => {
    if (!atividades.trim() || !municipio.trim()) {
      toast.error("Preencha pelo menos as Atividades e o Município.");
      return;
    }
    setIsLoading(true);
    const startTime = performance.now();
    const toastId = toast.loading(`Gerando Diagnóstico Profissional (${environment})...`);
    try {
      const cleanCnae = cnaePrincipal.replace(/\D/g, '');
      const normalizedMunicipio = municipio.charAt(0).toUpperCase() + municipio.slice(1).toLowerCase();
      
      // LÓGICA PROFISSIONAL DE PRÓ-LABORE
      const minWageEntry = minimumWages.find(w => w.year === anoBase);
      const minWageValue = minWageEntry ? minWageEntry.value : 1412;
      
      const isDeclaring = sociosDeclaramProlabore === 'Sim';
      const userValue = parseFloat(valorProlabore) || 0;

      const proLaborePayload = {
        declara_prolabore: isDeclaring,
        valor_declarado: isDeclaring ? userValue : 0,
        valor_estimado: isDeclaring ? userValue : minWageValue,
        recolhe_inss_ir: sociosRecolhemInssIr === 'Sim',
        modo_calculo: isDeclaring ? "declarado_pelo_usuario" : "estimado_para_simulacao"
      };

      const totalFaturamentoAnual = parseFloat(faturamentoAnual) || 0;
      const faturamentoMensalMedio = totalFaturamentoAnual / 12;
      const pComercio = parseFloat(percentComercio) || 0;
      const pServico = parseFloat(percentServico) || 0;
      const folhaMensal = parseFloat(folhaPagamento) || 0;

      const refInss = getInssTables().filter(t => t.year === anoBase);
      const refIrpf = getIrpfTables().filter(t => t.year === anoBase);

      const payload = {
        agentName: "Diagnóstico de Viabilidade e Estruturação de Negócios",
        contexto: { 
          anoBase, 
          objetivo: "Análise de Viabilidade, Planejamento Tributário e Blindagem Patrimonial", 
          timestamp: new Date().toISOString(), 
          ambiente: environment 
        },
        tabelasReferencia: {
          inss: refInss,
          irpf: refIrpf,
          salario_minimo: minWageValue
        },
        empresa: { razaoSocial: razaoSocial || 'Projeto não nomeado', naturezaJuridica: naturezaJuridica || 'A definir / Sugerir', capitalSocial: parseFloat(capital) || 0, numSocios: parseInt(numSocios) || 1, localizacao: { municipio: normalizedMunicipio, estado }, tributacaoPretendida: tributacaoSugerida || 'Sugerir melhor cenário' },
        operacional: { cnaeInformado: cleanCnae, descricaoAtividades: atividades, ideiaNegocio: businessIdea, tipoOperacao: pComercio > 0 && pServico > 0 ? 'Mista' : pComercio > 0 ? 'Comércio' : 'Serviço' },
        financeiro: { faturamento: { anual_total: totalFaturamentoAnual, mensal_medio: faturamentoMensalMedio, segregacao: { comercio_percent: pComercio, servico_percent: pServico, comercio_valor_anual: totalFaturamentoAnual * (pComercio / 100), servico_valor_anual: totalFaturamentoAnual * (pServico / 100) } }, tributos_locais: { iss_municipio: parseFloat(aliquotaIss) || 5, icms_estado: parseFloat(aliquotaIcms) || 18 }, custos_abertura: { honorarios_legalizacao: parseFloat(honorariosLegalizacao) || 0, taxas_governo: (parseFloat(valorJuntaCartorio) || 0) + (parseFloat(valorDpa) || 0) + (parseFloat(valorBombeiro) || 0) + (parseFloat(valorLicencasMunicipais) || 0), assessoria_mensal_contabil: parseFloat(honorariosAssessoriaMensal) || 0 } },
        societario_trabalhista: { quadro_pessoal: { num_funcionarios: parseInt(numFuncionarios) || 0, folha_salarial_mensal: folhaMensal }, pro_labore: proLaborePayload },
        conformidade_riscos: { recebe_vendas_conta_pf: recebeContaPF === 'Pessoa Física' || recebeContaPF === 'Ambos', retira_valores_sem_origem: sociosRetiramValores === 'Sim', mistura_patrimonial: mesmaContaSocios === 'Sim', alertas_criticos: { risco_confusao_patrimonial: mesmaContaSocios === 'Sim', risco_previdenciario_prolabore: !isDeclaring, risco_desconsideracao_pj: recebeContaPF === 'Pessoa Física' || mesmaContaSocios === 'Sim', fator_r_critico: (folhaMensal + proLaborePayload.valor_estimado) / (faturamentoMensalMedio || 1) < 0.28 } }
      };
      const webhooks = { test: 'https://jota-empresas-n8n.ubjifz.easypanel.host/webhook-test/e50090ba-ffc9-45e7-86f5-9a0467f4f794', production: 'https://jota-empresas-n8n.ubjifz.easypanel.host/webhook/e50090ba-ffc9-45e7-86f5-9a0467f4f794' };
      const response = await fetch(webhooks[environment], { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("Erro na comunicação com a IA.");
      const data = await response.json();
      const duration = (performance.now() - startTime) / 1000;
      setExecutionTime(duration);
      let reportText = data.report || (Array.isArray(data) ? data[0]?.report : null) || data.output || data.text;
      if (!reportText && data.content?.parts) reportText = data.content.parts.map((p: any) => p.text || "").join("\n\n");
      if (!reportText) throw new Error("Resposta da IA sem relatório reconhecível.");
      setAiReport(reportText);
      toast.success(`Diagnóstico concluído!`, { id: toastId });
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
          <Button variant="outline" size="sm" onClick={handleNewConsultation}><RefreshCw className="h-4 w-4 mr-2" /> Nova Consulta</Button>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <SectionTitle icon={Building2} title="Identificação e Atividade" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2"><Label>Razão Social / Nome do Projeto</Label><Input value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} placeholder="Ex: Top Motos Ltda" /></div>
                <div className="space-y-2">
                  <Label>Ano Base</Label>
                  <Select value={anoBase} onValueChange={setAnoBase}>
                    <SelectTrigger><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                    <SelectContent>{anosBase.map(ano => <SelectItem key={ano} value={ano}>{ano}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Natureza Jurídica</Label><Select value={naturezaJuridica} onValueChange={setNaturezaJuridica}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{naturezasJuridicas.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>CNAE Principal (Opcional)</Label><Input value={cnaePrincipal} onChange={e => setCnaePrincipal(e.target.value)} placeholder="Ex: 4541-2/06" /></div>
                <div className="space-y-2"><Label>Capital Social (R$)</Label><Input type="number" value={capital} onChange={e => setCapital(e.target.value)} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Tributação Pretendida</Label><Select value={tributacaoSugerida} onValueChange={setTributacaoSugerida}><SelectTrigger><SelectValue placeholder="Selecione ou deixe para a IA sugerir" /></SelectTrigger><SelectContent><SelectItem value="Simples Nacional">Simples Nacional</SelectItem><SelectItem value="Simples Nacional (Híbrido)">Simples Nacional (Híbrido)</SelectItem><SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem><SelectItem value="Lucro Real">Lucro Real</SelectItem><SelectItem value="Não sei / Sugerir">Não sei / Sugerir</SelectItem></SelectContent></Select></div>
                <div className="space-y-2 md:col-span-2"><Label>Descrição das Atividades (para sugestão de CNAE)</Label><Textarea value={atividades} onChange={e => setAtividades(e.target.value)} placeholder="Descreva o que a empresa faz..." className="h-24" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <SectionTitle icon={DollarSign} title="Faturamento e Impostos Locais" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2"><Label>Faturamento Anual Estimado (R$)</Label><Input type="number" value={faturamentoAnual} onChange={e => setFaturamentoAnual(e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Segregação: Comércio (%)</Label>
                  <Input type="number" value={percentComercio} onChange={e => handleComercioChange(e.target.value)} className="border-blue-200 bg-blue-50/30" />
                </div>
                <div className="space-y-2">
                  <Label>Segregação: Serviço (%)</Label>
                  <Input type="number" value={percentServico} onChange={e => handleServicoChange(e.target.value)} className="border-emerald-200 bg-emerald-50/30" />
                </div>
                <div className="space-y-2"><Label>Alíquota ISS Município (%)</Label><Input type="number" value={aliquotaIss} onChange={e => setAliquotaIss(e.target.value)} /></div>
                <div className="space-y-2"><Label>Alíquota ICMS Estado (%)</Label><Input type="number" value={aliquotaIcms} onChange={e => setAliquotaIcms(e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-card border-orange-200 bg-orange-50/10">
            <CardContent className="pt-6">
              <SectionTitle icon={ShieldQuestion} title="Folha de Pagamento e Sócios" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Folha Salarial Mensal (R$)</Label><Input type="number" value={folhaPagamento} onChange={e => setFolhaPagamento(e.target.value)} /></div>
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

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500" title="Tabelas IRPF"><Info className="h-3 w-3" /></Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader><DialogTitle>Tabelas IRPF - Ano {anoBase}</DialogTitle></DialogHeader>
                          <div className="space-y-6 max-h-[500px] overflow-y-auto">
                            {currentIrpfTables.length > 0 ? currentIrpfTables.map(table => (
                              <div key={table.id} className="space-y-4">
                                <div className="space-y-2">
                                  <h4 className="text-xs font-bold text-blue-600 uppercase">Tabela Progressiva Mensal</h4>
                                  <Table>
                                    <TableHeader><TableRow><TableHead className="text-[10px]">Base de Cálculo</TableHead><TableHead className="text-[10px]">Alíquota</TableHead><TableHead className="text-[10px]">Dedução</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                      {table.ranges.map((r, i) => (
                                        <TableRow key={i} className="text-[10px]">
                                          <TableCell>{formatCurrency(r.min)} {r.max ? `a ${formatCurrency(r.max)}` : 'em diante'}</TableCell>
                                          <TableCell>{r.rate > 0 ? `${r.rate.toFixed(2)}%` : 'Isento'}</TableCell>
                                          <TableCell>{r.deduction > 0 ? formatCurrency(r.deduction) : '---'}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                                
                                {table.reductionRules.length > 0 && (
                                  <div className="space-y-2 p-3 bg-blue-50 rounded-md border border-blue-100">
                                    <h4 className="text-xs font-bold text-blue-700 uppercase">Regras de Redução do Imposto</h4>
                                    <div className="space-y-2">
                                      {table.reductionRules.map((rule, ri) => (
                                        <div key={ri} className="text-[10px] flex justify-between border-b border-blue-200 pb-1 last:border-0">
                                          <span className="font-semibold">{formatCurrency(rule.min)} {rule.max ? `a ${formatCurrency(rule.max)}` : 'em diante'}:</span>
                                          <span className="text-blue-800">{rule.description}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )) : <p className="text-sm text-muted-foreground">Nenhuma tabela IRPF cadastrada para este ano.</p>}
                            
                            <div className="p-3 bg-yellow-50 rounded-md border border-yellow-100 text-[10px] text-yellow-800">
                              <p className="font-bold mb-1">Observações Importantes:</p>
                              <ul className="list-disc list-inside space-y-1">
                                <li>Critérios aplicáveis também ao 13º salário.</li>
                                <li>Não afeta disposições relativas à tabela regressiva.</li>
                                <li>Isenções por moléstia grave e parcela isenta 65+ (R$ 1.903,98) permanecem vigentes.</li>
                              </ul>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <Input type="number" value={valorProlabore} onChange={e => setValorProlabore(e.target.value)} placeholder="Mínimo 1.412,00" />
                </div>
                <div className="space-y-2"><Label>Declaram Pró-labore?</Label><Select value={sociosDeclaramProlabore} onValueChange={setSociosDeclaramProlabore}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{simNao.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Retiram valores p/ conta PF?</Label><Select value={sociosRetiramValores} onValueChange={setSociosRetiramValores}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{simNao.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Recebe em conta PF ou PJ?</Label><Select value={recebeContaPF} onValueChange={setRecebeContaPF}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="Pessoa Física">Pessoa Física</SelectItem><SelectItem value="Pessoa Jurídica">Pessoa Jurídica</SelectItem><SelectItem value="Ambos">Ambos</SelectItem><SelectItem value="Não sei">Não sei</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Usa a mesma conta bancária para pagar as contas dos sócios?</Label><Select value={mesmaContaSocios} onValueChange={setMesmaContaSocios}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{simNaoNaoSei.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
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

      <div className="mt-6 space-y-2"><Label className="font-semibold">Descrição Adicional da Ideia de Negócio</Label><Textarea value={businessIdea} onChange={(e) => setBusinessIdea(e.target.value)} placeholder="Exemplo: Pretendo focar em produtos orgânicos, ter um delivery e talvez um pequeno café no local..." className="min-h-[100px]" /></div>

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