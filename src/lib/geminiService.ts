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

// --- SUPER PROMPT CONSOLIDADO (PADRÃO JOTA - 10/10) ---

const SUPER_PROMPT_JOTA = `Você é o Consultor Master da Jota Contabilidade. Seu objetivo é um parecer 10/10, totalmente operacional.

⛔ REGRAS CRÍTICAS:
1. NUNCA RESUMA. Detalhe cada cálculo.
2. USE VALORES REAIS: Se o faturamento é X, calcule o DAS exato em R$.
3. FOCO EM BELÉM/PA: Use as alíquotas de ISS de Belém (geralmente 5%) e cite a Lei de Uso e Ocupação do Solo de Belém.

ESTRUTURA DO RELATÓRIO:

# RELATÓRIO TÉCNICO DE VIABILIDADE E PLANEJAMENTO TRIBUTÁRIO - JOTA CONTABILIDADE

### 1. VIABILIDADE LOCAL E ZONEAMENTO (FOCO PRÁTICO)
- Veredito de viabilidade.
- Validação via 'get_address_by_cep'.
- **LEGISLAÇÃO**: Cite a Lei Municipal nº 8.655/2008 (Plano Diretor de Belém) ou equivalente para o zoneamento do cliente.

### 2. CALENDÁRIO DE OBRIGAÇÕES E FERRAMENTAS
- Tabela com: Obrigação, Periodicidade (Mensal/Anual), Prazo (Ex: Dia 20) e Anexo Vinculado (I, III ou V).
- Ferramentas: Certificado A1, Emissor, Sistemas.

### 3. EVENTOS ESOCIAL E REINF (GUIA PARA O CONTADOR)
- Detalhamento de S-1200, R-2010, R-2020 e Série R-4000 com exemplos de valores.

### 4. ANÁLISE DE RETENÇÕES E CÓDIGOS FISCAIS INTERESTADUAIS
- Dispensa de retenção (Art. 191 IN RFB 971/2009).
- **TABELA DE CÓDIGOS**: Inclua CFOPs de venda interna (5102/5405) e interestadual (6102/6403).

### 5. ENGENHARIA TRIBUTÁRIA E FATOR R (O CORAÇÃO DO RELATÓRIO)
- **SIMULAÇÃO NUMÉRICA**: Calcule o DAS, INSS Patronal e IRRF sobre Pró-labore.
- **OTIMIZAÇÃO FATOR R**: Mostre a economia em R$ ao atingir 28% de folha para migrar do Anexo V para o III.
- **CENÁRIO ALTERNATIVO**: Compare Simples Nacional vs Lucro Presumido.

### 6. PARAMETRIZAÇÃO DE 20 ITENS
- Tabela: Produto/Serviço, NCM, CSOSN, CFOP, CEST, Classe IBS/CBS e CST PIS/COFINS.

### 7. LICENCIAMENTO E CUSTOS DE ABERTURA
- Detalhe: Alvará (Siat Belém), AVCB (Bombeiros PA), Vigilância e taxas da JUCEPA.

### 8. MATRIZ DE RISCOS E BLINDAGEM
- Analise Confusão Patrimonial e Pró-labore.
- **INDICADORES PARA SÓCIOS**: Tabela comparativa: Receita Bruta | Tributos Totais | Custos Fixos | Lucro Líquido Final.

### 9. CONCLUSÃO VINCULADA E RESPONSABILIDADE.`;

// --- PROMPTS DOS AGENTES ESPECIALISTAS ---

const PROMPT_AGENTE_1 = `Você é o Agente 1: Especialista em Localização e Viabilidade de Belém/PA.
CONTEÚDO OBRIGATÓRIO:
# 1. RESPOSTA DIRETA À CONSULTA DE VIABILIDADE E ENQUADRAMENTO
- Veredito imediato.
- Valide o endereço com 'get_address_by_cep'.
- Cite a Lei Municipal de Belém nº 8.655/2008 sobre zoneamento e ocupação do solo.`;

