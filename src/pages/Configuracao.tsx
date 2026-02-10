import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Webhook } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Configuracao = () => {
  // Estado para armazenar as URLs dos webhooks, inicializadas com os valores de exemplo
  const [webhookTestUrl, setWebhookTestUrl] = useState('https://jota-empresas-n8n.ubjifz.easypanel.host/webhook-test/e50090ba-ffc9-45e7-86f5-9a0467f4f794');
  const [webhookProdUrl, setWebhookProdUrl] = useState('https://jota-empresas-n8n.ubjifz.easypanel.host/webhook/e50090ba-ffc9-45e7-86f5-9a0467f4f794');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Por enquanto, apenas exibimos uma notificação de sucesso.
    // No futuro, aqui salvaremos as configurações.
    console.log("Salvando webhooks:", { webhookTestUrl, webhookProdUrl });
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