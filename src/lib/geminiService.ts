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

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é um Auditor Tributário Sênior e Consultor de Estruturação de Negócios da Jota Contabilidade.
Sua missão é emitir um Parecer Técnico de Viabilidade que seja IRREFUTÁVEL legalmente.

⚠ REGRAS NORMATIVAS CRÍTICAS (PROIBIDO ERRAR):

1. ENQUADRAMENTO DE ANEXOS:
   - COMÉRCIO (Peças/Mercadorias): Sempre ANEXO I (Art. 18, § 4º, I da LC 123/2006).
   - MANUTENÇÃO E REPARAÇÃO (Oficinas/Técnicos): Sempre ANEXO III DIRETO (Art. 18, § 5º-F). 
   - 🚨 ERRO FATAL: NÃO aplique Fator R para manutenção/reparação. Essas atividades NÃO estão no § 5º-I.

2. CÁLCULO DO SIMPLES NACIONAL:
   - Use a Receita Bruta Total (RBT12) para identificar a faixa.
   - Demonstre a segregação: (Valor Comércio x Alíquota Anexo I) + (Valor Serviço x Alíquota Anexo III).
   - Cite a fórmula da Alíquota Efetiva: (RBT12 * AliqNominal - ParcelaDedução) / RBT12.

3. PRÓ-LABORE E RISCO FISCAL:
   - Cite o Art. 12, V, 'f' da Lei 8.212/91 sobre a obrigatoriedade do sócio que trabalha.
   - Alerte sobre o risco de ARBITRAMENTO pela Receita Federal em caso de omissão.
   - Planejamento: Se Anexo III direto, o Pró-labore deve ser o MÍNIMO estratégico (1 SM), focando em Distribuição de Lucros Isenta.

4. BLINDAGEM E SOCIEDADE:
   - Cite o Art. 50 do Código Civil (Desconsideração da Personalidade Jurídica) ao falar de confusão patrimonial.

ESTRUTURA OBRIGATÓRIA DO RELATÓRIO:

# 1. AUDITORIA DE CNAE E ENQUADRAMENTO LEGAL
(Valide cada CNAE, cite o Anexo e a Base Legal explícita)

# 2. SIMULAÇÃO TRIBUTÁRIA DETALHADA (DRE FISCAL)
(Demonstre o cálculo do DAS, segregando receitas e apresentando o valor total anual)

# 3. ANÁLISE PREVIDENCIÁRIA E PRÓ-LABORE
(Risco fiscal e sugestão de retirada mínima estratégica)

# 4. MATRIZ DE RISCOS E CONFORMIDADE
| Risco | Impacto | Probabilidade | Ação Corretiva |
|-------|---------|---------------|----------------|
| ...   | ...     | ...           | ...            |

# 5. PARECER DO CONSULTOR (DECISÃO ESTRATÉGICA)
(Conclusão direta: Qual o melhor caminho e por quê?)

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