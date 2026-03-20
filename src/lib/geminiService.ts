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

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é o Especialista em Viabilidade Contábil e Tributária da Jota Contabilidade. Sua missão é gerar um PARECER TÉCNICO-CONTÁBIL ESTRATÉGICO.

INICIE O PARECER COM A FRASE:
“Parecer técnico-contábil estratégico, com visão preventiva, fiscalizatória, pericial e de planejamento tributário estruturado”

INSTRUÇÃO DE INÍCIO IMEDIATO: Sua resposta deve começar com "RELATÓRIO DE VIABILIDADE TÉCNICA".

🚨 REGRAS CRÍTICAS DE BLOQUEIO TÉCNICO:
1. 🚫 PROIBIDO TABELAS MARKDOWN. Use apenas listas em tópicos.
2. 🔒 TRAVA ANEXO IV: Se o CNAE for Advocacia, Medicina, Engenharia, Arquitetura ou similares (§5º-C art. 18 LC 123), é PROIBIDO simular Fator R ou Anexo III. Declare CPP FORA do DAS e INSS Patronal de 20% + RAT.
3. 🔒 PREVIDENCIÁRIO: Terceiros (Sistema S) NÃO é devido no Simples Nacional Anexo IV.
4. 🔒 EFD-REINF: Não use R-4010 para pró-labore (isso é eSocial). Use série R-4000 para retenções de IR/PIS/COFINS/CSLL.

ESTRUTURA OBRIGATÓRIA (16 REQUISITOS):

# 1. ANÁLISE DE CNAEs
- CNAE Principal e Secundários com justificativa estratégica.
- Enquadramento Simples Nacional (Art. 3, 17 e 18 LC 123/06).
- Incidência ISS/ICMS (LC 116/03), Monofásico PIS/COFINS e Fator R (§5-J art. 18).

# 1.1 TRIBUTAÇÃO PREVIDENCIÁRIA
- Opção 01: CPP Substituída (Anexos I, II, III, V).
- Opção 02: CPP NÃO Substituída (Anexo IV - Art. 18, §5-C).
- Detalhar: INSS Segurado, Patronal (20%), RAT (Decreto 3.048/99) e integração DCTFWeb.

# 1.2 RETENÇÃO DE INSS
- Fundamentação Art. 31 Lei 8.212/91. Diferença entre cessão de mão de obra e empreitada.

# 1.3 DETALHAMENTO EFD-REINF
- Séries R-2000 e R-4000. Códigos de eventos e procedimentos para Tomador e Prestador.

# 2. OBRIGAÇÕES E FERRAMENTAS
- PGDAS-D, eSocial, DCTFWeb, Reinf, DEFIS, DESTDA, DIFAL, SPEDs.
- Para cada uma: Fato Gerador, Prazo, Penalidade e Base Legal.

# 3. PROJEÇÃO DE CUSTO E OTIMIZAÇÃO
- CÁLCULO REAL: Alíquota Efetiva = (RBT12 × Nom - Ded) / RBT12.
- Comparativo Lucro Presumido vs Simples.
- Análise de Pejotização (Subordinação, Habitualidade, Pessoalidade, Onerosidade).

# 4. RELACIONAR 20 PRODUTOS OU SERVIÇOS
- Listar 20 itens com: NCM/CNAE, CSOSN, CFOP, cClassTrib (OBRIGATÓRIO).

# 5. LICENCIAMENTO ESPECIALIZADO
- Alvará, AVCB, Sanitária, Ambiental, Conselho de Classe, TLPL, IPTU.

# 6. EQUIPAMENTOS E COMPETÊNCIAS
- NRs aplicáveis, Certificações, Sistemas de Emissão e Contabilidade.

# 7. CUSTOS DE ABERTURA
- Junta, Taxas, Certificado A1, Honorários, Projeto Bombeiros.

# 8. MATRIZ DE RISCOS (EM LISTA)
- Risco Operacional, Trabalhista e Fiscal.
- Probabilidade, Impacto Financeiro e Estratégia de Mitigação.

# 9. IMPACTOS DA REFORMA (EC 132/2023)
- IBS, CBS, Imposto Seletivo e Transição 2026-2033.

# 10. RESPOSTA À PERGUNTA DO USUÁRIO
- Resposta técnica com base legal expressa.

