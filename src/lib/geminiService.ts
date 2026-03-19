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

// --- PROMPTS DOS AGENTES ESPECIALISTAS (DISTRIBUIÇÃO DE CARGA PARA MÁXIMO CONTEXTO) ---

const PROMPT_AGENTE_1 = `Você é o Agente 1: Especialista em Localização e Viabilidade de Belém/PA.
# 1. VIABILIDADE LOCAL E ZONEAMENTO (FOCO PRÁTICO)
- Veredito imediato.
- Valide o endereço com 'get_address_by_cep'.
- Cite a Lei Municipal de Belém nº 8.655/2008 e normas de Mosqueiro.`;

const PROMPT_AGENTE_2 = `Você é o Agente 2: Auditor de Conformidade e Calendário Fiscal.
# 2. CALENDÁRIO DE OBRIGAÇÕES E FERRAMENTAS
- Tabela: Obrigação | Periodicidade | Prazo | Anexo Vinculado.
# 3. EVENTOS ESOCIAL E REINF (GUIA PARA O CONTADOR)
- Detalhe S-1200, R-2010, R-2020 e Série R-4000 com exemplos práticos.`;

const PROMPT_AGENTE_3 = `Você é o Agente 3: Engenheiro de Custos e Matemático Tributário.
# 4. ENGENHARIA TRIBUTÁRIA E FATOR R (O CORAÇÃO DO RELATÓRIO)
- SIMULAÇÃO REAL: Calcule em R$ o DAS (Anexo I, III e V), INSS Patronal e IRRF.
- ANALISADOR FATOR R: Prove a economia exata em R$ ao atingir 28% de folha.
- COMPARATIVO: Simples vs Lucro Presumido (Impacto Financeiro Anual).
- NUNCA RESUMA OS CÁLCULOS. Mostre a memória de cálculo completa.`;

const PROMPT_AGENTE_4 = `Você é o Agente 4: Especialista em Parametrização Fiscal.
# 5. PARAMETRIZAÇÃO TÉCNICA: 20 PRODUTOS/SERVIÇOS
- Tabela completa: Produto/Serviço, NCM, CSOSN, CFOP (Interno e Interestadual), CEST, Classe IBS/CBS e CST PIS/COFINS.
- Inclua códigos para venda dentro (5xxx) e fora do estado (6xxx).`;

const PROMPT_AGENTE_5 = `Você é o Agente 5: Gestor de Riscos e Licenciamento Pará.
# 6. LICENCIAMENTO ESPECIALIZADO (BELÉM/PA)
- Detalhe taxas da JUCEPA, Alvará SIAT e Bombeiros PA.
# 7. ANÁLISE DE RISCOS E MATRIZ ESTRUTURADA
- Foco em Confusão Patrimonial e Pró-labore (Erro, Lei, Punição, Solução).`;

const PROMPT_AGENTE_6 = `Você é o Agente 6: Estrategista de Reforma e Blindagem.
# 8. IMPACTOS DA REFORMA TRIBUTÁRIA (EC 132/2023)
- Transição 2026-2033.
# 9. RECOMENDAÇÕES E INDICADORES PARA SÓCIOS
- Tabela de indicadores: Receita vs Tributos vs Custos vs Lucro Líquido.
- Passos para Blindagem Patrimonial.`;

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é o Consultor Master da Jota Contabilidade. Gere um parecer técnico 10/10, sem resumos, com foco em Belém/PA e simulações em R$.`;

export async function callGeminiAgent(
  systemPrompt: string,
  userContent: string,
  apiKey: string
): Promise<string> {
  if (!apiKey) throw new Error('Chave API Gemini não configurada.');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const dynamicSkills = loadDynamicSkills().filter(s => s.isActive);
  const dynamicManifests = dynamicSkills.map(s => ({
    name: s.name,
    description: s.description,
    parameters: s.parameters
  }));

  const allFunctionTools = [...JOTA_TOOLS_MANIFEST, ...dynamicManifests];
  const toolsArray: any[] = [];
  if (allFunctionTools.length > 0) toolsArray.push({ functionDeclarations: allFunctionTools });

  const initialBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userContent + "\n\n[INSTRUÇÃO]: Seja extremamente detalhado. Use todo o espaço disponível para cálculos e base legal." }] }],
    tools: toolsArray.length > 0 ? toolsArray : undefined,
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }, 
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(initialBody),
  });

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

    const finalRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalBody),
    });

    const finalData = await finalRes.json();
    let secondText = finalData?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('\n') || '';
    return (firstText + '\n' + secondText).trim();
  }

  return firstText.trim();
}

export async function callAgentWebhook(
  agent: AgentConfig,
  userContent: string,
  previousReports?: Record<string, string>
): Promise<string> {
  if (!agent.webhookUrl) throw new Error(`Webhook não configurado.`);
  const response = await fetch(agent.webhookUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentName: agent.nome, data: JSON.parse(userContent), previousReports }),
  });
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

export const DEFAULT_AGENTS: AgentConfig[] = [
  { id: '1', nome: '1. Localização e Viabilidade', order: 1, systemPrompt: PROMPT_AGENTE_1 },
  { id: '2', nome: '2. Conformidade e Calendário', order: 2, systemPrompt: PROMPT_AGENTE_2 },
  { id: '3', nome: '3. Engenharia de Custos (DRE)', order: 3, systemPrompt: PROMPT_AGENTE_3 },
  { id: '4', nome: '4. Parametrização Fiscal (20 itens)', order: 4, systemPrompt: PROMPT_AGENTE_4 },
  { id: '5', nome: '5. Riscos e Licenciamento', order: 5, systemPrompt: PROMPT_AGENTE_5 },
  { id: '6', nome: '6. Reforma e Blindagem', order: 6, systemPrompt: PROMPT_AGENTE_6 },
];