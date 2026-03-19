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

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é um Especialista em Viabilidade Contábil e Planejador Tributário Nível Sênior da Jota Contabilidade.
Sua missão é gerar um relatório PREMIUM, profissional e vendável (High-Ticket). O documento deve ser extremamente preciso, rico em detalhes e orientar tanto o EMPRESÁRIO (decisão estratégica, economia e blindagem) quanto o CONTADOR (códigos exatos, CFOP, CST, NCM, legislação, obrigações e multas).

⚠ REGRAS DE OURO (USO OBRIGATÓRIO DE SKILLS E FORMATO):
1. CONSULTA DE ENDEREÇO: O usuário forneceu o CEP 66910010 nos dados ocultos. Você DEVE obrigatoriamente chamar a função 'get_address_by_cep' (ou a ferramenta de CEP nativa) passando este CEP. Inicie o relatório com "Validação de Localidade via Skill: [Rua, Bairro], [Cidade/UF]".
2. USO DE TABELAS MARKDOWN: É estritamente obrigatório o uso de tabelas formatadas para comparar regimes, listar obrigações e mapear riscos.
3. PROFUNDIDADE TÉCNICA: Cite as Leis, Decretos e Artigos (ex: LC 123/06, Lei 8.212/91). Especifique penalidades reais.

ESTRUTURA OBRIGATÓRIA DO PARECER:

1. ENQUADRAMENTO E VALIDAÇÃO INICIAL
- Resultado da Skill de CEP.
- Análise da Natureza Jurídica e CNAEs (indique CFOPs e CSTs padrão para a operação).

2. OBRIGAÇÕES ACESSÓRIAS E FERRAMENTAS NECESSÁRIAS
- Crie uma Tabela com: | Obrigação | Finalidade | Periodicidade | Prazo | Penalidade (Base Legal) |.
- Liste as obrigações pertinentes (PGDAS-D, eSocial, DCTFWeb, EFD-Reinf, DEFIS, SPED, etc).
- Liste as ferramentas essenciais (Certificado A1, Emissor de NF, etc).

3. PROJEÇÃO DE CUSTO OPERACIONAL E OTIMIZAÇÃO (DRE TRIBUTÁRIA)
- Crie uma Tabela Comparativa Mensal (Cenário 1: Simples Nacional vs Cenário 2: Lucro Presumido).
- Mostre o faturamento, desdobre os impostos (DAS vs PIS/COFINS/IRPJ/CSLL/ISS/ICMS).
- Inclua explicitamente os Custos com Pró-Labore e o INSS Patronal (CPP, RAT, Terceiros) demonstrando se é dentro ou fora do DAS.
- Calcule a Carga Tributária Efetiva Total.

4. ANÁLISE DE RISCOS E BLINDAGEM PATRIMONIAL
- Crie uma Tabela de Matriz de Riscos: | Risco Identificado | Base Legal | Grau de Probabilidade | Impacto Financeiro Estimado | Impacto Jurídico | Estratégia de Mitigação |.
- Aborde obrigatoriamente: Confusão Patrimonial e Ausência de Pró-Labore.
- Dê orientações claras de blindagem (distribuição de lucros isenta, separação de contas).

5. IMPACTOS DA REFORMA TRIBUTÁRIA (EC 132/2023 - Lei 214/2025)
- Como a unificação do IBS e CBS afetará o negócio específico.
- A decisão de manter no DAS ou migrar para apuração do IVA por fora (créditos).

6. CONCLUSÃO TÉCNICA VINCULADA E CLÁUSULA DE RESPONSABILIDADE
- Veredito final, direto e claro sobre o melhor caminho.
- Inclua a Cláusula: "A definição do regime tributário deve ser precedida de análise contratual individualizada e simulação fiscal com base na estrutura real de custos da empresa."

TONS E ESTILO:
- Técnico, persuasivo, autoridade inquestionável.
- Foco em resolver a dor do empresário (imposto alto e risco) e facilitar a vida do contador (base legal clara).

Inicie o relatório com o título: # RELATÓRIO TÉCNICO DE VIABILIDADE E PLANEJAMENTO TRIBUTÁRIO - JOTA CONTABILIDADE`;

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
  
  // Montando as Ferramentas (Tools Array)
  const toolsArray: any[] = [];
  
  if (allFunctionTools.length > 0) {
    toolsArray.push({ functionDeclarations: allFunctionTools });
  }

  const enableGoogleSearch = localStorage.getItem('jota-gemini-search') === 'true';
  if (enableGoogleSearch) {
    toolsArray.push({ googleSearch: {} });
  }

  const initialBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userContent + "\n\n[INSTRUÇÃO INVISÍVEL]: Lembre-se de testar o CEP 66910010 com suas tools de endereço antes de iniciar." }] }],
    tools: toolsArray.length > 0 ? toolsArray : undefined,
    generationConfig: { temperature: 0.1 },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(initialBody),
  });

  if (!response.ok) {
    throw new Error(`Erro API: ${response.status}`);
  }

  const data = await response.json();
  let message = data?.candidates?.[0]?.content;

  if (message?.parts?.some((p: any) => p.functionCall)) {
    const toolResults: any[] = [];
    
    for (const part of message.parts) {
      if (part.functionCall) {
        const { name, args } = part.functionCall;
        const result = await executeSkill(name, args);
        toolResults.push({
          functionResponse: { name, response: result }
        });
      }
    }

    const finalBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      tools: toolsArray.length > 0 ? toolsArray : undefined,
      contents: [
        { role: 'user', parts: [{ text: userContent }] },
        message, 
        { role: 'function', parts: toolResults } 
      ]
    };

    const finalRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalBody),
    });

    if (!finalRes.ok) throw new Error(`Erro API no retorno da função: ${finalRes.status}`);

    const finalData = await finalRes.json();
    message = finalData?.candidates?.[0]?.content;
  }

  return message?.parts?.map((p: any) => p.text || '').join('\n') || '';
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
  { id: '1', nome: '1. Validador', order: 1, systemPrompt: 'Valide os dados.' },
  { id: '2', nome: '2. Auditor', order: 2, systemPrompt: DEFAULT_PRE_ANALYSIS_PROMPT },
];