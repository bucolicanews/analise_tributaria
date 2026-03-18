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

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'agente-normalizador',
    nome: 'Normalizador e Validador de Dados',
    order: 1,
    systemPrompt: `Você é um especialista em estruturação e validação de dados para análise tributária e contábil.
Sua função NÃO é refazer os dados, mas sim VALIDAR, CORRIGIR e NORMALIZAR o JSON recebido.

REGRAS OBRIGATÓRIAS:
1. NÃO altere dados que já estão corretos.
2. NÃO remova nenhuma informação existente.
3. SÓ corrija inconsistências lógicas, conflitos de informação e erros de tipo.
4. Normalizar tipos: "Sim"/"Não" → true/false, números como string → number.
5. Corrigir inconsistências: Ex: pro_labore declarado = "Não" com valor > 0 → corrigir.
6. Estruturar CNAE em formato objeto e padronizar textos (Casing).

CRIE UM BLOCO FINAL CHAMADO "diagnostico_input" com: inconsistencias_corrigidas, dados_ajustados, dados_preenchidos, confiabilidade_input (0 a 1) e observações.

FORMATO DE RESPOSTA: Retorne SOMENTE um JSON válido com as chaves "input_corrigido" e "diagnostico_input". NÃO escreva texto fora do JSON.`,
  },
  {
    id: 'agente-tributario',
    nome: 'Análise de Viabilidade Tributária',
    order: 2,
    systemPrompt: `Você é um especialista sênior em direito tributário e contabilidade fiscal brasileira.
Sua função é realizar uma análise técnica completa de viabilidade tributária baseada no JSON normalizado recebido.

REGRAS OBRIGATÓRIAS DE CÁLCULO E RISCO:
1. ANO BASE: Utilize rigorosamente os índices e tabelas do ANO BASE informado.
2. PRÓ-LABORE: Se o usuário NÃO declara pró-labore, analise o risco previdenciário e projete custos sobre a base de 1 salário mínimo.
3. RETIRADAS PF: Analise o risco de confusão patrimonial (Art. 50 CC).
4. SEGREGRAÇÃO: Utilize os percentuais de Comércio e Serviço para carga tributária mista.

Sempre aborde: CNAEs, Enquadramento (LC 123/2006), ISS/ICMS/ST/Monofásicos e Matriz de Riscos.`,
  },
  {
    id: 'agente-planejamento',
    nome: 'Sênior em Planejamento Tributário',
    order: 3,
    systemPrompt: `Você é um especialista sênior em planejamento tributário comparativo.
Sua função é realizar simulação tributária entre os regimes e indicar o mais vantajoso.

REGRAS OBRIGATÓRIAS:
1. FATOR R: Calcule o Fator R considerando folha + pró-labore.
2. REFORMA TRIBUTÁRIA: Analise o impacto da transição para IBS/CBS (EC 132/2023).
3. PRÓ-LABORE VS LUCRO: Identifique a natureza das retiradas.

Sempre aborde: Simulação comparativa (Simples, Híbrido, Presumido, Real), Alíquota efetiva real e Impacto previdenciário.`,
  },
  {
    id: 'agente-trabalhista',
    nome: 'Blindagem Trabalhista e Contratual',
    order: 4,
    systemPrompt: `Você é um especialista sênior em direito trabalhista e societário.
Sua função é analisar riscos e propor blindagem jurídica.

REGRAS OBRIGATÓRIAS:
1. PRÓ-LABORE: Analise a obrigatoriedade (Art. 12 Lei 8.212/91).
2. CONFUSÃO PATRIMONIAL: Alerta crítico sobre perda da proteção da responsabilidade limitada se houver mistura de contas.
3. FOLHA: Projete encargos (FGTS, Férias, 13º).

Sempre aborde: Riscos de vínculo, Estratégias de distribuição isenta e Plano de ação corretiva.`,
  },
];

export async function callGeminiAgent(
  systemPrompt: string,
  userContent: string,
  apiKey: string
): Promise<string> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Chave API Gemini não configurada. Acesse Configurações e informe sua chave.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userContent }],
      },
    ],
    generationConfig: {
      temperature: 0.2, // Baixa temperatura para o normalizador ser preciso
      maxOutputTokens: 8192,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `Erro HTTP ${response.status}`;
    throw new Error(`Gemini API: ${message}`);
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts) || parts.length === 0) {
    throw new Error('Resposta da API Gemini sem conteúdo reconhecível.');
  }

  return parts
    .map((p: { text?: string }) => (p.text || '').trim())
    .filter((t: string) => t.length > 0)
    .join('\n\n');
}

export async function callAgentWebhook(
  agent: AgentConfig,
  userContent: string,
  previousReports?: Record<string, string>
): Promise<string> {
  if (!agent.webhookUrl || agent.webhookUrl.trim() === '') {
    throw new Error(`Agente "${agent.nome}" não possui URL de webhook configurada.`);
  }

  let response: Response;
  try {
    response = await fetch(agent.webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentName: agent.nome,
        systemPrompt: agent.systemPrompt,
        userContent,
        ...(previousReports && Object.keys(previousReports).length > 0 ? { previousReports } : {}),
      }),
    });
  } catch (fetchErr: any) {
    throw new Error(`Falha de rede ao chamar webhook do agente "${agent.nome}": ${fetchErr.message}`);
  }

  if (!response.ok) {
    throw new Error(`Webhook do agente "${agent.nome}" retornou erro HTTP ${response.status}.`);
  }

  const data = await response.json();
  let unwrapped = data;
  if (Array.isArray(data)) {
    unwrapped = data[0]?.json ?? data[0] ?? data;
  }

  const report = unwrapped?.report || unwrapped?.output || unwrapped?.text;

  if (typeof report !== 'string' || report.trim() === '') {
    throw new Error(`Webhook do agente "${agent.nome}" não retornou campo "report" válido.`);
  }

  return report.trim();
}

export function loadAgentsFromStorage(): AgentConfig[] {
  try {
    const raw = localStorage.getItem('jota-agentes');
    if (!raw) return DEFAULT_AGENTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_AGENTS;
  } catch {
    return DEFAULT_AGENTS;
  }
}

export function saveAgentsToStorage(agents: AgentConfig[]): void {
  localStorage.setItem('jota-agentes', JSON.stringify(agents));
}