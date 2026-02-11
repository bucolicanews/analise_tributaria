import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Download, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface AiAnalysisReportProps {
  report: string;
  onClose: () => void;
}

export const AiAnalysisReport: React.FC<AiAnalysisReportProps> = ({ report, onClose }) => {
  return (
    <Card className="shadow-elegant border-accent/50 bg-accent/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-accent" />
          <CardTitle className="text-xl font-bold text-accent">Relatório de Inteligência Tributária</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>Fechar</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-invert max-w-none text-foreground/90">
          {/* Renderização simples do texto da IA. Em um app real, usaríamos react-markdown */}
          <div className="whitespace-pre-wrap font-sans leading-relaxed">
            {report}
          </div>
        </div>
        <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-500/90">
            Este relatório foi gerado por Inteligência Artificial com base nos parâmetros fornecidos. 
            Sempre valide as decisões estratégicas com seu contador antes de aplicá-las.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};