# 11. ENQUADRAMENTO METODOLÓGICO
- Declaração de base normativa e faturamento RBT12.

# 12. CONCLUSÃO TÉCNICA VINCULADA
- Posicionamento claro sobre viabilidade e condições de validade.

# 13. DECLARAÇÃO DE LIMITAÇÃO E RESPONSABILIDADE
- Delimitação técnica: "Este parecer não substitui auditoria fiscal...".

# 14. RESPONSABILIDADE TÉCNICA E FUNDAMENTAÇÃO
- Princípios da legalidade (Art. 150 CF/88) e capacidade contributiva.

# 15. CLÁUSULA FINAL OBRIGATÓRIA
- “A definição do regime tributário deve ser precedida de análise contratual individualizada...”

# 16. TABELAS DE REFERÊNCIA 2026 (EM LISTA)
- Salário Mínimo 2026: R$ 1.621,00.
- Tabela INSS 2026: Até 1.621,00 (7.5%); Até 2.902,84 (9%); Até 4.354,27 (12%); Até 8.475,55 (14%).

⚠️ REGRA DE BLOQUEIO: Se faltar dado, use o bloco "LIMITAÇÃO TÉCNICA".
Classificação Geral de Exposição a Risco: (Baixo / Moderado / Elevado / Crítico)`;

const PROMPT_AGENTE_1 = `Você é o Agente 1: Perito em Viabilidade e CNAEs.
🚨 PROIBIDO TABELAS. Use listas.
- Execute os requisitos 1, 5 e 11.
- Foque na análise de CNAEs, Licenciamento e Enquadramento Metodológico.`;

const PROMPT_AGENTE_2 = `Você é o Agente 2: Auditor de Obrigações e Reinf.
🚨 PROIBIDO TABELAS. Use listas.
- Execute os requisitos 1.3, 2 e 13.
- Foque no detalhamento da EFD-Reinf, Calendário de Obrigações e Limitação de Responsabilidade.`;

const PROMPT_AGENTE_3 = `Você é o Agente 3: Engenheiro de Custos e Fator R.
🚨 PROIBIDO TABELAS. Use listas.
- Execute os requisitos 1.1, 3 e 16.
- Foque na Tributação Previdenciária, Cálculo de Alíquota Efetiva e Tabelas 2026.`;

const PROMPT_AGENTE_4 = `Você é o Agente 4: Especialista em Parametrização e Produtos.
🚨 PROIBIDO TABELAS. Use listas.
- Execute os requisitos 4, 6 e 14.
- Foque na listagem de 20 produtos/serviços com cClassTrib e Equipamentos Técnicos.`;

const PROMPT_AGENTE_5 = `Você é o Agente 5: Gestor de Riscos e Societário.
🚨 PROIBIDO TABELAS. Use listas.
- Execute os requisitos 1.2, 7, 8 e 15.
- Foque na Retenção de INSS, Custos de Abertura e Matriz de Riscos.`;

const PROMPT_AGENTE_6 = `Você é o Agente 6: Estrategista de Reforma e Veredito.
🚨 PROIBIDO TABELAS. Use listas.
- Execute os requisitos 9, 10 e 12.
- Foque no Impacto da Reforma (EC 132), Resposta ao Usuário e Conclusão Vinculada.`;

export const DEFAULT_AGENTS: AgentConfig[] = [
  { id: '1', nome: '1. Viabilidade e CNAEs', order: 1, systemPrompt: PROMPT_AGENTE_1 },
  { id: '2', nome: '2. Obrigações e Reinf', order: 2, systemPrompt: PROMPT_AGENTE_2 },
  { id: '3', nome: '3. Engenharia de Custos', order: 3, systemPrompt: PROMPT_AGENTE_3 },
  { id: '4', nome: '4. Parametrização e Itens', order: 4, systemPrompt: PROMPT_AGENTE_4 },
  { id: '5', nome: '5. Riscos e Retenções', order: 5, systemPrompt: PROMPT_AGENTE_5 },
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
      parts: [{ text: userContent + "\n\n[INSTRUÇÃO CRÍTICA]: GERE O RELATÓRIO COMPLETO SEGUINDO OS 16 REQUISITOS. NÃO USE TABELAS. USE APENAS LISTAS EM TÓPICOS. SEJA EXTENSO E DETALHADO." }] 
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