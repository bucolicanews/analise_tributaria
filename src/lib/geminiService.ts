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

const SUPER_PROMPT_JOTA = `Você é um Consultor Tributário Sênior e Planejador Tributário Nível Extremo (10/10) da Jota Contabilidade.
Sua missão é gerar um Parecer Técnico e Pericial de altíssimo nível, analítico e 100% prático.

⛔ REGRA DE OURO: É ESTRITAMENTE PROIBIDO RESUMIR. VOCÊ DEVE GERAR TODAS AS 13 SEÇÕES ABAIXO COM DADOS NUMÉRICOS SIMULADOS.

ESTRUTURA OBRIGATÓRIA:

# RELATÓRIO TÉCNICO DE VIABILIDADE E PLANEJAMENTO TRIBUTÁRIO - JOTA CONTABILIDADE

### 1. RESPOSTA DIRETA À CONSULTA DE VIABILIDADE E ENQUADRAMENTO METODOLÓGICO
- Veredito imediato de viabilidade.
- Valide o endereço com 'get_address_by_cep'. 
- **NOVO**: Referencie a legislação municipal de zoneamento e licenciamento específica para o setor do cliente (ex: normas para oficinas, comércio de peças, etc).

### 2. OBRIGAÇÕES E FERRAMENTAS NECESSÁRIAS
- Tabela completa: PGDAS-D, eSocial, DCTFWeb, EFD-Reinf, DEFIS, DESTDA, DIFAL, SPED Fiscal, SPED Contábil, EFD-Contribuições.
- Ferramentas: Certificado A1, Emissor NFS-e, Sistema de Folha e Sistema Contábil.

### 3. DETALHAMENTO DA EFD-REINF E ESOCIAL
- Pró-labore/Folha = eSocial (S-1200).
- Reinf: R-2010, R-2020 e Série R-4000 (R-4010 apenas para aluguéis/lucros).

### 4. ANÁLISE DE CENÁRIOS: RETENÇÃO E PRESTAÇÃO DE SERVIÇOS
- Explique a DISPENSA de retenção de 11% para Simples Nacional (Anexos I, II e III).
- **NOVO**: Inclua códigos fiscais completos (CFOP, NCM, CST) para as atividades de comércio e serviço.

### 5. PROJEÇÃO DE CUSTO OPERACIONAL E PLANEJAMENTO TRIBUTÁRIO (FATOR R)
- **SIMULAÇÃO NUMÉRICA**: Apresente valores simulados de DAS, INSS Patronal, IRRF sobre pró-labore e alíquotas efetivas.
- **ANALISADOR FATOR R**: Calcule se vale a pena aumentar pró-labore para sair do Anexo V para o III. Mostre a economia exata em R$.
- **COMPARATIVO DE CENÁRIOS**: Tabela comparativa (Simples vs Presumido) mostrando economia fiscal e riscos de desenquadramento.

### 6. PARAMETRIZAÇÃO TÉCNICA: RELACIONAR 20 PRODUTOS OU SERVIÇOS
- Tabela com 20 itens: Produto, CSOSN, CFOP, NCM, CEST, Classe IBS/CBS e CST PIS/COFINS.

### 7. LICENCIAMENTO ESPECIALIZADO (MUNICÍPIO/UF)
- Alvará, AVCB/CLCB (Bombeiros), Vigilância Sanitária e Registros Profissionais.

### 8. EQUIPAMENTOS E COMPETÊNCIAS (NRs aplicáveis).

### 9. CUSTOS DE ABERTURA E FORMALIZAÇÃO (Junta, Taxas, Honorários, Bombeiros).

### 10. ANÁLISE DE RISCOS (OPERACIONAL, TRABALHISTA E FISCAL)
- ANALISE O COMPORTAMENTO: Se houver Confusão Patrimonial ou Ausência de Pró-labore, informe: O ERRO, A LEI, A PUNIÇÃO e COMO RESOLVER.
- Matriz de Riscos (Tabela) e Classificação Geral (CRÍTICO se houver confusão patrimonial).

### 11. IMPACTOS DA REFORMA TRIBUTÁRIA (EC 132/2023)
- Manutenção do Simples, Impacto nos Custos e Transição 2026-2033.

### 12. RECOMENDAÇÕES ESTRATÉGICAS E INDICADORES PARA SÓCIOS
- **NOVO**: Tabela de indicadores comparando Receita Bruta, Tributos Totais, Custos Operacionais e Lucro Líquido Final.
- Passos para Blindagem Patrimonial.

### 13. CONCLUSÕES TÉCNICAS E RESPONSABILIDADE LEGAL
- Conclusão Vinculada, Limitação de Responsabilidade, Nota Interpretativa e Cláusula Final Obrigatória.`;

