import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Webhook, Building, UserCheck, KeyRound, Bot, Trash2, Plus, Save, History, Zap, CheckCircle, Code, Globe, Download, Upload as UploadIcon, Edit3, X } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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
  const [preAnalysisPrompt, setPreAnalysisPrompt] = useState(localStorage.getItem('jota-pre-analysis-prompt') || DEFAULT_PRE_ANALYSIS_PROMPT);

  const [agents, setAgents] = useState<AgentConfig[]>(() => loadAgentsFromStorage());
  const [inssTables, setInssTables] = useState<InssTable[]>(() => getInssTables());
  const [irpfTables, setIrpfTables] = useState<IrpfTable[]>(() => getIrpfTables());
  const [minimumWages, setMinimumWages] = useState<MinimumWageEntry[]>(() => getMinimumWages());
  
  // Estado das Skills Dinâmicas
  const [dynamicSkills, setDynamicSkills] = useState<DynamicSkill[]>(() => loadDynamicSkills());
  const [editingSkill, setEditingSkill] = useState<Partial<DynamicSkill> | null>(null);
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
    localStorage.setItem('jota-pre-analysis-prompt', preAnalysisPrompt);
    saveAgentsToStorage(agents);
    saveInssTables(inssTables);
    saveIrpfTables(irpfTables);
    saveMinimumWages(minimumWages);
    saveDynamicSkills(dynamicSkills);
    toast.success("Configurações salvas com sucesso!");
  };

  // Funções de Gerenciamento de Skills
  const handleAddSkill = () => {
    setEditingSkill({
      id: `skill-${Date.now()}`,
      name: 'nova_habilidade',
      description: 'Descrição da habilidade para a IA...',
      parameters: { type: "object", properties: { param1: { type: "string" } } },
      executionType: 'webhook',
      isActive: true
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
    toast.success("Skill atualizada localmente. Salve as configurações para persistir.");
  };

  const handleImportSkill = () => {
    try {
      const parsed = JSON.parse(importJson);
      const skillsToImport = Array.isArray(parsed) ? parsed : [parsed];
      
      const validated = skillsToImport.map(s => ({
        ...s,
        id: s.id || `skill-imp-${Math.random().toString(36).substr(2, 9)}`,
        isActive: s.isActive ?? true
      }));

      setDynamicSkills([...dynamicSkills, ...validated]);
      setImportJson('');
      toast.success(`${validated.length} Skill(s) importada(s)!`);
    } catch (e) {
      toast.error("JSON inválido.");
    }
  };

  const deleteSkill = (id: string) => {
    setDynamicSkills(dynamicSkills.filter(s => s.id !== id));
    toast.info("Skill removida.");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <form onSubmit={handleSave}>
        <Card className="shadow-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-6 w-6 text-primary" />Configurações do Sistema</CardTitle></CardHeader>
          <CardContent className="space-y-8">
            
            {/* DADOS BÁSICOS */}
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
                {/* GERENCIADOR DE SKILLS (NOVO) */}
                <div className="space-y-4 rounded-lg border border-primary/30 p-4 bg-primary/5">
                   <div className="flex items-center justify-between">
                     <h3 className="text-lg font-bold flex items-center gap-2 text-primary"><Zap className="h-5 w-5" />Gerenciador de Habilidades (Skills)</h3>
                     <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild><Button type="button" variant="outline" size="sm"><UploadIcon className="h-4 w-4 mr-2" /> Importar JSON</Button></DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Importar Skills de Terceiros</DialogTitle></DialogHeader>
                            <Textarea 
                              placeholder='Cole o JSON da Skill aqui...' 
                              className="h-64 font-mono text-xs" 
                              value={importJson} 
                              onChange={e => setImportJson(e.target.value)} 
                            />
                            <DialogFooter><Button type="button" onClick={handleImportSkill}>Confirmar Importação</Button></DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button type="button" size="sm" onClick={handleAddSkill}><Plus className="h-4 w-4 mr-2" /> Nova Skill</Button>
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-4">
                     {/* Skills de Sistema (Read Only) */}
                     <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Habilidades de Sistema (Nativas)</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {JOTA_TOOLS_MANIFEST.map(tool => (
                            <div key={tool.name} className="p-3 rounded-md bg-muted/50 border border-border flex items-center justify-between opacity-70">
                              <div className="flex items-center gap-3">
                                <CheckCircle className="h-4 w-4 text-success" />
                                <span className="text-sm font-mono font-bold">{tool.name}</span>
                              </div>
                              <Badge variant="outline">Sistema</Badge>
                            </div>
                          ))}
                        </div>
                     </div>

                     {/* Skills Dinâmicas (CRUD) */}
                     <div className="space-y-2 pt-4">
                        <Label className="text-[10px] uppercase font-bold text-primary">Habilidades Customizadas / Importadas</Label>
                        {dynamicSkills.length === 0 && <p className="text-xs text-muted-foreground italic p-4 border border-dashed rounded-md text-center">Nenhuma skill customizada cadastrada.</p>}
                        <div className="grid grid-cols-1 gap-3">
                          {dynamicSkills.map(skill => (
                            <div key={skill.id} className="p-4 rounded-md bg-background border border-border flex items-center justify-between shadow-sm hover:border-primary/50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className={skill.isActive ? "text-primary" : "text-muted-foreground"}>
                                  {skill.executionType === 'webhook' ? <Globe className="h-5 w-5" /> : <Code className="h-5 w-5" />}
                                </div>
                                <div>
                                  <p className="text-sm font-bold font-mono">{skill.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{skill.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Switch checked={skill.isActive} onCheckedChange={(val) => {
                                  const n = [...dynamicSkills];
                                  const i = n.findIndex(s => s.id === skill.id);
                                  n[i].isActive = val;
                                  setDynamicSkills(n);
                                }} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => setEditingSkill(skill)}><Edit3 className="h-4 w-4" /></Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => deleteSkill(skill.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                     </div>
                   </div>
                </div>

                {/* DIALOG DE EDIÇÃO DE SKILL */}
                {editingSkill && (
                  <Dialog open={!!editingSkill} onOpenChange={() => setEditingSkill(null)}>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader><DialogTitle>Configurar Habilidade (Skill)</DialogTitle></DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Nome Técnico (Snake Case)</Label><Input value={editingSkill.name} onChange={e => setEditingSkill({...editingSkill, name: e.target.value})} placeholder="ex: consultar_estoque_externo" /></div>
                          <div className="space-y-2"><Label>Tipo de Execução</Label>
                            <Select value={editingSkill.executionType} onValueChange={(v: any) => setEditingSkill({...editingSkill, executionType: v})}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="webhook">Webhook (API Externa)</SelectItem><SelectItem value="local_js">JavaScript Local</SelectItem></SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2"><Label>Descrição para a IA (Quando usar?)</Label><Textarea value={editingSkill.description} onChange={e => setEditingSkill({...editingSkill, description: e.target.value})} /></div>
                        
                        {editingSkill.executionType === 'webhook' ? (
                          <div className="space-y-2"><Label>URL do Webhook</Label><Input value={editingSkill.webhookUrl} onChange={e => setEditingSkill({...editingSkill, webhookUrl: e.target.value})} placeholder="https://api.terceiro.com/v1/..." /></div>
                        ) : (
                          <div className="space-y-2"><Label>Código JavaScript (Recebe 'args', retorna objeto)</Label><Textarea className="font-mono text-xs h-32" value={editingSkill.jsCode} onChange={e => setEditingSkill({...editingSkill, jsCode: e.target.value})} placeholder="return { resultado: args.valor * 2 };" /></div>
                        )}

                        <div className="space-y-2">
                          <Label>Parâmetros (JSON Schema)</Label>
                          <Textarea className="font-mono text-xs h-32" value={JSON.stringify(editingSkill.parameters, null, 2)} onChange={e => {
                            try { setEditingSkill({...editingSkill, parameters: JSON.parse(e.target.value)}); } catch(e) {}
                          }} />
                        </div>
                      </div>
                      <DialogFooter><Button type="button" onClick={handleSaveSkill}>Salvar Habilidade</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {/* RESTANTE DAS CONFIGURAÇÕES (RESPONSÁVEL, WEBHOOKS, ETC) */}
                <div className="space-y-4 rounded-lg border border-border p-4">
                   <h3 className="text-lg font-semibold flex items-center gap-2"><UserCheck className="h-5 w-5 text-muted-foreground" />Responsável Técnico</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2"><Label>Nome do Contador</Label><Input value={contadorNome} onChange={(e) => setContadorNome(e.target.value)} /></div>
                     <div className="space-y-2"><Label>CRC</Label><Input value={contadorCrc} onChange={(e) => setContadorCrc(e.target.value)} /></div>
                   </div>
                </div>

                <div className="space-y-4 rounded-lg border border-border p-4 bg-accent/5">
                   <h3 className="text-lg font-semibold flex items-center gap-2"><Webhook className="h-5 w-5 text-accent" />Webhooks da IA (Viabilidade)</h3>
                   <div className="grid grid-cols-1 gap-4">
                     <div className="space-y-2"><Label>URL Webhook (Ambiente de Teste)</Label><Input value={webhookTestUrl} onChange={(e) => setWebhookTestUrl(e.target.value)} /></div>
                     <div className="space-y-2"><Label>URL Webhook (Ambiente de Produção)</Label><Input value={webhookProdUrl} onChange={(e) => setWebhookProdUrl(e.target.value)} /></div>
                   </div>
                </div>

                <div className="space-y-4 rounded-lg border border-border p-4 bg-blue-500/5">
                   <h3 className="text-lg font-semibold flex items-center gap-2"><KeyRound className="h-5 w-5 text-blue-500" />Configurações da IA Local (Gemini)</h3>
                   <div className="space-y-2"><Label>Gemini API Key</Label><Input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} /></div>
                   <div className="space-y-2 pt-2 border-t border-blue-500/20"><Label>System Prompt (Pré-Validação)</Label><Textarea className="font-mono text-xs h-32" value={preAnalysisPrompt} onChange={(e) => setPreAnalysisPrompt(e.target.value)} /></div>
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