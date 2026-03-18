import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Webhook, Building, UserCheck, KeyRound, Bot, Trash2, Plus, Save, Lock, Table as TableIcon, Info } from 'lucide-react';
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
    saveInssTables(inssTables);
    saveIrpfTables(irpfTables);
    toast.success("Configurações salvas com sucesso!");
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
                <div className="space-y-4 rounded-lg border border-border p-4">
                   <h3 className="text-lg font-semibold flex items-center gap-2"><UserCheck className="h-5 w-5 text-muted-foreground" />Responsável Técnico</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2"><Label>Nome do Contador</Label><Input value={contadorNome} onChange={(e) => setContadorNome(e.target.value)} /></div>
                     <div className="space-y-2"><Label>CRC</Label><Input value={contadorCrc} onChange={(e) => setContadorCrc(e.target.value)} /></div>
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