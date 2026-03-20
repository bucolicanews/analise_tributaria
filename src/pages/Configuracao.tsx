import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Settings, Building, KeyRound, Bot, Trash2, Plus, Zap, 
  Code, Globe, RotateCcw, Search, FileText, ChevronDown, 
  Wrench, Play, Lock, Book, Upload, Loader2, Eraser, Info, BookOpen, Copy, Check, Download, MessageSquareQuote,
  Lightbulb, Terminal, Cpu, HelpCircle
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
import { PromptSystemEditor } from '@/components/PromptSystemEditor';
import { AgentPromptEditor } from '@/components/AgentPromptEditor';

import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

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

  const handleManualCleanNoise = (id: string) => {
    const skill = dynamicSkills.find(s => s.id === id);
    if (!skill || !skill.knowledgeBaseText) return;
    
    const cleaned = skill.knowledgeBaseText
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '')
      .trim();
      
    updateSkill(id, 'knowledgeBaseText', cleaned);
    toast.success("Ruídos removidos!");
  };

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
             <p className="text-[10px] text-muted-foreground italic">Estes webhooks são usados pelos botões de "Auditoria IA" e "Diagnóstico Oficial".</p>
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

                 <Accordion type="multiple" className="w-full space-y-2">
                   {prompts.map((prompt) => (
                     <AccordionItem key={prompt.id} value={prompt.id} className="border rounded-md bg-background px-4 !overflow-visible">
                       <AccordionTrigger className="hover:no-underline py-3">
                         <div className="flex items-center gap-3">
                           <div className={prompt.isActive ? "text-indigo-500" : "text-muted-foreground"}><Bot className="h-4 w-4" /></div>
                           <span className="font-bold text-sm">{prompt.title}</span>
                           <Badge variant="outline" className="text-[10px] opacity-70">{prompt.role}</Badge>
                         </div>
                       </AccordionTrigger>
                       <AccordionContent className="pt-2 pb-4 space-y-4 !overflow-visible">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2"><Label>Título</Label><Input value={prompt.title} onChange={e => updatePrompt(prompt.id, 'title', e.target.value)} /></div>
                           <div className="space-y-2"><Label>Persona</Label><Input value={prompt.role} onChange={e => updatePrompt(prompt.id, 'role', e.target.value)} /></div>
                         </div>
                         <div className="space-y-2">
                           <Label className="text-indigo-600">Instruções de Sistema</Label>
                           <PromptSystemEditor 
                             value={prompt.content} 
                             onChange={v => updatePrompt(prompt.id, 'content', v)} 
                           />
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
                     <Dialog>
                       <DialogTrigger asChild>
                         <Button type="button" size="sm" variant="outline" className="border-orange-200 text-orange-600 bg-orange-50/50 hover:bg-orange-50">
                           <HelpCircle className="h-4 w-4 mr-2" /> Instruções
                         </Button>
                       </DialogTrigger>
                       <DialogContent className="max-w-2xl">
                         <DialogHeader>
                           <DialogTitle className="flex items-center gap-2 text-orange-600">
                             <Lightbulb className="h-5 w-5" /> Guia de Treinamento de Skills
                           </DialogTitle>
                           <DialogDescription>
                             Aprenda a usar o campo "Instrução de Uso (Prompt)" para ensinar seus Agentes.
                           </DialogDescription>
                         </DialogHeader>
                         <div className="space-y-4 py-4">
                           <div className="p-4 rounded-lg bg-muted/50 border border-border">
                             <h4 className="font-bold text-sm mb-2">O que é a Instrução de Uso?</h4>
                             <p className="text-xs text-muted-foreground leading-relaxed">
                               É o "manual" que a IA lê para saber que esta ferramenta existe. Sem uma boa instrução, a IA pode ignorar a Skill mesmo que ela seja necessária.
                             </p>
                           </div>
                           
                           <div className="space-y-2">
                             <h4 className="font-bold text-sm">Modelo Sugerido:</h4>
                             <div className="p-3 rounded bg-slate-950 font-mono text-[10px] text-emerald-400 border border-emerald-900/50">
                               "Você tem acesso à ferramenta #nome_da_skill. Utilize-a obrigatoriamente sempre que [CONDIÇÃO]. Ela serve para [OBJETIVO] e retorna [RESULTADO]."
                             </div>
                           </div>

                           <div className="space-y-2">
                             <h4 className="font-bold text-sm">Exemplo Prático:</h4>
                             <div className="p-3 rounded bg-slate-950 font-mono text-[10px] text-blue-300 border border-blue-900/50">
                               "Você tem acesso à ferramenta #consultar_viacep. Utilize-a para validar o endereço sempre que o usuário fornecer um CEP. Não tente adivinhar o endereço, use a skill."
                             </div>
                           </div>

                           <Alert className="bg-primary/5 border-primary/20">
                             <Info className="h-4 w-4 text-primary" />
                             <AlertTitle className="text-xs font-bold">Dica de Ouro</AlertTitle>
                             <AlertDescription className="text-[10px]">
                               Após escrever a instrução na Skill, **copie e cole** esse mesmo texto no "System Prompt" do seu Agente. Isso reforça o comportamento da IA.
                             </AlertDescription>
                           </Alert>
                         </div>
                       </DialogContent>
                     </Dialog>
                     <Button type="button" size="sm" variant="outline" className="border-emerald-200 text-emerald-600" onClick={() => setIsImportDialogOpen(true)}><Download className="h-4 w-4 mr-2" /> Importar</Button>
                     <Button type="button" size="sm" variant="outline" className="border-emerald-200 text-emerald-600" onClick={addSkill}><Plus className="h-4 w-4 mr-2" /> Nova Skill</Button>
                   </div>
                 </div>

                 <Accordion type="multiple" className="w-full space-y-2">
                   {dynamicSkills.map((skill) => (
                     <AccordionItem key={skill.id} value={skill.id} className="border rounded-md bg-background px-4 !overflow-visible">
                       <AccordionTrigger className="hover:no-underline py-3">
                         <div className="flex items-center gap-3">
                           <div className={skill.isActive ? "text-emerald-500" : "text-muted-foreground"}>
                             {skill.executionType === 'webhook' ? <Globe className="h-4 w-4" /> : skill.executionType === 'local_js' ? <Code className="h-4 w-4" /> : skill.executionType === 'web_scraping' ? <Search className="h-4 w-4" /> : <Book className="h-4 w-4" />}
                           </div>
                           <span className="font-bold text-sm">{skill.name}</span>
                         </div>
                       </AccordionTrigger>
                       <AccordionContent className="pt-2 pb-4 space-y-4 !overflow-visible">
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
                           <Label className="text-primary flex items-center gap-2"><Lightbulb className="h-3 w-3" /> Instrução de Uso (Prompt)</Label>
                           <Textarea 
                             placeholder="Descreva para o Agente como e quando usar esta skill. Ex: 'Sempre que o usuário fornecer um CEP, utilize a ferramenta #consultar_endereco_viacep para validar os dados.'"
                             value={skill.suggestedInstruction || ''} 
                             onChange={e => updateSkill(skill.id, 'suggestedInstruction', e.target.value)}
                             className="text-xs h-20 bg-primary/5 border-primary/20"
                           />
                           <p className="text-[10px] text-muted-foreground italic">Dica: Copie este texto para o 'System Prompt' do seu Agente para que ele saiba utilizar esta ferramenta.</p>
                         </div>

                         {skill.executionType === 'knowledge_base' ? (
                           <div className="space-y-3">
                             <div className="flex items-center justify-between">
                               <Label className="flex items-center gap-2 text-blue-600"><Book className="h-3 w-3" /> Conteúdo da Base</Label>
                               <div className="flex gap-2">
                                 <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] border-orange-200 text-orange-600" onClick={() => handleManualCleanNoise(skill.id)}><Eraser className="h-3 w-3 mr-1" /> Limpar Ruídos</Button>
                                 <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] border-blue-200 text-blue-600" onClick={() => { setActiveSkillIdForUpload(skill.id); fileInputRef.current?.click(); }} disabled={isExtracting}>{isExtracting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />} Importar Arquivo</Button>
                               </div>
                             </div>
                             <Textarea className="font-sans text-xs h-64 bg-slate-950 text-blue-300 border-blue-900/50" value={skill.knowledgeBaseText || ''} onChange={e => updateSkill(skill.id, 'knowledgeBaseText', e.target.value)} />
                           </div>
                         ) : (
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                             <div className="space-y-2"><Label>Parâmetros JSON</Label><Textarea className="font-mono text-[10px] h-48 bg-slate-900 text-blue-300" value={typeof skill.parameters === 'string' ? skill.parameters : JSON.stringify(skill.parameters, null, 2)} onChange={e => { try { updateSkill(skill.id, 'parameters', JSON.parse(e.target.value)); } catch (err) { updateSkill(skill.id, 'parameters', e.target.value); } }} /></div>
                             {skill.executionType === 'local_js' && <div className="space-y-2"><Label className="text-emerald-600">Código JavaScript</Label><Textarea className="font-mono text-[11px] h-48 bg-slate-950 text-emerald-400" value={skill.jsCode || ''} onChange={e => updateSkill(skill.id, 'jsCode', e.target.value)} /></div>}
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
                 <div className="flex items-center justify-between"><h3 className="text-lg font-bold flex items-center gap-2 text-primary"><Zap className="h-5 w-5" />Agentes Especialistas (Timeline)</h3><Button type="button" size="sm" onClick={() => setAgents([...agents, { id: Date.now().toString(), nome: 'Novo Agente', systemPrompt: '', order: agents.length + 1 }])}><Plus className="h-4 w-4 mr-2" /> Novo Agente</Button></div>
                 <Accordion type="multiple" className="w-full space-y-2">
                   {agents.sort((a,b) => (a.order||0)-(b.order||0)).map((agent) => (
                     <AccordionItem key={agent.id} value={agent.id} className="border rounded-md bg-background px-4 !overflow-visible">
                       <AccordionTrigger className="hover:no-underline py-3"><div className="flex items-center gap-3"><Badge variant="outline" className="font-mono">{agent.order}</Badge><span className="font-bold text-sm">{agent.nome}</span></div></AccordionTrigger>
                       <AccordionContent className="pt-2 pb-4 space-y-4 !overflow-visible">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2"><Label>Nome</Label><Input value={agent.nome} onChange={e => updateAgent(agent.id, 'nome', e.target.value)} /></div>
                           <div className="space-y-2"><Label>Webhook n8n</Label><Input placeholder="https://..." value={agent.webhookUrl || ''} onChange={e => updateAgent(agent.id, 'webhookUrl', e.target.value)} /></div>
                         </div>
                         <div className="space-y-2">
                           <Label>System Prompt (Instruções do Agente)</Label>
                           <AgentPromptEditor 
                             value={agent.systemPrompt} 
                             onChange={e => updateAgent(agent.id, 'systemPrompt', e)} 
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