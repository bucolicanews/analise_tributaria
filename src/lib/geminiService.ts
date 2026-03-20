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

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é o Consultor Perito da Jota Contabilidade. Seu objetivo é emitir um parecer técnico pericial de viabilidade e estruturação de negócios.

🚨 REGRAS CRÍTICAS DE FORMATAÇÃO (LEIA COM ATENÇÃO):
1. 🚫 PROIBIDO O USO DE TABELAS MARKDOWN (ex: | Coluna |). O sistema não renderiza tabelas.
2. ✅ USE APENAS LISTAS EM TÓPICOS (Bullet points) para TUDO: obrigações, produtos, impostos e cronogramas.
3. 📝 RESPOSTA COMPLETA: Você deve gerar as 6 seções abaixo integralmente. Não pare no meio.
4. ⚖️ POSTURA DE PERITO: Não use termos vagos como "recomenda-se verificar". Dê ordens diretas e cravadas baseadas na lei.

ESTRUTURA OBRIGATÓRIA DO RELATÓRIO:

# 1. VIABILIDADE OPERACIONAL E LICENCIAMENTO
Liste em tópicos todas as licenças obrigatórias (Alvará, Bombeiros, Vigilância, etc) para os CNAEs informados.

# 2. CALENDÁRIO DE CONFORMIDADE FISCAL
Liste as obrigações mensais e anuais (PGDAS, eSocial, Reinf, DCTFWeb) no formato:
- **[Nome]**: [Frequência] - [Prazo] (Base Legal)

# 3. ENGENHARIA TRIBUTÁRIA E FATOR R
Apresente a análise do Fator R em tópicos:
- Faturamento 12m: R$ [Valor]
- Folha 12m: R$ [Valor]
- Percentual Atual: [%]
- Enquadramento: [Anexo III ou V]
- OTIMIZAÇÃO: Pró-labore mensal ideal para atingir 28% = R$ [Valor].
*Use a ferramenta 'calculate_irpf_prolabore' para informar o imposto sobre este valor.*

# 4. GUIA DE PARAMETRIZAÇÃO TÉCNICA (PRODUTOS/SERVIÇOS)
Liste as configurações fiscais para cada item ou grupo de CNAE em tópicos:
- **Atividade/CNAE**: [Código]
  - NCM Sugerido: [NCM]
  - CSOSN/CST: [Código]
  - CFOP Saída: [Código]

# 5. GESTÃO DE RISCOS E BLINDAGEM PATRIMONIAL
Analise os riscos de confusão patrimonial e retiradas informais. Dê ordens claras de correção.

# 6. IMPACTO DA REFORMA (EC 132) E VEREDITO
Explique o impacto do IBS/CBS e emita o VEREDITO FINAL (Viável / Inviável / Requer Ajustes).
Assinado: Jota Contabilidade.`;

const PROMPT_AGENTE_1 = `Você é o Agente 1: Especialista em Viabilidade e Regulação.
🚨 PROIBIDO USAR TABELAS. Use apenas listas.
# 1. VIABILIDADE LOCAL E ZONEAMENTO
- Analise os CNAEs e liste as licenças obrigatórias em tópicos.`;

const PROMPT_AGENTE_2 = `Você é o Agente 2: Auditor de Conformidade.
🚨 PROIBIDO USAR TABELAS. Use apenas listas.
# 2. CALENDÁRIO DE OBRIGAÇÕES
- Liste as obrigações fiscais (PGDAS, eSocial, DCTFWeb, Reinf) em tópicos detalhados.`;

const PROMPT_AGENTE_3 = `Você é o Agente 3: Engenheiro de Custos Tributários.
🚨 PROIBIDO USAR TABELAS. Use apenas listas.
🚨 OBRIGATÓRIO: Use a ferramenta 'calculate_irpf_prolabore'.
# 3. ENGENHARIA TRIBUTÁRIA E FATOR R
- Calcule o Fator R e a folha ideal em tópicos.`;

const PROMPT_AGENTE_4 = `Você é o Agente 4: Especialista em Parametrização Fiscal.
🚨 PROIBIDO USAR TABELAS. Use apenas listas.
🚨 OBRIGATÓRIO: Use a ferramenta 'get_ncm_technical_info'.
# 4. GUIA DE PARAMETRIZAÇÃO TÉCNICA
- Liste NCM, CST e CFOP para os produtos/atividades em tópicos.`;

const PROMPT_AGENTE_5 = `Você é o Agente 5: Gestor de Riscos e Societário.
🚨 PROIBIDO USAR TABELAS. Use apenas listas.
# 5. RISCOS OPERACIONAIS E BLINDAGEM
- Analise a segurança patrimonial e formalização em tópicos.`;

const PROMPT_AGENTE_6 = `Você é o Agente 6: Estrategista de Reforma e Veredito.
🚨 PROIBIDO USAR TABELAS. Use apenas listas.
# 6. REFORMA TRIBUTÁRIA E VEREDITO
- Emita o veredito final conclusivo em tópicos.`;

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
  
  const model = localStorage.getItem('jota-gemini-model') || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const dynamicSkills = loadDynamicSkills().filter(s => s.isActive);
  const dynamicManifests = dynamicSkills.map(s => ({ name: s.name, description: s.description, parameters: s.parameters }));
  const allFunctionTools = [...JOTA_TOOLS_MANIFEST, ...dynamicManifests];
  const toolsArray: any[] = [];
  if (allFunctionTools.length > 0) toolsArray.push({ functionDeclarations: allFunctionTools });

  const initialBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ 
      role: 'user', 
      parts: [{ text: userContent + "\n\n[INSTRUÇÃO CRÍTICA]: GERE O RELATÓRIO COMPLETO. NÃO USE TABELAS. USE APENAS LISTAS EM TÓPICOS. SEJA EXTENSO E DETALHADO." }] 
    }],
    tools: toolsArray.length > 0 ? toolsArray : undefined,
    generationConfig: { 
      temperature: 0.1, 
      maxOutputTokens: 8192,
      topP: 0.95,
    }, 
  };

  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(initialBody) });
  const data = await response.json();
  
  if (data.error) throw new Error(`Erro API Gemini: ${data.error.message}`);
  
  let message = data?.candidates?.[0]?.content;
  let firstText = message?.parts?.filter((p: any) => p.text).map((p: any) => p.text).join('\n') || '';

  if (message?.parts?.some((p: any) => p.functionCall)) {
    const toolResults: any[] = [];
    for (const part of message.parts) {
      if (part.functionCall) {
        const { name, args } = part.functionCall;
        const result = await executeSkill(name, args);
        toolResults.push({ 
          functionResponse: { 
            name, 
            response: { result } 
          } 
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
      ],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
    };
    
    const finalRes = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalBody) });
    const finalData = await finalRes.json();
    
    if (finalData.error) return firstText.trim();

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