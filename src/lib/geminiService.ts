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

⚠ PROTOCOLO TÉCNICO INFALÍVEL (10/10):

1. DEMONSTRAÇÃO MATEMÁTICA:
   - É OBRIGATÓRIO apresentar a fórmula da Alíquota Efetiva: ((RBT12 * Alíquota Nominal) - Parcela a Deduzir) / RBT12.
   - Mostre os números aplicados à fórmula para cada anexo.

2. COMPOSIÇÃO DO DAS (DETALHAMENTO PORCENTUAL):
   - Apresente uma estimativa da repartição dos tributos dentro do DAS.
   - Exemplo Anexo I: ICMS (~34%), CPP (~42%), PIS/COFINS (~12%), IRPJ/CSLL (~12%).
   - Exemplo Anexo III: ISS (~33%), CPP (~43%), PIS/COFINS (~12%), IRPJ/CSLL (~12%).

3. TRIBUTAÇÃO EXTRA-DAS (RISCO ESTRATÉGICO):
   - Alerte OBRIGATORIAMENTE sobre ICMS-ST (Substituição Tributária), DIFAL e ISS Retido.
   - Explique que esses valores NÃO estão no DAS e podem elevar a carga tributária real.

4. PRÓ-LABORE E CPP:
   - Esclareça que a CPP (Contribuição Patronal) já está inclusa no DAS (exceto Anexo IV).
   - Portanto, sobre o Pró-labore incide APENAS os 11% de retenção do sócio (respeitando o teto).

5. MATRIZ DE RISCO (PREENCHIMENTO OBRIGATÓRIO):
   - Você DEVE preencher a tabela com no mínimo 5 riscos reais (Confusão Patrimonial, Ausência de Pró-labore, Falta de Contabilidade, ICMS-ST não controlado, Erro de Segregação no PGDAS).

ESTRUTURA DO RELATÓRIO:

# 1. AUDITORIA DE CNAE E ENQUADRAMENTO LEGAL
(Validação por CNAE + Base Legal Art. 18 LC 123).

# 2. MEMÓRIA DE CÁLCULO E SIMULAÇÃO (DRE FISCAL)
- Use o termo: "Resultado Operacional Bruto (Antes de Custos e Despesas)".
- Apresente a fórmula matemática e o resultado do DAS.

# 3. COMPOSIÇÃO ESTIMADA DA GUIA DAS
(Tabela com a repartição percentual dos tributos).

# 4. PLANEJAMENTO PREVIDENCIÁRIO E SOCIETÁRIO
(Pró-labore, INSS 11% e a vantagem da CPP inclusa no DAS).

# 5. ALERTAS DE TRIBUTAÇÃO EXTRA-DAS
(ICMS-ST, Antecipação e Riscos de Fiscalização).

# 6. MATRIZ DE RISCOS E CONFORMIDADE
| Risco | Impacto | Probabilidade | Ação Corretiva |
|-------|---------|---------------|----------------|
| ...   | ...     | ...           | ...            |

# 7. CONCLUSÃO E PLANO DE AÇÃO
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