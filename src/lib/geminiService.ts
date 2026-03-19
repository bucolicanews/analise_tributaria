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

⚠ PROTOCOLO DE EXCELÊNCIA FINAL (10/10):

1. PRECISÃO MATEMÁTICA E FAIXAS:
   - Verifique o RBT12. Se faturamento = R$ 270k, use OBRIGATORIAMENTE a 2ª Faixa.
   - Demonstre a fórmula: ((RBT12 * AliqNominal) - PD) / RBT12.
   - Alíquotas Efetivas Alvo: Anexo I (5,10%) e Anexo III (7,73%).

2. COMPOSIÇÃO DO DAS (ESTIMATIVA TÉCNICA):
   - Apresente a repartição dos tributos como "Valores aproximados conforme tabelas da LC 123/2006, sujeitos a variações por faixa e atividade".
   - Mantenha a clareza sobre ICMS, ISS, CPP e tributos federais.

3. PLANEJAMENTO PREVIDENCIÁRIO E RISCO DDL:
   - Esclareça que a CPP já está no DAS.
   - Alerte sobre o risco de "Distribuição Disfarçada de Lucros (DDL)" e fiscalização previdenciária em caso de retiradas informais sem pró-labore mínimo.
   - Reitere que a isenção total de lucros exige Escrituração Contábil Regular.

4. MATRIZ DE RISCO (ITENS OBRIGATÓRIOS):
   - A tabela DEVE conter:
     * Confusão Patrimonial | Impacto: Alto | Prob: Alto | Ação: Segregação total de contas PF/PJ.
     * Ausência de Pró-labore | Impacto: Alto | Prob: Médio | Ação: Formalizar retirada (1 SM).
     * Falta de Contabilidade | Impacto: Crítico | Prob: Médio | Ação: Escrituração mensal.
     * ICMS-ST/DIFAL | Impacto: Alto | Prob: Alto | Ação: Revisão de NCM e Antecipações.

5. TERMINOLOGIA E ESTRUTURA:
   - Use: "Resultado Operacional Bruto (Antes de Custos e Despesas)".
   - O Plano de Ação deve incluir a "Segregação Patrimonial" como passo prioritário.

ESTRUTURA DO RELATÓRIO:

# 1. AUDITORIA DE CNAE E ENQUADRAMENTO LEGAL
# 2. MEMÓRIA DE CÁLCULO E SIMULAÇÃO (DRE FISCAL)
# 3. COMPOSIÇÃO ESTIMADA DA GUIA DAS (REPARTIÇÃO TRIBUTÁRIA)
# 4. PLANEJAMENTO PREVIDENCIÁRIO E SOCIETÁRIO (PRÓ-LABORE E DDL)
# 5. ALERTAS DE TRIBUTAÇÃO EXTRA-DAS (ICMS-ST E DIFAL)
# 6. MATRIZ DE RISCOS E CONFORMIDADE (TABELA COMPLETA)
# 7. CONCLUSÃO E PLANO DE AÇÃO (5 PASSOS EXECUTÁVEIS)

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