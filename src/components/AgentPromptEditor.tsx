import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquareQuote, Wrench, Terminal, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PromptConfig } from '@/lib/geminiService';
import { DynamicSkill } from '@/lib/skills/taxSkills';

// Variáveis de contexto que o Agente pode usar para entender os dados do cliente
const CONTEXT_VARIABLES = [
  { name: 'empresa.razaoSocial', desc: 'Nome da empresa ou projeto' },
  { name: 'empresa.naturezaJuridica', desc: 'Natureza jurídica (SLU, LTDA, EI...)' },
  { name: 'empresa.classificacaoFiscal', desc: 'ME ou EPP' },
  { name: 'empresa.capitalSocial', desc: 'Valor do capital social em R$' },
  { name: 'empresa.numSocios', desc: 'Quantidade de sócios' },
  { name: 'empresa.localizacao.municipio', desc: 'Cidade da empresa' },
  { name: 'empresa.localizacao.estado', desc: 'UF da empresa (ex: PA)' },
  { name: 'empresa.tributacaoPretendida', desc: 'Regime tributário escolhido' },
  { name: 'operacional.cnaes', desc: 'Lista de objetos CNAE informados' },
  { name: 'operacional.descricaoAtividades', desc: 'Texto livre das atividades' },
  { name: 'financeiro.faturamento.anual_total', desc: 'Receita Bruta Anual total' },
  { name: 'financeiro.fator_r.percentual_atual', desc: 'Relação Folha/Faturamento (%)' },
  { name: 'conformidade_riscos.alertas_criticos.confusao_patrimonial', desc: 'Risco de mistura PF/PJ' },
  { name: 'conformidade_riscos.alertas_criticos.retirada_informal', desc: 'Risco fiscal na retirada de lucros' },
];

interface AgentPromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  prompts: PromptConfig[];
  skills: DynamicSkill[];
  className?: string;
}

export const AgentPromptEditor: React.FC<AgentPromptEditorProps> = ({ value, onChange, prompts, skills, className }) => {
  const [menu, setMenu] = useState<{ type: 'prompt_or_var' | 'skill', filter: string } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filtra itens com base no que o usuário digitou após o gatilho
  const getFilteredItems = () => {
    if (!menu) return [];
    const filter = menu.filter.toLowerCase();
    
    if (menu.type === 'skill') {
      return skills.filter(s => s.name.toLowerCase().includes(filter)).map(s => ({ ...s, display: s.name, typeLabel: 'Skill', icon: Wrench }));
    } else {
      // No gatilho '@', mostramos tanto Prompts da biblioteca quanto Variáveis de Contexto
      const filteredPrompts = prompts.filter(p => p.title.toLowerCase().includes(filter)).map(p => ({ ...p, display: p.title, typeLabel: 'Prompt', icon: MessageSquareQuote }));
      const filteredVars = CONTEXT_VARIABLES.filter(v => v.name.toLowerCase().includes(filter)).map(v => ({ ...v, display: v.name, typeLabel: 'Variável', icon: Database }));
      return [...filteredPrompts, ...filteredVars];
    }
  };

  const filteredItems = getFilteredItems();

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);

    const cursor = e.target.selectionStart || 0;
    const textBefore = val.substring(0, cursor);
    
    const lastAt = textBefore.lastIndexOf('@');
    const lastHash = textBefore.lastIndexOf('#');
    
    const lastTrigger = Math.max(lastAt, lastHash);
    
    if (lastTrigger !== -1) {
      const charBefore = textBefore[lastTrigger - 1];
      // O gatilho deve estar no início ou precedido por espaço/quebra de linha
      if (lastTrigger === 0 || charBefore === ' ' || charBefore === '\n') {
        const query = textBefore.substring(lastTrigger + 1);
        // Fecha o menu se houver espaço (fim da busca)
        if (!query.includes(' ') && !query.includes('\n')) {
          setMenu({ 
            type: lastTrigger === lastAt ? 'prompt_or_var' : 'skill', 
            filter: query 
          });
          setSelectedIndex(0);
          return;
        }
      }
    }
    setMenu(null);
  };

  const insertItem = (item: any) => {
    const cursor = textareaRef.current?.selectionStart || 0;
    const textBefore = value.substring(0, cursor);
    const textAfter = value.substring(cursor);
    const lastTrigger = Math.max(textBefore.lastIndexOf('@'), textBefore.lastIndexOf('#'));
    
    // Define o que será inserido no texto
    let contentToInsert = "";
    if (item.typeLabel === 'Prompt') contentToInsert = item.content;
    else if (item.typeLabel === 'Variável') contentToInsert = item.name;
    else contentToInsert = item.name; // Skill
    
    const newValue = value.substring(0, lastTrigger) + contentToInsert + " " + textAfter;
    onChange(newValue);
    setMenu(null);
    
    setTimeout(() => {
      textareaRef.current?.focus();
      const newPos = lastTrigger + contentToInsert.length + 1;
      textareaRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (menu && filteredItems.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertItem(filteredItems[selectedIndex]);
      } else if (e.key === 'Escape') {
        setMenu(null);
      }
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2 mb-1.5">
        <Badge variant="outline" className="text-[9px] uppercase bg-primary/5 border-primary/20 text-primary">Dica: Use @ para Variáveis/Prompts e # para Skills</Badge>
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        className={cn(
          "font-mono text-[11px] h-48 bg-slate-950 text-primary border-primary/30 resize-y focus-visible:ring-primary/50",
          className
        )}
        placeholder="Construa o Agente... Ex: Você tem acesso à skill #comparar_regimes. Analise a @empresa.razaoSocial..."
      />

      {menu && filteredItems.length > 0 && (
        <div className="absolute z-[100] bottom-full left-0 mb-2 w-80 bg-card border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-muted/90 px-3 py-1.5 border-b border-border flex items-center gap-2">
            <Terminal className="h-3 w-3 text-primary" />
            <span className="text-[9px] font-bold uppercase text-muted-foreground">
              {menu.type === 'prompt_or_var' ? 'Prompts e Variáveis' : 'Minhas Skills'}
            </span>
          </div>
          <div className="max-h-60 overflow-y-auto bg-background/95 backdrop-blur-sm">
            {filteredItems.map((item: any, idx) => (
              <div
                key={idx}
                className={cn(
                  "px-3 py-2 cursor-pointer flex flex-col gap-0.5 transition-colors border-l-4",
                  idx === selectedIndex 
                    ? "bg-primary/10 border-primary" 
                    : "hover:bg-muted/50 border-transparent"
                )}
                onClick={() => insertItem(item)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-3 w-3 opacity-50" />
                    <span className="text-[11px] font-bold text-foreground">{item.display}</span>
                  </div>
                  <Badge variant="outline" className="text-[8px] h-3 px-1 uppercase opacity-50">
                    {item.typeLabel}
                  </Badge>
                </div>
                <p className="text-[9px] text-muted-foreground line-clamp-1">
                  {item.role || item.desc || item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};