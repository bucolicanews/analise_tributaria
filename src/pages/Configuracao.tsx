import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Webhook, Building, UserCheck, KeyRound, Bot, Trash2, Plus, Save, Lock } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgentConfig, DEFAULT_AGENTS, loadAgentsFromStorage, saveAgentsToStorage } from '@/lib/geminiService';
import { useAuth } from '@/contexts/AuthContext';

const UFs = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const Configuracao = () => {
  const { autenticado } = useAuth();
  const [webhookTestUrl, setWebhookTestUrl] = useState(localStorage.getItem('jota-webhook-test') || 'https://jota-empresas-n8n.ubjifz.easypanel.host/webhook-test/e50090ba-ffc9-45e7-86f5-9a0467f4f794');
  const [webhookProdUrl, setWebhookProdUrl] = useState(localStorage.getItem('jota-webhook-prod') || 'https://jota-empresas-n8n.ubjifz.easypanel.host/webhook/e50090ba-ffc9-45e7-86f5-9a0467f4f794');

  const [razaoSocial, setRazaoSocial] = useState(localStorage.getItem('jota-razaoSocial') || '');
  const [nomeFantasia, setNomeFantasia] = useState(localStorage.getItem('jota-nomeFantasia') || '');
  const [cnpj, setCnpj] = useState(localStorage.getItem('jota-cnpj') || '');
  const [cnaes, setCnaes] = useState(localStorage.getItem('jota-cnaes') || '');
  const [uf, setUf] = useState(localStorage.getItem('jota-uf') || 'SP');
  
  const [contadorNome, setContadorNome] = useState(localStorage.getItem('jota-contador-nome') || '');
  const [contadorCrc, setContadorCrc] = useState(localStorage.getItem('jota-contador-crc') || '');

  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('jota-gemini-key') || '');

  const [agents, setAgents] = useState<AgentConfig[]>(() => loadAgentsFromStorage());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [editWebhookUrl, setEditWebhookUrl] = useState('');
  const [editOrder, setEditOrder] = useState<number>(1);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('jota-razaoSocial', razaoSocial);
    localStorage.setItem('jota-nomeFantasia', nomeFantasia);
    localStorage.setItem('jota-cnpj', cnpj);
    localStorage.setItem('jota-cnaes', cnaes);
    localStorage.setItem('jota-uf', uf);
    localStorage.setItem('jota-webhook-test', webhookTestUrl);
    localStorage.setItem('jota-webhook-prod', webhookProdUrl);
    localStorage.setItem('jota-contador-nome', contadorNome);
    localStorage.setItem('jota-contador-crc', contadorCrc);
    localStorage.setItem('jota-gemini-key', geminiKey);
    toast.success("Configurações salvas com sucesso!");
  };

  const startEditing = (agent: AgentConfig, index?: number) => {
    setEditingId(agent.id);
    setEditNome(agent.nome);
    setEditPrompt(agent.systemPrompt);
    setEditWebhookUrl(agent.webhookUrl || '');
    setEditOrder(agent.order ?? (index !== undefined ? index + 1 : 1));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditNome('');
    setEditPrompt('');
    setEditWebhookUrl('');
    setEditOrder(1);
  };

  const saveAgent = (id: string) => {
    if (!editNome.trim() || !editPrompt.trim()) {
      toast.error("Nome e Prompt são obrigatórios.");
      return;
    }
    const updated = agents.map(a => a.id === id ? { ...a, nome: editNome.trim(), systemPrompt: editPrompt.trim(), webhookUrl: editWebhookUrl.trim() || undefined, order: editOrder } : a);
    setAgents(updated);
    saveAgentsToStorage(updated);
    setEditingId(null);
    toast.success("Agente salvo.");
  };

  const deleteAgent = (id: string) => {
    const updated = agents.filter(a => a.id !== id);
    setAgents(updated);
    saveAgentsToStorage(updated);
    toast.success("Agente removido.");
  };

  const addAgent = () => {
    const newAgent: AgentConfig = {
      id: `agente-${Date.now()}`,
      nome: 'Novo Agente',
      systemPrompt: 'Você é um especialista em...',
      order: agents.length + 1,
    };
    const updated = [...agents, newAgent];
    setAgents(updated);
    saveAgentsToStorage(updated);
    startEditing(newAgent, agents.length);
  };

  const resetToDefaults = () => {
    setAgents(DEFAULT_AGENTS);
    saveAgentsToStorage(DEFAULT_AGENTS);
    toast.success("Agentes padrão restaurados.");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <form onSubmit={handleSave}>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              Configurações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            
            {/* DADOS DA EMPRESA */}
            <div className="space-y-4 rounded-lg border border-border p-4">
               <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  Dados da Empresa (Cabeçalho dos Relatórios)
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="razao-social">Razão Social</Label>
                    <Input id="razao-social" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} placeholder="Sua Empresa Contábil Ltda" />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
                 </div>
                 <div className="space-y-2">
                    <Label>Estado (UF)</Label>
                    <Select value={uf} onValueChange={setUf}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {UFs.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                      </SelectContent>
                    </Select>
                 </div>
               </div>
            </div>

            {/* DADOS DO CONTADOR */}
            {autenticado && (
            <div className="space-y-4 rounded-lg border border-border p-4">
               <h3 className="text-lg font-semibold flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-muted-foreground" />
                  Responsável Técnico (Assinatura Digital)
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="contador-nome">Nome do Contador</Label>
                    <Input id="contador-nome" value={contadorNome} onChange={(e) => setContadorNome(e.target.value)} placeholder="Ex: João da Silva" />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="contador-crc">CRC</Label>
                    <Input id="contador-crc" value={contadorCrc} onChange={(e) => setContadorCrc(e.target.value)} placeholder="Ex: PA-000000/O" />
                 </div>
               </div>
               <p className="text-xs text-muted-foreground">Estes dados aparecerão no rodapé e na folha de rosto dos relatórios gerados.</p>
            </div>
            )}

            {/* CHAVE API GEMINI */}
            {autenticado && (
            <div className="space-y-4 rounded-lg border border-border p-4">
               <h3 className="text-lg font-semibold flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-muted-foreground" />
                  Chave API Gemini (Agentes IA Diretos)
               </h3>
               <div className="space-y-2">
                  <Label htmlFor="gemini-key">Chave API Gemini (Google AI Studio)</Label>
                  <Input
                    id="gemini-key"
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIza..."
                    autoComplete="off"
                  />
               </div>
               <p className="text-xs text-muted-foreground">
                  Usada pelos agentes IA diretos (sem n8n). Obtenha sua chave em{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline text-primary">
                    aistudio.google.com
                  </a>
               </p>
            </div>
            )}

            {/* INTEGRAÇÕES N8N */}
            {autenticado && (
            <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/10">
               <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-muted-foreground" />
                  Integrações (n8n)
               </h3>
               <div className="space-y-2">
                  <Label htmlFor="webhook-test">URL do Webhook de Teste</Label>
                  <Input id="webhook-test" type="url" value={webhookTestUrl} onChange={(e) => setWebhookTestUrl(e.target.value)} />
               </div>
               <div className="space-y-2">
                  <Label htmlFor="webhook-prod">URL do Webhook de Produção</Label>
                  <Input id="webhook-prod" type="url" value={webhookProdUrl} onChange={(e) => setWebhookProdUrl(e.target.value)} />
               </div>
            </div>
            )}

            {!autenticado && (
              <div className="flex items-center gap-2 rounded-lg border border-border p-4 text-sm text-muted-foreground bg-muted/20">
                <Lock className="h-4 w-4 shrink-0" />
                <span>Faça login com a senha de acesso para editar as demais configurações do sistema.</span>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full sm:w-auto">Salvar Todas as Configurações</Button>
          </CardContent>
        </Card>
      </form>

      {/* GERENCIADOR DE AGENTES — fora do form pois tem sua própria lógica de save */}
      {autenticado && (
      <Card className="shadow-card mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Gerenciador de Agentes IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cadastre e edite os agentes que serão executados em sequência. A ordem define qual agente executa primeiro — cada agente recebe os relatórios dos anteriores.
          </p>

          <div className="space-y-4">
            {agents.map((agent, index) => (
              <div key={agent.id} className="rounded-lg border border-border p-4 space-y-3">
                {editingId === agent.id ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome do Agente</Label>
                        <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} placeholder="Ex: Análise Tributária" />
                      </div>
                      <div className="space-y-2">
                        <Label>Ordem de Execução</Label>
                        <Input
                          type="number"
                          min={1}
                          value={editOrder}
                          onChange={(e) => setEditOrder(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Prompt do Sistema</Label>
                      <Textarea
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        rows={8}
                        placeholder="Você é um especialista em..."
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL do Webhook n8n</Label>
                      <Input
                        value={editWebhookUrl}
                        onChange={(e) => setEditWebhookUrl(e.target.value)}
                        type="url"
                        placeholder="https://seu-n8n.host/webhook/..."
                      />
                      <p className="text-xs text-muted-foreground">Se preenchido, enviará um POST para este webhook. Caso contrário, chama o Gemini direto.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveAgent(agent.id)}>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditing}>Cancelar</Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0 mt-0.5">
                        {agent.order ?? index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{agent.nome}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{agent.systemPrompt}</p>
                        {agent.webhookUrl && (
                          <p className="text-xs text-indigo-500 mt-1 truncate">{agent.webhookUrl}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => startEditing(agent, index)}>Editar</Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteAgent(agent.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={addAgent}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agente
            </Button>
            <Button type="button" variant="ghost" className="text-muted-foreground" onClick={resetToDefaults}>
              Restaurar Padrões
            </Button>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default Configuracao;
