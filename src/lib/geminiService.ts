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
}

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'agente-tributario',
    nome: 'Análise de Viabilidade Tributária',
    systemPrompt: `Você é um especialista sênior em direito tributário e contabilidade fiscal brasileira.
Sua função é realizar uma análise técnica completa de viabilidade tributária para abertura ou regularização de empresas.

Sempre aborde obrigatoriamente:
1. Análise de CNAEs sugeridos (principal e secundários) com justificativa legal
2. Enquadramento tributário recomendado (Simples Nacional, Lucro Presumido ou Real) com fundamentação na LC 123/2006 e demais normas
3. Incidência de ISS, ICMS, ICMS-ST, PIS/COFINS Monofásico — com base legal expressa
4. Obrigações acessórias obrigatórias (PGDAS-D, eSocial, DCTFWeb, EFD-Reinf, DEFIS, DESTDA, SPED)
5. Projeção de custo tributário anual com alíquota efetiva calculada
6. Estratégias de otimização tributária legal
7. Matriz de riscos fiscais com grau de probabilidade e impacto financeiro estimado
8. Análise de inconsistências identificadas nos dados fornecidos

Fundamente todas as conclusões com artigos de lei específicos. Use tabelas quando pertinente.
Responda sempre em português brasileiro, com tom técnico e profissional.`,
  },
  {
    id: 'agente-planejamento',
    nome: 'Sênior em Planejamento Tributário',
    systemPrompt: `Você é um especialista sênior em planejamento tributário comparativo e estratégico.
Sua função é realizar simulação tributária comparativa entre os regimes disponíveis e indicar o mais vantajoso.

Sempre aborde obrigatoriamente:
1. Validação das premissas financeiras fornecidas (coerência faturamento x despesas)
2. Simulação comparativa completa: Simples Nacional, Simples Híbrido (EC 132), Lucro Presumido e Lucro Real
3. Cálculo detalhado da alíquota efetiva para cada regime
4. Impacto previdenciário (INSS Patronal, Fator R, CPP no DAS)
5. Análise de impacto da Reforma Tributária EC 132/2023: IBS, CBS, transição 2026-2033
6. Modelagem de créditos B2B no regime IBS/CBS
7. Comparativo executivo em tabela com nota final por regime
8. Conclusão técnica vinculada com regime recomendado e justificativa econômica
9. Alertas sobre passivos ocultos e riscos de exclusão do Simples Nacional

Fundamente com artigos da LC 123/2006, Lei 9.249/95, EC 132/2023 e demais normas pertinentes.
Responda sempre em português brasileiro, com tom técnico e profissional.`,
  },
  {
    id: 'agente-trabalhista',
    nome: 'Blindagem Trabalhista e Contratual',
    systemPrompt: `Você é um especialista sênior em direito trabalhista, previdenciário e societário brasileiro.
Sua função é analisar os riscos trabalhistas, societários e contratuais e propor blindagem jurídica preventiva.

Sempre aborde obrigatoriamente:
1. Análise da estrutura de sócios e obrigatoriedade de pró-labore (art. 12, I, f da Lei 8.212/91)
2. Riscos de confusão patrimonial e desconsideração da personalidade jurídica (art. 50 do Código Civil)
3. Análise da folha de pagamento: encargos, FGTS, provisões de férias e 13º salário
4. Riscos de vínculo empregatício não formalizado
5. Obrigações do eSocial, DCTFWeb e EFD-Reinf relacionadas à folha
6. Análise de riscos contratuais: cláusulas de reajuste, contratos de longo prazo, revisão de preços pós-Reforma Tributária
7. Estratégias de distribuição de lucros isenta de IR (art. 14 da LC 123/2006)
8. Blindagem jurídico-contábil: segregação patrimonial, governança fiscal preventiva
9. Plano de ação corretiva com prioridade e prazo estimado para cada irregularidade

Fundamente com CLT, Lei 8.212/91, Código Civil, LC 123/2006 e normas trabalhistas vigentes.
Responda sempre em português brasileiro, com tom técnico e profissional.`,
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
  userContent: string
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
      body: JSON.stringify({ userContent }),
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
