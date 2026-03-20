import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

const PROMPT_VARIABLES = [
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
  { name: 'operacional.percentual_comercio_industria_servico.comercio', desc: '% de faturamento em comércio' },
  { name: 'operacional.percentual_comercio_industria_servico.servico', desc: '% de faturamento em serviço' },
  { name: 'financeiro.faturamento.anual_total', desc: 'Receita Bruta Anual total' },
  { name: 'financeiro.faturamento.mensal_medio', desc: 'Média de faturamento mensal' },
  { name: 'financeiro.custos_operacionais.fixos_mensais', desc: 'Total de despesas fixas mensais' },
  { name: 'financeiro.fator_r.folha_12_meses', desc: 'Soma da folha de pagamento em 1 ano' },
  { name: 'financeiro.fator_r.percentual_atual', desc: 'Relação Folha/Faturamento (%)' },
  { name: 'societario_trabalhista.quadro_pessoal.num_funcionarios', desc: 'Número de funcionários registrados' },
  { name: 'societario_trabalhista.pro_labore.valor_declarado', desc: 'Valor do pró-labore informado' },
  { name: 'societario_trabalhista.pro_labore.declara_prolabore', desc: 'Se declara pró-labore (true/false)' },
  { name: 'societario_trabalhista.retira_valores_pf', desc: 'Se retira valores na conta PF (true/false)' },
  { name: 'conformidade_riscos.alertas_criticos.confusao_patrimonial', desc: 'Risco de mistura PF/PJ' },
  { name: 'conformidade_riscos.alertas_criticos.retirada_informal', desc: 'Risco fiscal na retirada de lucros' },
  { name: 'conformidade_riscos.alertas_criticos.risco_previdenciario', desc: 'Risco por falta de recolhimento INSS' },
];

interface PromptSystemEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const PromptSystemEditor: React.FC<PromptSystemEditorProps> = ({ value, onChange, className }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [filter, setFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredVars = PROMPT_VARIABLES.filter(v => 
    v.name.toLowerCase().includes(filter.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMenu && filteredVars.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredVars.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredVars.length) % filteredVars.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertVariable(filteredVars[selectedIndex].name);
      } else if (e.key === 'Escape') {
        setShowMenu(false);
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);

    const cursor = e.target.selectionStart || 0;
    const textBefore = val.substring(0, cursor);
    const lastAt = textBefore.lastIndexOf('@');

    if (lastAt !== -1) {
      const charBefore = textBefore[lastAt - 1];
      if (lastAt === 0 || charBefore === ' ' || charBefore === '\n') {
        const query = textBefore.substring(lastAt + 1);
        if (!query.includes(' ') && !query.includes('\n')) {
          setFilter(query);
          setShowMenu(true);
          setSelectedIndex(0);
          return;
        }
      }
    }
    setShowMenu(false);
  };

  const insertVariable = (varName: string) => {
    const cursor = textareaRef.current?.selectionStart || 0;
    const textBefore = value.substring(0, cursor);
    const textAfter = value.substring(cursor);
    const lastAt = textBefore.lastIndexOf('@');
    
    const newValue = value.substring(0, lastAt) + varName + " " + textAfter;
    onChange(newValue);
    setShowMenu(false);
    
    setTimeout(() => {
      textareaRef.current?.focus();
      const newPos = lastAt + varName.length + 1;
      textareaRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <div className="relative w-full">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        className={cn(
          "font-mono text-[11px] h-64 bg-slate-950 text-indigo-300 border-indigo-900/50 resize-y",
          className
        )}
        placeholder="Digite as instruções... Use @ para variáveis de contexto."
      />

      {showMenu && filteredVars.length > 0 && (
        <div 
          className="absolute z-[100] w-full max-w-[320px] bg-card border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2"
          style={{ 
            bottom: '20px', // Posiciona dentro da área visível do textarea
            left: '10px',
          }}
        >
          <div className="bg-muted/90 px-3 py-1.5 border-b border-border flex items-center gap-2">
            <Terminal className="h-3 w-3 text-primary" />
            <span className="text-[9px] font-bold uppercase text-muted-foreground">Variáveis de Contexto</span>
          </div>
          <div className="max-h-48 overflow-y-auto bg-background/95 backdrop-blur-sm">
            {filteredVars.map((v, idx) => (
              <div
                key={v.name}
                className={cn(
                  "px-3 py-2 cursor-pointer flex flex-col gap-0.5 transition-colors border-l-4",
                  idx === selectedIndex ? "bg-primary/20 border-primary" : "hover:bg-muted/50 border-transparent"
                )}
                onClick={() => insertVariable(v.name)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-foreground">{v.name}</span>
                  <Badge variant="outline" className="text-[8px] h-3 px-1 uppercase opacity-50">Var</Badge>
                </div>
                <p className="text-[9px] text-muted-foreground line-clamp-1">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};