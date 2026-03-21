import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Settings, Building, KeyRound, Bot, Trash2, Plus, Zap, 
  Code, Globe, RotateCcw, Search, FileText, ChevronDown, 
  Wrench, Play, Lock, Book, Upload, Loader2, Eraser, Info, BookOpen, Copy, Check, Download, MessageSquareQuote,
  Lightbulb, Terminal, Cpu, HelpCircle, Workflow
} from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AgentConfig, loadAgentsFromStorage, saveAgentsToStorage, PromptConfig, loadPromptsFromStorage, savePromptsToStorage, DEFAULT_PROMPTS, DEFAULT_AGENTS } from '@/lib/geminiService';
import { useAuth } from '@/contexts/AuthContext';
import { getInssTables, saveInssTables, InssTable } from '@/lib/tax/inssData';
import { getIrpfTables, saveIrpfTables, IrpfTable } from '@/lib/tax/irpfData';
import { getMinimumWages, saveMinimumWages, MinimumWageEntry } from '@/lib/tax/minimumWageData';
import { DynamicSkill, loadDynamicSkills, saveDynamicSkills, DEFAULT_DYNAMIC_SKILLS, executeSkill } from '@/lib/skills/taxSkills';
import { AgentPromptEditor } from '@/components/AgentPromptEditor';

// Importação dinâmica do PDFJS para evitar erros de build
let pdfjsLib: any = null;

const UFs = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

