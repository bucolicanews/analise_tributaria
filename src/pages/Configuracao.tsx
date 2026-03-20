import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Settings, Building, KeyRound, Bot, Trash2, Plus, Zap, 
  Code, Globe, RotateCcw, Search, FileText, ChevronDown, 
  Wrench, Play, Lock, Book, Upload, Loader2, Eraser 
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
import { AgentConfig, DEFAULT_AGENTS, DEFAULT_PRE_ANALYSIS_PROMPT, loadAgentsFromStorage, saveAgentsToStorage } from '@/lib/geminiService';
import { useAuth } from '@/contexts/AuthContext';
import { getInssTables, saveInssTables, InssTable } from '@/lib/tax/inssData';
import { getIrpfTables, saveIrpfTables, IrpfTable } from '@/lib/tax/irpfData';
import { getMinimumWages, saveMinimumWages, MinimumWageEntry } from '@/lib/tax/minimumWageData';
import { DynamicSkill, loadDynamicSkills, saveDynamicSkills, DEFAULT_DYNAMIC_SKILLS, executeSkill } from '@/lib/skills/taxSkills';

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
  const [preAnalysisPrompt, setPreAnalysisPrompt] = useState(localStorage.getItem('jota-pre-analysis-prompt') || DEFAULT_PRE_ANALYSIS_PROMPT);

  const [agents, setAgents] = useState<AgentConfig[]>(() => loadAgentsFromStorage());
  const [inssTables, setInssTables] = useState<InssTable[]>(() => getInssTables());
  const [irpfTables, setIrpfTables] = useState<IrpfTable[]>(() => getIrpfTables());
  const [minimumWages, setMinimumWages] = useState<MinimumWageEntry[]>(() => getMinimumWages());
  const [dynamicSkills, setDynamicSkills] = useState<DynamicSkill[]>(() => loadDynamicSkills());

  // SISTEMA DE AUTO-SAVE (Persistência em tempo real)
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
    localStorage.setItem('jota-pre-analysis-prompt', preAnalysisPrompt);
    
    saveAgentsToStorage(agents);
    saveInssTables(inssTables);
    saveIrpfTables(irpfTables);
    saveMinimumWages(minimumWages);
    saveDynamicSkills(dynamicSkills);
  }, [
    razaoSocial, cnpj, uf, webhookTestUrl, webhookProdUrl, 
    contadorNome, contadorCrc, geminiKey, geminiModel, 
    enableGoogleSearch, preAnalysisPrompt, agents, 
    inssTables, irpfTables, minimumWages, dynamicSkills
  ]);

  const cleanTextNoise = (text: string): string => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => /[a-zA-Z0-9]/.test(line))
      .join('\n');
  };

  const handleManualCleanNoise = (skillId: string) => {
    setDynamicSkills(prev => prev.map(s => {
      if (s.id === skillId && s.knowledgeBaseText) {
        const cleaned = cleanTextNoise(s.knowledgeBaseText);
        toast.success("Ruídos removidos!");
        return { ...s, knowledgeBaseText: cleaned };
      }
      return s;
    }));
  };

  const handleTestSkill = async (skill: DynamicSkill) => {
    setIsTestingSkill(skill.id);
    const toastId = toast.loading(`Testando skill: ${skill.name}...`);
    try {
      const result = await executeSkill(skill.name, {}, dynamicSkills);
      if (result.error) {
        toast.error(`Erro no teste: ${result.error}`, { id: toastId });
      } else {
        toast.success("Teste concluído!", { id: toastId });
        if (skill.executionType === 'web_scraping') {
          const extractedContent = result.conteudo || (result.dados_extraidos ? result.dados_extraidos.join('\n') : "");
          if (extractedContent) {
            updateSkill(skill.id, 'knowledgeBaseText', extractedContent);
          }
        }
      }
    } catch (err: any) {
      toast.error(`Falha no teste: ${err.message}`, { id: toastId });
    } finally {
      setIsTestingSkill(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeSkillIdForUpload) return;

    setIsExtracting(true);
    const toastId = toast.loading(`Processando ${file.name}...`);

    try {
      let extractedText = "";
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".pdf")) {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
        }
        extractedText = fullText;
      } 
      else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        let fullSheetText = "";
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          fullSheetText += `--- PLANILHA: ${sheetName} ---\n${XLSX.utils.sheet_to_csv(worksheet)}\n\n`;
        });
        extractedText = fullSheetText;
      }
      else {
        extractedText = await file.text();
      }

      if (extractedText.trim()) {
        const cleanedText = cleanTextNoise(extractedText);
        updateSkill(activeSkillIdForUpload, 'knowledgeBaseText', cleanedText);
        toast.success("Conteúdo extraído!", { id: toastId });
      }
    } catch (error: any) {
      toast.error("Erro ao processar arquivo: " + error.message, { id: toastId });
    } finally {
      setIsExtracting(false);
      setActiveSkillIdForUpload(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerFileUpload = (skillId: string) => {
    setActiveSkillIdForUpload(skillId);
    fileInputRef.current?.click();
  };

  const updateAgent = (id: string, field: keyof AgentConfig, value: string) => {
    setAgents(agents.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const deleteAgent = (id: string) => {
    setAgents(agents.filter(a => a.id !== id));
  };

  const addAgent = () => {
    const newId = Date.now().toString();
    setAgents([...agents, { id: newId, nome: `Novo Agente`, systemPrompt: '', order: agents.length + 1 }]);
  };

  const addSkill = () => {
    const newSkill: DynamicSkill = {
      id: Date.now().toString(),
      name: 'nova_skill',
      description: 'Descrição da skill',
      parameters: { type: 'object', properties: { arg1: { type: 'string' } } },
      executionType: 'local_js',
      isActive: true,
      jsCode: '// Código JS\nreturn { status: "sucesso" };'
    };
    setDynamicSkills([...dynamicSkills, newSkill]);
    toast.success("Nova Skill criada! Lembre-se de configurar o nome técnico.");
  };

  const updateSkill = (id: string, field: keyof DynamicSkill, value: any) => {
    setDynamicSkills(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt,.xml,.json,.xlsx,.xls,.csv" onChange={handleFileUpload} />

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Settings className="h-6 w-6 text-primary" />Configurações do Sistema</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => {
            if (confirm("Deseja restaurar o padrão JOTA?")) {
              setPreAnalysisPrompt(DEFAULT_PRE_ANALYSIS_PROMPT);
              setAgents(DEFAULT_AGENTS);
              setDynamicSkills(DEFAULT_DYNAMIC_SKILLS);
              toast.info("Padrão JOTA restaurado.");
            }
          }} className="text-xs text-indigo-600 border-indigo-200">
            <RotateCcw className="h-3 w-3 mr-1" /> Restaurar Padrão JOTA
          </Button>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <div className="space-y-4 rounded-lg border border-border p-4">
             <h3 className="text-lg font-semibold flex items-center gap-2"><Building className="h-5 w-5 text-muted-foreground" />Dados da Empresa</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2"><Label>Razão Social</Label><Input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} /></div>
               <div className="space-y-2"><Label>CNPJ</Label><Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} /></div>
               <div className="space-y-2"><Label>Estado (UF)</Label><Select value={uf} onValueChange={setUf}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UFs.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
             </div>
          </div>

          {autenticado ? (
            <>
              <div className="space-y-4 rounded-lg border border-emerald-500/30 p-4 bg-emerald-500/5">
                 <div className="flex items-center justify-between">
                   <div className="space-y-1">
                     <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-600"><Wrench className="h-5 w-5" />Skills e Ferramentas</h3>
                     <p className="text-xs text-emerald-700/70">Crie ferramentas de consulta ou importe arquivos. As alterações são salvas automaticamente.</p>
                   </div>
                   <Button type="button" size="sm" variant="outline" className="border-emerald-200 text-emerald-600" onClick={addSkill}>
                     <Plus className="h-4 w-4 mr-2" /> Nova Skill
                   </Button>
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

                         {skill.executionType === 'knowledge_base' ? (
                           <div className="space-y-3">
                             <div className="flex items-center justify-between">
                               <Label className="flex items-center gap-2 text-blue-600"><Book className="h-3 w-3" /> Conteúdo da Base</Label>
                               <div className="flex gap-2">
                                 <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] border-orange-200 text-orange-600" onClick={() => handleManualCleanNoise(skill.id)}>
                                   <Eraser className="h-3 w-3 mr-1" /> Limpar Ruídos
                                 </Button>
                                 <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] border-red-200 text-red-600" onClick={() => updateSkill(skill.id, 'knowledgeBaseText', '')}>
                                   <Trash2 className="h-3 w-3 mr-1" /> Apagar Tudo
                                 </Button>
                                 <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] border-blue-200 text-blue-600" onClick={() => triggerFileUpload(skill.id)} disabled={isExtracting}>
                                   {isExtracting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />} Importar Arquivo
                                 </Button>
                               </div>
                             </div>
                             <Textarea className="font-sans text-xs h-64 bg-blue-50/30 border-blue-200" value={skill.knowledgeBaseText || ''} onChange={e => updateSkill(skill.id, 'knowledgeBaseText', e.target.value)} />
                           </div>
                         ) : skill.executionType === 'web_scraping' ? (
                           <div className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="space-y-2"><Label>URL Alvo</Label><Input placeholder="https://..." value={skill.url || ''} onChange={e => updateSkill(skill.id, 'url', e.target.value)} /></div>
                               <div className="space-y-2"><Label>Seletor CSS Opcional</Label><Input placeholder="Ex: #main-content" value={skill.selector || ''} onChange={e => updateSkill(skill.id, 'selector', e.target.value)} /></div>
                             </div>
                             
                             {skill.knowledgeBaseText && (
                               <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                 <div className="flex items-center justify-between">
                                   <Label className="flex items-center gap-2 text-emerald-600"><Search className="h-3 w-3" /> Resultado da Última Extração</Label>
                                   <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] border-orange-200 text-orange-600" onClick={() => handleManualCleanNoise(skill.id)}>
                                     <Eraser className="h-3 w-3 mr-1" /> Limpar Ruídos
                                   </Button>
                                 </div>
                                 <Textarea 
                                   readOnly 
                                   className="font-sans text-xs h-48 bg-emerald-50/10 border-emerald-200/50" 
                                   value={skill.knowledgeBaseText} 
                                 />
                               </div>
                             )}
                           </div>
                         ) : (
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                             <div className="space-y-2"><Label>Parâmetros JSON</Label><Textarea className="font-mono text-[10px] h-48 bg-slate-900 text-blue-300" value={typeof skill.parameters === 'string' ? skill.parameters : JSON.stringify(skill.parameters, null, 2)} onChange={e => { try { updateSkill(skill.id, 'parameters', JSON.parse(e.target.value)); } catch (err) { updateSkill(skill.id, 'parameters', e.target.value); } }} /></div>
                             {skill.executionType === 'local_js' && <div className="space-y-2"><Label className="text-emerald-600">Código JavaScript</Label><Textarea className="font-mono text-[11px] h-48 bg-slate-950 text-emerald-400" value={skill.jsCode || ''} onChange={e => updateSkill(skill.id, 'jsCode', e.target.value)} /></div>}
                           </div>
                         )}

                         <div className="flex justify-between items-center pt-2 border-t border-border/50">
                           <div className="flex gap-2">
                             <Button type="button" variant="outline" size="sm" className="text-emerald-600 border-emerald-200" onClick={() => handleTestSkill(skill)} disabled={isTestingSkill === skill.id}>
                               {isTestingSkill === skill.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />} Testar Skill
                             </Button>
                             <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setDynamicSkills(dynamicSkills.filter(s => s.id !== skill.id))}><Trash2 className="h-4 w-4 mr-2" /> Remover Skill</Button>
                           </div>
                         </div>
                       </AccordionContent>
                     </AccordionItem>
                   ))}
                 </Accordion>
              </div>

              <div className="space-y-4 rounded-lg border border-indigo-500/30 p-4 bg-indigo-500/5">
                 <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-600"><Bot className="h-5 w-5" />Cérebro da IA (Super Prompt)</h3>
                 <Textarea className="font-mono text-[11px] h-[250px] bg-background border-indigo-200" value={preAnalysisPrompt} onChange={(e) => setPreAnalysisPrompt(e.target.value)} />
              </div>

              <div className="space-y-4 rounded-lg border border-primary/30 p-4 bg-primary/5">
                 <div className="flex items-center justify-between"><h3 className="text-lg font-bold flex items-center gap-2 text-primary"><Zap className="h-5 w-5" />Agentes Especialistas</h3><Button type="button" size="sm" onClick={addAgent}><Plus className="h-4 w-4 mr-2" /> Novo Agente</Button></div>
                 <Accordion type="multiple" className="w-full space-y-2">
                   {agents.sort((a,b) => (a.order||0)-(b.order||0)).map((agent) => (
                     <AccordionItem key={agent.id} value={agent.id} className="border rounded-md bg-background px-4">
                       <AccordionTrigger className="hover:no-underline py-3"><div className="flex items-center gap-3"><Badge variant="outline" className="font-mono">{agent.order}</Badge><span className="font-bold text-sm">{agent.nome}</span></div></AccordionTrigger>
                       <AccordionContent className="pt-2 pb-4 space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2"><Label>Nome do Agente</Label><Input value={agent.nome} onChange={e => updateAgent(agent.id, 'nome', e.target.value)} /></div>
                           <div className="space-y-2"><Label>Webhook Opcional</Label><Input placeholder="https://..." value={agent.webhookUrl || ''} onChange={e => updateAgent(agent.id, 'webhookUrl', e.target.value)} /></div>
                         </div>
                         <div className="space-y-2"><Label>System Prompt</Label><Textarea className="font-mono text-xs h-32" value={agent.systemPrompt} onChange={e => updateAgent(agent.id, 'systemPrompt', e.target.value)} /></div>
                         <div className="flex justify-end"><Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => deleteAgent(agent.id)}><Trash2 className="h-4 w-4 mr-2" /> Remover Agente</Button></div>
                       </AccordionContent>
                     </AccordionItem>
                   ))}
                 </Accordion>
              </div>

              <div className="space-y-4 rounded-lg border border-border p-4 bg-blue-50/5">
                 <h3 className="text-lg font-semibold flex items-center gap-2"><KeyRound className="h-5 w-5 text-blue-500" />Configurações da IA Local</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <div className="space-y-2"><Label>Gemini API Key</Label><Input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} /></div>
                   <div className="space-y-2">
                     <Label>Modelo da IA</Label>
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
            <Button type="button" size="lg" className="w-full sm:w-auto" onClick={() => toast.success("Todas as configurações foram salvas!")}>Confirmar e Sair</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracao;