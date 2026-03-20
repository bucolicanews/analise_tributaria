import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquareQuote, Wrench, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PromptConfig } from '@/lib/geminiService';
import { DynamicSkill } from '@/lib/skills/taxSkills';

interface AgentPromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  prompts: PromptConfig[];
  skills: DynamicSkill[];
  className?: string;
}

export const AgentPromptEditor: React.FC<AgentPromptEditorProps> = ({ value, onChange, prompts, skills, className }) => {
  const [menu, setMenu] = useState<{ type: 'prompt' | 'skill', filter: string } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredItems = menu?.type === 'prompt' 
    ? prompts.filter(p => p.title.toLowerCase().includes(menu.filter.toLowerCase()))
    : skills.filter(s => s.name.toLowerCase().includes(menu?.filter.toLowerCase() || ''));

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
      if (lastTrigger === 0 || charBefore === ' ' || charBefore === '\n') {
        const query = textBefore.substring(lastTrigger + 1);
        if (!query.includes(' ') && !query.includes('\n')) {
          setMenu({ 
            type: lastTrigger === lastAt ? 'prompt' : 'skill', 
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
    
    // Se for prompt, inserimos o conteúdo (instruções). Se for skill, inserimos o nome técnico.
    const contentToInsert = menu?.type === 'prompt' ? item.content : item.name;
    
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
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        className={cn(
          "font-mono text-[11px] h-48 bg-slate-950 text-primary border-primary/30 resize-y",
          className
        )}
        placeholder="Construa o Agente... Use @ para importar um Prompt e # para citar uma Skill."
      />

      {menu && filteredItems.length > 0 && (
        <div className="absolute z-[100] bottom-4 left-4 w-80 bg-card border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-muted/90 px-3 py-1.5 border-b border-border flex items-center gap-2">
            {menu.type === 'prompt' ? <MessageSquareQuote className="h-3 w-3 text-indigo-500" /> : <Wrench className="h-3 w-3 text-emerald-500" />}
            <span className="text-[9px] font-bold uppercase text-muted-foreground">
              {menu.type === 'prompt' ? 'Biblioteca de Prompts' : 'Minhas Skills'}
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto bg-background/95">
            {filteredItems.map((item: any, idx) => (
              <div
                key={item.id}
                className={cn(
                  "px-3 py-2 cursor-pointer flex flex-col gap-0.5 transition-colors border-l-4",
                  idx === selectedIndex 
                    ? (menu.type === 'prompt' ? "bg-indigo-500/10 border-indigo-500" : "bg-emerald-500/10 border-emerald-500") 
                    : "hover:bg-muted/50 border-transparent"
                )}
                onClick={() => insertItem(item)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-foreground">
                    {menu.type === 'prompt' ? item.title : item.name}
                  </span>
                  <Badge variant="outline" className="text-[8px] h-3 px-1 uppercase opacity-50">
                    {menu.type === 'prompt' ? 'Prompt' : 'Skill'}
                  </Badge>
                </div>
                <p className="text-[9px] text-muted-foreground line-clamp-1">
                  {menu.type === 'prompt' ? item.role : item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};