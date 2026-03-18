import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Webhook, Building, UserCheck, KeyRound, Bot, Trash2, Plus, Save, Lock, Table as TableIcon, Info, History } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgentConfig, DEFAULT_AGENTS, loadAgentsFromStorage, saveAgentsToStorage } from '@/lib/geminiService';
import { useAuth } from '@/contexts/AuthContext';
import { getInssTables, saveInssTables, InssTable } from '@/lib/tax/inssData';
import { getIrpfTables, saveIrpfTables, IrpfTable } from '@/lib/tax/irpfData';

const UFs = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

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

  const [agents, setAgents] = useState<AgentConfig[]>(() => loadAgentsFromStorage());
  const [inssTables, setInssTables] = useState<InssTable[]>(() => getInssTables());
  const [irpfTables, setIrpfTables] = useState<IrpfTable[]>(() => getIrpfTables());

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
    saveAgentsToStorage(agents);
    saveInssTables(inssTables);
    saveIrpfTables(irpfTables);
    toast.success("Configurações salvas com sucesso!");
  };

  // --- AGENTS LOGIC ---
  const addAgent = () => {
    const newAgent: AgentConfig = {
      id: `agent-${Date.now()}`,
      nome: 'Novo Agente',
      systemPrompt: '',
      order: agents.length + 1
    };
    setAgents([...agents, newAgent]);
  };

  const removeAgent = (id: string) => {
    setAgents(agents.filter(a => a.id !== id));
  };

  const updateAgent = (id: string, field: keyof AgentConfig, value: any) => {
    setAgents(agents.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const resetAgents = () => {
    if (confirm("Deseja restaurar os agentes padrão? Isso apagará suas customizações.")) {
      setAgents(DEFAULT_AGENTS);
      saveAgentsToStorage(DEFAULT_AGENTS);
      toast.info("Agentes restaurados.");
    }
  };

  // --- INSS LOGIC ---
  const addInssTable = () => {
    const newTable: InssTable = {
      id: `inss-${Date.now()}`,
      label: 'Novo Período',
      year: '2026',
      ranges: [{ min: 0, max: 0, rate: 0, deduction: 0 }]
    };
    setInssTables([...inssTables, newTable]);
  };

  const removeInssTable = (id: string) => setInssTables(inssTables.filter(t => t.id !== id));

  const updateInssRange = (tableIdx: number, rangeIdx: number, field: string, val: string) => {
    const newTables = [...inssTables];
    const numVal = parseFloat(val) || 0;
    (newTables[tableIdx].ranges[rangeIdx] as any)[field] = numVal;
    setInssTables(newTables);
  };

  // --- IRPF LOGIC ---
  const addIrpfTable = () => {
    const newTable: IrpfTable = {
      id: `irpf-${Date.now()}`,
      label: 'Nova Tabela IRPF',
      year: '2026',
      ranges: [{ min: 0, max: 0, rate: 0, deduction: 0 }],
      reductionRules: []
    };
    setIrpfTables([...irpfTables, newTable]);
  };

  const removeIrpfTable = (id: string) => setIrpfTables(irpfTables.filter(t => t.id !== id));

  const updateIrpfRange = (tableIdx: number, rangeIdx: number, field: string, val: string) => {
    const newTables = [...irpfTables];
    const numVal = parseFloat(val) || 0;
    (newTables[tableIdx].ranges[rangeIdx] as any)[field] = numVal;
    setIrpfTables(newTables);
  };

  const addIrpfReduction = (tableIdx: number) => {
    const newTables = [...irpfTables];
    newTables[tableIdx].reductionRules.push({ min: 0, max: 0, description: "" });
    setIrpfTables(newTables);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <form onSubmit={handleSave}>
        <Card className="shadow-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-6 w-6 text-primary" />Configurações do Sistema</CardTitle></CardHeader>
          <CardContent className="space-y-8">
            
            {/* DADOS DA EMPRESA */}
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
                {/* RESPONSÁVEL TÉCNICO */}
                <div className="space-y-4 rounded-lg border border-border p-4">
                   <h3 className="text-lg font-semibold flex items-center gap-2"><UserCheck className="h-5 w-5 text-muted-foreground" />Responsável Técnico</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2"><Label>Nome do Contador</Label><Input value={contadorNome} onChange={(e) => setContadorNome(e.target.value)} /></div>
                     <div className="space-y-2"><Label>CRC</Label><Input value={contadorCrc} onChange={(e) => setContadorCrc(e.target.value)} /></div>
                   </div>
                </div>

                {/* WEBHOOKS IA */}
                <div className="space-y-4 rounded-lg border border-border p-4 bg-accent/5">
                   <h3 className="text-lg font-semibold flex items-center gap-2"><Webhook className="h-5 w-5 text-accent" />Webhooks da IA (Viabilidade)</h3>
                   <div className="grid grid-cols-1 gap-4">
                     <div className="space-y-2"><Label>URL Webhook (Ambiente de Teste)</Label><Input value={webhookTestUrl} onChange={(e) => setWebhookTestUrl(e.target.value)} placeholder="https://n8n.seu-servidor.com/webhook-test/..." /></div>
                     <div className="space-y-2"><Label>URL Webhook (Ambiente de Produção)</Label><Input value={webhookProdUrl} onChange={(e) => setWebhookProdUrl(e.target.value)} placeholder="https://n8n.seu-servidor.com/webhook/..." /></div>
                   </div>
                </div>

                {/* CHAVE GEMINI */}
                <div className="space-y-4 rounded-lg border border-border p-4 bg-blue-500/5">
                   <h3 className="text-lg font-semibold flex items-center gap-2"><KeyRound className="h-5 w-5 text-blue-500" />Chave API Gemini (Agentes Locais)</h3>
                   <div className="space-y-2">
                     <Label>Gemini API Key</Label>
                     <Input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} placeholder="AIzaSy..." />
                     <p className="text-[10px] text-muted-foreground">Necessária para executar os agentes que não possuem Webhook próprio.</p>
                   </div>
                </div>

                {/* GERENCIADOR DE AGENTES */}
                <div className="space-y-4 rounded-lg border border-border p-4 bg-indigo-500/5">
                   <div className="flex items-center justify-between">
                     <h3 className="text-lg font-semibold flex items-center gap-2"><Bot className="h-5 w-5 text-indigo-500" />Gerenciador de Agentes IA</h3>
                     <div className="flex gap-2">
                       <Button type="button" variant="outline" size="sm" onClick={resetAgents}><History className="h-4 w-4 mr-2" /> Resetar</Button>
                       <Button type="button" variant="outline" size="sm" onClick={addAgent}><Plus className="h-4 w-4 mr-2" /> Novo Agente</Button>
                     </div>
                   </div>
                   <div className="space-y-6">
                     {agents.sort((a,b) => (a.order||0) - (b.order||0)).map((agent, idx) => (
                       <div key={agent.id} className="p-4 border rounded-md bg-background space-y-4 shadow-sm">
                         <div className="flex items-center justify-between gap-4">
                           <div className="flex-1 grid grid-cols-4 gap-2">
                             <div className="col-span-3"><Label className="text-[10px] uppercase">Nome do Agente</Label><Input value={agent.nome} onChange={e => updateAgent(agent.id, 'nome', e.target.value)} /></div>
                             <div><Label className="text-[10px] uppercase">Ordem</Label><Input type="number" value={agent.order} onChange={e => updateAgent(agent.id, 'order', parseInt(e.target.value))} /></div>
                           </div>
                           <Button type="button" variant="ghost" size="icon" className="mt-5" onClick={() => removeAgent(agent.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                         </div>
                         <div className="space-y-2">
                           <Label className="text-[10px] uppercase">System Prompt (Instruções)</Label>
                           <Textarea className="text-xs h-24 font-mono" value={agent.systemPrompt} onChange={e => updateAgent(agent.id, 'systemPrompt', e.target.value)} />
                         </div>
                         <div className="space-y-2">
                           <Label className="text-[10px] uppercase">URL Webhook Específico (Opcional)</Label>
                           <Input className="text-xs" value={agent.webhookUrl || ''} onChange={e => updateAgent(agent.id, 'webhookUrl', e.target.value)} placeholder="Se vazio, usará o Gemini local..." />
                         </div>
                       </div>
                     ))}
                   </div>
                </div>

                {/* GERENCIADOR INSS */}
                <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/10">
                   <h3 className="text-lg font-semibold flex items-center gap-2"><TableIcon className="h-5 w-5 text-muted-foreground" />Gerenciador de Tabelas INSS</h3>
                   <div className="space-y-6">
                     {inssTables.map((table, tIdx) => (
                       <div key={table.id} className="p-4 border rounded-md bg-background space-y-3">
                         <div className="flex items-center justify-between gap-4">
                           <Input className="font-bold text-accent" value={table.label} onChange={e => { const n = [...inssTables]; n[tIdx].label = e.target.value; setInssTables(n); }} />
                           <Input className="w-24" value={table.year} onChange={e => { const n = [...inssTables]; n[tIdx].year = e.target.value; setInssTables(n); }} />
                           <Button type="button" variant="ghost" size="icon" onClick={() => removeInssTable(table.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                         </div>
                         <div className="space-y-2">
                           {table.ranges.map((range, rIdx) => (
                             <div key={rIdx} className="grid grid-cols-4 gap-2">
                               <Input type="number" placeholder="De" value={range.min} onChange={e => updateInssRange(tIdx, rIdx, 'min', e.target.value)} />
                               <Input type="number" placeholder="Até" value={range.max || ''} onChange={e => updateInssRange(tIdx, rIdx, 'max', e.target.value)} />
                               <Input type="number" placeholder="Aliq %" value={range.rate} onChange={e => updateInssRange(tIdx, rIdx, 'rate', e.target.value)} />
                               <Input type="number" placeholder="Dedução" value={range.deduction} onChange={e => updateInssRange(tIdx, rIdx, 'deduction', e.target.value)} />
                             </div>
                           ))}
                           <Button type="button" variant="outline" size="sm" onClick={() => { const n = [...inssTables]; n[tIdx].ranges.push({ min: 0, max: 0, rate: 0, deduction: 0 }); setInssTables(n); }}><Plus className="h-3 w-3 mr-1" /> Faixa</Button>
                         </div>
                       </div>
                     ))}
                     <Button type="button" variant="outline" onClick={addInssTable}><Plus className="h-4 w-4 mr-2" /> Novo Período INSS</Button>
                   </div>
                </div>

                {/* GERENCIADOR IRPF */}
                <div className="space-y-4 rounded-lg border border-border p-4 bg-blue-50/30">
                   <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-700"><Info className="h-5 w-5" />Gerenciador de Tabelas IRPF</h3>
                   <div className="space-y-6">
                     {irpfTables.map((table, tIdx) => (
                       <div key={table.id} className="p-4 border rounded-md bg-background space-y-4">
                         <div className="flex items-center justify-between gap-4">
                           <Input className="font-bold text-blue-600" value={table.label} onChange={e => { const n = [...irpfTables]; n[tIdx].label = e.target.value; setIrpfTables(n); }} />
                           <Input className="w-24" value={table.year} onChange={e => { const n = [...irpfTables]; n[tIdx].year = e.target.value; setIrpfTables(n); }} />
                           <Button type="button" variant="ghost" size="icon" onClick={() => removeIrpfTable(table.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                         </div>
                         
                         <div className="space-y-2">
                           <Label className="text-[10px] uppercase font-bold text-muted-foreground">Tabela Progressiva</Label>
                           {table.ranges.map((range, rIdx) => (
                             <div key={rIdx} className="grid grid-cols-4 gap-2">
                               <Input type="number" placeholder="De" value={range.min} onChange={e => updateIrpfRange(tIdx, rIdx, 'min', e.target.value)} />
                               <Input type="number" placeholder="Até" value={range.max || ''} onChange={e => updateIrpfRange(tIdx, rIdx, 'max', e.target.value)} />
                               <Input type="number" placeholder="Aliq %" value={range.rate} onChange={e => updateIrpfRange(tIdx, rIdx, 'rate', e.target.value)} />
                               <Input type="number" placeholder="Dedução" value={range.deduction} onChange={e => updateIrpfRange(tIdx, rIdx, 'deduction', e.target.value)} />
                             </div>
                           ))}
                           <Button type="button" variant="outline" size="sm" onClick={() => { const n = [...irpfTables]; n[tIdx].ranges.push({ min: 0, max: 0, rate: 0, deduction: 0 }); setIrpfTables(n); }}><Plus className="h-3 w-3 mr-1" /> Faixa</Button>
                         </div>

                         <div className="space-y-2 pt-2 border-t">
                           <Label className="text-[10px] uppercase font-bold text-muted-foreground">Regras de Redução</Label>
                           {table.reductionRules.map((rule, ri) => (
                             <div key={ri} className="grid grid-cols-3 gap-2">
                               <Input type="number" placeholder="De" value={rule.min} onChange={e => { const n = [...irpfTables]; n[tIdx].reductionRules[ri].min = parseFloat(e.target.value) || 0; setIrpfTables(n); }} />
                               <Input type="number" placeholder="Até" value={rule.max || ''} onChange={e => { const n = [...irpfTables]; n[tIdx].reductionRules[ri].max = parseFloat(e.target.value) || 0; setIrpfTables(n); }} />
                               <Input placeholder="Descrição da Regra" value={rule.description} onChange={e => { const n = [...irpfTables]; n[tIdx].reductionRules[ri].description = e.target.value; setIrpfTables(n); }} />
                             </div>
                           ))}
                           <Button type="button" variant="outline" size="sm" onClick={() => addIrpfReduction(tIdx)}><Plus className="h-3 w-3 mr-1" /> Regra</Button>
                         </div>
                       </div>
                     ))}
                     <Button type="button" variant="outline" onClick={addIrpfTable}><Plus className="h-4 w-4 mr-2" /> Nova Tabela IRPF</Button>
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