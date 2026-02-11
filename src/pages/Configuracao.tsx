import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Webhook, Building } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Textarea } from '@/components/ui/textarea';

const Configuracao = () => {
  // Estado para webhooks, inicializado com valores do localStorage ou padrão
  const [webhookTestUrl, setWebhookTestUrl] = useState(localStorage.getItem('jota-webhook-test') || 'https://jota-empresas-n8n.ubjifz.easypanel.host/webhook-test/e50090ba-ffc9-45e7-86f5-9a0467f4f794');
  const [webhookProdUrl, setWebhookProdUrl] = useState(localStorage.getItem('jota-webhook-prod') || 'https://jota-empresas-n8n.ubjifz.easypanel.host/webhook/e50090ba-ffc9-45e7-86f5-9a0467f4f794');

  // Estado para dados da empresa, inicializado com valores do localStorage
  const [razaoSocial, setRazaoSocial] = useState(localStorage.getItem('jota-razaoSocial') || '');
  const [nomeFantasia, setNomeFantasia] = useState(localStorage.getItem('jota-nomeFantasia') || '');
  const [cnpj, setCnpj] = useState(localStorage.getItem('jota-cnpj') || '');
  const [faturamento12Meses, setFaturamento12Meses] = useState(localStorage.getItem('jota-faturamento12Meses') || '');
  const [cnaes, setCnaes] = useState(localStorage.getItem('jota-cnaes') || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Salva os dados da empresa no localStorage
    localStorage.setItem('jota-razaoSocial', razaoSocial);
    localStorage.setItem('jota-nomeFantasia', nomeFantasia);
    localStorage.setItem('jota-cnpj', cnpj);
    localStorage.setItem('jota-faturamento12Meses', faturamento12Meses);
    localStorage.setItem('jota-cnaes', cnaes);

    // Salva os webhooks no localStorage
    localStorage.setItem('jota-webhook-test', webhookTestUrl);
    localStorage.setItem('jota-webhook-prod', webhookProdUrl);
    
    toast.success("Configurações salvas com sucesso!");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <form onSubmit={handleSave}>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Seção de Dados da Empresa */}
            <div className="space-y-4 rounded-lg border border-border p-4">
               <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  Dados da Empresa
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="razao-social">Razão Social</Label>
                    <Input
                       id="razao-social"
                       value={razaoSocial}
                       onChange={(e) => setRazaoSocial(e.target.value)}
                    />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="nome-fantasia">Nome Fantasia</Label>
                    <Input
                       id="nome-fantasia"
                       value={nomeFantasia}
                       onChange={(e) => setNomeFantasia(e.target.value)}
                    />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                       id="cnpj"
                       value={cnpj}
                       onChange={(e) => setCnpj(e.target.value)}
                    />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="faturamento">Faturamento (Últimos 12 Meses)</Label>
                    <Input
                       id="faturamento"
                       type="number"
                       placeholder="R$"
                       value={faturamento12Meses}
                       onChange={(e) => setFaturamento12Meses(e.target.value)}
                    />
                 </div>
               </div>
               <div className="space-y-2">
                  <Label htmlFor="cnaes">CNAE's</Label>
                  <Textarea
                     id="cnaes"
                     placeholder="Liste os CNAE's, separados por vírgula"
                     value={cnaes}
                     onChange={(e) => setCnaes(e.target.value)}
                  />
               </div>
            </div>

            {/* Seção de Webhooks */}
            <div className="space-y-4 rounded-lg border border-border p-4">
               <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-muted-foreground" />
                  Webhooks de Integração
               </h3>
               <div className="space-y-2">
                  <Label htmlFor="webhook-test">URL do Webhook de Teste</Label>
                  <Input
                     id="webhook-test"
                     type="url"
                     placeholder="https://..."
                     value={webhookTestUrl}
                     onChange={(e) => setWebhookTestUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                     Usado para enviar dados para o ambiente de teste.
                  </p>
               </div>
               <div className="space-y-2">
                  <Label htmlFor="webhook-prod">URL do Webhook de Produção</Label>
                  <Input
                     id="webhook-prod"
                     type="url"
                     placeholder="https://..."
                     value={webhookProdUrl}
                     onChange={(e) => setWebhookProdUrl(e.target.value)}
                  />
                   <p className="text-xs text-muted-foreground">
                     Usado para enviar dados para o ambiente de produção.
                  </p>
               </div>
            </div>
            
            <Button type="submit">Salvar Configurações</Button>

          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default Configuracao;