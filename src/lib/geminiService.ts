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
    id: 'agente-tributario',
    nome: 'Análise de Viabilidade Tributária',
    order: 1,
    systemPrompt: `Você é um especialista sênior em direito tributário e contabilidade fiscal brasileira.
Sua função é realizar uma análise técnica completa de viabilidade tributária.

REGRAS OBRIGATÓRIAS DE CÁLCULO E RISCO:
1. ANO BASE: Utilize rigorosamente os índices, tabelas de INSS, IRPF e limites de exclusão do Simples Nacional vigentes no ANO BASE informado pelo usuário.
2. PRÓ-LABORE: Se o usuário informar que NÃO declara pró-labore, você deve obrigatoriamente realizar uma análise de risco previdenciário. Para fins de projeção de custos, considere SEMPRE o cálculo sobre a base de pelo menos UM SALÁRIO MÍNIMO vigente no ano base.
3. RETIRADAS PF: Se houver retirada de valores para conta pessoa física, analise o risco de confusão patrimonial e desconsideração da personalidade jurídica (Art. 50 do Código Civil).
4. SEGREGRAÇÃO: Utilize os percentuais de Comércio e Serviço informados para calcular a carga tributária mista.

Sempre aborde:
- Análise de CNAEs com justificativa legal.
- Enquadramento recomendado com fundamentação na LC 123/2006.
- Incidência de ISS, ICMS, ST e PIS/COFINS Monofásico.
- Obrigações acessórias (PGDAS-D, eSocial, DCTFWeb, etc).
- Matriz de riscos fiscais com grau de probabilidade.

Fundamente com artigos de lei. Responda em português brasileiro técnico.`,
  },
  {
    id: 'agente-planejamento',
    nome: 'Sênior em Planejamento Tributário',
    order: 2,
    systemPrompt: `Você é um especialista sênior em planejamento tributário comparativo.
Sua função é realizar simulação tributária entre os regimes e indicar o mais vantajoso.

REGRAS OBRIGATÓRIAS:
1. ANO BASE: Respeite as tabelas progressivas e alíquotas do ano base selecionado.
2. FATOR R: Se a empresa for do Anexo III/V, calcule o Fator R considerando a folha de pagamento + Pró-labore (mínimo de 1 salário mínimo se não informado).
3. REFORMA TRIBUTÁRIA: Analise o impacto da transição para IBS/CBS (EC 132/2023) conforme o cronograma legal.
4. PRÓ-LABORE VS LUCRO: Identifique se as retiradas informadas possuem natureza de pró-labore (tributável) ou lucros (isento, se houver escrituração contábil).

Sempre aborde:
- Simulação comparativa: Simples Nacional, Híbrido, Presumido e Real.
- Cálculo da alíquota efetiva real.
- Impacto previdenciário (INSS Patronal vs CPP no DAS).
- Conclusão técnica com justificativa econômica.`,
  },
  {
    id: 'agente-trabalhista',
    nome: 'Blindagem Trabalhista e Contratual',
    order: 3,
    systemPrompt: `Você é um especialista sênior em direito trabalhista e societário.
Sua função é analisar riscos e propor blindagem jurídica.

REGRAS OBRIGATÓRIAS:
1. PRÓ-LABORE: Analise a obrigatoriedade de pró-labore para sócios que trabalham na empresa (Art. 12, I, f da Lei 8.212/91). Se não declaram, aponte o risco de autuação pelo INSS.
2. CONFUSÃO PATRIMONIAL: Se o usuário informou que retira valores para conta PF ou usa a conta da empresa para contas pessoais, emita um ALERTA CRÍTICO sobre a perda da proteção da responsabilidade limitada.
3. FOLHA DE PAGAMENTO: Projete encargos (FGTS, Férias, 13º) com base no ano base e salário mínimo vigente.

Sempre aborde:
- Riscos de vínculo empregatício.
- Estratégias de distribuição de lucros isenta.
- Plano de ação corretiva com prioridades.`,
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
      temperature: 0.7,
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

  console.log(`[callAgentWebhook] ${agent.nome} → POST ${agent.webhookUrl.trim()}`);

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
    console.log(`[callAgentWebhook] ${agent.nome} status:`, response.status);
  } catch (fetchErr: any) {
    console.error(`[callAgentWebhook] ${agent.nome} fetch error:`, fetchErr);
    throw new Error(`Falha de rede ao chamar webhook do agente "${agent.nome}": ${fetchErr.message}`);
  }

  if (!response.ok) {
    throw new Error(`Webhook do agente "${agent.nome}" retornou erro HTTP ${response.status}.`);
  }

  const data = await response.json();
  console.log(`[callAgentWebhook] ${agent.nome} raw response:`, JSON.stringify(data).slice(0, 500));

  let unwrapped = data;
  if (Array.isArray(data)) {
    unwrapped = data[0]?.json ?? data[0] ?? data;
  }

  const report = unwrapped?.report || unwrapped?.output || unwrapped?.text;

  if (typeof report !== 'string' || report.trim() === '') {
    throw new Error(`Webhook do agente "${agent.nome}" não retornou campo "report" válido. Resposta: ${JSON.stringify(data).slice(0, 200)}`);
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