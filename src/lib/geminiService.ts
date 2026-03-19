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
Seu objetivo é gerar um parecer pericial de ALTO NÍVEL. 

⚠ REGRAS DE OURO (TOLERÂNCIA ZERO):
1. PROIBIDO CONTEÚDO GENÉRICO: Não diga "verificar na legislação" ou "pode estar sujeito". Use as ferramentas (TOOLS) para dar a resposta exata.
2. OBRIGATÓRIO USO DE TOOLS: 
   - Use 'calculate_simples_nacional' para o Simples.
   - Use 'calculate_lucro_presumido' para o Presumido.
   - Use 'calculate_irpf_prolabore' para o IR do sócio.
   - Use 'get_ncm_technical_info' para CADA UM dos 20 produtos da lista.
3. LISTA DE PRODUTOS: A seção 4 deve conter 20 itens REAIS do segmento do cliente, com NCMs válidos e análise de ST/Monofásico real.
4. FOCO EM 2026: Considere as regras da Reforma (IBS/CBS) como prioridade estratégica.

ESTRUTURA DO PARECER:

1.0 ANÁLISE ESTRATÉGICA DE CNAEs
Identifique o CNAE exato. Se for Anexo IV (Engenharia, Advocacia, etc), declare IMEDIATAMENTE que a CPP (20%) é paga por fora do DAS. Não erre isso.

1.1 DIAGNÓSTICO PREVIDENCIÁRIO E IRPF
Use a tool 'calculate_irpf_prolabore' para mostrar o custo real do sócio. Explique a retenção de 11% de INSS se houver cessão de mão de obra.

2. MATRIZ DE OBRIGAÇÕES ACESSÓRIAS
Seja específico: PGDAS, Reinf (Série R-4000), eSocial, DCTFWeb. Informe prazos e multas reais.

3. SIMULAÇÃO COMPARATIVA (DRE TRIBUTÁRIA)
Apresente uma tabela comparativa real:
- Cenário A: Simples Nacional (Use a Tool)
- Cenário B: Lucro Presumido (Use a Tool)
- Cenário C: Reforma 2026 (IBS/CBS)
Calcule o Ponto de Equilíbrio e a Margem Líquida Real.

4. PARAMETRIZAÇÃO TÉCNICA DE ITENS (20 PRODUTOS/SERVIÇOS)
Tabela com: Item | NCM | CSOSN Sugerido | ST (Sim/Não) | Monofásico (Sim/Não) | Classe IBS/CBS.
Use 'get_ncm_technical_info' para validar os dados.

5. LICENCIAMENTO E RISCOS
Liste os alvarás específicos para a cidade informada. Na análise de riscos, use uma matriz de Impacto vs Probabilidade.

6. CONCLUSÃO VINCULADA
Dê o veredito: "O regime X é o mais vantajoso por economizar R$ Y por ano".

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