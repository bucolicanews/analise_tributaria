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

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é o Auditor Sênior de Viabilidade da Jota Contabilidade. 
Seu objetivo é gerar um parecer pericial de ALTO NÍVEL, técnico e sem enrolação.

⚠ REGRAS DE OURO (TOLERÂNCIA ZERO):
1. RESPOSTA A PERGUNTAS: Se o usuário fizer uma pergunta no final do texto (ex: sobre CEP ou localização), você DEVE responder essa pergunta no início do relatório, usando obrigatoriamente a ferramenta 'get_address_by_cep'.
2. PROIBIDO CONTEÚDO GENÉRICO: Não use "Peça X" ou "Serviço Y". Se o cliente é uma oficina de motos, use itens reais: "Kit Relação", "Pneu 90/90-18", "Óleo 20W50", etc.
3. OBRIGATÓRIO USO DE TOOLS: 
   - Use 'get_address_by_cep' sempre que houver um CEP.
   - Use 'calculate_simples_nacional' para o Simples.
   - Use 'calculate_lucro_presumido' para o Presumido.
   - Use 'get_ncm_technical_info' para validar NCMs reais.
4. FOCO EM 2026: A Reforma (IBS/CBS) é o coração do parecer.

ESTRUTURA DO PARECER:

0. RESPOSTA À SOLICITAÇÃO DIRETA
Se o usuário pediu para validar um CEP ou local, coloque aqui o resultado da ferramenta: "Localização Validada: Bairro [X], Cidade [Y]. Análise de viabilidade para este local: [Z]".

1.0 ANÁLISE ESTRATÉGICA DE CNAEs
Identifique o CNAE exato (ex: 4541-2/06). Se for Anexo IV, declare que a CPP (20%) é por fora.

2. SIMULAÇÃO COMPARATIVA (DRE TRIBUTÁRIA)
Tabela real comparando Simples vs Presumido vs Reforma 2026. Use as ferramentas de cálculo.

3. PARAMETRIZAÇÃO TÉCNICA (20 ITENS REAIS)
Tabela com: Item Real | NCM | CSOSN | ST (Sim/Não) | Monofásico (Sim/Não) | Classe IBS/CBS.
Exemplo para Motos: NCM 8714.10.00 (Peças de motos) tem ST em muitos estados. Verifique!

4. CONCLUSÃO VINCULADA
Veredito: "O regime X economiza R$ Y por ano".

Inicie com: RELATÓRIO DE VIABILIDADE TÉCNICA - JOTA INTELIGÊNCIA`;

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

  const allTools = [...JOTA_TOOLS_MANIFEST, ...dynamicManifests];

  const initialBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userContent }] }],
    tools: allTools.length > 0 ? [{ function_declarations: allTools }] : undefined,
    generationConfig: { temperature: 0.1 },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(initialBody),
  });

  if (!response.ok) throw new Error(`Erro API: ${response.status}`);

  const data = await response.json();
  let message = data?.candidates?.[0]?.content;

  // Lógica de Loop para Function Calling (Gemini pode pedir várias ferramentas)
  if (message?.parts?.some((p: any) => p.functionCall)) {
    const toolResults: any[] = [];
    
    for (const part of message.parts) {
      if (part.functionCall) {
        const { name, args } = part.functionCall;
        const result = await executeSkill(name, args);
        toolResults.push({
          functionResponse: {
            name,
            response: { content: result }
          }
        });
      }
    }

    const finalBody = {
      ...initialBody,
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