// --- PROMPTS DOS AGENTES ESPECIALISTAS ATUALIZADOS ---

const PROMPT_AGENTE_1 = `Você é o Agente 1: Especialista em Localização e Viabilidade da Jota Contabilidade.
CONTEÚDO OBRIGATÓRIO:
# 1. RESPOSTA DIRETA À CONSULTA DE VIABILIDADE E ENQUADRAMENTO METODOLÓGICO
- Dê o veredito imediato de viabilidade.
- Chame a ferramenta 'get_address_by_cep' para validar o endereço.
- Referencie a legislação municipal de zoneamento e licenciamento específica para o setor do cliente (ex: normas para oficinas, comércio de peças, etc).`;

const PROMPT_AGENTE_2 = `Você é o Agente 2: Auditor de Conformidade e Códigos Fiscais da Jota Contabilidade.
CONTEÚDO OBRIGATÓRIO:
# 2. OBRIGAÇÕES E FERRAMENTAS NECESSÁRIAS
- Tabela completa com prazos e penalidades.
# 3. DETALHAMENTO DA EFD-REINF E ESOCIAL
- Detalhe eventos S-1200, R-2010, R-2020 e Série R-4000.
# 4. ANÁLISE DE RETENÇÃO E CÓDIGOS FISCAIS
- Explique a dispensa de retenção de 11% (Anexos I, II e III).
- Inclua códigos fiscais completos (CFOP, NCM, CST) para as atividades de comércio e serviço do cliente.`;

const PROMPT_AGENTE_3 = `Você é o Agente 3: Engenheiro de Custos e Planejador Tributário da Jota Contabilidade.
CONTEÚDO OBRIGATÓRIO:
# 5. PROJEÇÃO DE CUSTO OPERACIONAL E PLANEJAMENTO TRIBUTÁRIO (FATOR R)
- SIMULAÇÃO NUMÉRICA: Apresente valores simulados de DAS, INSS Patronal, IRRF sobre pró-labore e alíquotas efetivas.
- ANALISADOR FATOR R: Calcule a economia exata em R$ ao migrar do Anexo V para o III.
- COMPARATIVO DE CENÁRIOS: Tabela comparativa (Simples vs Presumido) mostrando economia fiscal e riscos de desenquadramento.
# 6. PARAMETRIZAÇÃO TÉCNICA: RELACIONAR 20 PRODUTOS OU SERVIÇOS
- Tabela com 20 itens: Produto, CSOSN, CFOP, NCM, CEST, Classe IBS/CBS e CST PIS/COFINS.`;

const PROMPT_AGENTE_4 = `Você é o Agente 4: Gestor de Riscos e Licenciamento da Jota Contabilidade.
CONTEÚDO OBRIGATÓRIO:
# 7. LICENCIAMENTO ESPECIALIZADO (MUNICÍPIO/UF)
- Detalhe Alvará, AVCB/CLCB (Bombeiros), Vigilância Sanitária e Registros Profissionais.
# 8. EQUIPAMENTOS E COMPETÊNCIAS (NRs aplicáveis).
# 9. CUSTOS DE ABERTURA E FORMALIZAÇÃO (Junta, Taxas, Honorários, Bombeiros).
# 10. ANÁLISE DE RISCOS E MATRIZ ESTRUTURADA
- Aborde Confusão Patrimonial e Ausência de Pró-labore.
- Gere a Matriz de Riscos (Tabela) e classifique como CRÍTICO se houver confusão patrimonial.`;

const PROMPT_AGENTE_5 = `Você é o Agente 5: Estrategista de Reforma e Indicadores de Gestão da Jota Contabilidade.
CONTEÚDO OBRIGATÓRIO:
# 11. IMPACTOS DA REFORMA TRIBUTÁRIA (EC 132/2023)
- Manutenção do Simples, Impacto nos Custos e Transição 2026-2033.
# 12. RECOMENDAÇÕES ESTRATÉGICAS E INDICADORES PARA SÓCIOS
- Tabela de indicadores comparando Receita Bruta, Tributos Totais, Custos Operacionais e Lucro Líquido Final.
- Passos para Blindagem Patrimonial.
# 13. CONCLUSÕES TÉCNICAS E RESPONSABILIDADE LEGAL
- Conclusão Vinculada e Cláusula Final Obrigatória.`;

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
    contents: [{ role: 'user', parts: [{ text: userContent + "\n\n[INSTRUÇÃO]: Gere o relatório completo com todas as seções solicitadas, incluindo simulações numéricas e códigos fiscais." }] }],
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