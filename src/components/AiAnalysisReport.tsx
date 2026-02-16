import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Download, AlertCircle, X, Clock, FileCheck } from 'lucide-react';
import { Button } from './ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { ViabilityReportPDF } from './ViabilityReportPDF';
import QRCode from 'qrcode';

interface AiAnalysisReportProps {
  report: string;
  onClose: () => void;
  executionTime?: number;
}

export const AiAnalysisReport: React.FC<AiAnalysisReportProps> = ({ report, onClose, executionTime }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  
  // Dados vindos da configuração
  const razaoSocial = localStorage.getItem('jota-razaoSocial') || 'Jota Contabilidade';
  const contadorNome = localStorage.getItem('jota-contador-nome') || '';
  const contadorCrc = localStorage.getItem('jota-contador-crc') || '';
  const uf = localStorage.getItem('jota-uf') || 'PA';
  
  // Extrair o nome do cliente do relatório se possível, ou usar genérico
  // (Em uma implementação real, passariamos via props do componente pai)
  const clientName = "Cliente Jota Empreendimentos"; 

  useEffect(() => {
    // Gerar QR Code único para validação (simulação de hash)
    const uniqueId = Math.random().toString(36).substring(7);
    const validationUrl = `https://jotaempresas.com/validar/${uniqueId}`;
    
    QRCode.toDataURL(validationUrl, { width: 100, margin: 1, color: { dark: '#334155' } })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error(err));
  }, []);

  return (
    <Card className="shadow-elegant border-accent/50 bg-accent/5 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-accent/20 bg-accent/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent rounded-full">
            <Bot className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold text-accent">Parecer Técnico de Inteligência Fiscal</CardTitle>
              {typeof executionTime === 'number' && (
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
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <FileCheck className="h-4 w-4 mr-2" />
                Gerar PDF Oficial
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
               <div className="flex-1 w-full h-full bg-slate-100 rounded-md overflow-hidden">
                 {qrCodeUrl && (
                   <PDFViewer width="100%" height="100%" className="border-none">
                     <ViabilityReportPDF 
                        reportMarkdown={report}
                        clientName={clientName}
                        clientCity="Belém" // Idealmente viria do input do usuário
                        clientState={uf}
                        companyName={razaoSocial}
                        accountantName={contadorNome}
                        accountantCrc={contadorCrc}
                        qrCodeDataUrl={qrCodeUrl}
                     />
                   </PDFViewer>
                 )}
               </div>
               <div className="p-4 bg-white border-t flex justify-between items-center">
                 <p className="text-xs text-muted-foreground">O PDF é gerado em tempo real no navegador.</p>
                 {qrCodeUrl && (
                   <PDFDownloadLink 
                     document={
                       <ViabilityReportPDF 
                          reportMarkdown={report}
                          clientName={clientName}
                          clientCity="Belém"
                          clientState={uf}
                          companyName={razaoSocial}
                          accountantName={contadorNome}
                          accountantCrc={contadorCrc}
                          qrCodeDataUrl={qrCodeUrl}
                       />
                     } 
                     fileName="relatorio_viabilidade_jota.pdf"
                   >
                     {({ loading }) => (
                       <Button disabled={loading}>
                         {loading ? 'Preparando...' : 'Baixar Arquivo PDF'}
                       </Button>
                     )}
                   </PDFDownloadLink>
                 )}
               </div>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-destructive/10 hover:text-destructive">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 max-h-[500px] overflow-y-auto">
        <div className="prose prose-sm prose-invert prose-accent max-w-none 
          prose-headings:text-accent prose-headings:font-bold prose-headings:border-b prose-headings:border-accent/20 prose-headings:pb-2 prose-headings:mt-8
          prose-p:text-foreground/90 prose-p:leading-relaxed
          prose-strong:text-accent prose-strong:font-bold
          prose-table:border prose-table:border-border/50 prose-table:rounded-lg prose-table:overflow-hidden
          prose-th:bg-accent/20 prose-th:text-accent prose-th:p-3 prose-th:text-xs prose-th:uppercase
          prose-td:p-3 prose-td:border-t prose-td:border-border/30 prose-td:text-sm">
          
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {report}
          </ReactMarkdown>
          
        </div>

        <div className="mt-8 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex gap-3 items-start">
          <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-yellow-500 uppercase mb-1">Aviso Legal</p>
            <p className="text-[10px] text-yellow-500/80 leading-tight">
              Este relatório é gerado por inteligência artificial para fins de simulação. 
              As interpretações legais podem variar. Consulte seu departamento jurídico antes de qualquer decisão.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};