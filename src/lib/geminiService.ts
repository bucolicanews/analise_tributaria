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

export interface ChatMessage {
  role: 'user' | 'model' | 'function';
  parts: any[];
}

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é o Perito Tributário Sênior da Jota Contabilidade. Sua missão é entregar um MANUAL DE ESTRUTURAÇÃO FISCAL E VIABILIDADE (Nível 10/10).

INICIE COM: “Parecer técnico-contábil estratégico, com visão preventiva, fiscalizatória, pericial e de planejamento tributário estruturado”

INSTRUÇÃO DE INÍCIO: Comece com "RELATÓRIO DE VIABILIDADE TÉCNICA".

🚨 REGRAS DE OURO (PROIBIDO FALHAR):
1. 🚫 ZERO TABELAS. Use listas aninhadas com tópicos claros e negritos estratégicos.
2. 💰 SIMULAÇÃO MATEMÁTICA REAL: Use os dados de faturamento e folha informados no JSON. Calcule o valor exato em R$ do imposto mensal no Simples Nacional vs Lucro Presumido.
3. ⚙️ OPERAÇÃO REAL: Diferencie venda (NF-e/ICMS) de serviço (NFS-e municipal).
4. 📦 ICMS-ST E CEST: Analise a Substituição Tributária. Explique a segregação no PGDAS.
5. 📑 INTEGRIDADE: Você DEVE obrigatoriamente listar todos os 19 itens abaixo. Não pule nenhum.
6. 🧠 VEREDITO FINAL: O relatório deve terminar APÓS O ITEM 19 com uma decisão clara: "O regime ideal para você hoje é X por causa da economia real de R$ Y".

ESTRUTURA OBRIGATÓRIA (19 REQUISITOS):

# 1. ANÁLISE DE CNAEs E OPERAÇÃO
# 1.1 TRIBUTAÇÃO PREVIDENCIÁRIA (CPP)
# 1.2 RETENÇÃO DE INSS E ISS
# 1.3 DETALHAMENTO EFD-REINF
# 2. CALENDÁRIO DE OBRIGAÇÕES (O QUE ENTREGAR)
# 3. PROJEÇÃO MATEMÁTICA COMPARATIVA (O CORAÇÃO)
# 4. GUIA DE PARAMETRIZAÇÃO (20 ITENS DO SETOR)
# 5. LICENCIAMENTO REGIONAL (BELÉM/PA OU INFORMADO)
# 6. NORMAS E EQUIPAMENTOS
# 7. INVESTIMENTO DE ABERTURA
# 8. MATRIZ DE RISCOS E CONFORMIDADE (ANÁLISE CRÍTICA)
# 9. IMPACTO DA REFORMA (EC 132)
# 10. RESPOSTA À PERGUNTA DO USUÁRIO
# 11. METODOLOGIA DE ANÁLISE
# 12. CONCLUSÃO E PLANO DE AÇÃO
# 13. LIMITAÇÃO DE RESPONSABILIDADE
# 14. FUNDAMENTAÇÃO PERICIAL
# 15. CLÁUSULA DE REVISÃO CONTRATUAL
# 16. TABELAS 2026 (Salário Mínimo e INSS)
# 17. OBRIGAÇÕES DA EMPRESA COM A PRÓPRIA EMPRESA (GOVERNANÇA)
# 18. OBRIGAÇÕES DA EMPRESA COM a CONTABILIDADE
# 19. OBRIGAÇÕES DA EMPRESA COM O FISCO (CONFORMIDADE)

---
VEREDITO PRÁTICO FINAL:
[Sua decisão técnica aqui]`;

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
      parts: [{ text: userContent }] 
    }],
    tools: toolsArray.length > 0 ? toolsArray : undefined,
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }, 
  };

  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(initialBody) });
  const data = await response.json();
  
  if (data.error) throw new Error(`Erro API Gemini: ${data.error.message}`);
  
  let message = data?.candidates?.[0]?.content;
  if (!message) return "Sem resposta da IA.";

  // Loop de execução de ferramentas
  if (message.parts?.some((p: any) => p.functionCall)) {
    const toolResults: any[] = [];
    for (const part of message.parts) {
      if (part.functionCall) {
        const { name, args } = part.functionCall;
        const result = await executeSkill(name, args);
        toolResults.push({ functionResponse: { name, response: { result } } });
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
    return finalData?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('\n') || '';
  }
  
  return message.parts?.map((p: any) => p.text || '').join('\n') || '';
}

// NOVA FUNÇÃO: Chat Interativo com Memória e Skills
export async function sendChatMessage(
  history: ChatMessage[],
  apiKey: string,
  onToolCall?: (toolName: string) => void
): Promise<string> {
  if (!apiKey) throw new Error('Chave API Gemini não configurada.');
  
  const model = localStorage.getItem('jota-gemini-model') || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const dynamicSkills = loadDynamicSkills().filter(s => s.isActive);
  const dynamicManifests = dynamicSkills.map(s => ({ name: s.name, description: s.description, parameters: s.parameters }));
  const toolsArray = dynamicManifests.length > 0 ? [{ functionDeclarations: dynamicManifests }] : undefined;

  const systemPrompt = `Você é o Assistente Inteligente da Jota Contabilidade. 
  Você tem acesso a ferramentas especializadas para cálculos tributários, consultas de CEP e análise de mercado.
  Sempre que precisar de um dado preciso (como cálculo de imposto ou endereço), use a ferramenta correspondente.
  Responda de forma profissional, clara e técnica. Use Markdown para formatar suas respostas.`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: history,
    tools: toolsArray,
    generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
  };

  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  
  if (data.error) throw new Error(data.error.message);
  
  const message = data?.candidates?.[0]?.content;
  if (!message) return "Desculpe, não consegui processar sua mensagem.";

  // Se a IA chamou uma função
  if (message.parts?.some((p: any) => p.functionCall)) {
    const toolResults: any[] = [];
    for (const part of message.parts) {
      if (part.functionCall) {
        const { name, args } = part.functionCall;
        if (onToolCall) onToolCall(name);
        const result = await executeSkill(name, args);
        toolResults.push({ functionResponse: { name, response: { result } } });
      }
    }

    // Envia o resultado da função de volta para a IA gerar o texto final
    const updatedHistory = [...history, message, { role: 'function', parts: toolResults }];
    return sendChatMessage(updatedHistory, apiKey, onToolCall);
  }

  return message.parts?.map((p: any) => p.text || '').join('\n') || '';
}

export async function callAgentWebhook(agent: AgentConfig, userContent: string, previousReports?: Record<string, string>): Promise<string> {
  if (!agent.webhookUrl) throw new Error(`Webhook não configurado.`);
  const response = await fetch(agent.webhookUrl.trim(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentName: agent.nome, data: JSON.parse(userContent), previousReports }) });
  const data = await response.json();
  return data.report || data.output || "Erro no processamento.";
}

export function loadAgentsFromStorage(): AgentConfig[] {
  const raw = localStorage.getItem('jota-agentes');
  return raw ? JSON.parse(raw) : [];
}

export function saveAgentsToStorage(agents: AgentConfig[]): void {
  localStorage.setItem('jota-agentes', JSON.stringify(agents));
}