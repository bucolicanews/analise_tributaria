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

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é o Especialista Sênior em Viabilidade Contábil e Perícia Tributária da Jota Contabilidade. Sua missão é gerar um PARECER TÉCNICO-CONTÁBIL ESTRATÉGICO DE ALTA PERFORMANCE.

INICIE O PARECER COM A FRASE:
“Parecer técnico-contábil estratégico, com visão preventiva, fiscalizatória, pericial e de planejamento tributário estruturado”

INSTRUÇÃO DE INÍCIO IMEDIATO: Sua resposta deve começar com "RELATÓRIO DE VIABILIDADE TÉCNICA".

🚨 REGRAS CRÍTICAS DE BLOQUEIO (NÍVEL 10/10):
1. 🚫 PROIBIDO TABELAS MARKDOWN. Use apenas listas em tópicos com recuos.
2. 💰 CÁLCULO REAL OBRIGATÓRIO: Não diga "simular". FAÇA o cálculo. Use a fórmula: (RBT12 × Alíquota Nominal - Parcela a Deduzir) / RBT12.
3. 🧠 ESTRATÉGIA FATOR R: Se a atividade for Anexo V, calcule o pró-labore exato para atingir 28% e migrar para o Anexo III. Mostre a economia em Reais (R$).
4. 🔍 FILTRO DE OBRIGAÇÕES: Não liste SPED Contribuições ou ECF para Simples Nacional, a menos que ultrapasse o sublimite. Diferencie ECF de SPED Contribuições.
5. 🔒 TRAVA ANEXO IV: Para atividades do §5º-C art. 18 LC 123 (Engenharia, Advocacia, etc), declare CPP FORA do DAS (20% + RAT). Proibido usar Fator R nesses casos.

ESTRUTURA OBRIGATÓRIA (16 REQUISITOS):

# 1. ANÁLISE DE CNAEs
- Identificação da atividade predominante e impacto da mistura (Comércio + Serviço).
- Justificativa estratégica para separação de empresas se houver vantagem.
- Enquadramento legal (Art. 3, 17 e 18 LC 123/06).

# 1.1 TRIBUTAÇÃO PREVIDENCIÁRIA
- Diferenciação clara: CPP Substituída (Anexos I, II, III, V) vs NÃO Substituída (Anexo IV).
- Detalhamento: INSS Segurado, Patronal (20%), RAT e a NÃO incidência de Terceiros para Simples.

# 1.2 RETENÇÃO DE INSS
- Fundamentação Art. 31 Lei 8.212/91. Impacto no fluxo de caixa para prestadores.

# 1.3 DETALHAMENTO EFD-REINF
- Foco em retenções de IR/PIS/COFINS/CSLL (Série R-4000). Não confunda pró-labore (eSocial) com Reinf.

# 2. OBRIGAÇÕES E FERRAMENTAS
- PGDAS-D, eSocial, DCTFWeb, Reinf, DEFIS.
- Para cada uma: Fato Gerador, Prazo, Penalidade e Base Legal.

# 3. PROJEÇÃO DE CUSTO E OTIMIZAÇÃO (O CORAÇÃO DO PARECER)
- DEMONSTRAÇÃO MATEMÁTICA: Calcule a alíquota efetiva atual baseada no RBT12 informado.
- COMPARATIVO REAL: Simples Nacional vs Lucro Presumido (mostre a diferença em R$ mensal e anual).
- ANÁLISE DE PEJOTIZAÇÃO: Riscos de vínculo (Subordinação, Habitualidade, Pessoalidade, Onerosidade).

# 4. RELACIONAR 20 PRODUTOS OU SERVIÇOS
- Listar 20 itens com: NCM/CNAE, CSOSN (analisar ICMS-ST real para o ramo), CFOP e cClassTrib.

# 5. LICENCIAMENTO ESPECIALIZADO
- Exigências específicas do Município e Estado informados (Ex: Belém/PA - SEFA e PMB).

# 6. EQUIPAMENTOS E COMPETÊNCIAS
- NRs aplicáveis, Sistemas de Emissão e Contabilidade Integrada.

# 7. CUSTOS DE ABERTURA
- Estimativa real: Junta Comercial, Taxas, Certificado A1 e Honorários.

# 8. MATRIZ DE RISCOS TRIBUTÁRIOS (ESPECÍFICA)
- Risco de ICMS-ST, MVA ajustada, Diferencial de Alíquota (DIFAL) e Classificação Fiscal incorreta.

