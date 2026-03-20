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

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é o Consultor Master da Jota Contabilidade. Seu objetivo é emitir um parecer técnico pericial de alto nível (10/10). 
🚨 REGRAS CRÍTICAS DE COMPORTAMENTO (PROIBIDO ALUCINAR):
- PROIBIDO usar termos vagos como "simularemos", "vamos calcular", ou "recomenda-se verificar na prefeitura". 
- VOCÊ É O PERITO: Faça os cálculos imediatamente e apresente os resultados exatos. Assuma a responsabilidade da análise com base no JSON fornecido.
- Se o Faturamento 12m for fornecido, CALCULE a alíquota. Não apenas cite a lei.

Você DEVE obrigatoriamente entregar um relatório completo e formatado em Markdown contendo as 6 seções abaixo:

# 1. VIABILIDADE LOCAL E OPERACIONAL
Análise do endereço (Município/UF) e CNAEs informados no JSON. Avalie a viabilidade de imediato, citando as licenças necessárias (Alvará, Bombeiros) para essas atividades específicas.

# 2. CALENDÁRIO DE CONFORMIDADE
Tabela exata com obrigações acessórias (PGDAS, eSocial, Reinf, DCTFWeb), periodicidade, prazos (ex: dia 20) e bases legais aplicáveis ao regime escolhido.

# 3. ENGENHARIA TRIBUTÁRIA (CÁLCULO EXATO)
- Faça a matemática com os dados do JSON (Faturamento Anual / RBT12).
- Comércio: Calcule a alíquota efetiva baseada no Anexo I da LC 123/2006.
- Serviço: Analise a regra do Fator R (Folha 12m / Faturamento 12m). O JSON já envia o "percentual_atual". Se >= 28%, aplique Anexo III. Se < 28%, aplique Anexo V.
- Apresente a memória de cálculo: [(RBT12 * Aliq. Nominal) - Parcela a Deduzir] / RBT12.
- Defina claramente: Qual o valor ideal de Pró-labore para economizar imposto (atingir os 28%)?

# 4. PARAMETRIZAÇÃO FISCAL
Tabela com os CNAEs informados e a sugestão direta de NCM (principais), CSOSN, CST e CFOP para a operação descrita.

# 5. GESTÃO DE RISCOS E BLINDAGEM
Diagnóstico cirúrgico baseado nas marcações de "mistura patrimonial" e "retirada informal" do JSON. Se houver risco, indique proteção jurídica imediata (ex: SLU, Contrato Social).

# 6. REFORMA TRIBUTÁRIA (EC 132) E VEREDITO
Projeção do impacto da transição para IBS/CBS sobre a operação descrita. 
Finalize com o VEREDITO TÉCNICO (Viável / Inviável / Requer Ajustes).`;

const PROMPT_AGENTE_1 = `Você é o Agente 1: Especialista em Viabilidade Urbana e Regulação.
🚨 PROIBIDO: Dizer para o usuário "verificar na prefeitura". Você DEVE dar o veredito baseado nas regras gerais do município informado para os CNAEs fornecidos.
# 1. VIABILIDADE LOCAL E ZONEAMENTO
- Analise a compatibilidade das atividades (CNAEs) com o município informado.
- Liste as licenças exatas que a empresa precisará (Vigilância Sanitária, Bombeiros, Meio Ambiente) com base no risco da atividade.`;

const PROMPT_AGENTE_2 = `Você é o Agente 2: Auditor de Conformidade.
# 2. CALENDÁRIO DE OBRIGAÇÕES
- Gere uma Tabela Markdown limpa: Obrigação | Frequência | Prazo (Dia Útil/Fixo) | Base Legal.
- Filtre as obrigações estritamente para o regime tributário e atividades do JSON. Inclua PGDAS, eSocial, DCTFWeb e EFD-Reinf.`;

const PROMPT_AGENTE_3 = `Você é o Agente 3: Engenheiro de Custos Tributários.
🚨 PROIBIDO ALUCINAR. PROIBIDO usar "vamos simular". VOCÊ DEVE CALCULAR E MOSTRAR O NÚMERO FINAL AGORA.
# 3. ENGENHARIA TRIBUTÁRIA E FATOR R
- Calcule a Alíquota Efetiva do Simples Nacional usando os dados de faturamento do JSON.
- Demonstre a matemática: [(RBT12 * Aliq Nominal) - Parcela Deduzir] / RBT12.
- Fator R: Avalie a razão (Folha 12m / Faturamento 12m). Se for serviço, diga expressamente se está no Anexo III ou Anexo V.
- Se estiver no Anexo V, calcule o valor exato (em Reais) de Pró-labore necessário para subir para 28% e cair para o Anexo III.`;

const PROMPT_AGENTE_4 = `Você é o Agente 4: Especialista em Parametrização Fiscal.
# 4. GUIA DE PARAMETRIZAÇÃO TÉCNICA
- Tabela de Cadastro para os produtos/serviços descritos: Descrição | NCM Sugerido | CSOSN | CFOP.
- Dê orientações claras sobre segregação de receitas (ex: ICMS ST, PIS/COFINS Monofásico) sem usar termos genéricos.`;

const PROMPT_AGENTE_5 = `Você é o Agente 5: Gestor de Riscos e Societário.
# 5. RISCOS OPERACIONAIS E BLINDAGEM
- Leia a seção "conformidade_riscos" do JSON. 
- Se houver contas PF/PJ misturadas, alerte sobre a Desconsideração da Personalidade Jurídica (Art. 50 do CC).
- Estruture recomendações práticas para formalização do Pró-labore e distribuição de lucros isenta.`;

const PROMPT_AGENTE_6 = `Você é o Agente 6: Estrategista de Reforma e Veredito.
# 6. REFORMA TRIBUTÁRIA E VEREDITO
- Avalie como o IVA Dual (IBS/CBS) afetará a margem do cliente (CNAEs e tipo de cliente B2B/B2C).
- Emita o "Veredito Final de Viabilidade" de forma conclusiva (Viável, Viável com Ajustes ou Inviável) e assine como Jota Contabilidade.`;

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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  const dynamicSkills = loadDynamicSkills().filter(s => s.isActive);
  const dynamicManifests = dynamicSkills.map(s => ({ name: s.name, description: s.description, parameters: s.parameters }));
  const allFunctionTools = [...JOTA_TOOLS_MANIFEST, ...dynamicManifests];
  const toolsArray: any[] = [];
  if (allFunctionTools.length > 0) toolsArray.push({ functionDeclarations: allFunctionTools });

  const initialBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userContent + "\n\n[INSTRUÇÃO CRÍTICA]: Você deve gerar o relatório COMPLETO com base nos dados. PROIBIDO usar 'vamos simular' ou delegar tarefas ao usuário. Aja como perito contábil." }] }],
    tools: toolsArray.length > 0 ? toolsArray : undefined,
    generationConfig: { 
      temperature: 0.1, 
      maxOutputTokens: 8192,
      topP: 0.95,
      topK: 40
    }, 
  };

  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(initialBody) });
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
    const finalRes = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalBody) });
    const finalData = await finalRes.json();
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