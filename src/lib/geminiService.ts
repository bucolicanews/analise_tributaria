import { JOTA_SKILLS, JOTA_TOOLS_MANIFEST } from "./skills/taxSkills";

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
Seu objetivo é emitir um Parecer Técnico de Viabilidade de nível PREMIUM.

VOCÊ POSSUI SKILLS (FERRAMENTAS) TÉCNICAS:
- Use 'calculate_simples_nacional' para alíquotas exatas.
- Use 'analyze_fator_r' para decisões de Anexo III vs V.
- Use 'get_ncm_technical_info' para regras de produtos.

Sempre que precisar de um cálculo ou dado técnico, CHAME A SKILL correspondente antes de escrever o valor. Isso garante precisão de 100%.

ESTRUTURA DO RELATÓRIO:
# 1. AUDITORIA DE CNAE E ENQUADRAMENTO LEGAL
# 2. MEMÓRIA DE CÁLCULO E SIMULAÇÃO (DRE FISCAL)
# 3. COMPOSIÇÃO ESTIMADA DA GUIA DAS (REPARTIÇÃO TRIBUTÁRIA)
# 4. PLANEJAMENTO PREVIDENCIÁRIO E SOCIETÁRIO (PRÓ-LABORE E DDL)
# 5. ALERTAS DE TRIBUTAÇÃO EXTRA-DAS (ICMS-ST E DIFAL)
# 6. MATRIZ DE RISCOS E CONFORMIDADE
# 7. CONCLUSÃO E PLANO DE AÇÃO`;

export async function callGeminiAgent(
  systemPrompt: string,
  userContent: string,
  apiKey: string
): Promise<string> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Chave API Gemini não configurada.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  // 1. Primeira chamada: Envia o prompt e as ferramentas disponíveis
  const initialBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userContent }] }],
    tools: [{ function_declarations: JOTA_TOOLS_MANIFEST }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(initialBody),
  });

  if (!response.ok) throw new Error(`Erro API Gemini: ${response.status}`);

  const data = await response.json();
  let message = data?.candidates?.[0]?.content;

  // 2. Loop de Execução de Skills (Function Calling)
  // Se a IA quiser chamar uma função, nós executamos e enviamos de volta
  if (message?.parts?.some((p: any) => p.functionCall)) {
    const toolResults: any[] = [];
    
    for (const part of message.parts) {
      if (part.functionCall) {
        const { name, args } = part.functionCall;
        console.log(`[Skill Engine] Executando: ${name}`, args);
        
        // Executa a função localmente
        const skillFn = (JOTA_SKILLS as any)[name];
        const result = skillFn ? skillFn(args) : { error: "Skill não encontrada" };
        
        toolResults.push({
          functionResponse: {
            name,
            response: { content: result }
          }
        });
      }
    }

    // 3. Segunda chamada: Envia os resultados das funções para a IA finalizar o texto
    const finalBody = {
      ...initialBody,
      contents: [
        { role: 'user', parts: [{ text: userContent }] },
        message, // A requisição da IA
        { role: 'function', parts: toolResults } // Nossas respostas técnicas
      ]
    };

    const finalRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalBody),
    });

    const finalData = await finalRes.json();
    message = finalData?.candidates?.[0]?.content;
  }

  const parts = message?.parts;
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
    systemPrompt: DEFAULT_PRE_ANALYSIS_PROMPT,
  },
  {
    id: 'agente-decisor',
    nome: '3. Resumo Executivo e Decisão',
    order: 3,
    systemPrompt: `Resuma o melhor regime, calcule a economia anual real e crie um plano de ação de 5 passos.`,
  },
];