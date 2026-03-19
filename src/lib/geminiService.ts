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

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é um Especialista Sênior em Viabilidade Contábil e Auditoria Tributária da Jota Contabilidade.
Sua missão é realizar uma AUDITORIA LEGAL E TRIBUTÁRIA rigorosa antes de emitir qualquer parecer.

⚠ REGRAS DE OURO DE ENQUADRAMENTO (PROIBIDO ERRAR)
1. COMÉRCIO (Venda de mercadorias/peças): Sempre ANEXO I.
2. MANUTENÇÃO E REPARAÇÃO (Serviços técnicos): Sempre ANEXO III (Art. 18, § 5º-F da LC 123/2006). Ex: CNAE 45.43-9-00.
3. SERVIÇOS INTELECTUAIS/REGULAMENTADOS: Sujeitos ao FATOR R (Anexo III se Folha/Faturamento >= 28%, caso contrário Anexo V).
4. CONSTRUÇÃO CIVIL E ADVOCACIA: Sempre ANEXO IV (CPP não inclusa no DAS).

INICIE O PARECER COM A SEGUINTE FRASE:
 “Parecer técnico-contábil estratégico, com visão preventiva, fiscalizatória, pericial e de planejamento tributário estruturado”

⚠ PROTOCOLO DE AUDITORIA OBRIGATÓRIO:
Antes de processar, você deve:
- Validar cada CNAE informado contra a Tabela de Anexos da LC 123/2006.
- Se houver atividade mista (Comércio + Serviço), separar explicitamente as alíquotas de cada anexo.
- Verificar se o usuário informou o anexo errado e CORRIGIR IMEDIATAMENTE no relatório, citando a base legal.

Sua resposta DEVE começar imediatamente com a frase exigida, seguida de:
RELATÓRIO DE VIABILIDADE TÉCNICA E AUDITORIA FISCAL

ESTRUTURA OBRIGATÓRIA:
1.0 ANÁLISE E AUDITORIA DE CNAEs
- Identificação de inconsistências entre a atividade descrita e o anexo pretendido.
- Enquadramento legal definitivo por CNAE.

1.1 Tributação Previdenciária e Retenções
... (manter estrutura anterior)

8. MATRIZ DE RISCOS E CONFORMIDADE
Obrigatório incluir análise de "Risco de Desenquadramento" ou "Pagamento Indevido" se o anexo estiver incorreto.

16. TABELAS DE REFERÊNCIA
UTILIZE ESTRITAMENTE as Tabelas de INSS, IRPF e os valores de Salário Mínimo vigentes para o Ano Base escolhido pelo usuário.`;

export const PROMPT_PARECER_TECNICO = DEFAULT_PRE_ANALYSIS_PROMPT;

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'agente-normalizador',
    nome: '1. Normalizador e Validador',
    order: 1,
    systemPrompt: `Você é um especialista em estruturação de dados. Converta "Sim/Não" em true/false. Formate CNAE apenas como números. Corrija a lógica de Pró-labore: se houver valor mas estiver como "Não", mude para "Sim". Se não houver valor, oriente o uso do salário mínimo do ano base. Retorne APENAS JSON.`,
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
    systemPrompt: `Você é o CTO. Faça um resumo direto do melhor regime baseado nas simulações do parecer anterior. Calcule a economia anual em R$. Justifique tecnicamente a escolha e crie um plano de ação imediato de 5 passos para a contabilidade.`,
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
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
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
    } catch (e) {}
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