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

⚠ REGRAS DE OURO (USO OBRIGATÓRIO DE SKILLS):
1. CONSULTA DE ENDEREÇO: O usuário forneceu o CEP 66910010 nos dados ocultos. Você DEVE obrigatoriamente chamar a função 'consultar_endereco_viacep' (ou 'get_address_by_cep' se a customizada falhar) passando este CEP.
2. CONFIRMAÇÃO NO TEXTO: No início do relatório, você deve escrever EXATAMENTE os dados que a função retornar: "Validação via Skill: [Bairro], [Cidade]".
3. PROIBIDO CONTEÚDO GENÉRICO: Use itens reais do nicho do cliente.
4. FOCO EM 2026: A Reforma (IBS/CBS) é o coração do parecer.

ESTRUTURA DO PARECER:

0. RESPOSTA À SOLICITAÇÃO DIRETA (VALIDAÇÃO DE SKILL)
Escreva os dados retornados pela ferramenta de CEP.

1.0 ANÁLISE ESTRATÉGICA DE CNAEs
Identifique o CNAE exato. Se for Anexo IV, declare que a CPP (20%) é por fora.

2. SIMULAÇÃO COMPARATIVA (DRE TRIBUTÁRIA)
Tabela real comparando Simples vs Presumido vs Reforma 2026. Use as ferramentas de cálculo de imposto disponíveis.

3. PARAMETRIZAÇÃO TÉCNICA
Tabela com NCMs e CSTs. Use a ferramenta de NCM para embasar.

4. CONCLUSÃO VINCULADA
Veredito final.

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

  // A IA verá tanto as nativas quanto as customizadas
  const allTools = [...JOTA_TOOLS_MANIFEST, ...dynamicManifests];

  console.log("[Gemini] Enviando ferramentas para a IA:", allTools.map(t => t.name));

  // O Segredo: A chave correta para a API REST do Gemini é functionDeclarations (CamelCase)
  const initialBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userContent + "\n\n[INSTRUÇÃO INVISÍVEL]: Lembre-se de testar o CEP 66910010 com suas tools." }] }],
    tools: allTools.length > 0 ? [{ functionDeclarations: allTools }] : undefined,
    generationConfig: { temperature: 0.1 },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(initialBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[Gemini] Erro na requisição inicial:", errText);
    throw new Error(`Erro API: ${response.status}`);
  }

  const data = await response.json();
  let message = data?.candidates?.[0]?.content;

  // Lógica de Loop para Function Calling (Se a IA decidir usar uma ferramenta)
  if (message?.parts?.some((p: any) => p.functionCall)) {
    const toolResults: any[] = [];
    
    for (const part of message.parts) {
      if (part.functionCall) {
        const { name, args } = part.functionCall;
        console.log(`[Gemini] A IA solicitou a execução da Skill: '${name}' com argumentos:`, args);
        
        // Executa a função localmente ou no Webhook
        const result = await executeSkill(name, args);
        console.log(`[Gemini] Resultado da Skill '${name}':`, result);
        
        toolResults.push({
          functionResponse: {
            name,
            response: result 
          }
        });
      }
    }

    // Devolve o resultado da ferramenta para a IA continuar o texto
    const finalBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      tools: allTools.length > 0 ? [{ functionDeclarations: allTools }] : undefined,
      contents: [
        { role: 'user', parts: [{ text: userContent }] },
        message, // A mensagem da IA pedindo a função
        { role: 'function', parts: toolResults } // Nossa resposta com os dados do ViaCEP
      ]
    };

    console.log("[Gemini] Devolvendo dados da Skill para a IA gerar o relatório final...");

    const finalRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalBody),
    });

    if (!finalRes.ok) {
      const errText = await finalRes.text();
      console.error("[Gemini] Erro no retorno da função:", errText);
      throw new Error(`Erro API no retorno da função: ${finalRes.status}`);
    }

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