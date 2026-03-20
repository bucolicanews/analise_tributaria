import { JOTA_TOOLS_MANIFEST, loadDynamicSkills, executeSkill } from "./skills/taxSkills";

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

// --- PROMPTS ESTABILIZADOS (ANTI-LOOP / NÍVEL 10/10) ---

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é o Consultor Master da Jota Contabilidade. Seu objetivo é um parecer técnico pericial de alto nível.

DIRETRIZES DE ESTABILIDADE:
1. Seja denso e técnico, mas evite repetições desnecessárias.
2. Use tabelas curtas e objetivas para cálculos.
3. FOCO EM BELÉM/PA: Use alíquota de ISS de 5% (Lei Municipal nº 8.655/2008).

ESTRUTURA DO PARECER:
# RELATÓRIO TÉCNICO DE VIABILIDADE
1. VIABILIDADE LOCAL: Veredito sobre o endereço e zoneamento.
2. ENGENHARIA TRIBUTÁRIA: Simulação de DAS (Anexo I, III e V) e Fator R.
3. PARAMETRIZAÇÃO: Sugestão de NCM e CSOSN para os itens principais.
4. RISCOS E BLINDAGEM: Diagnóstico de confusão patrimonial.`;

const PROMPT_AGENTE_1 = `Você é o Agente 1: Especialista em Viabilidade Urbana (Belém/PA).
# 1. VIABILIDADE LOCAL E ZONEAMENTO
- Valide o endereço com 'get_address_by_cep'.
- Analise a compatibilidade com o Plano Diretor de Belém (Lei 8.655/2008).`;

const PROMPT_AGENTE_2 = `Você é o Agente 2: Auditor de Conformidade e Calendário.
# 2. CALENDÁRIO DE OBRIGAÇÕES
- Tabela objetiva: Obrigação | Prazo | Base Legal.
- Foco em PGDAS, eSocial e EFD-Reinf.`;

const PROMPT_AGENTE_3 = `Você é o Agente 3: Engenheiro de Custos Tributários.
# 3. ENGENHARIA TRIBUTÁRIA E FATOR R
- Calcule o DAS (Anexo I, III e V) em R$ com base no faturamento informado.
- Demonstre o cálculo do Fator R (Folha/Faturamento) e a economia gerada.
- Compare com o Lucro Presumido de forma tabular.`;

const PROMPT_AGENTE_4 = `Você é o Agente 4: Especialista em Parametrização Fiscal.
# 4. GUIA DE PARAMETRIZAÇÃO TÉCNICA
- Tabela: Item | NCM | CSOSN | CFOP | Classe IBS/CBS.
- Limite-se aos 10 itens mais relevantes para evitar cortes no texto.`;

const PROMPT_AGENTE_5 = `Você é o Agente 5: Gestor de Riscos e Licenciamento.
# 5. LICENCIAMENTO E RISCOS OPERACIONAIS
- Detalhe Alvará SIAT Belém e Bombeiros PA.
- Analise riscos de confusão patrimonial (PF vs PJ).`;

const PROMPT_AGENTE_6 = `Você é o Agente 6: Estrategista de Reforma e Blindagem.
# 6. REFORMA TRIBUTÁRIA E INDICADORES
- Projete o impacto do IBS/CBS (EC 132/2023).
- Tabela de indicadores financeiros sugeridos para os sócios.`;

export const DEFAULT_AGENTS: AgentConfig[] = [
  { id: '1', nome: '1. Viabilidade Local', order: 1, systemPrompt: PROMPT_AGENTE_1 },
  { id: '2', nome: '2. Calendário e Reinf', order: 2, systemPrompt: PROMPT_AGENTE_2 },
  { id: '3', nome: '3. Engenharia de Custos', order: 3, systemPrompt: PROMPT_AGENTE_3 },
  { id: '4', nome: '4. Parametrização Fiscal', order: 4, systemPrompt: PROMPT_AGENTE_4 },
  { id: '5', nome: '5. Riscos e Licenciamento', order: 5, systemPrompt: PROMPT_AGENTE_5 },
  { id: '6', nome: '6. Reforma e Blindagem', order: 6, systemPrompt: PROMPT_AGENTE_6 },
];

export async function callGeminiAgent(
  systemPrompt: string,
  userContent: string,
  apiKey: string
): Promise<string> {
  if (!apiKey) throw new Error('Chave API Gemini não configurada.');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  const dynamicSkills = loadDynamicSkills().filter(s => s.isActive);
  const dynamicManifests = dynamicSkills.map(s => ({ name: s.name, description: s.description, parameters: s.parameters }));
  const allFunctionTools = [...JOTA_TOOLS_MANIFEST, ...dynamicManifests];
  const toolsArray: any[] = [];
  if (allFunctionTools.length > 0) toolsArray.push({ functionDeclarations: allFunctionTools });

  const initialBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userContent + "\n\n[INSTRUÇÃO]: Seja técnico, use tabelas limpas e evite repetições de caracteres." }] }],
    tools: toolsArray.length > 0 ? toolsArray : undefined,
    generationConfig: { 
      temperature: 0.1, 
      maxOutputTokens: 4096, // Reduzido para garantir estabilidade por agente
      topP: 0.8,
      topK: 40
    }, 
  };

  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(initialBody) });
  if (!response.ok) throw new Error(`Erro API: ${response.status}`);
  const data = await response.json();
  let message = data?.candidates?.[0]?.content;
  let firstText = message?.parts?.filter((p: any) => p.text).map((p: any) => p.text).join('\n') || '';

  if (message?.parts?.some((p: any) => p.functionCall)) {
    const toolResults: any[] = [];
    for (const part of message.parts) {
      if (part.functionCall) {
        const { name, args } = part.functionCall;
        const result = await executeSkill(name, args);
        toolResults.push({ functionResponse: { name, response: result } });
      }
    }
    const finalBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      tools: toolsArray.length > 0 ? toolsArray : undefined,
      contents: [{ role: 'user', parts: [{ text: userContent }] }, message, { role: 'function', parts: toolResults }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
    };
    const finalRes = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalBody) });
    const finalData = await finalRes.json();
    let secondText = finalData?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('\n') || '';
    return (firstText + '\n' + secondText).trim();
  }
  return firstText.trim();
}

export async function callAgentWebhook(agent: AgentConfig, userContent: string, previousReports?: Record<string, string>): Promise<string> {
  if (!agent.webhookUrl) throw new Error(`Webhook não configurado.`);
  const response = await fetch(agent.webhookUrl.trim(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentName: agent.nome, data: JSON.parse(userContent), previousReports }) });
  const data = await response.json();
  return data.report || data.output || "Erro no processamento.";
}

export function loadAgentsFromStorage(): AgentConfig[] {
  const raw = localStorage.getItem('jota-agentes');
  return raw ? JSON.parse(raw) : DEFAULT_AGENTS;
}

export function saveAgentsToStorage(agents: AgentConfig[]): void {
  localStorage.setItem('jota-agentes', JSON.stringify(agents));
}