const Configuracao = () => {
  const { autenticado } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSkillIdForUpload, setActiveSkillIdForUpload] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isTestingSkill, setIsTestingSkill] = useState<string | null>(null);
  const [importJson, setImportJson] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importPromptJson, setImportPromptJson] = useState('');
  const [isImportPromptDialogOpen, setIsImportPromptDialogOpen] = useState(false);

  const [webhookTestUrl, setWebhookTestUrl] = useState(localStorage.getItem('jota-webhook-test') || '');
  const [webhookProdUrl, setWebhookProdUrl] = useState(localStorage.getItem('jota-webhook-prod') || '');
  const [razaoSocial, setRazaoSocial] = useState(localStorage.getItem('jota-razaoSocial') || '');
  const [cnpj, setCnpj] = useState(localStorage.getItem('jota-cnpj') || '');
  const [uf, setUf] = useState(localStorage.getItem('jota-uf') || 'SP');
  const [contadorNome, setContadorNome] = useState(localStorage.getItem('jota-contador-nome') || '');
  const [contadorCrc, setContadorCrc] = useState(localStorage.getItem('jota-contador-crc') || '');
  
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('jota-gemini-key') || '');
  const [geminiModel, setGeminiModel] = useState(localStorage.getItem('jota-gemini-model') || 'gemini-2.0-flash');
  const [enableGoogleSearch, setEnableGoogleSearch] = useState(localStorage.getItem('jota-gemini-search') === 'true');

  const [agents, setAgents] = useState<AgentConfig[]>(() => loadAgentsFromStorage());
  const [prompts, setPrompts] = useState<PromptConfig[]>(() => loadPromptsFromStorage());
  const [dynamicSkills, setDynamicSkills] = useState<DynamicSkill[]>(() => loadDynamicSkills());

  useEffect(() => {
    localStorage.setItem('jota-razaoSocial', razaoSocial);
    localStorage.setItem('jota-cnpj', cnpj);
    localStorage.setItem('jota-uf', uf);
    localStorage.setItem('jota-webhook-test', webhookTestUrl);
    localStorage.setItem('jota-webhook-prod', webhookProdUrl);
    localStorage.setItem('jota-contador-nome', contadorNome);
    localStorage.setItem('jota-contador-crc', contadorCrc);
    localStorage.setItem('jota-gemini-key', geminiKey);
    localStorage.setItem('jota-gemini-model', geminiModel);
    localStorage.setItem('jota-gemini-search', enableGoogleSearch.toString());
    
    saveAgentsToStorage(agents);
    savePromptsToStorage(prompts);
    saveDynamicSkills(dynamicSkills);
  }, [
    razaoSocial, cnpj, uf, webhookTestUrl, webhookProdUrl, 
    contadorNome, contadorCrc, geminiKey, geminiModel, 
    enableGoogleSearch, agents, prompts, dynamicSkills
  ]);

  const handleImportSkill = () => {
    try {
      const skillData = JSON.parse(importJson);
      const newSkill: DynamicSkill = { ...skillData, id: Date.now().toString(), isActive: true };
      setDynamicSkills([...dynamicSkills, newSkill]);
      setImportJson('');
      setIsImportDialogOpen(false);
      toast.success("Skill importada!");
    } catch (e: any) { toast.error("Erro no JSON"); }
  };

  const handleImportPrompt = () => {
    try {
      const promptData = JSON.parse(importPromptJson);
      const newPrompt: PromptConfig = { ...promptData, id: Date.now().toString(), isActive: true };
      setPrompts([...prompts, newPrompt]);
      setImportPromptJson('');
      setIsImportPromptDialogOpen(false);
      toast.success("Prompt importado!");
    } catch (e: any) { toast.error("Erro no JSON"); }
  };

  const handleDownloadSkill = (skill: DynamicSkill) => {
    const { id, ...exportData } = skill;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `skill_${skill.name}.json`;
    link.click();
  };

  const handleDownloadPrompt = (prompt: PromptConfig) => {
    const { id, ...exportData } = prompt;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prompt_${prompt.title.replace(/\s+/g, '_').toLowerCase()}.json`;
    link.click();
  };

  const handleTestSkill = async (skill: DynamicSkill) => {
    setIsTestingSkill(skill.id);
    try {
      const result = await executeSkill(skill.name, {}, dynamicSkills);
      if (result.error) toast.error(`Erro: ${result.error}`);
      else {
        toast.success("Teste concluído!");
        if (skill.executionType === 'web_scraping' && result.conteudo) {
          updateSkill(skill.id, 'knowledgeBaseText', result.conteudo);
        }
      }
    } catch (err: any) { toast.error(`Falha: ${err.message}`); } 
    finally { setIsTestingSkill(null); }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeSkillIdForUpload) return;
    setIsExtracting(true);
    try {
      let text = "";
      if (file.name.toLowerCase().endsWith(".pdf")) {
        if (!pdfjsLib) {
          pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        }
        const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ") + "\n";
        }
      } else { text = await file.text(); }
      updateSkill(activeSkillIdForUpload, 'knowledgeBaseText', text);
      toast.success("Conteúdo extraído!");
    } catch (error: any) { toast.error("Erro no arquivo"); } 
    finally { setIsExtracting(false); setActiveSkillIdForUpload(null); }
  };

  const updateAgent = (id: string, field: keyof AgentConfig, value: string) => {
    setAgents(agents.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const updatePrompt = (id: string, field: keyof PromptConfig, value: any) => {
    setPrompts(prompts.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const updateSkill = (id: string, field: keyof DynamicSkill, value: any) => {
    setDynamicSkills(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addPrompt = () => setPrompts([...prompts, { id: Date.now().toString(), title: 'Novo Prompt', role: 'Especialista', content: '', isActive: true }]);
  const addSkill = () => setDynamicSkills([...dynamicSkills, { id: Date.now().toString(), name: 'nova_skill', description: 'Descrição', parameters: { type: 'object', properties: {} }, executionType: 'local_js', isActive: true, jsCode: 'return { status: "ok" };' }]);

  return (
    <div className="container mx-auto px-4 py-8">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Settings className="h-6 w-6 text-primary" />Configurações do Sistema</CardTitle>
          <Button variant="outline" size="sm" onClick={() => { if (confirm("Restaurar padrão?")) { setAgents(DEFAULT_AGENTS); setPrompts(DEFAULT_PROMPTS); setDynamicSkills(DEFAULT_DYNAMIC_SKILLS); } }}>
            <RotateCcw className="h-3 w-3 mr-1" /> Restaurar Padrão
          </Button>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* 1. DADOS DA EMPRESA E CONTADOR */}
          <div className="space-y-6 rounded-lg border border-border p-4">
             <h3 className="text-lg font-semibold flex items-center gap-2"><Building className="h-5 w-5 text-muted-foreground" />Identificação e Responsabilidade</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="space-y-2"><Label>Razão Social</Label><Input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} /></div>
               <div className="space-y-2"><Label>CNPJ</Label><Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} /></div>
               <div className="space-y-2"><Label>Estado (UF)</Label><Select value={uf} onValueChange={setUf}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UFs.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
               <div className="space-y-2"><Label>Contador Responsável</Label><Input value={contadorNome} onChange={(e) => setContadorNome(e.target.value)} placeholder="Nome completo" /></div>
               <div className="space-y-2"><Label>CRC do Contador</Label><Input value={contadorCrc} onChange={(e) => setContadorCrc(e.target.value)} placeholder="Ex: PA-000000/O" /></div>
             </div>
          </div>

          {/* 2. WEBHOOKS GLOBAIS */}
          <div className="space-y-4 rounded-lg border border-orange-500/20 p-4 bg-orange-500/5">
             <h3 className="text-lg font-semibold flex items-center gap-2 text-orange-600"><Globe className="h-5 w-5" />Webhooks de Integração (n8n)</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2"><Label>Webhook Ambiente TESTE</Label><Input value={webhookTestUrl} onChange={(e) => setWebhookTestUrl(e.target.value)} placeholder="https://n8n.seu-servidor.com/webhook-test/..." /></div>
               <div className="space-y-2"><Label>Webhook Ambiente PRODUÇÃO</Label><Input value={webhookProdUrl} onChange={(e) => setWebhookProdUrl(e.target.value)} placeholder="https://n8n.seu-servidor.com/webhook/..." /></div>
             </div>
          </div>

          {autenticado ? (
            <>
              {/* 3. BIBLIOTECA DE PROMPTS */}
              <div className="space-y-4 rounded-lg border border-indigo-500/30 p-4 bg-indigo-500/5">
                 <div className="flex items-center justify-between">
                   <div className="space-y-1">
                     <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-600"><MessageSquareQuote className="h-5 w-5" />Biblioteca de Prompts</h3>
                     <p className="text-xs text-indigo-700/70">Gerencie os cérebros e personas da sua IA.</p>
                   </div>
                   <div className="flex gap-2">
                     <Button type="button" size="sm" variant="outline" className="border-indigo-200 text-indigo-600" onClick={() => setIsImportPromptDialogOpen(true)}><Download className="h-4 w-4 mr-2" /> Importar</Button>
                     <Button type="button" size="sm" variant="outline" className="border-indigo-200 text-indigo-600" onClick={addPrompt}><Plus className="h-4 w-4 mr-2" /> Novo Prompt</Button>
                   </div>
                 </div>

                 <div className="space-y-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full border-indigo-500/30 text-indigo-600 hover:bg-indigo-500/10">
                          <BookOpen className="h-4 w-4 mr-2" /> Manual Técnico: Dicionário de Dados para Prompts
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-indigo-600"><Terminal className="h-5 w-5" /> Manual Técnico: Dicionário de Dados para Prompts</DialogTitle>
                          <DialogDescription>Lista completa de caminhos JSON que você pode usar para instruir a IA.</DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-8 py-4">
                          <section className="space-y-3">
                            <h4 className="font-bold text-sm border-b border-indigo-100 pb-1 text-indigo-700 uppercase tracking-wider">1. DADOS DA EMPRESA (OBJETO: EMPRESA)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-[11px]">
                              <div className="flex justify-between border-b border-muted py-1"><code>empresa.razaoSocial</code> <span className="text-muted-foreground italic">Nome da empresa</span></div>
                              <div className="flex justify-between border-b border-muted py-1"><code>empresa.naturezaJuridica</code> <span className="text-muted-foreground italic">SLU, LTDA, EI...</span></div>
                              <div className="flex justify-between border-b border-muted py-1"><code>empresa.classificacaoFiscal</code> <span className="text-muted-foreground italic">ME ou EPP</span></div>
                              <div className="flex justify-between border-b border-muted py-1"><code>empresa.capitalSocial</code> <span className="text-muted-foreground italic">Valor em R$</span></div>
                              <div className="flex justify-between border-b border-muted py-1"><code>empresa.numSocios</code> <span className="text-muted-foreground italic">Quantidade</span></div>
                              <div className="flex justify-between border-b border-muted py-1"><code>empresa.localizacao.municipio</code> <span className="text-muted-foreground italic">Cidade</span></div>
                              <div className="flex justify-between border-b border-muted py-1"><code>empresa.localizacao.estado</code> <span className="text-muted-foreground italic">UF (ex: PA)</span></div>
                              <div className="flex justify-between border-b border-muted py-1"><code>empresa.tributacaoPretendida</code> <span className="text-muted-foreground italic">Regime escolhido</span></div>
                            </div>
                          </section>

                          <section className="space-y-3">
                            <h4 className="font-bold text-sm border-b border-indigo-100 pb-1 text-indigo-700 uppercase tracking-wider">2. OPERACIONAL E CNAES (OBJETO: OPERACIONAL)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-[11px]">
                              <div className="flex justify-between border-b border-muted py-1"><code>operacional.cnaes</code> <span className="text-muted-foreground italic">Lista de objetos CNAE</span></div>
                              <div className="flex justify-between border-b border-muted py-1"><code>operacional.descricaoAtividades</code> <span className="text-muted-foreground italic">Texto livre</span></div>
                              <div className="flex justify-between border-b border-muted py-1"><code>operacional.percentual_comercio_industria_servico.comercio</code> <span className="text-muted-foreground italic">% de Comércio</span></div>
                              <div className="flex justify-between border-b border-muted py-1"><code>operacional.percentual_comercio_industria_servico.servico</code> <span className="text-muted-foreground italic">% de Serviço</span></div>
                            </div>
                          </section>

                          <section className="space-y-3">
                            <h4 className="font-bold text-sm border-b border-indigo-100 pb-1 text-indigo-700 uppercase tracking-wider">3. FINANCEIRO E FATOR R (OBJETO: FINANCEIRO)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-[11px]">
                              <div className="flex justify-between border-b border-muted py-1"><code>financeiro.faturamento.anual_total</code> <span className="text-muted-foreground italic">Receita Bruta Anual</span></div>
                              <div className="flex justify-between border-b border-muted py-1"><code>financeiro.faturamento.mensal_medio</code> <span className="text-muted-foreground italic">Média mensal</span></div>
                              <div className="flex justify-between border-b border-muted py-1"><code>financeiro.custos_operacionais.fixos_mensais</code> <span className="text-muted-foreground italic">Despesas fixas</span></div>
                              <div className="flex justify-between border-b border-muted py-1"><code>financeiro.fator_r.folha_12_meses</code> <span className="text-muted-foreground italic">Soma folha 1 ano</span></div>
                              <div className="flex justify-between border-b border-muted py-1"><code>financeiro.fator_r.percentual_atual</code> <span className="text-muted-foreground italic">Relação Folha/Fat</span></div>
                            </div>
                          </section>

                          <section className="space-y-3">
                            <h4 className="font-bold text-sm border-b border-indigo-100 pb-1 text-indigo-700 uppercase tracking-wider">4. SOCIETÁRIO E TRABALHISTA (OBJETO: SOCIETARIO_TRABALHISTA)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-[11px]">
                              <div className="flex justify-between border-b border-muted py-1"><code>societario_trabalhista.quadro_pessoal.num_funcionarios</code> <span className="text-muted-foreground italic">Qtd funcionários</span></div>
                              <div className="flex justify-between border-b border-muted py-1"><code>societario_trabalhista.pro_labore.valor_declarado</code> <span className="text-muted-foreground italic">Valor do Pró-labore</span></div>
                              <div className="flex justify-between border-b border-muted py-1"><code>societario_trabalhista.pro_labore.declara_prolabore</code> <span className="text-muted-foreground italic">Booleano (true/false)</span></div>
                              <div className="flex justify-between border-b border-muted py-1"><code>societario_trabalhista.retira_valores_pf</code> <span className="text-muted-foreground italic">Booleano</span></div>
                            </div>
                          </section>

                          <section className="space-y-3">
                            <h4 className="font-bold text-sm border-b border-indigo-100 pb-1 text-indigo-700 uppercase tracking-wider">5. CONFORMIDADE E RISCOS (OBJETO: CONFORMIDADE_RISCOS)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-[11px]">
                              <div className="flex justify-between border-b border-muted py-1"><code>conformidade_riscos.alertas_criticos.confusao_patrimonial</code> <span className="text-muted-foreground italic">Risco de mistura PF/PJ</span></div>
                              <div className="flex justify-between border-b border-muted py-1"><code>conformidade_riscos.alertas_criticos.retirada_informal</code> <span className="text-muted-foreground italic">Risco fiscal retirada</span></div>
                              <div className="flex justify-between border-b border-muted py-1"><code>conformidade_riscos.alertas_criticos.risco_previdenciario</code> <span className="text-muted-foreground italic">Risco falta de INSS</span></div>
                            </div>
                          </section>

                          <section className="space-y-3 pt-4">
                            <h4 className="font-bold text-sm text-orange-600 flex items-center gap-2"><Lightbulb className="h-4 w-4" /> Exemplo de Instrução no Prompt</h4>
                            <div className="bg-slate-950 p-4 rounded-lg border border-indigo-900/50">
                              <p className="text-[11px] text-indigo-300 font-mono leading-relaxed">
                                "Analise o campo <span className="text-white font-bold">financeiro.fator_r.percentual_atual</span>. <br/>
                                Se o valor for menor que 28, alerte o usuário que ele está no Anexo V do Simples Nacional. <br/>
                                Sugira aumentar o <span className="text-white font-bold">societario_trabalhista.pro_labore.valor_declarado</span> para atingir a economia do Anexo III."
                              </p>
                            </div>
                          </section>
                        </div>
                      </DialogContent>
                    </Dialog>
                 </div>

                 <Accordion type="multiple" className="w-full space-y-2">
                   {prompts.map((prompt) => (
                     <AccordionItem key={prompt.id} value={prompt.id} className="border rounded-md bg-background px-4">
                       <AccordionTrigger className="hover:no-underline py-3">
                         <div className="flex items-center gap-3">
                           <div className={prompt.isActive ? "text-indigo-500" : "text-muted-foreground"}><Bot className="h-4 w-4" /></div>
                           <span className="font-bold text-sm">{prompt.title}</span>
                           <Badge variant="outline" className="text-[10px] opacity-70">{prompt.role}</Badge>
                         </div>
                       </AccordionTrigger>
                       <AccordionContent className="pt-2 pb-4 space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2"><Label>Título</Label><Input value={prompt.title} onChange={e => updatePrompt(prompt.id, 'title', e.target.value)} /></div>
                           <div className="space-y-2"><Label>Persona</Label><Input value={prompt.role} onChange={e => updatePrompt(prompt.id, 'role', e.target.value)} /></div>
                         </div>
                         <div className="space-y-2">
                           <Label className="text-indigo-600">Instruções de Sistema</Label>
                           <Textarea className="font-mono text-[11px] h-64 bg-slate-950 text-indigo-300 border-indigo-900/50" value={prompt.content} onChange={e => updatePrompt(prompt.id, 'content', e.target.value)} />
                         </div>
                         <div className="flex justify-between items-center pt-2 border-t border-border/50">
                           <div className="flex items-center gap-2"><Switch checked={prompt.isActive} onCheckedChange={v => updatePrompt(prompt.id, 'isActive', v)} /><Label>Ativo</Label></div>
                           <div className="flex gap-2">
                             <Button type="button" variant="outline" size="sm" className="text-blue-600 border-blue-200" onClick={() => handleDownloadPrompt(prompt)}><Download className="h-4 w-4 mr-2" /> Exportar</Button>
                             <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setPrompts(prompts.filter(p => p.id !== prompt.id))}><Trash2 className="h-4 w-4 mr-2" /> Remover</Button>
                           </div>
                         </div>
                       </AccordionContent>
                     </AccordionItem>
                   ))}
                 </Accordion>
              </div>

              {/* 4. SKILLS E FERRAMENTAS */}
              <div className="space-y-4 rounded-lg border border-emerald-500/30 p-4 bg-emerald-500/5">
                 <div className="flex items-center justify-between">
                   <div className="space-y-1">
                     <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-600"><Wrench className="h-5 w-5" />Skills e Ferramentas</h3>
                     <p className="text-xs text-emerald-700/70">Crie ferramentas de consulta ou importe arquivos.</p>
                   </div>
                   <div className="flex gap-2">
                     <Button type="button" size="sm" variant="outline" className="border-emerald-200 text-emerald-600" onClick={() => setIsImportDialogOpen(true)}><Download className="h-4 w-4 mr-2" /> Importar</Button>
                     <Button type="button" size="sm" variant="outline" className="border-emerald-200 text-emerald-600" onClick={addSkill}><Plus className="h-4 w-4 mr-2" /> Nova Skill</Button>
                   </div>
                 </div>

                 <div className="space-y-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">
                          <BookOpen className="h-4 w-4 mr-2" /> Manual Técnico de Desenvolvimento de Skills
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-emerald-600"><Terminal className="h-5 w-5" /> Manual Técnico de Desenvolvimento de Skills</DialogTitle>
                          <DialogDescription>Guia completo para estruturar JSON, seletores de Web Scraping e lógica JavaScript.</DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6 py-4">
                          <section className="space-y-2">
                            <h4 className="font-bold text-sm border-b pb-1">1. Estrutura do Parâmetro JSON (Schema)</h4>
                            <p className="text-xs text-muted-foreground">Define quais dados a IA deve coletar do usuário antes de chamar a skill.</p>
                            <pre className="bg-slate-950 text-blue-300 p-3 rounded-md text-[10px] font-mono overflow-x-auto">
{`// Exemplo: Skill de Consulta de NCM
{
  "type": "object",
  "properties": {
    "ncm": { 
      "type": "string", 
      "description": "Código NCM (8 dígitos) para consulta de alíquotas" 
    },
    "ano": { 
      "type": "number", 
      "description": "Ano base do cálculo (ex: 2025)" 
    }
  },
  "required": ["ncm"]
}`}
                            </pre>
                          </section>

                          <section className="space-y-2">
                            <h4 className="font-bold text-sm border-b pb-1">2. Web Scraping (Tags e Seletores)</h4>
                            <p className="text-xs text-muted-foreground">Use seletores CSS para extrair dados de sites públicos. Exemplos comuns:</p>
                            <ul className="list-disc pl-4 space-y-1 text-[11px]">
                              <li><code className="bg-muted px-1">article</code>: Captura o conteúdo principal de blogs e notícias.</li>
                              <li><code className="bg-muted px-1">.conteudo-post</code>: Captura classes específicas de texto em portais WordPress.</li>
                              <li><code className="bg-muted px-1">table.tabela-taxas</code>: Captura tabelas de dados técnicos específicos.</li>
                              <li><code className="bg-muted px-1">#main-content</code>: Captura o ID principal da página (comum em sites institucionais).</li>
                              <li><code className="bg-muted px-1">#parent-fieldname-text</code>: Seletor padrão para o corpo de leis no portal do **Planalto**.</li>
                              <li><code className="bg-muted px-1">#content-core</code>: Seletor de conteúdo central em portais do **Governo Federal**.</li>
                            </ul>
                          </section>

                          <section className="space-y-2">
                            <h4 className="font-bold text-sm border-b pb-1 text-blue-600">3. Placeholders Dinâmicos ({{var}})</h4>
                            <p className="text-xs text-muted-foreground">Você pode tornar a URL da Skill dinâmica usando os parâmetros definidos no JSON.</p>
                            <div className="bg-slate-950 p-3 rounded-md border border-blue-900/50">
                              <p className="text-[10px] text-blue-300 font-mono leading-relaxed">
                                URL: <span className="text-white">https://site.com/consulta?codigo=</span><span className="text-yellow-400 font-bold">{"{{ncm}}"}</span><br/>
                                <br/>
                                No JSON de parâmetros, defina a propriedade "ncm". A IA preencherá o valor automaticamente antes de acessar o site.
                              </p>
                            </div>
                          </section>

                          <section className="space-y-2">
                            <h4 className="font-bold text-sm border-b pb-1">4. Contexto de Execução JavaScript</h4>
                            <p className="text-xs text-muted-foreground">Seu código roda em um ambiente isolado com acesso a:</p>
                            <ul className="list-disc pl-4 space-y-1 text-[11px]">
                              <li><strong>args:</strong> Objeto com os valores preenchidos pela IA (ex: <code className="bg-muted px-1">args.ncm</code>).</li>
                              <li><strong>helpers:</strong> Funções internas (ex: <code className="bg-muted px-1">calculateSimplesNacionalEffectiveRate</code>).</li>
                              <li><strong>fetch:</strong> Para chamadas de API externas (ViaCEP, APIs de tributos, etc).</li>
                            </ul>
                            <pre className="bg-slate-950 text-emerald-400 p-3 rounded-md text-[10px] font-mono overflow-x-auto">
{`// Exemplo: Cálculo de Pró-labore Líquido
const bruto = args.valor_bruto;
const inss = bruto * 0.11;
const baseIR = bruto - inss;
// ... lógica de cálculo de IR ...
return { 
  status: "sucesso", 
  bruto: bruto, 
  inss: inss, 
  liquido: bruto - inss - ir 
};`}
                            </pre>
                          </section>

                          <section className="space-y-2">
                            <h4 className="font-bold text-sm border-b pb-1">5. Estrutura JSON para Importação/Exportação</h4>
                            <p className="text-xs text-muted-foreground">Use este formato para compartilhar ou fazer backup de suas ferramentas completas:</p>
                            <pre className="bg-slate-950 text-orange-300 p-3 rounded-md text-[10px] font-mono overflow-x-auto">
{`{
  "name": "calculadora_irpf_2026",
  "description": "Calcula o IR sobre o pró-labore conforme Lei 15.270/2025",
  "parameters": { 
    "type": "object", 
    "properties": { "valor_bruto": { "type": "number" } },
    "required": ["valor_bruto"]
  },
  "executionType": "local_js",
  "jsCode": "const bruto = args.valor_bruto; ... return { liquido: x };",
  "isActive": true
}`}
                            </pre>
                          </section>

                          <section className="space-y-2">
                            <h4 className="font-bold text-sm border-b pb-1 text-emerald-600">6. Instrução Sugerida para o Agente</h4>
                            <p className="text-xs text-muted-foreground">Este texto orienta a IA sobre como e quando utilizar a ferramenta. É o que será inserido no Agente ao usar o atalho #.</p>
                            <div className="bg-slate-950 p-3 rounded-md border border-emerald-900/50">
                              <p className="text-[11px] text-emerald-300 font-mono leading-relaxed">
                                "Você tem acesso à ferramenta #comparar_regimes_tributarios. Utilize-a obrigatoriamente para realizar simulações matemáticas precisas entre Simples Nacional e Lucro Presumido, garantindo que os valores em R$ sejam exatos e baseados no faturamento informado."
                              </p>
                            </div>
                          </section>
                        </div>
                      </DialogContent>
                    </Dialog>
                 </div>

                 <Accordion type="multiple" className="w-full space-y-2">
                   {dynamicSkills.map((skill) => (
                     <AccordionItem key={skill.id} value={skill.id} className="border rounded-md bg-background px-4">
                       <AccordionTrigger className="hover:no-underline py-3">
                         <div className="flex items-center gap-3">
                           <div className={skill.isActive ? "text-emerald-500" : "text-muted-foreground"}>
                             {skill.executionType === 'webhook' ? <Globe className="h-4 w-4" /> : skill.executionType === 'local_js' ? <Code className="h-4 w-4" /> : skill.executionType === 'web_scraping' ? <Search className="h-4 w-4" /> : <Book className="h-4 w-4" />}
                           </div>
                           <span className="font-bold text-sm">{skill.name}</span>
                         </div>
                       </AccordionTrigger>
                       <AccordionContent className="pt-2 pb-4 space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div className="space-y-2"><Label>Nome Técnico</Label><Input value={skill.name} onChange={e => updateSkill(skill.id, 'name', e.target.value)} /></div>
                           <div className="space-y-2">
                             <Label>Tipo de Execução</Label>
                             <Select value={skill.executionType} onValueChange={v => updateSkill(skill.id, 'executionType', v)}>
                               <SelectTrigger><SelectValue /></SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="local_js">JavaScript Local</SelectItem>
                                 <SelectItem value="webhook">Webhook (n8n)</SelectItem>
                                 <SelectItem value="knowledge_base">Base de Conhecimento</SelectItem>
                                 <SelectItem value="web_scraping">Navegação Web</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                           <div className="flex items-center gap-2 pt-6"><Switch checked={skill.isActive} onCheckedChange={v => updateSkill(skill.id, 'isActive', v)} /><Label>Ativa</Label></div>
                         </div>

                         <div className="space-y-2"><Label>Descrição para a IA</Label><Input value={skill.description} onChange={e => updateSkill(skill.id, 'description', e.target.value)} /></div>

                         <div className="space-y-2">
                           <Label className="text-emerald-600">Instrução Sugerida para o Agente</Label>
                           <Textarea 
                             placeholder="Ex: Você tem acesso à ferramenta #nome_da_skill. Utilize-a para..."
                             value={skill.suggestedInstruction || ''} 
                             onChange={e => updateSkill(skill.id, 'suggestedInstruction', e.target.value)}
                             className="text-xs h-20"
                           />
                         </div>

                         {skill.executionType === 'knowledge_base' ? (
                           <div className="space-y-3">
                             <div className="flex items-center justify-between">
                               <Label className="flex items-center gap-2 text-blue-600"><Book className="h-3 w-3" /> Conteúdo da Base</Label>
                               <div className="flex gap-2">
                                 <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] border-blue-200 text-blue-600" onClick={() => { setActiveSkillIdForUpload(skill.id); fileInputRef.current?.click(); }} disabled={isExtracting}>{isExtracting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />} Importar Arquivo</Button>
                               </div>
                             </div>
                             <Textarea className="font-sans text-xs h-64 bg-slate-950 text-blue-300 border-blue-900/50" value={skill.knowledgeBaseText || ''} onChange={e => updateSkill(skill.id, 'knowledgeBaseText', e.target.value)} />
                           </div>
                         ) : (
                           <div className="space-y-4">
                             {skill.executionType === 'web_scraping' && (
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border rounded-md bg-blue-500/5 border-blue-500/20">
                                 <div className="space-y-2">
                                   <Label className="text-blue-600 flex items-center gap-2"><Globe className="h-3 w-3" /> URL do Site</Label>
                                   <Input 
                                     placeholder="https://www.nfe.fazenda.gov.br/..." 
                                     value={skill.url || ''} 
                                     onChange={e => updateSkill(skill.id, 'url', e.target.value)} 
                                   />
                                 </div>
                                 <div className="space-y-2">
                                   <Label className="text-blue-600 flex items-center gap-2"><Search className="h-3 w-3" /> Seletor CSS (Opcional)</Label>
                                   <Input 
                                     placeholder="article, #main-content, .texto-lei" 
                                     value={skill.selector || ''} 
                                     onChange={e => updateSkill(skill.id, 'selector', e.target.value)} 
                                   />
                                 </div>
                               </div>
                             )}
                             
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                               <div className="space-y-2"><Label>Parâmetros JSON</Label><Textarea className="font-mono text-[10px] h-48 bg-slate-900 text-blue-300" value={typeof skill.parameters === 'string' ? skill.parameters : JSON.stringify(skill.parameters, null, 2)} onChange={e => { try { updateSkill(skill.id, 'parameters', JSON.parse(e.target.value)); } catch (err) { updateSkill(skill.id, 'parameters', e.target.value); } }} /></div>
                               {skill.executionType === 'local_js' && <div className="space-y-2"><Label className="text-emerald-600">Código JavaScript</Label><Textarea className="font-mono text-[11px] h-48 bg-slate-950 text-emerald-400" value={skill.jsCode || ''} onChange={e => updateSkill(skill.id, 'jsCode', e.target.value)} /></div>}
                             </div>
                           </div>
                         )}
                         <div className="flex justify-between items-center pt-2 border-t border-border/50">
                           <div className="flex gap-2">
                             <Button type="button" variant="outline" size="sm" className="text-emerald-600 border-emerald-200" onClick={() => handleTestSkill(skill)} disabled={isTestingSkill === skill.id}>{isTestingSkill === skill.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />} Testar Skill</Button>
                             <Button type="button" variant="outline" size="sm" className="text-blue-600 border-blue-200" onClick={() => handleDownloadSkill(skill)}><Download className="h-4 w-4 mr-2" /> Exportar</Button>
                             <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setDynamicSkills(dynamicSkills.filter(s => s.id !== skill.id))}><Trash2 className="h-4 w-4 mr-2" /> Remover</Button>
                           </div>
                         </div>
                       </AccordionContent>
                     </AccordionItem>
                   ))}
                 </Accordion>
              </div>

              {/* 5. AGENTES ESPECIALISTAS */}
              <div className="space-y-4 rounded-lg border border-primary/30 p-4 bg-primary/5">
                 <div className="flex items-center justify-between">
                   <div className="space-y-1">
                     <h3 className="text-lg font-bold flex items-center gap-2 text-primary"><Zap className="h-5 w-5" />Agentes Especialistas (Timeline)</h3>
                     <p className="text-xs text-primary/70">Configure a sequência de inteligência autônoma.</p>
                   </div>
                   <div className="flex gap-2">
                     <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
                            <Workflow className="h-4 w-4 mr-2" /> Manual de Agentes Autônomos
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-primary"><Cpu className="h-5 w-5" /> Manual de Engenharia de Agentes Autônomos</DialogTitle>
                            <DialogDescription>Como criar inteligências que utilizam ferramentas e dados dinâmicos.</DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-8 py-4">
                            <section className="space-y-3">
                              <h4 className="font-bold text-sm border-b border-primary/10 pb-1 text-primary uppercase tracking-wider">1. O CONCEITO DE AGENTE AUTÔNOMO</h4>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                Um Agente Autônomo não é apenas um prompt de texto. Ele é a combinação de:
                              </p>
                              <ul className="list-disc pl-4 space-y-2 text-[11px]">
                                <li><strong>Persona (Role):</strong> Quem a IA finge ser (ex: Perito Tributário).</li>
                                <li><strong>Contexto (@):</strong> Dados reais da empresa injetados no prompt.</li>
                                <li><strong>Skills (#):</strong> Ferramentas que a IA decide usar para obter dados externos ou fazer cálculos.</li>
                              </ul>
                            </section>

                            <section className="space-y-3">
                              <h4 className="font-bold text-sm border-b border-primary/10 pb-1 text-primary uppercase tracking-wider">2. VINCULANDO SKILLS (O GATILHO #)</h4>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                No editor de prompt do Agente, use o atalho <span className="font-bold text-primary">#</span> para listar suas Skills.
                                Ao selecionar uma, o sistema insere a <strong>Instrução Sugerida</strong> daquela ferramenta.
                              </p>
                              <div className="bg-slate-950 p-3 rounded-md border border-primary/20">
                                <p className="text-[10px] text-primary font-mono">
                                  "Você tem acesso à ferramenta <span className="text-white">#consultar_portal_nfe</span>. <br/>
                                  Sempre que o usuário perguntar sobre legislação, use-a para validar se há mudanças."
                                </p>
                              </div>
                            </section>

                            <section className="space-y-3">
                              <h4 className="font-bold text-sm border-b border-primary/10 pb-1 text-primary uppercase tracking-wider">3. INJETANDO DADOS (O GATILHO @)</h4>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                Use o atalho <span className="font-bold text-primary">@</span> para inserir variáveis de contexto. 
                                Isso permite que o Agente saiba exatamente de qual empresa está falando sem que você precise digitar.
                              </p>
                              <div className="bg-slate-950 p-3 rounded-md border border-primary/20">
                                <p className="text-[10px] text-primary font-mono">
                                  "Analise a viabilidade da empresa <span className="text-white">@empresa.razaoSocial</span> <br/>
                                  localizada em <span className="text-white">@empresa.localizacao.municipio</span>."
                                </p>
                              </div>
                            </section>

                            <section className="space-y-3">
                              <h4 className="font-bold text-sm border-b border-primary/10 pb-1 text-primary uppercase tracking-wider">4. FLUXO DE EXECUÇÃO (TIMELINE)</h4>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                Os agentes rodam em sequência (Ordem 1, 2, 3...). <br/>
                                <strong>Importante:</strong> O Agente 2 recebe o relatório gerado pelo Agente 1 como contexto adicional. 
                                Isso permite criar cadeias de pensamento:
                              </p>
                              <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                                <li><strong>Agente 1:</strong> Coleta dados e faz o cálculo matemático.</li>
                                <li><strong>Agente 2:</strong> Lê o cálculo do Agente 1 e faz a análise jurídica.</li>
                                <li><strong>Agente 3:</strong> Consolida tudo em um parecer final para o cliente.</li>
                              </ol>
                            </section>

                            <section className="space-y-3 pt-4">
                              <h4 className="font-bold text-sm text-orange-600 flex items-center gap-2"><Lightbulb className="h-4 w-4" /> Dica de Ouro: Autonomia Real</h4>
                              <p className="text-xs text-muted-foreground italic">
                                "Não diga à IA para 'fazer o cálculo'. Diga: 'Se você identificar que o faturamento é alto, use a skill #comparar_regimes para validar a melhor opção'. Isso dá autonomia de decisão ao Agente."
                              </p>
                            </section>
                          </div>
                        </DialogContent>
                      </Dialog>
                     <Button type="button" size="sm" onClick={() => setAgents([...agents, { id: Date.now().toString(), nome: 'Novo Agente', systemPrompt: '', order: agents.length + 1 }])}><Plus className="h-4 w-4 mr-2" /> Novo Agente</Button>
                   </div>
                 </div>

                 <Accordion type="multiple" className="w-full space-y-2">
                   {agents.sort((a,b) => (a.order||0)-(b.order||0)).map((agent) => (
                     <AccordionItem key={agent.id} value={agent.id} className="border rounded-md bg-background px-4">
                       <AccordionTrigger className="hover:no-underline py-3"><div className="flex items-center gap-3"><Badge variant="outline" className="font-mono">{agent.order}</Badge><span className="font-bold text-sm">{agent.nome}</span></div></AccordionTrigger>
                       <AccordionContent className="pt-2 pb-4 space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2"><Label>Nome</Label><Input value={agent.nome} onChange={e => updateAgent(agent.id, 'nome', e.target.value)} /></div>
                           <div className="space-y-2"><Label>Webhook n8n</Label><Input placeholder="https://..." value={agent.webhookUrl || ''} onChange={e => updateAgent(agent.id, 'webhookUrl', e.target.value)} /></div>
                         </div>
                         <div className="space-y-2">
                           <Label>System Prompt</Label>
                           <AgentPromptEditor 
                             value={agent.systemPrompt} 
                             onChange={(val) => updateAgent(agent.id, 'systemPrompt', val)}
                             prompts={prompts}
                             skills={dynamicSkills}
                           />
                         </div>
                         <div className="flex justify-end"><Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setAgents(agents.filter(a => a.id !== agent.id))}><Trash2 className="h-4 w-4 mr-2" /> Remover</Button></div>
                       </AccordionContent>
                     </AccordionItem>
                   ))}
                 </Accordion>
              </div>

              {/* 6. IA LOCAL */}
              <div className="space-y-4 rounded-lg border border-border p-4 bg-blue-50/5">
                 <h3 className="text-lg font-semibold flex items-center gap-2"><KeyRound className="h-5 w-5 text-blue-500" />Configurações da IA Local</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <div className="space-y-2"><Label>Gemini API Key</Label><Input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} /></div>
                   <div className="space-y-2">
                     <Label>Modelo</Label>
                     <Select value={geminiModel} onValueChange={setGeminiModel}>
                       <SelectTrigger><SelectValue /></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro</SelectItem>
                         <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                         <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2">
                     <Label className="flex items-center gap-2"><Search className="h-4 w-4 text-blue-500" /> Grounding</Label>
                     <div className="flex items-center justify-between p-2 border border-blue-500/30 rounded bg-blue-500/10">
                       <span className="text-xs text-blue-800">Pesquisa na internet</span>
                       <Switch checked={enableGoogleSearch} onCheckedChange={setEnableGoogleSearch} />
                     </div>
                   </div>
                 </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
              <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-bold">Acesso Restrito</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">As configurações avançadas de IA estão protegidas.</p>
            </div>
          )}

          <div className="pt-6 border-t border-border">
            <Button type="button" size="lg" className="w-full sm:w-auto" onClick={() => toast.success("Configurações salvas!")}>Confirmar e Sair</Button>
          </div>
        </CardContent>
      </Card>

      {/* DIALOGS DE IMPORTAÇÃO */}
      <Dialog open={isImportPromptDialogOpen} onOpenChange={setIsImportPromptDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Importar Prompt</DialogTitle><DialogDescription>Cole o JSON do prompt.</DialogDescription></DialogHeader>
          <Textarea className="font-mono text-xs h-64 bg-slate-950 text-indigo-300" value={importPromptJson} onChange={e => setImportPromptJson(e.target.value)} />
          <DialogFooter><Button onClick={handleImportPrompt}>Importar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Importar Skill</DialogTitle><DialogDescription>Cole o JSON da skill.</DialogDescription></DialogHeader>
          <Textarea className="font-mono text-xs h-64 bg-slate-950 text-emerald-300" value={importJson} onChange={e => setImportJson(e.target.value)} />
          <DialogFooter><Button onClick={handleImportSkill}>Importar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Configuracao;