import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck, Search, FileText, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProgressStep = 'idle' | 'validating_data' | 'analyzing' | 'auditing' | 'validating_audit' | 'completed';

interface AnalysisProgressProps {
  step: ProgressStep;
}

const steps = [
  { id: 'validating_data', label: 'Validando os dados...', icon: Search },
  { id: 'analyzing', label: 'Realizando a análise...', icon: Zap },
  { id: 'auditing', label: 'Realizando auditoria...', icon: ShieldCheck },
  { id: 'validating_audit', label: 'Validando a auditoria...', icon: FileText },
  { id: 'completed', label: 'Análise concluída!', icon: CheckCircle2 },
];

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ step }) => {
  if (step === 'idle') return null;

  const currentIdx = steps.findIndex(s => s.id === step);

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-card border border-primary/20 rounded-xl shadow-elegant animate-in fade-in zoom-in-95 duration-300">
      <div className="space-y-6">
        {steps.map((s, idx) => {
          const isPast = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const Icon = s.icon;

          return (
            <div 
              key={s.id} 
              className={cn(
                "flex items-center gap-4 transition-all duration-500",
                isPast ? "opacity-60" : "opacity-100",
                !isPast && !isCurrent && "opacity-30 grayscale"
              )}
            >
              <div className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                isPast ? "bg-success/20 border-success text-success" : 
                isCurrent ? "bg-primary/20 border-primary text-primary animate-pulse" : 
                "bg-muted border-border text-muted-foreground"
              )}>
                {isPast ? <CheckCircle2 className="h-6 w-6" /> : 
                 isCurrent ? <Loader2 className="h-5 w-5 animate-spin" /> : 
                 <Icon className="h-5 w-5" />}
              </div>
              
              <div className="flex-1">
                <p className={cn(
                  "text-sm font-bold uppercase tracking-tight",
                  isCurrent ? "text-primary" : isPast ? "text-success" : "text-muted-foreground"
                )}>
                  {s.label}
                </p>
                {isCurrent && (
                  <div className="h-1 w-full bg-muted rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-primary animate-progress-infinite" style={{ width: '40%' }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};