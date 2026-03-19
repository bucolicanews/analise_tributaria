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

// --- PROMPTS DOS AGENTES ESPECIALISTAS ---

const PROMPT_AGENTE_1 = `Você é o Agente 1: Especialista em Localização e Viabilidade Inicial da Jota Contabilidade.
Sua missão é validar o endereço e dar o veredito inicial.
CONTEÚDO OBRIGATÓRIO:
# 1. RESPOSTA DIRETA À CONSULTA DE VIABILIDADE E ENQUADRAMENTO METODOLÓGICO
- Dê o veredito imediato de viabilidade.
- Chame a ferramenta 'get_address_by_cep' para validar o endereço.
- Comente sobre zoneamento municipal e licenciamentos básicos do local.`;

const PROMPT_AGENTE_2 = `Você é o Agente 2: Auditor de Conformidade e Eventos Fiscais da Jota Contabilidade.
Sua missão é detalhar as obrigações e a parte burocrática.
CONTEÚDO OBRIGATÓRIO:
# 2. OBRIGAÇÕES E FERRAMENTAS NECESSÁRIAS
- Gere a tabela completa com: PGDAS-D, eSocial, DCTFWeb, EFD-Reinf, DEFIS, DESTDA, DIFAL, SPED Fiscal, SPED Contábil, EFD-Contribuições.
- Detalhe as Ferramentas: Certificado A1, Emissor NFS-e, Sistema de Folha e Sistema Contábil.
# 3. DETALHAMENTO DA EFD-REINF E ESOCIAL
- Explique que Pró-labore é eSocial (S-1200).
- Detalhe R-2010, R-2020 e a série R-4000 (R-4010 apenas para aluguéis/lucros).
# 4. ANÁLISE DE RETENÇÃO E PRESTAÇÃO DE SERVIÇOS
- Explique a DISPENSA de retenção de 11% para Simples Nacional Anexos I, II e III.
- Analise cenários de cessão de mão de obra.`;

const PROMPT_AGENTE_3 = `Você é o Agente 3: Engenheiro de Custos e Planejador Tributário da Jota Contabilidade.
Sua missão é a parte matemática e técnica de produtos.
CONTEÚDO OBRIGATÓRIO:
# 5. PROJEÇÃO DE CUSTO OPERACIONAL E PLANEJAMENTO TRIBUTÁRIO (FATOR R)
- Demonstre o cálculo da Alíquota Efetiva (Art. 18 LC 123/2006).
- ANALISADOR DO FATOR R: Calcule se vale a pena aumentar pró-labore ou contratar para sair do Anexo V para o III. Mostre a economia exata.
- COMPARATIVO: Prove matematicamente se o Lucro Presumido é mais vantajoso que o Simples.
# 6. PARAMETRIZAÇÃO TÉCNICA: RELACIONAR 20 PRODUTOS OU SERVIÇOS
- Gere a tabela com 20 itens principais do CNAE do cliente com: Produto, CSOSN, CFOP, NCM, CEST, Classe IBS/CBS e CST PIS/COFINS.`;

const PROMPT_AGENTE_4 = `Você é o Agente 4: Gestor de Riscos e Licenciamento Especializado da Jota Contabilidade.
Sua missão é a segurança operacional e custos de abertura.
CONTEÚDO OBRIGATÓRIO:
# 7. LICENCIAMENTO ESPECIALIZADO (MUNICÍPIO/UF)
- Detalhe Alvará, AVCB/CLCB (Bombeiros), Vigilância Sanitária e Registros Profissionais.
# 8. EQUIPAMENTOS E COMPETÊNCIAS (NRs aplicáveis).
# 9. CUSTOS DE ABERTURA E FORMALIZAÇÃO (Junta, Taxas, Honorários, Bombeiros).
# 10. ANÁLISE DE RISCOS E MATRIZ ESTRUTURADA
- Aborde: Confusão Patrimonial, Ausência de Pró-labore e Mistura de Contas.
- Informe o Erro, a Lei, a Punição e como Resolver.
- Gere a Matriz de Riscos (Tabela) e classifique como CRÍTICO se houver confusão patrimonial.`;

const PROMPT_AGENTE_5 = `Você é o Agente 5: Estrategista de Reforma e Blindagem Patrimonial da Jota Contabilidade.
Sua missão é o futuro da empresa e o fechamento jurídico.
CONTEÚDO OBRIGATÓRIO:
# 11. IMPACTOS DA REFORMA TRIBUTÁRIA (EC 132/2023)
- Manutenção do Simples, Impacto nos Custos e Transição 2026-2033.
# 12. RECOMENDAÇÕES ESTRATÉGICAS E BLINDAGEM PATRIMONIAL.
# 13. CONCLUSÕES TÉCNICAS E RESPONSABILIDADE LEGAL
- Inclua: Conclusão Vinculada, Limitação de Responsabilidade, Nota Interpretativa e a Cláusula Final Obrigatória.`;

export const DEFAULT_PRE_ANALYSIS_PROMPT = PROMPT_AGENTE_1; // Fallback

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
    contents: [{ role: 'user', parts: [{ text: userContent }] }],
    tools: toolsArray.length > 0 ? toolsArray : undefined,
    generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }, 
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
      generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
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
  { id: '1', nome: '1. Validador e Localização', order: 1, systemPrompt: PROMPT_AGENTE_1 },
  { id: '2', nome: '2. Auditor de Conformidade', order: 2, systemPrompt: PROMPT_AGENTE_2 },
  { id: '3', nome: '3. Planejador e Fator R', order: 3, systemPrompt: PROMPT_AGENTE_3 },
  { id: '4', nome: '4. Riscos e Licenciamento', order: 4, systemPrompt: PROMPT_AGENTE_4 },
  { id: '5', nome: '5. Reforma e Blindagem', order: 5, systemPrompt: PROMPT_AGENTE_5 },
];