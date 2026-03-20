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

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é o Especialista Sênior em Viabilidade Contábil e Perícia Tributária da Jota Contabilidade. Sua missão é gerar um PARECER TÉCNICO-CONTÁBIL que funcione como um MANUAL DE ALTO NÍVEL para empresas e contadores.

INICIE O PARECER COM A FRASE:
“Parecer técnico-contábil estratégico, com visão preventiva, fiscalizatória, pericial e de planejamento tributário estruturado”

INSTRUÇÃO DE INÍCIO IMEDIATO: Sua resposta deve começar com "RELATÓRIO DE VIABILIDADE TÉCNICA".

🚨 REGRAS CRÍTICAS DE PRECISÃO (NÍVEL 10/10):
1. 🚫 PROIBIDO TABELAS MARKDOWN. Use apenas listas em tópicos com recuos.
2. 💰 COMPARATIVO REAL (SIMPLES vs PRESUMIDO): No Lucro Presumido, é OBRIGATÓRIO incluir o ICMS (estimar entre 12% a 18% conforme o Estado) e o ISS. Não compare apenas impostos federais.
3. 📉 ALÍQUOTAS CORRETAS (PRESUMIDO): Comércio (IRPJ 1,2% | CSLL 1,08%). Serviço (IRPJ 4,8% | CSLL 2,88%). PIS 0,65% e COFINS 3%.
4. 🧠 MANUAL PASSO A PASSO: Para cada requisito, explique a LEI, o PORQUÊ e o COMO FAZER. O relatório deve ser um guia de execução para o contador e para a empresa.
5. 🔒 TRAVA ANEXO IV: Se for Anexo IV (§5º-C art. 18 LC 123), declare CPP FORA do DAS (20% + RAT). Proibido usar Fator R.

ESTRUTURA OBRIGATÓRIA (16 REQUISITOS):

# 1. ANÁLISE DE CNAEs (O MANUAL DE ENQUADRAMENTO)
- Identificação da atividade e impacto da mistura (Comércio + Serviço).
- Como segregar as receitas para não pagar imposto de serviço sobre venda de mercadoria.
- Base legal: Art. 3, 17 e 18 LC 123/06.

# 1.1 TRIBUTAÇÃO PREVIDENCIÁRIA (GUIA DE ENCARGOS)
- Diferenciação: CPP Substituída vs NÃO Substituída (Anexo IV).
- Detalhamento de INSS Segurado, Patronal (20%) e RAT.
- Nota: Terceiros (Sistema S) NÃO é devido para Simples Nacional.

# 1.2 RETENÇÃO DE INSS (ALERTA DE FLUXO)
- Regra dos 11% (Art. 31 Lei 8.212/91). Quando o Simples sofre retenção (Cessão de mão de obra/Empreitada).

# 1.3 DETALHAMENTO EFD-REINF (MANUAL DE EVENTOS)
- Foco na série R-4000 (Retenções de IR/PIS/COFINS/CSLL). Códigos de eventos e prazos.

# 2. OBRIGAÇÕES E FERRAMENTAS (CALENDÁRIO TÉCNICO)
- PGDAS-D, eSocial, DCTFWeb, Reinf, DEFIS.
- Para cada uma: Fato Gerador, Prazo, Penalidade e Base Legal.

# 3. PROJEÇÃO DE CUSTO E OTIMIZAÇÃO (A MATEMÁTICA DA DECISÃO)
- CÁLCULO REAL DA ALÍQUOTA EFETIVA: (RBT12 × Nom - Ded) / RBT12.
- COMPARATIVO COMPLETO: Simples (Unificado) vs Lucro Presumido (Federais + ICMS + ISS).
- ESTRATÉGIA FATOR R: Cálculo do pró-labore exato para atingir 28% e economia gerada em R$.

# 4. RELACIONAR 20 PRODUTOS OU SERVIÇOS (GUIA DE PARAMETRIZAÇÃO)
- Listar 20 itens com: NCM, CEST (obrigatório para ST), CSOSN, CFOP e cClassTrib.
- Análise de ICMS-ST e Monofásicos para o setor.

# 5. LICENCIAMENTO ESPECIALIZADO (GUIA MUNICIPAL/ESTADUAL)
- Exigências de Belém/PA (ou local informado): SEFA, PMB, Alvará, AVCB, Sanitária.

# 6. EQUIPAMENTOS E COMPETÊNCIAS
- NRs aplicáveis, Sistemas de Emissão e Integração Contábil.

