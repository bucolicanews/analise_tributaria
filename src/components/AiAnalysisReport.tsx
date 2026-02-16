import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Download, AlertCircle, X, Clock } from 'lucide-react';
import { Button } from './ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AiAnalysisReportProps {
  report: string;
  onClose: () => void;
  executionTime?: number;
}

export const AiAnalysisReport: React.FC<AiAnalysisReportProps> = ({ report, onClose, executionTime }) => {
  return (
    <Card className="shadow-elegant border-accent/50 bg-accent/5 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden print:shadow-none print:border-none print:bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-accent/20 bg-accent/10 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent rounded-full">
            <Bot className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold text-accent">Parecer Técnico de Inteligência Fiscal</CardTitle>
              {executionTime && (
                <div className="flex items-center gap-1 text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-mono">
                  <Clock className="h-3 w-3" />
                  {executionTime.toFixed(2)}s
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Análise Estratégica baseada na Lei 214/2025</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-accent/30 hover:bg-accent/20" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" /> PDF / Imprimir
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-destructive/10 hover:text-destructive">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="prose prose-invert prose-accent max-w-none 
          prose-headings:text-accent prose-headings:font-bold prose-headings:border-b prose-headings:border-accent/20 prose-headings:pb-2 prose-headings:mt-8
          prose-p:text-foreground/90 prose-p:leading-relaxed
          prose-strong:text-accent prose-strong:font-bold
          prose-table:border prose-table:border-border/50 prose-table:rounded-lg prose-table:overflow-hidden
          prose-th:bg-accent/20 prose-th:text-accent prose-th:p-3 prose-th:text-xs prose-th:uppercase
          prose-td:p-3 prose-td:border-t prose-td:border-border/30 prose-td:text-sm
          print:prose-invert-none print:text-black">
          
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {report}
          </ReactMarkdown>
          
        </div>

        <div className="mt-8 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex gap-3 items-start print:hidden">
          <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-yellow-500 uppercase mb-1">Aviso de Isenção de Responsabilidade</p>
            <p className="text-[10px] text-yellow-500/80 leading-tight">
              Este relatório é gerado por algoritmos de inteligência artificial para fins de simulação estratégica. 
              As interpretações da Lei Complementar 214/2025 podem variar. 
              Consulte sempre seu departamento jurídico e contábil antes de qualquer tomada de decisão societária ou fiscal.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};