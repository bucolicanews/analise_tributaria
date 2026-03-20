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
1. 🚫 ZERO TABELAS. Use listas aninhadas com tópicos claros.
2. 💰 FOCO TOTAL NOS DADOS FORNECIDOS: Use EXCLUSIVAMENTE os CNAEs e a Descrição de Atividades enviada pelo usuário. 
3. ❌ PROIBIDO CITAR OUTROS SETORES: Se o cliente é uma GRANJA, não cite oficinas, serviços de TI ou qualquer outro exemplo que não pertença ao contexto de AGROINDÚSTRIA/INDÚSTRIA/COMÉRCIO DE AVES.
4. ⚙️ OPERAÇÃO REAL: Diferencie venda (NF-e/ICMS), indústria (Anexo II) e serviço (NFS-e municipal).
5. 📦 ICMS-ST E CEST: Analise a Substituição Tributária para os NCMs de aves e ovos. Explique a segregação de receita no Simples Nacional.
6. 🧠 VEREDITO PRÁTICO: O relatório deve terminar com uma decisão clara: "O regime ideal para você hoje é X por causa da economia de R$ Y".

ESTRUTURA DO MANUAL (16 REQUISITOS):

# 1. ANÁLISE DOS CNAES INFORMADOS
- Analise cada código CNAE enviado no JSON. Explique o enquadramento de cada um (Anexo I, II ou III/V).
- Segregação de Receitas: Como separar a produção própria (Indústria - Anexo II) da revenda (Comércio - Anexo I).
- Base legal: Art. 18 LC 123/06.

# 1.1 TRIBUTAÇÃO PREVIDENCIÁRIA (CPP)
- Explique a CPP dentro do DAS (Anexos I, II, III) vs Fora do DAS (Anexo IV).
- Detalhe o custo real da folha (INSS Patronal 20% + RAT) se aplicável ao setor do cliente.

# 1.2 RETENÇÃO DE INSS E ISS
- Analise se as atividades da GRANJA/INDÚSTRIA sofrem retenção. (Dica: Venda de mercadoria não sofre retenção de ISS).

# 1.3 DETALHAMENTO EFD-REINF
- Guia prático da Série R-4000 focado na realidade da empresa analisada.

# 2. CALENDÁRIO DE OBRIGAÇÕES (O QUE ENTREGAR)
- PGDAS-D, eSocial, DCTFWeb, Reinf, DEFIS. Fato gerador e prazos.

# 3. PROJEÇÃO MATEMÁTICA COMPARATIVA (O CORAÇÃO)
- CÁLCULO SIMPLES: Alíquota efetiva real sobre o faturamento informado.
- CÁLCULO PRESUMIDO: (Federal 5,93% + ISS + ICMS - Créditos estimados).
- RESULTADO: "Economia estimada de R$ X por mês no regime Y".

# 4. GUIA DE PARAMETRIZAÇÃO (20 ITENS DO SETOR)
- Liste 20 itens ESPECÍFICOS DO SETOR DO CLIENTE (ex: Aves, Ovos, Ração) com: NCM, CEST, CSOSN e cClassTrib.

# 5. LICENCIAMENTO REGIONAL (NA CIDADE INFORMADA)
- SEFA (Inscrição Estadual), PMB (Alvará/ISS), Vigilância Sanitária e Bombeiros.

# 6. NORMAS E EQUIPAMENTOS
- NRs de segurança do trabalho e normas do Ministério da Agricultura (MAPA) se for agroindústria.

# 7. INVESTIMENTO DE ABERTURA
- Taxas da Junta, Certificado Digital A1 e honorários de legalização.

# 8. MATRIZ DE RISCOS (PREVENÇÃO)
- Risco de confusão patrimonial, falta de segregação de ST e passivo de Fator R.

# 9. IMPACTO DA REFORMA (EC 132)
- Como o IBS/CBS afetará o preço de venda e a competitividade do Simples.

# 10. RESPOSTA À PERGUNTA DO USUÁRIO
- Resposta técnica direta com fundamentação.

# 11. METODOLOGIA DE ANÁLISE
- Base normativa e premissas de cálculo.

# 12. CONCLUSÃO E PLANO DE AÇÃO
- Recomendação final e os 3 primeiros passos práticos.

# 13. LIMITAÇÃO DE RESPONSABILIDADE
- Delimitação do parecer.

# 14. FUNDAMENTAÇÃO PERICIAL
- Princípios contábeis aplicados.

# 15. CLÁUSULA DE REVISÃO CONTRATUAL
- Necessidade de análise individualizada.

# 16. TABELAS 2026
- Salário Mínimo e Tabela INSS 2026 em lista.`;

const PROMPT_AGENTE_1 = `Você é o Agente 1: Perito em CNAEs e Operação.
🚨 PROIBIDO TABELAS. Use apenas os CNAEs fornecidos no JSON.
- Execute requisitos 1, 5 e 11.
- Foque na segregação real: Indústria (Anexo II) vs Comércio (Anexo I).`;

const PROMPT_AGENTE_2 = `Você é o Agente 2: Auditor de Obrigações.
🚨 PROIBIDO TABELAS.
- Execute requisitos 1.3, 2 e 13.
- Filtre obrigações do Simples Nacional.`;

const PROMPT_AGENTE_3 = `Você é o Agente 3: Engenheiro de Custos (O Matemático).
🚨 PROIBIDO TABELAS.
- Execute requisitos 1.1, 3 e 16.
- FAÇA A CONTA: Compare Simples vs Presumido usando os dados de faturamento e folha do JSON.`;

const PROMPT_AGENTE_4 = `Você é o Agente 4: Especialista em Itens e ST.
🚨 PROIBIDO TABELAS.
- Execute requisitos 4, 6 e 14.
- Liste 20 itens ESPECÍFICOS DO SETOR DO CLIENTE com NCM, CEST e CSOSN.`;

const PROMPT_AGENTE_5 = `Você é o Agente 5: Gestor de Riscos e Retenções.
🚨 PROIBIDO TABELAS.
- Execute requisitos 1.2, 7, 8 e 15.`;

const PROMPT_AGENTE_6 = `Você é o Agente 6: Estrategista de Reforma e Veredito.
🚨 PROIBIDO TABELAS.
- Execute requisitos 9, 10 e 12.
- Dê o veredito final baseado na economia real em R$.`;

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
      parts: [{ text: userContent + "\n\n[INSTRUÇÃO CRÍTICA]: USE APENAS OS CNAES E DADOS DO CLIENTE ACIMA. NÃO CITE OFICINAS OU OUTROS SETORES. NÃO USE TABELAS." }] 
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