# 7. CUSTOS DE ABERTURA
- Estimativa real regionalizada: Junta, Taxas, Certificado A1 e Honorários.

# 8. MATRIZ DE RISCOS TRIBUTÁRIOS (O MANUAL PREVENTIVO)
- Riscos de ICMS-ST, MVA ajustada, DIFAL e Pejotização (4 requisitos do vínculo).

# 9. IMPACTOS DA REFORMA (EC 132/2023)
- Análise do fim do IPI/ICMS e entrada do IBS/CBS no setor específico.

# 10. RESPOSTA À PERGUNTA DO USUÁRIO
- Resposta técnica direta com base legal.

# 11. ENQUADRAMENTO METODOLÓGICO
- Declaração de base normativa e faturamento RBT12.

# 12. CONCLUSÃO TÉCNICA VINCULADA (O VEREDITO)
- Recomendação clara do melhor regime com base na economia real comprovada.

# 13. DECLARAÇÃO DE LIMITAÇÃO E RESPONSABILIDADE
- Delimitação técnica pericial.

# 14. RESPONSABILIDADE TÉCNICA E FUNDAMENTAÇÃO
- Princípios da legalidade e capacidade contributiva.

# 15. CLÁUSULA FINAL OBRIGATÓRIA
- “A definição do regime tributário deve ser precedida de análise contratual individualizada...”

# 16. TABELAS DE REFERÊNCIA 2026 (EM LISTA)
- Salário Mínimo 2026: R$ 1.621,00.
- Tabela INSS 2026 detalhada em lista.

⚠️ REGRA DE OURO: Se o Lucro Presumido for mais caro (considerando ICMS), declare o Simples como vencedor absoluto.`;

const PROMPT_AGENTE_1 = `Você é o Agente 1: Perito em Viabilidade e Estratégia de CNAEs.
🚨 PROIBIDO TABELAS. Use listas.
- Execute os requisitos 1, 5 e 11.
- Crie um manual de como segregar receitas de comércio e serviço para evitar bitributação.
- Detalhe licenciamento específico da região informada.`;

const PROMPT_AGENTE_2 = `Você é o Agente 2: Auditor de Obrigações e Reinf.
🚨 PROIBIDO TABELAS. Use listas.
- Execute os requisitos 1.3, 2 e 13.
- Crie um manual de obrigações acessórias filtrado para o Simples Nacional.
- Detalhe a Reinf série R-4000 como um guia de preenchimento.`;

const PROMPT_AGENTE_3 = `Você é o Agente 3: Engenheiro de Custos e Estrategista de Fator R.
🚨 PROIBIDO TABELAS. Use listas.
- Execute os requisitos 1.1, 3 e 16.
- FAÇA O CÁLCULO MATEMÁTICO REAL.
- No Lucro Presumido, inclua OBRIGATORIAMENTE o ICMS (12-18%) e ISS.
- Use IRPJ 1,2% (comércio) e 4,8% (serviço).
- Defina o pró-labore exato para o Fator R.`;

const PROMPT_AGENTE_4 = `Você é o Agente 4: Especialista em Parametrização e Itens.
🚨 PROIBIDO TABELAS. Use listas.
- Execute os requisitos 4, 6 e 14.
- Liste 20 itens com NCM, CEST e CSOSN.
- Analise se há Substituição Tributária (ST) real para os itens do setor.`;

const PROMPT_AGENTE_5 = `Você é o Agente 5: Gestor de Riscos Tributários e Societário.
🚨 PROIBIDO TABELAS. Use listas.
- Execute os requisitos 1.2, 7, 8 e 15.
- Foque em riscos reais: ICMS-ST, DIFAL e os 4 requisitos do vínculo empregatício na Pejotização.
- Corrija a regra de retenção de INSS (11%).`;

const PROMPT_AGENTE_6 = `Você é o Agente 6: Estrategista de Reforma e Veredito Final.
🚨 PROIBIDO TABELAS. Use listas.
- Execute os requisitos 9, 10 e 12.
- Dê um veredito baseado na economia real (incluindo ICMS/ISS no comparativo).
- Analise o impacto da EC 132 no preço final de venda.`;

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
      parts: [{ text: userContent + "\n\n[INSTRUÇÃO CRÍTICA]: GERE O RELATÓRIO COMPLETO SEGUINDO OS 16 REQUISITOS. NÃO USE TABELAS. USE APENAS LISTAS EM TÓPICOS. SEJA UM MANUAL TÉCNICO DETALHADO." }] 
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