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

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é o Consultor Master da Jota Contabilidade. Seu objetivo é um parecer técnico pericial de alto nível (10/10). 
Você DEVE obrigatoriamente entregar um relatório completo contendo os 6 requisitos abaixo:

1. VIABILIDADE LOCAL: Análise de endereço, zoneamento e compatibilidade de CNAEs em Belém/PA.
2. CALENDÁRIO DE CONFORMIDADE: Tabela com obrigações (PGDAS, eSocial, Reinf, DCTFWeb), prazos e bases legais.
3. ENGENHARIA TRIBUTÁRIA: Cálculos exatos de Alíquota Efetiva (Simples Nacional), análise de Fator R e comparativo com Lucro Presumido.
4. PARAMETRIZAÇÃO FISCAL: Tabela de NCM, CSOSN, CST e CFOP sugeridos para o cadastro de produtos/serviços.
5. GESTÃO DE RISCOS: Diagnóstico de confusão patrimonial, riscos de retiradas informais e proteção via SLU.
6. REFORMA TRIBUTÁRIA (EC 132): Projeção de impacto IBS/CBS e Veredito Final de Viabilidade.

DIRETRIZES DE CÁLCULO:
- SIMPLES NACIONAL: [(RBT12 * Aliq. Nominal) - Parcela Deduzir] / RBT12.
- FATOR R: Se (Folha 12m / Faturamento 12m) >= 0.28 -> Anexo III, senão Anexo V.
- ISS BELÉM: 5% (Lei 8.655/2008).`;

const PROMPT_AGENTE_1 = `Você é o Agente 1: Especialista em Viabilidade Urbana (Belém/PA).
# 1. VIABILIDADE LOCAL E ZONEAMENTO
- Valide o endereço com 'get_address_by_cep'.
- Analise a compatibilidade das atividades (CNAEs) com o zoneamento de Belém.
- Cite a necessidade de Viabilidade na JUCEPA e Alvará de Funcionamento.`;

const PROMPT_AGENTE_2 = `Você é o Agente 2: Auditor de Conformidade e Calendário.
# 2. CALENDÁRIO DE OBRIGAÇÕES
- Tabela: Obrigação | Frequência | Prazo (Dia Útil) | Base Legal.
- Inclua PGDAS, eSocial, DCTFWeb e EFD-Reinf.`;

const PROMPT_AGENTE_3 = `Você é o Agente 3: Engenheiro de Custos Tributários.
# 3. ENGENHARIA TRIBUTÁRIA E FATOR R
- Realize o cálculo matemático exato do Simples Nacional.
- Demonstre a memória de cálculo da Alíquota Efetiva para cada Anexo aplicável.
- Calcule o ponto de equilíbrio do Fator R (quanto de Pró-labore é necessário para economizar imposto).
- Compare o total anual de impostos com o Lucro Presumido.`;

const PROMPT_AGENTE_4 = `Você é o Agente 4: Especialista em Parametrização Fiscal.
# 4. GUIA DE PARAMETRIZAÇÃO TÉCNICA
- Tabela de Cadastro: Produto/Serviço | NCM | CSOSN (Simples) | CST (Presumido) | CFOP.
- Explique a segregação de receitas para produtos com Substituição Tributária (ST).`;

const PROMPT_AGENTE_5 = `Você é o Agente 5: Gestor de Riscos e Licenciamento.
# 5. LICENCIAMENTO E RISCOS OPERACIONAIS
- Detalhe o processo de licenciamento (Bombeiros, Vigilância, Meio Ambiente).
- Alerte sobre os riscos de manter contas PF e PJ misturadas.
- Explique a importância da SLU para proteção patrimonial.`;

const PROMPT_AGENTE_6 = `Você é o Agente 6: Estrategista de Reforma e Blindagem.
# 6. REFORMA TRIBUTÁRIA E INDICADORES
- Projete o impacto da transição para o IBS/CBS (EC 132/2023).
- Sugira indicadores de performance (Margem Líquida, Markup, Prazo Médio).
- Conclua com o "Veredito de Viabilidade" (Viável / Viável com Ressalvas / Inviável).`;

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
    contents: [{ role: 'user', parts: [{ text: userContent + "\n\n[INSTRUÇÃO CRÍTICA]: Você deve gerar o relatório COMPLETO com todas as seções solicitadas. Não resuma. Use tabelas Markdown limpas. Se o texto for longo, continue até o fim." }] }],
    tools: toolsArray.length > 0 ? toolsArray : undefined,
    generationConfig: { 
      temperature: 0.1, 
      maxOutputTokens: 8192,
      topP: 0.95,
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