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

// --- PROMPTS ESTABILIZADOS (NÍVEL 10/10 SEM LOOPS) ---

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é o Consultor Master da Jota Contabilidade. Seu objetivo é um parecer técnico pericial de alto nível.

DIRETRIZES DE ESTABILIDADE:
1. Apresente cálculos matemáticos de forma clara e estruturada.
2. Use valores reais baseados nos dados fornecidos.
3. FOCO EM BELÉM/PA: Use alíquota de ISS de 5% (Lei Municipal nº 8.655/2008).

ESTRUTURA DO PARECER:
# RELATÓRIO TÉCNICO DE VIABILIDADE
1. VIABILIDADE LOCAL: Veredito sobre o endereço e zoneamento.
2. ENGENHARIA TRIBUTÁRIA: Simulação de DAS (Anexo I, III e V) e impacto do Fator R.
3. PARAMETRIZAÇÃO: Sugestão de NCM, CSOSN e CFOP para os principais itens.
4. RISCOS E BLINDAGEM: Diagnóstico de confusão patrimonial e recomendações aos sócios.`;

const PROMPT_AGENTE_1 = `Você é o Agente 1: Especialista em Viabilidade Urbana (Belém/PA).
# 1. VIABILIDADE LOCAL E ZONEAMENTO
- Valide o endereço usando a ferramenta 'get_address_by_cep'.
- Analise a compatibilidade da atividade com o Plano Diretor de Belém (Lei 8.655/2008).`;

const PROMPT_AGENTE_2 = `Você é o Agente 2: Auditor de Conformidade e Calendário.
# 2. CALENDÁRIO DE OBRIGAÇÕES
- Liste as obrigações mensais e anuais (DAS, PGDAS, DEFIS, eSocial, DCTFWeb).
- Explique a importância da Série R-4000 da EFD-Reinf para o negócio.`;

const PROMPT_AGENTE_3 = `Você é o Agente 3: Engenheiro de Custos Tributários.
# 3. ENGENHARIA TRIBUTÁRIA E FATOR R
- Realize a simulação do Simples Nacional (Anexos I, III e V) em valores monetários (R$).
- Demonstre matematicamente o benefício do Fator R (28%) para a redução da carga tributária.
- Compare com o Lucro Presumido para validar a melhor opção.`;

const PROMPT_AGENTE_4 = `Você é o Agente 4: Especialista em Parametrização Fiscal.
# 4. GUIA DE PARAMETRIZAÇÃO TÉCNICA
- Forneça uma tabela com: Produto/Serviço, NCM, CSOSN, CFOP (Interno/Interestadual) e CST PIS/COFINS.
- Foque nos itens de maior relevância para o setor de motocicletas.`;

const PROMPT_AGENTE_5 = `Você é o Agente 5: Gestor de Riscos e Licenciamento.
# 5. LICENCIAMENTO E RISCOS OPERACIONAIS
- Detalhe o processo de Alvará no SIAT Belém e licenciamento dos Bombeiros PA.
- Analise riscos de confusão patrimonial e retiradas informais de lucro.`;

const PROMPT_AGENTE_6 = `Você é o Agente 6: Estrategista de Reforma e Blindagem.
# 6. REFORMA TRIBUTÁRIA E INDICADORES
- Projete o impacto da transição para o IBS/CBS (EC 132/2023).
- Apresente uma tabela de indicadores financeiros sugeridos para os sócios.`;

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
    contents: [{ role: 'user', parts: [{ text: userContent + "\n\n[INSTRUÇÃO]: Seja técnico e preciso. Evite repetições de caracteres ou tabelas infinitas." }] }],
    tools: toolsArray.length > 0 ? toolsArray : undefined,
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }, 
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
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
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