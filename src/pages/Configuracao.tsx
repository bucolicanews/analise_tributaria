import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Webhook, Building, UserCheck } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const UFs = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const Configuracao = () => {
  const [webhookTestUrl, setWebhookTestUrl] = useState(localStorage.getItem('jota-webhook-test') || 'https://jota-empresas-n8n.ubjifz.easypanel.host/webhook-test/e50090ba-ffc9-45e7-86f5-9a0467f4f794');
  const [webhookProdUrl, setWebhookProdUrl] = useState(localStorage.getItem('jota-webhook-prod') || 'https://jota-empresas-n8n.ubjifz.easypanel.host/webhook/e50090ba-ffc9-45e7-86f5-9a0467f4f794');

  const [razaoSocial, setRazaoSocial] = useState(localStorage.getItem('jota-razaoSocial') || '');
  const [nomeFantasia, setNomeFantasia] = useState(localStorage.getItem('jota-nomeFantasia') || '');
  const [cnpj, setCnpj] = useState(localStorage.getItem('jota-cnpj') || '');
  const [cnaes, setCnaes] = useState(localStorage.getItem('jota-cnaes') || '');
  const [uf, setUf] = useState(localStorage.getItem('jota-uf') || 'SP');
  
  // Novos campos para o Relatório
  const [contadorNome, setContadorNome] = useState(localStorage.getItem('jota-contador-nome') || '');
  const [contadorCrc, setContadorCrc] = useState(localStorage.getItem('jota-contador-crc') || '');

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
    
    toast.success("Configurações salvas com sucesso!");
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

            {/* DADOS DO CONTADOR RESPONSÁVEL */}
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

            {/* INTEGRAÇÕES */}
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

            <Button type="submit" size="lg" className="w-full sm:w-auto">Salvar Todas as Configurações</Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default Configuracao;