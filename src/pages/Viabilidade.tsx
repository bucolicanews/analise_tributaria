import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Sparkles, ChevronDown, RefreshCw, DollarSign, Building2, ShieldQuestion } from 'lucide-react';
import { AiAnalysisReport } from '@/components/AiAnalysisReport';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [razaoSocial, setRazaoSocial] = useState(localStorage.getItem('viab-razaoSocial') || '');
  const [naturezaJuridica, setNaturezaJuridica] = useState(localStorage.getItem('viab-naturezaJuridica') || '');
  const [capital, setCapital] = useState(localStorage.getItem('viab-capital') || '');
  const [atividades, setAtividades] = useState(localStorage.getItem('viab-atividades') || '');
  const [numSocios, setNumSocios] = useState(localStorage.getItem('viab-numSocios') || '1');
  const [numFuncionarios, setNumFuncionarios] = useState(localStorage.getItem('viab-numFuncionarios') || '0');
  const [folhaPagamento, setFolhaPagamento] = useState(localStorage.getItem('viab-folhaPagamento') || '');
  const [municipio, setMunicipio] = useState(localStorage.getItem('viab-municipio') || '');
  const [estado, setEstado] = useState(localStorage.getItem('viab-estado') || 'SP');
  const [tributacaoSugerida, setTributacaoSugerida] = useState(localStorage.getItem('viab-tributacaoSugerida') || '');
  const [businessIdea, setBusinessIdea] = useState(localStorage.getItem('viab-businessIdea') || '');

  // Novos campos — Financeiro / Custos de Abertura
  const [faturamentoAnual, setFaturamentoAnual] = useState(localStorage.getItem('viab-faturamentoAnual') || '');
  const [percentComercio, setPercentComercio] = useState(localStorage.getItem('viab-percentComercio') || '100');
  const [percentServico, setPercentServico] = useState(localStorage.getItem('viab-percentServico') || '0');
  const [honorariosLegalizacao, setHonorariosLegalizacao] = useState(localStorage.getItem('viab-honorariosLegalizacao') || '');
  const [honorariosAssessoriaMensal, setHonorariosAssessoriaMensal] = useState(localStorage.getItem('viab-honorariosAssessoriaMensal') || '');
  const [valorJuntaCartorio, setValorJuntaCartorio] = useState(localStorage.getItem('viab-valorJuntaCartorio') || '');
  const [valorDpa, setValorDpa] = useState(localStorage.getItem('viab-valorDpa') || '');
  const [valorBombeiro, setValorBombeiro] = useState(localStorage.getItem('viab-valorBombeiro') || '');
  const [valorLicencasMunicipais, setValorLicencasMunicipais] = useState(localStorage.getItem('viab-valorLicencasMunicipais') || '');

  // Novos campos — Comportamento Financeiro dos Sócios
  const [sociosRetiramValores, setSociosRetiramValores] = useState(localStorage.getItem('viab-sociosRetiramValores') || '');
  const [sociosDeclaramProlabore, setSociosDeclaramProlabore] = useState(localStorage.getItem('viab-sociosDeclaramProlabore') || '');
  const [sociosRecolhemInssIr, setSociosRecolhemInssIr] = useState(localStorage.getItem('viab-sociosRecolhemInssIr') || '');
  const [recebeContaPF, setRecebeContaPF] = useState(localStorage.getItem('viab-recebeContaPF') || '');
  const [mesmaContaSocios, setMesmaContaSocios] = useState(localStorage.getItem('viab-mesmaContaSocios') || '');

  const [aiReport, setAiReport] = useState<string | null>(localStorage.getItem('viab-aiReport') || null);
  const [isLoading, setIsLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  // Persistência no localStorage
  useEffect(() => { localStorage.setItem('viab-razaoSocial', razaoSocial); }, [razaoSocial]);
  useEffect(() => { localStorage.setItem('viab-naturezaJuridica', naturezaJuridica); }, [naturezaJuridica]);
  useEffect(() => { localStorage.setItem('viab-capital', capital); }, [capital]);
  useEffect(() => { localStorage.setItem('viab-atividades', atividades); }, [atividades]);
  useEffect(() => { localStorage.setItem('viab-numSocios', numSocios); }, [numSocios]);
  useEffect(() => { localStorage.setItem('viab-numFuncionarios', numFuncionarios); }, [numFuncionarios]);
  useEffect(() => { localStorage.setItem('viab-folhaPagamento', folhaPagamento); }, [folhaPagamento]);
  useEffect(() => { localStorage.setItem('viab-municipio', municipio); }, [municipio]);
  useEffect(() => { localStorage.setItem('viab-estado', estado); }, [estado]);
  useEffect(() => { localStorage.setItem('viab-tributacaoSugerida', tributacaoSugerida); }, [tributacaoSugerida]);
  useEffect(() => { localStorage.setItem('viab-businessIdea', businessIdea); }, [businessIdea]);
  useEffect(() => { localStorage.setItem('viab-faturamentoAnual', faturamentoAnual); }, [faturamentoAnual]);
  useEffect(() => { localStorage.setItem('viab-percentComercio', percentComercio); }, [percentComercio]);
  useEffect(() => { localStorage.setItem('viab-percentServico', percentServico); }, [percentServico]);
  useEffect(() => { localStorage.setItem('viab-honorariosLegalizacao', honorariosLegalizacao); }, [honorariosLegalizacao]);
  useEffect(() => { localStorage.setItem('viab-honorariosAssessoriaMensal', honorariosAssessoriaMensal); }, [honorariosAssessoriaMensal]);
  useEffect(() => { localStorage.setItem('viab-valorJuntaCartorio', valorJuntaCartorio); }, [valorJuntaCartorio]);
  useEffect(() => { localStorage.setItem('viab-valorDpa', valorDpa); }, [valorDpa]);
  useEffect(() => { localStorage.setItem('viab-valorBombeiro', valorBombeiro); }, [valorBombeiro]);
  useEffect(() => { localStorage.setItem('viab-valorLicencasMunicipais', valorLicencasMunicipais); }, [valorLicencasMunicipais]);
  useEffect(() => { localStorage.setItem('viab-sociosRetiramValores', sociosRetiramValores); }, [sociosRetiramValores]);
  useEffect(() => { localStorage.setItem('viab-sociosDeclaramProlabore', sociosDeclaramProlabore); }, [sociosDeclaramProlabore]);
  useEffect(() => { localStorage.setItem('viab-sociosRecolhemInssIr', sociosRecolhemInssIr); }, [sociosRecolhemInssIr]);
  useEffect(() => { localStorage.setItem('viab-recebeContaPF', recebeContaPF); }, [recebeContaPF]);
  useEffect(() => { localStorage.setItem('viab-mesmaContaSocios', mesmaContaSocios); }, [mesmaContaSocios]);

  useEffect(() => {
    if (aiReport) localStorage.setItem('viab-aiReport', aiReport);
    else localStorage.removeItem('viab-aiReport');
  }, [aiReport]);

  const handleNewConsultation = () => {
    if (confirm("Deseja limpar todos os campos e iniciar uma nova consulta?")) {
      setRazaoSocial(''); setNaturezaJuridica(''); setCapital(''); setAtividades('');
      setNumSocios('1'); setNumFuncionarios('0'); setFolhaPagamento(''); setMunicipio('');
      setEstado('SP'); setTributacaoSugerida(''); setBusinessIdea('');
      setFaturamentoAnual(''); setPercentComercio('100'); setPercentServico('0');
      setHonorariosLegalizacao(''); setHonorariosAssessoriaMensal('');
      setValorJuntaCartorio(''); setValorDpa(''); setValorBombeiro(''); setValorLicencasMunicipais('');
      setSociosRetiramValores(''); setSociosDeclaramProlabore(''); setSociosRecolhemInssIr('');
      setRecebeContaPF(''); setMesmaContaSocios('');
      setAiReport(null); setExecutionTime(null);

      const keysToRemove = [
        'viab-razaoSocial', 'viab-naturezaJuridica', 'viab-capital', 'viab-atividades',
        'viab-numSocios', 'viab-numFuncionarios', 'viab-folhaPagamento', 'viab-municipio',
        'viab-estado', 'viab-tributacaoSugerida', 'viab-businessIdea', 'viab-aiReport',
        'viab-faturamentoAnual', 'viab-percentComercio', 'viab-percentServico',
        'viab-honorariosLegalizacao', 'viab-honorariosAssessoriaMensal',
        'viab-valorJuntaCartorio', 'viab-valorDpa', 'viab-valorBombeiro', 'viab-valorLicencasMunicipais',
        'viab-sociosRetiramValores', 'viab-sociosDeclaramProlabore', 'viab-sociosRecolhemInssIr',
        'viab-recebeContaPF', 'viab-mesmaContaSocios',
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      toast.info("Campos limpos. Inicie uma nova análise.");
    }
  };

  const handleSendToAI = async (environment: 'test' | 'production') => {
    if (!atividades.trim() || !municipio.trim()) {
      toast.error("Preencha pelo menos as Atividades e o Município antes de enviar.");
      return;
    }

    setIsLoading(true);
    setExecutionTime(null);
    const startTime = performance.now();
    const toastId = toast.loading(`Aguardando diagnóstico da IA (${environment})...`);

    try {
      const totalFaturamento = parseFloat(faturamentoAnual) || 0;
      const pComercio = parseFloat(percentComercio) || 0;
      const pServico = parseFloat(percentServico) || 0;

      const payload = {
        agentName: "Análise de Viabilidade Tributária",
        systemPrompt: "Você é um especialista sênior em direito tributário e contabilidade fiscal brasileira. Sua função é realizar uma análise técnica completa de viabilidade tributária para abertura ou regularização de empresas...",
        empresa: {
          razaoSocial: razaoSocial || 'Não informado',
          naturezaJuridica: naturezaJuridica || 'Não informado / Sugerir',
          capitalSocial: parseFloat(capital) || 0,
          numSocios: parseInt(numSocios) || 1,
          atividades: atividades,
          tributacaoPretendida: tributacaoSugerida || 'Não informado / Sugerir',
          descricaoAdicional: businessIdea || 'Nenhuma descrição adicional fornecida.'
        },
        financeiro: {
          faturamentoMensalEstimado: totalFaturamento / 12,
          faturamentoAnualEstimado: totalFaturamento,
          segregacaoAtividade: {
            comercioPercent: pComercio,
            servicoPercent: pServico,
            comercioValorAnual: totalFaturamento * (pComercio / 100),
            servicoValorAnual: totalFaturamento * (pServico / 100)
          },
          custosAbertura: {
            honorariosLegalizacao: parseFloat(honorariosLegalizacao) || 0,
            juntaCartorio: parseFloat(valorJuntaCartorio) || 0,
            dpa: parseFloat(valorDpa) || 0,
            bombeiro: parseFloat(valorBombeiro) || 0,
            licencasMunicipais: parseFloat(valorLicencasMunicipais) || 0
          },
          custosManutencao: {
            honorariosAssessoriaMensal: parseFloat(honorariosAssessoriaMensal) || 0
          }
        },
        folha: {
          folhaPagamentoMensal: parseFloat(folhaPagamento) || 0,
          numFuncionarios: parseInt(numFuncionarios) || 0,
          comportamentoSocios: {
            retiramValoresPF: sociosRetiramValores,
            declaramProlabore: sociosDeclaramProlabore,
            recolhemInssIr: sociosRecolhemInssIr
          }
        },
        localizacao: {
          municipio: municipio,
          estado: estado
        },
        conformidade: {
          recebeContaPF: recebeContaPF,
          mesmaContaSocios: mesmaContaSocios
        }
      };

      const webhooks = {
        test: localStorage.getItem('jota-webhook-test') || 'https://jota-empresas-n8n.ubjifz.easypanel.host/webhook-test/e50090ba-ffc9-45e7-86f5-9a0467f4f794',
        production: localStorage.getItem('jota-webhook-prod') || 'https://jota-empresas-n8n.ubjifz.easypanel.host/webhook/e50090ba-ffc9-45e7-86f5-9a0467f4f794'
      };

      const webhookUrl = webhooks[environment];
      if (!webhookUrl) throw new Error(`A URL do webhook de '${environment}' não está configurada.`);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Erro na comunicação com o servidor de IA.");

      const data = await response.json();
      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000;
      setExecutionTime(duration);

      let reportText = "";
      if (data.report) {
        reportText = data.report;
      } else if (Array.isArray(data) && data[0]?.report) {
        reportText = data[0].report;
      } else if (Array.isArray(data) && data[0]?.content?.parts?.[0]?.text) {
        reportText = data.map((item: any) => item.content.parts.map((part: any) => part.text).join("\n")).join("\n\n---\n\n");
      } else if (data?.content?.parts?.[0]?.text) {
        reportText = data.content.parts.map((part: any) => part.text).join("\n");
      } else {
        console.error("Formato não reconhecido:", data);
        throw new Error("Formato de resposta da IA não reconhecido. Verifique o console.");
      }

      setAiReport(reportText);
      toast.success(`Diagnóstico concluído em ${duration.toFixed(2)}s!`, { id: toastId });
      setTimeout(() => document.getElementById('ai-report-section')?.scrollIntoView({ behavior: 'smooth' }), 500);

    } catch (error: any) {
      toast.error("Falha na análise", { id: toastId, description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const SelectSimNao = ({
    id, value, onChange, options = simNao, placeholder = "Selecione..."
  }: {
    id: string; value: string; onChange: (v: string) => void; options?: string[]; placeholder?: string;
  }) => (
    <Select value={value} onValueChange={onChange} disabled={isLoading}>
      <SelectTrigger id={id}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">

      {/* Cabeçalho */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-primary">
                <Sparkles className="h-6 w-6" />
                Análise de Viabilidade de Novo Negócio
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Preencha os dados abaixo para gerar um diagnóstico completo com IA. Seus dados são salvos automaticamente.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleNewConsultation}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Nova Consulta
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Seção 1 — Dados da Empresa */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <SectionTitle icon={Building2} title="Dados da Empresa" subtitle="Informações cadastrais e operacionais" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="razao-social">Razão Social (Opcional)</Label>
                <Input id="razao-social" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="natureza-juridica">Natureza Jurídica</Label>
                <Select value={naturezaJuridica} onValueChange={setNaturezaJuridica} disabled={isLoading}>
                  <SelectTrigger><SelectValue placeholder="Selecione ou deixe para a IA sugerir" /></SelectTrigger>
                  <SelectContent>
                    {naturezasJuridicas.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capital">Capital Social (R$)</Label>
                <Input id="capital" type="number" value={capital} onChange={(e) => setCapital(e.target.value)} disabled={isLoading} placeholder="Ex: 50000" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="num-socios">Qtd. de Sócios</Label>
                  <Input id="num-socios" type="number" value={numSocios} onChange={(e) => setNumSocios(e.target.value)} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="num-funcionarios">Funcionários</Label>
                  <Input id="num-funcionarios" type="number" value={numFuncionarios} onChange={(e) => setNumFuncionarios(e.target.value)} disabled={isLoading} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="folha-pagamento">Folha de Pagamento Mensal (R$)</Label>
                <Input id="folha-pagamento" type="number" value={folhaPagamento} onChange={(e) => setFolhaPagamento(e.target.value)} disabled={isLoading} placeholder="Ex: 4500" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="municipio">Município</Label>
                  <Input id="municipio" value={municipio} onChange={(e) => setMunicipio(e.target.value)} disabled={isLoading} placeholder="Ex: São Paulo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado (UF)</Label>
                  <Select value={estado} onValueChange={setEstado} disabled={isLoading}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UFs.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tributacao-sugerida">Tributação Pretendida</Label>
                <Select value={tributacaoSugerida} onValueChange={setTributacaoSugerida} disabled={isLoading}>
                  <SelectTrigger><SelectValue placeholder="Selecione ou deixe para a IA sugerir" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                    <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                    <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                    <SelectItem value="Não sei / Sugerir">Não sei / Sugerir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="atividades">Principais Atividades (para sugestão de CNAE)</Label>
                <Textarea id="atividades" value={atividades} onChange={(e) => setAtividades(e.target.value)} placeholder="Ex: Venda de alimentos, bebidas, produtos de limpeza..." className="min-h-[108px]" disabled={isLoading} />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border space-y-2">
            <Label htmlFor="business-idea" className="font-semibold">Descrição geral da ideia (detalhes adicionais)</Label>
            <Textarea
              id="business-idea"
              value={businessIdea}
              onChange={(e) => setBusinessIdea(e.target.value)}
              placeholder="Exemplo: Pretendo focar em produtos orgânicos, ter um delivery e talvez um pequeno café no local. O faturamento inicial estimado é de R$ 30.000/mês."
              className="min-h-[100px]"
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Seção 2 — Projeção Financeira e Custos */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <SectionTitle
            icon={DollarSign}
            title="Projeção Financeira e Custos de Abertura"
            subtitle="Estimativas de faturamento e investimentos iniciais"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label htmlFor="faturamento-anual">Faturamento Anual Estimado (12 meses) R$</Label>
              <Input
                id="faturamento-anual"
                type="number"
                value={faturamentoAnual}
                onChange={(e) => setFaturamentoAnual(e.target.value)}
                disabled={isLoading}
                placeholder="Ex: 360000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 p-3 rounded-md bg-muted/30 border border-border/50">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold">Comércio (%)</Label>
                <Input type="number" value={percentComercio} onChange={(e) => setPercentComercio(e.target.value)} disabled={isLoading} className="h-8 text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold">Serviço (%)</Label>
                <Input type="number" value={percentServico} onChange={(e) => setPercentServico(e.target.value)} disabled={isLoading} className="h-8 text-xs" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="honorarios-assessoria-mensal">Honorários de Assessoria Mensal R$</Label>
              <Input
                id="honorarios-assessoria-mensal"
                type="number"
                value={honorariosAssessoriaMensal}
                onChange={(e) => setHonorariosAssessoriaMensal(e.target.value)}
                disabled={isLoading}
                placeholder="Ex: 600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="honorarios-legalizacao">Honorários Contábeis de Legalização R$</Label>
              <Input
                id="honorarios-legalizacao"
                type="number"
                value={honorariosLegalizacao}
                onChange={(e) => setHonorariosLegalizacao(e.target.value)}
                disabled={isLoading}
                placeholder="Ex: 1500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="valor-junta-cartorio">Junta Comercial / Cartório R$</Label>
              <Input
                id="valor-junta-cartorio"
                type="number"
                value={valorJuntaCartorio}
                onChange={(e) => setValorJuntaCartorio(e.target.value)}
                disabled={isLoading}
                placeholder="Ex: 300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor-dpa">DPA (Documento de Arrecadação) R$</Label>
              <Input
                id="valor-dpa"
                type="number"
                value={valorDpa}
                onChange={(e) => setValorDpa(e.target.value)}
                disabled={isLoading}
                placeholder="Ex: 150"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor-bombeiro">Bombeiro (AVCB / Auto de Vistoria) R$</Label>
              <Input
                id="valor-bombeiro"
                type="number"
                value={valorBombeiro}
                onChange={(e) => setValorBombeiro(e.target.value)}
                disabled={isLoading}
                placeholder="Ex: 500"
              />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-2">
              <Label htmlFor="valor-licencas-municipais">Valor Médio das Licenças Municipais R$</Label>
              <Input
                id="valor-licencas-municipais"
                type="number"
                value={valorLicencasMunicipais}
                onChange={(e) => setValorLicencasMunicipais(e.target.value)}
                disabled={isLoading}
                placeholder="Ex: 400"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção 3 — Comportamento Financeiro dos Sócios */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <SectionTitle
            icon={ShieldQuestion}
            title="Comportamento Financeiro dos Sócios"
            subtitle="Informações para análise de conformidade fiscal e exposição a risco"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="socios-retiram-valores">Os sócio(s) retiram valores para sua conta bancária pessoa física?</Label>
              <SelectSimNao id="socios-retiram-valores" value={sociosRetiramValores} onChange={setSociosRetiramValores} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="socios-declaram-prolabore">Os sócio(s) declaram pró-labore?</Label>
              <SelectSimNao id="socios-declaram-prolabore" value={sociosDeclaramProlabore} onChange={setSociosDeclaramProlabore} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="socios-recolhem-inss-ir">Os sócios recolhem INSS ou IR sobre o pró-labore?</Label>
              <SelectSimNao id="socios-recolhem-inss-ir" value={sociosRecolhemInssIr} onChange={setSociosRecolhemInssIr} options={simNaoNaoSei} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recebe-conta-pf">Sua empresa recebe em conta corrente de Pessoa Física ou Jurídica?</Label>
              <Select value={recebeContaPF} onValueChange={setRecebeContaPF} disabled={isLoading}>
                <SelectTrigger id="recebe-conta-pf"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pessoa Física">Pessoa Física</SelectItem>
                  <SelectItem value="Pessoa Jurídica">Pessoa Jurídica</SelectItem>
                  <SelectItem value="Ambos">Ambos</SelectItem>
                  <SelectItem value="Não sei">Não sei</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="mesma-conta-socios">Sua empresa usa a mesma conta bancária para pagar as contas dos sócios?</Label>
              <SelectSimNao id="mesma-conta-socios" value={mesmaContaSocios} onChange={setMesmaContaSocios} options={simNaoNaoSei} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão de envio */}
      <div className="text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="lg" disabled={isLoading} className="bg-accent hover:bg-accent/90">
              {isLoading ? "Analisando..." : "Gerar Diagnóstico com IA"}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleSendToAI('test')}>
              <Send className="h-4 w-4 mr-2" />
              Usar Ambiente de Teste
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSendToAI('production')}>
              <Send className="h-4 w-4 mr-2" />
              Usar Ambiente de Produção
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {aiReport && (
        <div id="ai-report-section">
          <AiAnalysisReport
            report={aiReport}
            onClose={() => setAiReport(null)}
            executionTime={executionTime || undefined}
            clientName={razaoSocial}
            clientCity={municipio}
            clientState={estado}
          />
        </div>
      )}
    </div>
  );
};

export default Viabilidade;