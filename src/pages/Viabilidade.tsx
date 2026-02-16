import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { toast } from "sonner";
import { Bot, Send, Sparkles, FileText } from 'lucide-react';
import { AiAnalysisReport } from '@/components/AiAnalysisReport';

const Viabilidade = () => {
  const [businessIdea, setBusinessIdea] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const handleSendToAI = async () => {
    if (!businessIdea.trim()) {
      toast.error("Descreva sua ideia de negócio antes de enviar.");
      return;
    }

    setIsLoading(true);
    setAiReport(null);
    setExecutionTime(null);
    const startTime = performance.now();
    const toastId = toast.loading("Aguardando diagnóstico da IA...");

    try {
      // Adicionamos a tag para o N8N filtrar
      const payload = {
        analise_simples: true,
        prompt: businessIdea
      };

      const webhookUrl = localStorage.getItem('jota-webhook-prod') || 'https://jota-empresas-n8n.ubjifz.easypanel.host/webhook/e50090ba-ffc9-45e7-86f5-9a0467f4f794';

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Erro na comunicação com o servidor de IA.");
      
      const data = await response.json();
      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000;
      setExecutionTime(duration);

      let reportText = "";
      if (Array.isArray(data) && data[0]?.content?.parts?.[0]?.text) {
        reportText = data.map((item: any) => item.content.parts.map((part: any) => part.text).join("\n")).join("\n\n---\n\n");
      } else {
        throw new Error("Formato de resposta da IA não reconhecido.");
      }
      
      setAiReport(reportText);
      toast.success(`Diagnóstico concluído em ${duration.toFixed(2)}s!`, { id: toastId });

    } catch (error: any) {
      toast.error("Falha na análise", { id: toastId, description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-primary">
            <Sparkles className="h-6 w-6" />
            Análise de Viabilidade de Novo Negócio
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Descreva sua ideia de negócio e a IA irá gerar um diagnóstico tributário e de obrigações para você começar com o pé direito.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label htmlFor="business-idea" className="font-bold">Descreva sua ideia de negócio:</Label>
            <Textarea
              id="business-idea"
              value={businessIdea}
              onChange={(e) => setBusinessIdea(e.target.value)}
              placeholder="Exemplo: Quero abrir um minimercado em São Paulo, capital. Pretendo vender produtos alimentícios, bebidas e alguns itens de limpeza. Serei eu e mais 2 funcionários. Capital inicial de R$ 50.000."
              className="min-h-[150px]"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Seja o mais detalhado possível: inclua atividades, cidade/estado, número de sócios, se terá funcionários, faturamento estimado, etc.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button onClick={handleSendToAI} disabled={isLoading} size="lg" className="bg-accent hover:bg-accent/90">
          {isLoading ? "Analisando..." : "Gerar Diagnóstico com IA"}
          <Send className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {aiReport && (
        <div id="ai-report-section">
          <AiAnalysisReport report={aiReport} onClose={() => setAiReport(null)} executionTime={executionTime || undefined} />
        </div>
      )}
    </div>
  );
};

export default Viabilidade;