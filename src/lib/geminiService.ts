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

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é o Consultor Master da Jota Contabilidade. Seu objetivo é emitir um parecer técnico pericial de alto nível.

🚨 REGRAS CRÍTICAS E INEGOCIÁVEIS (ANTI-ALUCINAÇÃO E FORMATAÇÃO):
1. NUNCA DELEGUE TAREFAS ("Recomenda-se confirmar", "Consulte a prefeitura"). Você DEVE CRAVAR A RESPOSTA. Assuma a postura de Perito.
2. GERE EXATAMENTE AS 6 SEÇÕES ABAIXO, completas, do início ao fim.
3. 🚨 TOTALMENTE PROIBIDO O USO DE TABELAS MARKDOWN (ex: | Coluna | Coluna |). USE APENAS LISTAS EM TÓPICOS (Bullet points). As tabelas quebram a renderização do sistema.
4. NÃO USE EMOJIS.
5. OBRIGATÓRIO: Use as ferramentas 'calculate_irpf_prolabore' e 'get_ncm_technical_info'.

# 1. VIABILIDADE LOCAL E OPERACIONAL
Liste as licenças exatas necessárias (Alvará, Bombeiros, Sanitária) em tópicos, cravando que são obrigatórias.

# 2. CALENDÁRIO DE CONFORMIDADE
Liste as obrigações fiscais (PGDAS, eSocial, Reinf, DCTFWeb) rigorosamente no formato de tópicos:
- **[Nome da Obrigação]**: [Frequência] - [Prazo Fixo] (Base Legal: [Base])

# 3. ENGENHARIA TRIBUTÁRIA E FATOR R
Apresente a memória de cálculo em tópicos simples:
- **Faturamento Anual (12m)**: R$ [Valor]
- **Folha de Pagamento Atual (12m)**: R$ [Valor]
- **Fator R Atual**: [%]
- **Enquadramento Atual**: [Anexo III ou V]
- **OTIMIZAÇÃO**: Folha 12m ideal = R$ [Faturamento * 0.28]. Pró-labore Mensal ideal = R$ [(Faturamento * 0.28) / 12].
*Após calcular o Pró-labore Mensal ideal, você DEVE chamar a ferramenta 'calculate_irpf_prolabore' e informar o imposto exato.*

# 4. PARAMETRIZAÇÃO FISCAL
Apresente os dados de parametrização em formato de lista para cada CNAE/Produto:
- **CNAE**: [Código]
  - NCM Sugerido: [NCM]
  - CSOSN: [Código]
  - CST: [Código]
  - CFOP Entrada: [Código]
  - CFOP Saída: [Código]

# 5. GESTÃO DE RISCOS E BLINDAGEM
Diagnóstico direto baseado nas marcações do JSON (confusão patrimonial). Dê ordens claras de correção em tópicos.

# 6. REFORMA TRIBUTÁRIA (EC 132) E VEREDITO
Explique o impacto do IVA Dual (IBS/CBS). Emita o VEREDITO TÉCNICO (Viável / Inviável / Requer Ajustes) assinado pela Jota Contabilidade.`;

const PROMPT_AGENTE_1 = `Você é o Agente 1: Especialista em Viabilidade Urbana e Regulação.
🚨 PROIBIDO: Dizer "verificar na prefeitura" ou usar Tabelas.
# 1. VIABILIDADE LOCAL E ZONEAMENTO
- Analise a compatibilidade das atividades (CNAEs).
- Liste as licenças exatas que a empresa precisará em tópicos.`;

const PROMPT_AGENTE_2 = `Você é o Agente 2: Auditor de Conformidade.
🚨 PROIBIDO: USAR TABELAS MARKDOWN.
# 2. CALENDÁRIO DE OBRIGAÇÕES
- Liste em tópicos: - **[Obrigação]**: [Frequência] - [Prazo Fixo] (Base Legal).
- Inclua PGDAS, eSocial, DCTFWeb e EFD-Reinf.`;

const PROMPT_AGENTE_3 = `Você é o Agente 3: Engenheiro de Custos Tributários.
🚨 OBRIGATÓRIO: Use a ferramenta 'calculate_irpf_prolabore'. Proibido usar tabelas.
# 3. ENGENHARIA TRIBUTÁRIA E FATOR R
- Mostre Fator R em tópicos (Folha 12m / Faturamento 12m).
- Se Anexo V, calcule a OTIMIZAÇÃO: Pró-labore Mensal Ideal = (Faturamento * 0.28) / 12. Mostre o valor em Reais.`;

const PROMPT_AGENTE_4 = `Você é o Agente 4: Especialista em Parametrização Fiscal.
🚨 OBRIGATÓRIO: Use a ferramenta 'get_ncm_technical_info'. PROIBIDO usar tabelas.
# 4. GUIA DE PARAMETRIZAÇÃO TÉCNICA
- Liste os parâmetros em tópicos por CNAE (NCM, CSOSN, CFOP). Seja assertivo.`;

const PROMPT_AGENTE_5 = `Você é o Agente 5: Gestor de Riscos e Societário.
# 5. RISCOS OPERACIONAIS E BLINDAGEM
- Dê orientações peremptórias em tópicos para formalização do Pró-labore e distribuição de lucros.`;

const PROMPT_AGENTE_6 = `Você é o Agente 6: Estrategista de Reforma e Veredito.
# 6. REFORMA TRIBUTÁRIA E VEREDITO
- Emita o "Veredito Final de Viabilidade" conclusivo e assine como Jota Contabilidade.`;

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
  
  // Lê o modelo do localStorage, ou usa flash como padrão
  const model = localStorage.getItem('jota-gemini-model') || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const dynamicSkills = loadDynamicSkills().filter(s => s.isActive);
  const dynamicManifests = dynamicSkills.map(s => ({ name: s.name, description: s.description, parameters: s.parameters }));
  const allFunctionTools = [...JOTA_TOOLS_MANIFEST, ...dynamicManifests];
  const toolsArray: any[] = [];
  if (allFunctionTools.length > 0) toolsArray.push({ functionDeclarations: allFunctionTools });

  const initialBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userContent + "\n\n[INSTRUÇÃO CRÍTICA]: Você DEVE gerar o relatório COMPLETO. NÃO PARE NO MEIO. PROIBIDO USAR TABELAS. Use apenas listas de tópicos. Aja como perito." }] }],
    tools: toolsArray.length > 0 ? toolsArray : undefined,
    generationConfig: { 
      temperature: 0.2, 
      maxOutputTokens: 8192,
    }, 
  };

  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(initialBody) });
  const data = await response.json();
  
  if (data.error) throw new Error(`Erro API Gemini: ${data.error.message}`);
  
  let message = data?.candidates?.[0]?.content;
  let firstText = message?.parts?.filter((p: any) => p.text).map((p: any) => p.text).join('\n') || '';

  // Se a IA decidiu chamar uma ferramenta/skill
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
      generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
    };
    
    const finalRes = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalBody) });
    const finalData = await finalRes.json();
    
    if (finalData.error) {
      console.error("Erro na segunda chamada do Gemini (Pós-Skill):", finalData.error);
      return firstText.trim() + "\n\n[Nota do Sistema: A IA tentou usar uma ferramenta e foi interrompida.]";
    }

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