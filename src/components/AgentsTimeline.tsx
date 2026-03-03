import React from 'react';
import { CheckCircle2, XCircle, Loader2, FileText, Printer, Circle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentStatus } from '@/lib/geminiService';

interface AgentsTimelineProps {
  agents: AgentStatus[];
  onViewReport: (agent: AgentStatus) => void;
  onPrintReport: (agent: AgentStatus) => void;
  onRunSingle: (agent: AgentStatus) => void;
}

function AgentDot({ agent, index, total, onViewReport, onPrintReport, onRunSingle }: {
  agent: AgentStatus;
  index: number;
  total: number;
  onViewReport: (agent: AgentStatus) => void;
  onPrintReport: (agent: AgentStatus) => void;
  onRunSingle: (agent: AgentStatus) => void;
}) {
  const isLast = index === total - 1;

  return (
    <div className="flex flex-col items-center flex-1 relative">
      {!isLast && (
        <div className="absolute top-5 left-1/2 w-full h-0.5 z-0">
          <div className="h-full bg-border w-full" />
          {agent.status === 'done' && (
            <div className="h-full bg-green-500 w-full absolute top-0 left-0 transition-all duration-700" />
          )}
        </div>
      )}

      <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-500
        border-border bg-background
        data-[status=loading]:border-blue-500 data-[status=loading]:bg-blue-50
        data-[status=done]:border-green-500 data-[status=done]:bg-green-50
        data-[status=error]:border-red-500 data-[status=error]:bg-red-50
      " data-status={agent.status}>
        {agent.status === 'idle' && <Circle className="h-4 w-4 text-muted-foreground" />}
        {agent.status === 'loading' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
        {agent.status === 'done' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
        {agent.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
      </div>

      <p className={`mt-2 text-xs font-semibold text-center max-w-[100px] leading-tight transition-colors duration-300
        ${agent.status === 'loading' ? 'text-blue-600 animate-pulse' : ''}
        ${agent.status === 'done' ? 'text-green-700' : ''}
        ${agent.status === 'error' ? 'text-red-600' : ''}
        ${agent.status === 'idle' ? 'text-muted-foreground' : ''}
      `}>
        {agent.nome}
      </p>

      <p className="mt-1 text-[10px] text-muted-foreground text-center">
        {agent.status === 'idle' && 'Aguardando'}
        {agent.status === 'loading' && 'Processando...'}
        {agent.status === 'done' && 'Concluído'}
        {agent.status === 'error' && (agent.errorMessage || 'Erro')}
      </p>

      {agent.status === 'done' && agent.report && (
        <div className="mt-3 flex flex-col gap-1 items-center">
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 px-2 border-green-500 text-green-700 hover:bg-green-50"
            onClick={() => onViewReport(agent)}
          >
            <FileText className="h-3 w-3 mr-1" />
            Ver Relatório
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 px-2"
            onClick={() => onPrintReport(agent)}
          >
            <Printer className="h-3 w-3 mr-1" />
            Imprimir PDF
          </Button>
        </div>
      )}

      {(agent.status === 'idle' || agent.status === 'error') && (
        <div className="mt-3">
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 px-2 border-indigo-400 text-indigo-600 hover:bg-indigo-50"
            onClick={() => onRunSingle(agent)}
          >
            <Play className="h-3 w-3 mr-1" />
            Testar
          </Button>
        </div>
      )}
    </div>
  );
}

export function AgentsTimeline({ agents, onViewReport, onPrintReport, onRunSingle }: AgentsTimelineProps) {
  if (agents.length === 0) return null;

  const doneCount = agents.filter(a => a.status === 'done').length;
  const allDone = doneCount === agents.length;
  const hasError = agents.some(a => a.status === 'error');

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Loader2 className={`h-4 w-4 ${allDone ? 'text-green-500' : 'text-blue-500 animate-spin'}`} />
          {allDone
            ? `${doneCount} agente${doneCount > 1 ? 's' : ''} concluído${doneCount > 1 ? 's' : ''}`
            : hasError
            ? 'Alguns agentes encontraram erros'
            : `Executando agentes... (${doneCount}/${agents.length})`}
        </h3>
        <div className="flex gap-1">
          {agents.map(a => (
            <div
              key={a.id}
              className={`h-1.5 w-6 rounded-full transition-colors duration-500
                ${a.status === 'done' ? 'bg-green-500' : ''}
                ${a.status === 'loading' ? 'bg-blue-400 animate-pulse' : ''}
                ${a.status === 'error' ? 'bg-red-400' : ''}
                ${a.status === 'idle' ? 'bg-muted' : ''}
              `}
            />
          ))}
        </div>
      </div>

      <div className="flex items-start justify-between gap-2">
        {agents.map((agent, index) => (
          <AgentDot
            key={agent.id}
            agent={agent}
            index={index}
            total={agents.length}
            onViewReport={onViewReport}
            onPrintReport={onPrintReport}
            onRunSingle={onRunSingle}
          />
        ))}
      </div>
    </div>
  );
}
