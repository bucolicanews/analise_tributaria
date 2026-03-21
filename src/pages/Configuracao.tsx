import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Settings, Building, KeyRound, Bot, Trash2, Plus, Zap, 
  Code, Globe, RotateCcw, Search, FileText, ChevronDown, 
  Wrench, Play, Lock, Book, Upload, Loader2, Eraser, Info, BookOpen, Copy, Check, Download, MessageSquareQuote,
  Lightbulb, Terminal, Cpu, HelpCircle, Workflow, Clock, Activity, Link2
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
import { Checkbox } from "@/components/ui/checkbox";
import { AgentConfig, loadAgentsFromStorage, saveAgentsToStorage, PromptConfig, loadPromptsFromStorage, savePromptsToStorage, DEFAULT_PROMPTS, DEFAULT_AGENTS } from '@/lib/geminiService';
import { useAuth } from '@/contexts/AuthContext';
import { getInssTables, saveInssTables, InssTable } from '@/lib/tax/inssData';
import { getIrpfTables, saveIrpfTables, IrpfTable } from '@/lib/tax/irpfData';
import { getMinimumWages, saveMinimumWages, MinimumWageEntry } from '@/lib/tax/minimumWageData';
import { DynamicSkill, loadDynamicSkills, saveDynamicSkills, DEFAULT_DYNAMIC_SKILLS, executeSkill } from '@/lib/skills/taxSkills';
import { AgentPromptEditor } from '@/components/AgentPromptEditor';
import { PromptSystemEditor } from '@/components/PromptSystemEditor';
import * as XLSX from 'xlsx';

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

  const cleanTextNoise = (text: string) => {
    return text
      .replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, " ") // Remove caracteres não imprimíveis/estranhos
      .replace(/\t/g, " ") // Tabs para espaços
      .replace(/ +/g, " ") // Múltiplos espaços para um só
      .replace(/\n\s*\n/g, "\n\n") // Múltiplas quebras de linha para no máximo duas
      .trim();
  };

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
          updateSkill(skill.id, 'knowledgeBaseText', cleanTextNoise(result.conteudo));
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
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".pdf")) {
        if (!pdfjsLib) {
          pdfjsLib = await import('pdfjs-dist');
          // Fix para versões do PDF.js > 3.x que usam worker com extensão .mjs
          const pdfVersion = pdfjsLib.version || '4.0.379';
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfVersion}/pdf.worker.min.mjs`;
        }
        const arrayBuffer = await file.arrayBuffer();
        const typedarray = new Uint8Array(arrayBuffer);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ") + "\n";
        }
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          text += `--- Planilha: ${sheetName} ---\n`;
          text += XLSX.utils.sheet_to_txt(worksheet) + "\n\n";
        });
      } else { 
        text = await file.text(); 
      }

      const cleanedText = cleanTextNoise(text);
      updateSkill(activeSkillIdForUpload, 'knowledgeBaseText', cleanedText);
      toast.success("Conteúdo extraído e limpo com sucesso!");
    } catch (error: any) { 
      console.error("Erro no processamento do arquivo:", error);
      toast.error(`Erro na extração: ${error.message || "Formato não suportado."}`); 
    } 
    finally { 
      setIsExtracting(false); 
      setActiveSkillIdForUpload(null);
      // Limpa o input para permitir enviar o mesmo arquivo logo em seguida
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const updateAgent = (id: string, field: keyof AgentConfig, value: any) => {
    setAgents(agents.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const toggleAgentSkill = (agentId: string, skillId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    const currentSkills = agent.selectedSkills || [];
    const newSkills = currentSkills.includes(skillId)
      ? currentSkills.filter(id => id !== skillId)
      : [...currentSkills, skillId];
    updateAgent(agentId, 'selectedSkills', newSkills);
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
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.xlsx,.xls,.csv,.txt" />

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
                           <PromptSystemEditor value={prompt.content} onChange={e => updatePrompt(prompt.id, 'content', e)} />
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
                                 <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] border-amber-200 text-amber-600" onClick={() => { const cleaned = cleanTextNoise(skill.knowledgeBaseText || ''); updateSkill(skill.id, 'knowledgeBaseText', cleaned); toast.success("Ruído removido!"); }}><Eraser className="h-3 w-3 mr-1" /> Limpar Ruído</Button>
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
                     <Button type="button" size="sm" onClick={() => setAgents([...agents, { id: Date.now().toString(), nome: 'Novo Agente', systemPrompt: '', order: agents.length + 1, selectedSkills: [], enableMonitoring: false, monitoringInterval: 60, useN8n: false, n8nResponseUrl: 'http://localhost:3001/agent-result' }])}><Plus className="h-4 w-4 mr-2" /> Novo Agente</Button>
                   </div>
                 </div>

                 <Accordion type="multiple" className="w-full space-y-2">
                   {agents.sort((a,b) => (a.order||0)-(b.order||0)).map((agent) => (
                     <AccordionItem key={agent.id} value={agent.id} className="border rounded-md bg-background px-4">
                       <AccordionTrigger className="hover:no-underline py-3">
                         <div className="flex items-center gap-3">
                           <Badge variant="outline" className="font-mono">{agent.order}</Badge>
                           <span className="font-bold text-sm">{agent.nome}</span>
                           {agent.enableMonitoring && <Badge className="bg-emerald-500 text-[8px] h-4">MONITORANDO</Badge>}
                           {agent.useN8n && <Badge variant="outline" className="text-[8px] h-4 border-orange-400 text-orange-600">N8N</Badge>}
                         </div>
                       </AccordionTrigger>
                       <AccordionContent className="pt-2 pb-4 space-y-6">
                         
                         {/* SEÇÃO 1: IDENTIFICAÇÃO E N8N */}
                         <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
                           <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2"><Bot className="h-3 w-3" /> Identificação e Integração</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                               <Label>Nome do Agente</Label>
                               <Input value={agent.nome} onChange={e => updateAgent(agent.id, 'nome', e.target.value)} placeholder="Ex: Auditor de NCM" />
                             </div>
                             <div className="space-y-2">
                               <Label>Webhook n8n (Execução)</Label>
                               <Input placeholder="https://n8n.seu-servidor.com/webhook/..." value={agent.webhookUrl || ''} onChange={e => updateAgent(agent.id, 'webhookUrl', e.target.value)} />
                               <p className="text-[9px] text-muted-foreground">URL do nó Webhook que inicia o fluxo no n8n.</p>
                             </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                             <div className="flex items-center justify-between p-3 border rounded-md bg-orange-500/5 border-orange-500/20">
                               <div className="space-y-0.5">
                                 <Label className="text-orange-700 flex items-center gap-2"><Workflow className="h-3 w-3" /> Usar n8n para Processamento</Label>
                                 <p className="text-[10px] text-orange-600/70">Se ativado, o agente enviará os dados para o n8n em vez do Gemini direto.</p>
                               </div>
                               <Switch checked={agent.useN8n} onCheckedChange={v => updateAgent(agent.id, 'useN8n', v)} />
                             </div>
                             <div className="space-y-2">
                               <Label className="text-orange-700 flex items-center gap-2"><Link2 className="h-3 w-3" /> URL de Resposta do n8n</Label>
                               <Input 
                                 disabled={!agent.useN8n}
                                 placeholder="http://localhost:3001/agent-result" 
                                 value={agent.n8nResponseUrl || ''} 
                                 onChange={e => updateAgent(agent.id, 'n8nResponseUrl', e.target.value)} 
                               />
                               <p className="text-[9px] text-muted-foreground">URL onde o n8n deve postar o resultado final (Relay).</p>
                             </div>
                           </div>
                         </div>

                         {/* SEÇÃO 2: MONITORAMENTO */}
                         <div className="space-y-4 p-4 border rounded-lg bg-emerald-500/5 border-emerald-500/20">
                           <h4 className="text-xs font-bold uppercase text-emerald-700 flex items-center gap-2"><Activity className="h-3 w-3" /> Monitoramento de Site / Automação</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="flex items-center justify-between p-3 border rounded-md bg-background">
                               <div className="space-y-0.5">
                                 <Label className="text-emerald-700 flex items-center gap-2">Ativar Monitoramento</Label>
                                 <p className="text-[10px] text-muted-foreground">Executa o agente periodicamente para checar mudanças.</p>
                               </div>
                               <Switch checked={agent.enableMonitoring} onCheckedChange={v => updateAgent(agent.id, 'enableMonitoring', v)} />
                             </div>
                             <div className="space-y-2">
                               <Label className="text-emerald-700 flex items-center gap-2"><Clock className="h-3 w-3" /> Intervalo de Monitoramento (Minutos)</Label>
                               <Input 
                                 type="number"
                                 disabled={!agent.enableMonitoring}
                                 value={agent.monitoringInterval || 60} 
                                 onChange={e => updateAgent(agent.id, 'monitoringInterval', parseInt(e.target.value) || 60)} 
                               />
                             </div>
                           </div>
                         </div>

                         {/* SEÇÃO 3: SKILLS VINCULADAS */}
                         <div className="space-y-4 p-4 border rounded-lg bg-blue-500/5 border-blue-500/20">
                           <h4 className="text-xs font-bold uppercase text-blue-700 flex items-center gap-2"><Wrench className="h-3 w-3" /> Skills Vinculadas</h4>
                           <p className="text-[10px] text-blue-600/70 mb-2">Selecione quais ferramentas este agente tem permissão para utilizar autonomamente.</p>
                           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                             {dynamicSkills.map(skill => (
                               <div key={skill.id} className="flex items-center space-x-2 p-2 rounded border bg-background hover:bg-blue-50 transition-colors">
                                 <Checkbox 
                                   id={`skill-${agent.id}-${skill.id}`} 
                                   checked={(agent.selectedSkills || []).includes(skill.id)}
                                   onCheckedChange={() => toggleAgentSkill(agent.id, skill.id)}
                                 />
                                 <label htmlFor={`skill-${agent.id}-${skill.id}`} className="text-[11px] font-medium leading-none cursor-pointer truncate">
                                   {skill.name}
                                 </label>
                               </div>
                             ))}
                           </div>
                         </div>

                         {/* SEÇÃO 4: PROMPT DO SISTEMA */}
                         <div className="space-y-2">
                           <Label className="flex items-center gap-2"><MessageSquareQuote className="h-4 w-4 text-primary" /> Prompt do Sistema (Instruções do Agente)</Label>
                           <AgentPromptEditor 
                             value={agent.systemPrompt} 
                             onChange={(val) => updateAgent(agent.id, 'systemPrompt', val)}
                             prompts={prompts}
                             skills={dynamicSkills.filter(s => (agent.selectedSkills || []).includes(s.id))}
                           />
                         </div>

                         <div className="flex justify-between items-center pt-4 border-t border-border/50">
                           <div className="flex items-center gap-2">
                             <Label>Ordem na Timeline:</Label>
                             <Input 
                               type="number" 
                               className="w-16 h-8 text-center" 
                               value={agent.order || 0} 
                               onChange={e => updateAgent(agent.id, 'order', parseInt(e.target.value) || 0)} 
                             />
                           </div>
                           <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setAgents(agents.filter(a => a.id !== agent.id))}><Trash2 className="h-4 w-4 mr-2" /> Remover Agente</Button>
                         </div>
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