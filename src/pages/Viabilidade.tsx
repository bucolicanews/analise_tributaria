import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Sparkles, ChevronDown, RefreshCw } from 'lucide-react';
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

const Viabilidade = () => {
  // Inicializa o estado lendo do localStorage ou usa valor padrão
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
  const [aiReport, setAiReport] = useState<string | null>(localStorage.getItem('viab-aiReport') || null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  // Efeito para salvar no localStorage sempre que um estado mudar
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
  
  useEffect(() => { 
    if (aiReport) localStorage.setItem('viab-aiReport', aiReport); 
    else localStorage.removeItem('viab-aiReport');
  }, [aiReport]);

  const handleNewConsultation = () => {
    if (confirm("Deseja limpar todos os campos e iniciar uma nova consulta?")) {
      setRazaoSocial('');
      setNaturezaJuridica('');
      setCapital('');
      setAtividades('');
      setNumSocios('1');
      setNumFuncionarios('0');
      setFolhaPagamento('');
      setMunicipio('');
      setEstado('SP');
      setTributacaoSugerida('');
      setBusinessIdea('');
      setAiReport(null);
      setExecutionTime(null);
      
      // Limpar chaves específicas do localStorage
      const keysToRemove = [
        'viab-razaoSocial', 'viab-naturezaJuridica', 'viab-capital', 'viab-atividades',
        'viab-numSocios', 'viab-numFuncionarios', 'viab-folhaPagamento', 'viab-municipio',
        'viab-estado', 'viab-tributacaoSugerida', 'viab-businessIdea', 'viab-aiReport'
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
    // Não limpa o relatório anterior imediatamente para evitar "piscar" se falhar, 
    // mas o usuário verá o loader.
    setExecutionTime(null);
    const startTime = performance.now();
    const toastId = toast.loading(`Aguardando diagnóstico da IA (${environment})...`);

    try {
      const payload = {
        analise_simples: true,
        razaoSocial: razaoSocial || 'Não informado',
        naturezaJuridica: naturezaJuridica || 'Não informado / Sugerir',
        capital: capital || 'Não informado',
        numSocios: numSocios || 'Não informado',
        numFuncionarios: numFuncionarios || 'Não informado',
        folhaPagamento: folhaPagamento || 'Não informado',
        municipio: municipio,
        estado: estado,
        atividades: atividades,
        tributacaoSugerida: tributacaoSugerida || 'Não informado / Sugerir',
        businessIdea: businessIdea || 'Nenhuma descrição adicional fornecida.'
      };

      const webhooks = {
        test: localStorage.getItem('jota-webhook-test') || 'https://jota-empresas-n8n.ubjifz.easypanel.host/webhook-test/e50090ba-ffc9-45e7-86f5-9a0467f4f794',
        production: localStorage.getItem('jota-webhook-prod') || 'https://jota-empresas-n8n.ubjifz.easypanel.host/webhook/e50090ba-ffc9-45e7-86f5-9a0467f4f794'
      };

      const webhookUrl = webhooks[environment];
      if (!webhookUrl) {
        throw new Error(`A URL do webhook de '${environment}' não está configurada.`);
      }

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
      } 
      else if (Array.isArray(data) && data[0]?.content?.parts?.[0]?.text) {
        reportText = data.map((item: any) => item.content.parts.map((part: any) => part.text).join("\n")).join("\n\n---\n\n");
      } else if (data?.content?.parts?.[0]?.text) {
         reportText = data.content.parts.map((part: any) => part.text).join("\n");
      }
      else {
        console.error("Formato não reconhecido:", data);
        throw new Error("Formato de resposta da IA não reconhecido. Verifique o console.");
      }
      
      setAiReport(reportText);
      toast.success(`Diagnóstico concluído em ${duration.toFixed(2)}s!`, { id: toastId });
      
      // Rolar até o relatório
      setTimeout(() => document.getElementById('ai-report-section')?.scrollIntoView({ behavior: 'smooth' }), 500);

    } catch (error: any) {
      toast.error("Falha na análise", { id: toastId, description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
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
        <CardContent>
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
                  <Label htmlFor="num-socios">Quantidade de Sócios</Label>
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
                <Textarea id="atividades" value={atividades} onChange={(e) => setAtividades(e.target.value)} placeholder="Ex: Venda de alimentos, bebidas, produtos de limpeza..." className="min-h-[105px]" disabled={isLoading} />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <div className="space-y-4">
              <Label htmlFor="business-idea" className="font-bold">Descrição geral da sua ideia (detalhes adicionais)</Label>
              <Textarea
                id="business-idea"
                value={businessIdea}
                onChange={(e) => setBusinessIdea(e.target.value)}
                placeholder="Exemplo: Pretendo focar em produtos orgânicos, ter um delivery e talvez um pequeno café no local. O faturamento inicial estimado é de R$ 30.000/mês."
                className="min-h-[100px]"
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
          <AiAnalysisReport report={aiReport} onClose={() => setAiReport(null)} executionTime={executionTime || undefined} />
        </div>
      )}
    </div>
  );
};

export default Viabilidade;