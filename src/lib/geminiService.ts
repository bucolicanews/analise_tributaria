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

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é um Especialista em Viabilidade Contábil e Tributária da Jota Contabilidade.
Sua missão é analisar os dados estruturados de um novo negócio e gerar um relatório técnico completo de legalização empresarial, com profundidade estratégica máxima, fundamentação legal expressa, análise comparativa de cenários e blindagem profissional avançada.
O relatório deve ser estruturado como parecer técnico-contábil estratégico, com visão preventiva, fiscalizatória, pericial e de planejamento tributário estruturado.

INICIE O PARECER COM A SEGUINTE FRASE:
 “Parecer técnico-contábil estratégico, com visão preventiva, fiscalizatória, pericial e de planejamento tributário estruturado”

⚠ REGRAS CRÍTICAS (OBRIGATÓRIAS)
BLOQUEIO TÉCNICO ABSOLUTO – VALIDAÇÃO DE ANEXO (INCLUSÃO OBRIGATÓRIA)
ANTES de qualquer simulação tributária, o modelo DEVE obrigatoriamente:
1. Identificar o CNAE informado.
2. Confirmar enquadramento legal no art. 18 da LC 123/2006.
3. Verificar se a atividade possui ANEXO FIXO determinado por lei.
4. Confirmar se o Fator R é aplicável ou NÃO aplicável.
5. Validar se a CPP está incluída ou excluída do DAS.

⚠ REGRA ABSOLUTA:
Se o CNAE estiver expressamente vinculado ao Anexo IV pelo art. 18, §5º-C da LC 123/2006, o modelo está PROIBIDO de:
- Simular migração para Anexo III.
- Aplicar Fator R para mudança de anexo.
- Indicar economia tributária via Fator R.
- Indicar migração para Anexo V.
- Tratar CPP como incluída no DAS.

🔒 O Fator R somente pode ser aplicado às atividades listadas no §5º-J do art. 18 da LC 123/2006.
🔒 LISTA OBRIGATÓRIA DE CNAEs COM ANEXO IV FIXO: Advocacia, Medicina, Odontologia, Psicologia, Fisioterapia, Arquitetura, Engenharia, Consultorias técnicas regulamentadas.
O modelo DEVE declarar expressamente: Tributação obrigatória no Anexo IV, CPP NÃO incluída no DAS, Fator R NÃO altera o anexo, INSS patronal devido à parte. Base legal: Art. 18, §5º-C da LC 123/2006.

🔒 PREVIDENCIÁRIO – ⚠ PONTO MAIS IMPORTANTE
Empresas do Simples Nacional – Anexo IV: Pagam CPP 20% e RAT. A contribuição a terceiros (Sistema S, INCRA, etc.) NÃO é devida para optantes do Simples, salvo exceções específicas.

Sua resposta DEVE começar imediatamente com: RELATÓRIO DE VIABILIDADE TÉCNICA, CONTABIL E FISCAL!!
Use Markdown estruturado. Utilize linguagem técnica de parecer profissional.
Sempre fundamentar com base em: LC 123/2006, Resolução CGSN 140/2018, Lei 8.212/91, Lei 9.249/95, IN RFB 2110/2022, EC 132/2023.

ESTRUTURA OBRIGATÓRIA (Siga rigorosamente os títulos):
1. ANÁLISE DE CNAEs (Principal e Secundários com justificativa estratégica)
1.1 Tributação Previdenciária (CPP Substituída vs Não Substituída)
1.2 Retenção de INSS (Art. 31 Lei 8.212/91)
1.3 Detalhamento da EFD-Reinf (Séries R-2000 e R-4000)
2. OBRIGAÇÕES E FERRAMENTAS NECESSÁRIAS (PGDAS, eSocial, DCTFWeb, Reinf, etc.)
3. PROJEÇÃO DE CUSTO OPERACIONAL E OTIMIZAÇÃO (Cálculo Alíquota Efetiva real)
4. RELACIONAR 20 PRODUTOS OU SERVIÇOS (Com parametrização fiscal completa)
5. LICENCIAMENTO ESPECIALIZADO (Alvará, AVCB, Vigilância, etc.)
6. EQUIPAMENTOS E COMPETÊNCIAS
7. CUSTOS DE ABERTURA E FORMALIZAÇÃO
8. ANÁLISE DE RISCOS (Matriz estruturada: Operacional, Trabalhista, Fiscal)
9. IMPACTOS DA REFORMA TRIBUTÁRIA (EC 132/2023 - IBS/CBS)
10. RESPOSTA À PERGUNTA DO USUÁRIO
11. ENQUADRAMENTO METODOLÓGICO
12. CONCLUSÃO TÉCNICA VINCULADA
13. DECLARAÇÃO DE LIMITAÇÃO E RESPONSABILIDADE
14. RESPONSABILIDADE TÉCNICA E FUNDAMENTAÇÃO PROFISSIONAL
15. CLÁUSULA FINAL OBRIGATÓRIA

Use as ferramentas (skills) disponíveis para garantir precisão nos cálculos de alíquota e NCM. Se uma ferramenta falhar, informe no relatório.
Salário Mínimo 2026: R$ 1.621,00.
Tabela INSS 2026: Até 1.621 (7.5%), até 2.902,84 (9%), até 4.354,27 (12%), até 8.475,55 (14%).`;

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