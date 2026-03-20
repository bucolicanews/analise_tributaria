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
# 8. MATRIZ DE RISCOS (PREVENÇÃO)
# 9. IMPACTO DA REFORMA (EC 132)
# 10. RESPOSTA À PERGUNTA DO USUÁRIO
# 11. METODOLOGIA DE ANÁLISE
# 12. CONCLUSÃO E PLANO DE AÇÃO
# 13. LIMITAÇÃO DE RESPONSABILIDADE
# 14. FUNDAMENTAÇÃO PERICIAL
# 15. CLÁUSULA DE REVISÃO CONTRATUAL
# 16. TABELAS 2026 (Salário Mínimo e INSS)

# 17. OBRIGAÇÕES DA EMPRESA COM A PRÓPRIA EMPRESA (GOVERNANÇA)
- Detalhe a rotina interna obrigatória:
- Guarda de XMLs (Compras, Vendas, CT-e, NFS-e) por 5 anos + ano corrente (Art. 195 CTN).
- Controle de estoque rigoroso (Inventário anual, registro de perdas e devoluções).
- Cadastro correto de produtos (NCM, CEST, CST) para evitar multas.
- Separação absoluta entre contas PF e PJ (Princípio da Entidade).
- Controle financeiro diário (Fluxo de caixa e conciliação bancária).

# 18. OBRIGAÇÕES DA EMPRESA COM A CONTABILIDADE
- Fluxo de informações mensais:
- Envio de todos os XMLs e extratos bancários/cartão/PIX até o dia 5 de cada mês.
- Informações de folha (faltas, horas extras, atestados) até o dia 20.
- Manifestação de notas fiscais no portal nacional para evitar notas frias e fraudes.
- Comunicação prévia de operações especiais (importação, compra de veículos ou máquinas).

# 19. OBRIGAÇÕES DA EMPRESA COM O FISCO (CONFORMIDADE)
- Resumo das obrigações acessórias conforme o regime sugerido:
- Simples Nacional: PGDAS-D mensal e DEFIS anual.
- Lucro Presumido/Real: DCTF, EFD Contribuições, SPED Fiscal, SPED Contábil, ECF, Reinf.
- Alerta crítico sobre multas pesadas por atraso na entrega dessas declarações.

---
VEREDITO PRÁTICO FINAL:
[Sua decisão técnica aqui]`;

const PROMPT_AGENTE_1 = `Você é o Agente 1: Perito em Viabilidade e CNAEs.
🚨 REGRAS: ZERO TABELAS.
- Execute requisitos 1, 5, 11 e 14.
- Detalhe a segregação real entre Indústria, Comércio e Serviço.`;

const PROMPT_AGENTE_2 = `Você é o Agente 2: Auditor de Obrigações e Compliance.
🚨 REGRAS: ZERO TABELAS.
- Execute requisitos 1.3, 2, 13 e 19 (Obrigações com o Fisco).
- Detalhe a Série R-4000 da Reinf e as multas por atraso de declarações.`;

const PROMPT_AGENTE_3 = `Você é o Agente 3: Engenheiro de Custos e Matemática.
🚨 REGRAS: ZERO TABELAS.
- Execute requisitos 1.1, 3 e 16.
- FAÇA A CONTA: Compare Simples vs Presumido em R$ usando os dados do JSON.`;

const PROMPT_AGENTE_4 = `Você é o Agente 4: Especialista em Parametrização.
🚨 REGRAS: ZERO TABELAS.
- Execute requisitos 4 e 6.
- Liste 20 itens ESPECÍFICOS DO SETOR com NCM, CEST e CSOSN.`;

const PROMPT_AGENTE_5 = `Você é o Agente 5: Gestor de Riscos e Governança.
🚨 REGRAS: ZERO TABELAS.
- Execute requisitos 7, 8, 15, 17 (Governança Interna) e 18 (Relação com Contador).
- Foque na separação PF/PJ e no fluxo de documentos.`;

const PROMPT_AGENTE_6 = `Você é o Agente 6: Estrategista de Reforma e Veredito.
🚨 REGRAS: ZERO TABELAS.
- Execute requisitos 9, 10 e 12.
- Dê o VEREDITO FINAL: "O regime ideal é X com economia de R$ Y".`;

export const DEFAULT_AGENTS: AgentConfig[] = [
  { id: '1', nome: '1. Viabilidade e CNAEs', order: 1, systemPrompt: PROMPT_AGENTE_1 },
  { id: '2', nome: '2. Obrigações e Reinf', order: 2, systemPrompt: PROMPT_AGENTE_2 },
  { id: '3', nome: '3. Engenharia de Custos', order: 3, systemPrompt: PROMPT_AGENTE_3 },
  { id: '4', nome: '4. Parametrização e Itens', order: 4, systemPrompt: PROMPT_AGENTE_4 },
  { id: '5', nome: '5. Riscos e Governança', order: 5, systemPrompt: PROMPT_AGENTE_5 },
  { id: '6', nome: '6. Reforma e Veredito', order: 6, systemPrompt: PROMPT_AGENTE_6 },
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
      parts: [{ text: userContent + "\n\n[INSTRUÇÃO CRÍTICA]: VOCÊ DEVE CHEGAR ATÉ O ITEM 19. NÃO PULE AS SEÇÕES DE GOVERNANÇA (17, 18, 19). NÃO USE TABELAS." }] 
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