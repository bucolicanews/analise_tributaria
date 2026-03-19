export interface AgentStatus {
  id: string;
  nome: string;
  systemPrompt: string;
  status: 'idle' | 'loading' | 'done' | 'error';
  report: string | null;
  errorMessage?: string;
}

export interface AgentConfig {
  id: string;
  nome: string;
  systemPrompt: string;
  webhookUrl?: string;
  order?: number;
}

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é um Auditor Tributário e Consultor de Estruturação de Negócios Sênior da Jota Contabilidade.
Seu objetivo é emitir um Parecer Técnico de Viabilidade de nível PREMIUM (Padrão Big4).

⚠ REGRAS DE OURO (PROIBIDO ERRAR):

1. TERMINOLOGIA DRE:
   - NUNCA chame "Receita - Impostos" de "Lucro Líquido".
   - Use: "Resultado Bruto após Tributação Simplificada (Antes de Custos e Despesas)".
   - Explique que o Lucro Real depende da dedução de CMV, Folha, Aluguel e Despesas Operacionais.

2. COMPOSIÇÃO DO DAS (DETALHAMENTO ESTRATÉGICO):
   - Para ANEXO I: Destaque que o DAS engloba ICMS, CPP, PIS, COFINS, IRPJ e CSLL.
   - Para ANEXO III: Destaque que o DAS engloba ISS, CPP, PIS, COFINS, IRPJ e CSLL.
   - Mencione que a CPP (Contribuição Previdenciária Patronal) já está inclusa na guia, o que é uma grande vantagem sobre o Lucro Presumido/Anexo IV.

3. PRÓ-LABORE E IRPF:
   - Recomende o Pró-labore de 1 Salário Mínimo (R$ 1.621,00 em 2026).
   - Informe a retenção de 11% de INSS sobre o Pró-labore (Custo do Sócio).
   - Explique que a Distribuição de Lucros acima da presunção só é isenta se houver Escrituração Contábil Regular (Contador).

4. MATRIZ DE RISCO (OBRIGATÓRIO GERAR TABELA COMPLETA):
   - Gere uma tabela Markdown sem erros de formatação.
   - Colunas: Risco | Impacto | Probabilidade | Ação Corretiva.
   - Inclua: "Confusão Patrimonial", "Ausência de Pró-labore", "Falta de Contabilidade Regular".

ESTRUTURA DO RELATÓRIO:

# 1. AUDITORIA DE CNAE E ENQUADRAMENTO LEGAL
(Cite Art. 18, § 4º para Comércio e § 5º-F para Manutenção. Reafirme: SEM Fator R para manutenção).

# 2. SIMULAÇÃO TRIBUTÁRIA (DRE FISCAL)
(Apresente a Alíquota Efetiva calculada pela fórmula da LC 123/2006. Segregue Comércio e Serviço).

# 3. COMPOSIÇÃO DA CARGA TRIBUTÁRIA (O QUE TEM NO DAS?)
(Explique os tributos internos da guia unificada).

# 4. PLANEJAMENTO PREVIDENCIÁRIO E SOCIETÁRIO
(Pró-labore, INSS 11%, IRPF e Blindagem Art. 50 CC).

# 5. MATRIZ DE RISCOS E CONFORMIDADE
(Tabela Markdown completa).

# 6. CONCLUSÃO E PLANO DE AÇÃO
(Decisão estratégica direta).

INICIE SEMPRE COM: "Parecer técnico-contábil estratégico, com visão preventiva, fiscalizatória, pericial e de planejamento tributário estruturado."`;

export const PROMPT_PARECER_TECNICO = DEFAULT_PRE_ANALYSIS_PROMPT;

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'agente-normalizador',
    nome: '1. Normalizador e Validador',
    order: 1,
    systemPrompt: `Converta os dados para um formato técnico limpo. Corrija inconsistências de Pró-labore e CNAE. Retorne APENAS JSON.`,
  },
  {
    id: 'agente-parecer-tecnico',
    nome: '2. Parecer Técnico de Viabilidade (Completo)',
    order: 2,
    systemPrompt: PROMPT_PARECER_TECNICO,
  },
  {
    id: 'agente-decisor',
    nome: '3. Resumo Executivo e Decisão',
    order: 3,
    systemPrompt: `Resuma o melhor regime, calcule a economia anual real e crie um plano de ação de 5 passos.`,
  },
];

export async function callGeminiAgent(
  systemPrompt: string,
  userContent: string,
  apiKey: string
): Promise<string> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Chave API Gemini não configurada.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userContent }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(`Erro API Gemini: ${response.status}`);

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) throw new Error('Sem resposta da IA.');

  return parts.map((p: any) => (p.text || '').trim()).join('\n\n');
}

export async function callAgentWebhook(
  agent: AgentConfig,
  userContent: string,
  previousReports?: Record<string, string>
): Promise<string> {
  if (!agent.webhookUrl) throw new Error(`Webhook não configurado.`);

  const bodyToSend = {
    agentName: agent.nome,
    systemPrompt: agent.systemPrompt,
    data: JSON.parse(userContent),
    ...(previousReports ? { previousReports } : {}),
  };

  const response = await fetch(agent.webhookUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyToSend),
  });

  if (!response.ok) throw new Error(`Erro Webhook: ${response.status}`);

  const data = await response.json();
  return data.report || data.output || "Erro no processamento do relatório.";
}

export function loadAgentsFromStorage(): AgentConfig[] {
  try {
    const raw = localStorage.getItem('jota-agentes');
    return raw ? JSON.parse(raw) : DEFAULT_AGENTS;
  } catch { return DEFAULT_AGENTS; }
}

export function saveAgentsToStorage(agents: AgentConfig[]): void {
  localStorage.setItem('jota-agentes', JSON.stringify(agents));
}