# 9. IMPACTOS DA REFORMA (EC 132/2023)
- Projeção de aumento ou redução de carga para o setor específico. Impacto do fim do IPI/ICMS e entrada do IBS/CBS.

# 10. RESPOSTA À PERGUNTA DO USUÁRIO
- Resposta técnica direta com base legal.

# 11. ENQUADRAMENTO METODOLÓGICO
- Declaração de base normativa e faturamento RBT12.

# 12. CONCLUSÃO TÉCNICA VINCULADA (DECISÃO)
- Recomendação clara do melhor regime e estratégia imediata (Ex: "Recomenda-se Simples Anexo I + III com Fator R").

# 13. DECLARAÇÃO DE LIMITAÇÃO E RESPONSABILIDADE
- Delimitação técnica pericial.

# 14. RESPONSABILIDADE TÉCNICA E FUNDAMENTAÇÃO
- Princípios da legalidade e capacidade contributiva.

# 15. CLÁUSULA FINAL OBRIGATÓRIA
- “A definição do regime tributário deve ser precedida de análise contratual individualizada...”

# 16. TABELAS DE REFERÊNCIA 2026 (EM LISTA)
- Salário Mínimo 2026: R$ 1.621,00.
- Tabela INSS 2026 detalhada em lista.

⚠️ REGRA DE OURO: Se faltar dado, use o bloco "LIMITAÇÃO TÉCNICA". Não invente números, mas use os fornecidos para exaurir a lógica matemática.`;

const PROMPT_AGENTE_1 = `Você é o Agente 1: Perito em Viabilidade e Estratégia de CNAEs.
🚨 PROIBIDO TABELAS. Use listas.
- Execute os requisitos 1, 5 e 11.
- Analise a predominância das atividades e se vale a pena separar o CNPJ de comércio do de serviço.
- Foque em licenciamento específico da região informada.`;

const PROMPT_AGENTE_2 = `Você é o Agente 2: Auditor de Obrigações e Reinf.
🚨 PROIBIDO TABELAS. Use listas.
- Execute os requisitos 1.3, 2 e 13.
- Filtre apenas obrigações reais do Simples Nacional. Corrija erros de SPED/ECF.
- Detalhe a Reinf série R-4000 com precisão cirúrgica.`;

const PROMPT_AGENTE_3 = `Você é o Agente 3: Engenheiro de Custos e Estrategista de Fator R.
🚨 PROIBIDO TABELAS. Use listas.
- Execute os requisitos 1.1, 3 e 16.
- FAÇA O CÁLCULO MATEMÁTICO da alíquota efetiva.
- Defina o valor exato do pró-labore para otimização do Fator R.
- Compare Simples vs Lucro Presumido em valores monetários (R$).`;

const PROMPT_AGENTE_4 = `Você é o Agente 4: Especialista em Parametrização e Inteligência de Itens.
🚨 PROIBIDO TABELAS. Use listas.
- Execute os requisitos 4, 6 e 14.
- Liste 20 itens com NCM real e CSOSN correto (identifique se há Substituição Tributária no setor).
- Defina o cClassTrib (Reforma) para cada item.`;

const PROMPT_AGENTE_5 = `Você é o Agente 5: Gestor de Riscos Tributários e Societário.
🚨 PROIBIDO TABELAS. Use listas.
- Execute os requisitos 1.2, 7, 8 e 15.
- Foque em riscos reais: ICMS-ST, DIFAL e confusão patrimonial.
- Detalhe custos de abertura regionais.`;

const PROMPT_AGENTE_6 = `Você é o Agente 6: Estrategista de Reforma e Veredito Final.
🚨 PROIBIDO TABELAS. Use listas.
- Execute os requisitos 9, 10 e 12.
- Dê um veredito claro: Qual regime escolher e qual o primeiro passo prático.
- Analise o impacto real da EC 132 no preço de venda do cliente.`;

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
      parts: [{ text: userContent + "\n\n[INSTRUÇÃO CRÍTICA]: GERE O RELATÓRIO COMPLETO SEGUINDO OS 16 REQUISITOS. NÃO USE TABELAS. USE APENAS LISTAS EM TÓPICOS. SEJA EXTENSO, MATEMÁTICO E ESTRATÉGICO." }] 
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