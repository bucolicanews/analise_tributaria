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

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é um Auditor Fiscal e Consultor de Negócios Sênior. 
Sua função é fazer um 'Sanity Check' (validação rápida) dos dados informados pelo usuário ANTES de gerar o relatório final.
Analise o JSON de contexto e aponte APENAS:
1. Inconsistências Financeiras (ex: custos absurdos para o faturamento).
2. Riscos Societários Críticos (ex: confusão patrimonial, retirada de lucros sem pró-labore).
3. Atenção aos CNAEs (avise rapidamente se algum CNAE não pode ser Simples Nacional ou se é óbvio que entra no Fator R).
Seja extremamente direto, use marcadores (bullet points) e não escreva uma introdução longa. O foco é alertar o usuário para corrigir dados errados.`;

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'agente-normalizador',
    nome: '1. Normalizador e Validador',
    order: 1,
    systemPrompt: `Você é um especialista em estruturação de dados. Converta "Sim/Não" em true/false. Formate CNAE apenas como números. Corrija a lógica de Pró-labore: se houver valor mas estiver como "Não", mude para "Sim". Se não houver valor, oriente o uso do salário mínimo do ano base. Retorne APENAS JSON.`,
  },
  {
    id: 'agente-tributario',
    nome: '2. Analista de Viabilidade',
    order: 2,
    systemPrompt: `Analise CNAEs, enquadramento e riscos de conformidade (Art. 50 CC). Foco em ISS/ICMS e segregação de receitas.`,
  },
  {
    id: 'agente-planejamento',
    nome: '3. Planejamento Tributário',
    order: 3,
    systemPrompt: `Realize simulação comparativa entre Simples, Híbrido, Presumido e Real. Calcule Fator R e impacto da Reforma (IBS/CBS).`,
  },
  {
    id: 'agente-decisor',
    nome: '4. Veredito e Decisão Sênior',
    order: 4,
    systemPrompt: `Você é o CTO. Escolha o melhor regime baseado nas simulações. Calcule a economia anual em R$. Justifique tecnicamente a escolha e crie um plano de ação imediato.`,
  },
];

export async function callGeminiAgent(
  systemPrompt: string,
  userContent: string,
  apiKey: string
): Promise<string> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Chave API Gemini não configurada. Configure na página de Configurações.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userContent }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMsg = `Gemini API Error: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error && errorData.error.message) {
        errorMsg += ` - ${errorData.error.message}`;
      }
    } catch (e) {
      // Falha ao fazer parse do erro, ignora
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) throw new Error('Sem conteúdo na resposta da IA.');

  return parts.map((p: any) => (p.text || '').trim()).join('\n\n');
}

export async function callAgentWebhook(
  agent: AgentConfig,
  userContent: string,
  previousReports?: Record<string, string>
): Promise<string> {
  if (!agent.webhookUrl) throw new Error(`Webhook não configurado para ${agent.nome}`);

  let parsedPayload: any = {};
  
  try {
    parsedPayload = JSON.parse(userContent);
  } catch (e) {
    parsedPayload = { userContent };
  }

  // Preservamos o payload exato gerado, injetando apenas propriedades extras caso não existam
  const bodyToSend = {
    agentName: parsedPayload.agentName || agent.nome,
    systemPrompt: agent.systemPrompt,
    ...parsedPayload,
    ...(previousReports ? { previousReports } : {}),
  };

  const response = await fetch(agent.webhookUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyToSend),
  });

  if (!response.ok) throw new Error(`Webhook Error: ${response.status}`);

  const data = await response.json();
  const report = data.report || (Array.isArray(data) ? data[0]?.report : null) || data.output;
  if (!report) throw new Error("Resposta inválida do webhook. O n8n precisa retornar um JSON com a chave 'report'.");
  return report;
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