const PROMPT_AGENTE_2 = `Você é o Agente 2: Auditor de Conformidade e Calendário Fiscal.
CONTEÚDO OBRIGATÓRIO:
# 2. OBRIGAÇÕES E FERRAMENTAS NECESSÁRIAS
- Tabela: Obrigação | Periodicidade | Prazo | Anexo Vinculado.
# 3. DETALHAMENTO DA EFD-REINF E ESOCIAL
- Detalhe eventos com exemplos de preenchimento para o contador.
# 4. ANÁLISE DE RETENÇÃO E CÓDIGOS INTERESTADUAIS
- Explique a dispensa de retenção.
- Liste CFOPs para vendas dentro e fora do estado (5xxx e 6xxx).`;

const PROMPT_AGENTE_3 = `Você é o Agente 3: Engenheiro de Custos e Matemático Tributário.
CONTEÚDO OBRIGATÓRIO:
# 5. PROJEÇÃO DE CUSTO OPERACIONAL E FATOR R
- SIMULAÇÃO REAL: Calcule em R$ o DAS, INSS e IRRF.
- ANALISADOR FATOR R: Prove a economia exata em R$ ao sair do Anexo V para o III.
- COMPARATIVO: Simples vs Lucro Presumido (Impacto Financeiro Anual).
# 6. PARAMETRIZAÇÃO TÉCNICA: 20 PRODUTOS/SERVIÇOS
- Tabela completa com NCM, CSOSN, CFOP, CEST e Classe IBS/CBS.`;

const PROMPT_AGENTE_4 = `Você é o Agente 4: Gestor de Riscos e Licenciamento Pará.
CONTEÚDO OBRIGATÓRIO:
# 7. LICENCIAMENTO ESPECIALIZADO (BELÉM/PA)
- Detalhe taxas da JUCEPA, Alvará SIAT e Bombeiros PA.
# 8. EQUIPAMENTOS E COMPETÊNCIAS (NRs).
# 9. CUSTOS DE ABERTURA E FORMALIZAÇÃO.
# 10. ANÁLISE DE RISCOS E MATRIZ ESTRUTURADA
- Foco em Confusão Patrimonial e Pró-labore (Erro, Lei, Punição, Solução).`;

const PROMPT_AGENTE_5 = `Você é o Agente 5: Estrategista de Reforma e Indicadores de Gestão.
CONTEÚDO OBRIGATÓRIO:
# 11. IMPACTOS DA REFORMA TRIBUTÁRIA (EC 132/2023)
- Transição 2026-2033.
# 12. RECOMENDAÇÕES E INDICADORES PARA SÓCIOS
- Tabela de indicadores: Receita vs Tributos vs Custos vs Lucro Líquido.
- Passos para Blindagem Patrimonial.
# 13. CONCLUSÕES TÉCNICAS E CLÁUSULA FINAL.`;

export const DEFAULT_PRE_ANALYSIS_PROMPT = SUPER_PROMPT_JOTA;

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
    contents: [{ role: 'user', parts: [{ text: userContent + "\n\n[INSTRUÇÃO]: Gere o relatório 10/10 com simulações numéricas em R$, códigos fiscais interestaduais e legislação de Belém/PA." }] }],
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
  { id: '1', nome: '1. Validador e Localização', order: 1, systemPrompt: PROMPT_AGENTE_1 },
  { id: '2', nome: '2. Auditor de Conformidade', order: 2, systemPrompt: PROMPT_AGENTE_2 },
  { id: '3', nome: '3. Planejador e Fator R', order: 3, systemPrompt: PROMPT_AGENTE_3 },
  { id: '4', nome: '4. Riscos e Licenciamento', order: 4, systemPrompt: PROMPT_AGENTE_4 },
  { id: '5', nome: '5. Reforma e Blindagem', order: 5, systemPrompt: PROMPT_AGENTE_5 },
];