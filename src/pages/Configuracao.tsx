import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Webhook, Building, UserCheck, KeyRound, Bot, Trash2, Plus, Save, History, Zap, CheckCircle, Code, Globe, Download, Upload as UploadIcon, Edit3, X, Eye, RotateCcw, Info, Search, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentConfig, DEFAULT_AGENTS, DEFAULT_PRE_ANALYSIS_PROMPT, loadAgentsFromStorage, saveAgentsToStorage } from '@/lib/geminiService';
import { useAuth } from '@/contexts/AuthContext';
import { getInssTables, saveInssTables, InssTable } from '@/lib/tax/inssData';
import { getIrpfTables, saveIrpfTables, IrpfTable } from '@/lib/tax/irpfData';
import { getMinimumWages, saveMinimumWages, MinimumWageEntry } from '@/lib/tax/minimumWageData';
import { JOTA_TOOLS_MANIFEST, DynamicSkill, loadDynamicSkills, saveDynamicSkills } from '@/lib/skills/taxSkills';

const UFs = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

const Configuracao = () => {
  const { autenticado } = useAuth();
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
  const [editingSkill, setEditingSkill] = useState<Partial<DynamicSkill> | null>(null);
  const [viewingSystemSkill, setViewingSystemSkill] = useState<any | null>(null);
  const [importJson, setImportJson] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
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
    toast.success("Configurações salvas com sucesso!");
  };

  const handleRestoreDefaultJota = () => {
    if (confirm("Deseja restaurar o padrão JOTA? Isso resetará o Super Prompt e os 6 Agentes Especialistas.")) {
      setPreAnalysisPrompt(DEFAULT_PRE_ANALYSIS_PROMPT);
      setAgents(DEFAULT_AGENTS);
      toast.info("Padrão JOTA restaurado. Salve para confirmar.");
    }
  };

  const updateAgent = (id: string, field: keyof AgentConfig, value: string) => {
    setAgents(agents.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const deleteAgent = (id: string) => {
    setAgents(agents.filter(a => a.id !== id));
  };

  const addAgent = () => {
    const newId = (agents.length + 1).toString();
    setAgents([...agents, { id: newId, nome: `Novo Agente ${newId}`, systemPrompt: '', order: agents.length + 1 }]);
  };

  const handleAddSkill = () => {
    setEditingSkill({
      id: `skill-${Date.now()}`,
      name: 'nova_habilidade',
      description: 'Descrição detalhada...',
      parameters: { type: "object", properties: { termo_busca: { type: "string" } } },
      executionType: 'knowledge_base',
      isActive: true,
      knowledgeBaseText: '',
      jsCode: '// args contém os parâmetros\nreturn { status: "sucesso", dados: args };'
    });
  };

  const handleSaveSkill = () => {
    if (!editingSkill?.name) return toast.error("Nome é obrigatório.");
    const newSkills = [...dynamicSkills];
    const index = newSkills.findIndex(s => s.id === editingSkill.id);
    if (index >= 0) newSkills[index] = editingSkill as DynamicSkill;
    else newSkills.push(editingSkill as DynamicSkill);
    setDynamicSkills(newSkills);
    setEditingSkill(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <form onSubmit={handleSave}>
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Settings className="h-6 w-6 text-primary" />Configurações do Sistema</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={handleRestoreDefaultJota} className="text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50">
              <RotateCcw className="h-3 w-3 mr-1" /> Restaurar Padrão JOTA (10/10)
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

            {autenticado && (
              <>
                <div className="space-y-4 rounded-lg border border-indigo-500/30 p-4 bg-indigo-500/5">
                   <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-600"><Bot className="h-5 w-5" />Cérebro da IA (Super Prompt)</h3>
                   <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Este prompt é usado na Pré-Análise e como base para o Diagnóstico Oficial.</Label>
                      <Textarea 
                        className="font-mono text-[11px] h-[250px] bg-background border-indigo-200 focus:border-indigo-500 leading-relaxed" 
                        value={preAnalysisPrompt} 
                        onChange={(e) => setPreAnalysisPrompt(e.target.value)} 
                      />
                   </div>
                </div>

                <div className="space-y-4 rounded-lg border border-primary/30 p-4 bg-primary/5">
                   <div className="flex items-center justify-between">
                     <h3 className="text-lg font-bold flex items-center gap-2 text-primary"><Zap className="h-5 w-5" />Agentes Especialistas (Diagnóstico em Cadeia)</h3>
                     <Button type="button" size="sm" onClick={addAgent}><Plus className="h-4 w-4 mr-2" /> Novo Agente</Button>
                   </div>
                   
                   <Accordion type="multiple" className="w-full space-y-2">
                     {agents.sort((a,b) => (a.order||0)-(b.order||0)).map((agent) => (
                       <AccordionItem key={agent.id} value={agent.id} className="border rounded-md bg-background px-4">
                         <AccordionTrigger className="hover:no-underline py-3">
                           <div className="flex items-center gap-3">
                             <Badge variant="outline" className="font-mono">{agent.order}</Badge>
                             <span className="font-bold text-sm">{agent.nome}</span>
                           </div>
                         </AccordionTrigger>
                         <AccordionContent className="pt-2 pb-4 space-y-4">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                               <Label>Nome do Agente</Label>
                               <Input value={agent.nome} onChange={e => updateAgent(agent.id, 'nome', e.target.value)} />
                             </div>
                             <div className="space-y-2">
                               <Label>Webhook Opcional (n8n)</Label>
                               <Input placeholder="https://..." value={agent.webhookUrl || ''} onChange={e => updateAgent(agent.id, 'webhookUrl', e.target.value)} />
                             </div>
                           </div>
                           <div className="space-y-2">
                             <Label>System Prompt do Agente</Label>
                             <Textarea 
                               className="font-mono text-xs h-32" 
                               value={agent.systemPrompt} 
                               onChange={e => updateAgent(agent.id, 'systemPrompt', e.target.value)} 
                             />
                           </div>
                           <div className="flex justify-end">
                             <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => deleteAgent(agent.id)}>
                               <Trash2 className="h-4 w-4 mr-2" /> Remover Agente
                             </Button>
                           </div>
                         </AccordionContent>
                       </AccordionItem>
                     ))}
                   </Accordion>
                </div>

                <div className="space-y-4 rounded-lg border border-border p-4 bg-blue-500/5">
                   <h3 className="text-lg font-semibold flex items-center gap-2"><KeyRound className="h-5 w-5 text-blue-500" />Configurações da IA Local (Google Gemini)</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <div className="space-y-2">
                       <Label>Gemini API Key</Label>
                       <Input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} />
                     </div>
                     <div className="space-y-2">
                       <Label>Modelo da IA</Label>
                       <Select value={geminiModel} onValueChange={setGeminiModel}>
                         <SelectTrigger><SelectValue /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (Mais Rápido)</SelectItem>
                           <SelectItem value="gemini-2.0-pro-exp">Gemini 2.0 Pro Experimental (Mais Inteligente)</SelectItem>
                           <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (Estável e Robusto)</SelectItem>
                           <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash (Básico)</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <Label className="flex items-center gap-2"><Search className="h-4 w-4 text-blue-500" /> Grounding</Label>
                       <div className="flex items-center justify-between p-2 border border-blue-500/30 rounded bg-blue-500/10">
                         <span className="text-xs text-blue-800">Permitir pesquisa na internet em tempo real</span>
                         <Switch checked={enableGoogleSearch} onCheckedChange={setEnableGoogleSearch} />
                       </div>
                     </div>
                   </div>
                </div>
              </>
            )}

            <Button type="submit" size="lg" className="w-full sm:w-auto">Salvar Todas as Configurações</Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default Configuracao;