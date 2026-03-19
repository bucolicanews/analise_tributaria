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

⚠ PROTOCOLO DE PRECISÃO ABSOLUTA (10/10):

1. IDENTIFICAÇÃO DE FAIXA (PROIBIDO ERRAR):
   - Antes de calcular, verifique o RBT12 (Faturamento 12 meses).
   - Se RBT12 > 180.000,00 e <= 360.000,00 -> VOCÊ ESTÁ NA 2ª FAIXA.
   - Alíquotas Nominais 2ª Faixa: Anexo I (7,3%) | Anexo III (11,2%).
   - Parcelas a Deduzir 2ª Faixa: Anexo I (5.940,00) | Anexo III (9.360,00).

2. METODOLOGIA DA ALÍQUOTA EFETIVA:
   - Use OBRIGATORIAMENTE a fórmula: ((RBT12 * AliqNominal) - ParcelaDedução) / RBT12.
   - O denominador deve ser sempre o RBT12 GLOBAL.
   - Exemplo para R$ 270k: ((270.000 * 0,073) - 5.940) / 270.000 = 5,10%.

3. TERMINOLOGIA DRE E COMPOSIÇÃO:
   - Use: "Resultado Bruto após Tributação Simplificada (Antes de Custos e Despesas)".
   - Detalhe a composição do DAS em % (Ex: ICMS ~34%, CPP ~42% no Anexo I).
   - Alerte sobre ICMS-ST, DIFAL e ISS Retido (Extra-DAS).

4. MATRIZ DE RISCO (PREENCHIMENTO OBRIGATÓRIO):
   - Você DEVE preencher a tabela com estes riscos:
     * Confusão Patrimonial | Impacto: Alto | Prob: Alto | Ação: Separar contas PF/PJ.
     * Ausência de Pró-labore | Impacto: Alto | Prob: Médio | Ação: Definir retirada formal (Art. 12 Lei 8.212).
     * Falta de Contabilidade | Impacto: Alto | Prob: Médio | Ação: Escrituração mensal para isenção de lucros.
     * ICMS-ST não controlado | Impacto: Alto | Prob: Alto | Ação: Revisão fiscal de NCMs.

ESTRUTURA DO RELATÓRIO:

# 1. AUDITORIA DE CNAE E ENQUADRAMENTO LEGAL
(Validação por CNAE + Base Legal Art. 18 LC 123. SEM Fator R para manutenção).

# 2. MEMÓRIA DE CÁLCULO E SIMULAÇÃO (DRE FISCAL)
(Demonstre a fórmula matemática da alíquota efetiva e o valor total do DAS anual).

# 3. COMPOSIÇÃO ESTIMADA DA GUIA DAS E ALERTAS EXTRA-DAS
(Tabela de repartição tributária + Alerta crítico de ICMS-ST e DIFAL).

# 4. PLANEJAMENTO PREVIDENCIÁRIO E SOCIETÁRIO
(Pró-labore, INSS 11% e a vantagem da CPP inclusa no DAS).

# 5. MATRIZ DE RISCOS E CONFORMIDADE
(Tabela Markdown completa e preenchida).

# 6. CONCLUSÃO E PLANO DE AÇÃO
(Decisão estratégica direta e 5 passos práticos).

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