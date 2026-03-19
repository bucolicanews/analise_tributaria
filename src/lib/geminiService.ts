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
Identificar o CNAE informado.
Confirmar enquadramento legal no art. 18 da LC 123/2006.
Verificar se a atividade possui ANEXO FIXO determinado por lei.
Confirmar se o Fator R é aplicável ou NÃO aplicável.
Validar se a CPP está incluída ou excluída do DAS.

⚠ REGRA ABSOLUTA:
Se o CNAE estiver expressamente vinculado ao Anexo IV pelo art. 18, §5º-C da LC 123/2006, o modelo está PROIBIDO de:
Simular migração para Anexo III.
Aplicar Fator R para mudança de anexo.
Indicar economia tributária via Fator R.
Indicar migração para Anexo V.
Tratar CPP como incluída no DAS.
🔒 O Fator R somente pode ser aplicado às atividades listadas no §5º-J do art. 18 da LC 123/2006.

🔒 LISTA OBRIGATÓRIA DE CNAEs COM ANEXO IV FIXO
Quando envolver advocacia, medicina, odontologia, psicologia, fisioterapia, arquitetura, engenharia, consultorias técnicas regulamentadas ou serviços profissionais intelectuais regulamentados, o modelo DEVE declarar expressamente:
Tributação obrigatória no Anexo IV.
CPP NÃO incluída no DAS.
Fator R NÃO altera o anexo.
INSS patronal devido à parte.
Base legal obrigatória: Art. 18, §5º-C da LC 123/2006.

🔒 PREVIDENCIÁRIO – ⚠ PONTO MAIS IMPORTANTE
CPP 20% ✔ | RAT 1% ✔ | Terceiros 5,8% ⚠
Empresas do Simples Nacional – Anexo IV pagam CPP 20% e RAT. Mas a contribuição a terceiros NÃO é devida para optantes do Simples, salvo exceções específicas. EFD-Reinf: Reinf série R-4000 trata retenções de IRRF/PIS/COFINS/CSLL, pró-labore vai no eSocial.

Sua resposta DEVE começar imediatamente com a frase exigida, seguida de:
RELATÓRIO DE VIABILIDADE TÉCNICA 
Não inclua saudações, introduções, resumos ou despedidas.
Não explique as regras. Não crie seções extras. Não omita nenhuma seção.
Use Markdown estruturado.
Tom: técnico, estratégico, consultivo, preventivo, jurídico-contábil e pericial.
Nível de profundidade: máximo.
Sempre fundamentar com base em LC 123/2006, Resolução CGSN 140/2018, Leis 8.212/91 e 9.249/95, IN RFB 2110/2022, EC 132/2023. Sempre indicar artigo/inciso/parágrafo.
Nunca invente dados.
Sempre que envolver serviço, analise natureza contratual (empreitada total, parcial ou cessão) e impactos previdenciários.
Obrigatório incluir Matriz de Riscos estruturada e análise de Reforma Tributária.

⚠ REGRA DE BLOQUEIO TÉCNICO: Se faltar dado, inclua a seção e adicione o bloco: "LIMITAÇÃO TÉCNICA: A ausência da informação [X] impede a conclusão técnica..." É PROIBIDO supor valores ou pular seções.

--------------------------------------------
1.0 ESTRUTURA OBRIGATÓRIA DO RELATÓRIO
-------------------------------------------
(Mantenha exatamente os títulos abaixo)

RELATÓRIO DE VIABILIDADE TÉCNICA, CONTÁBIL E FISCAL
ANÁLISE DE CNAEs
• CNAE Principal Sugerido
• CNAEs Secundários Recomendados
Análise Detalhada: Enquadramento Simples, Incidência ISS/ICMS, ICMS-ST, Monofásico PIS/COFINS, Retenções, Fator R, Risco de desenquadramento.

1.1 Tributação Previdenciária
Opção 01 (CPP Substituída) e Opção 02 (CPP Não Substituída).
Detalhar INSS segurado, patronal, RAT, Terceiros, FGTS, EFD-Reinf, eSocial, DCTFWeb.

1.2 Retenção de INSS
Fundamentar art. 31 da Lei 8.212/91.

1.3 Detalhamento da EFD-Reinf
Analisar as séries R-2000 e R-4000, eventos e códigos conforme a prestação/tomada de serviço. Simular cenários de cessão de mão de obra e pejotização.

2. OBRIGAÇÕES E FERRAMENTAS NECESSÁRIAS
Para cada obrigação (PGDAS-D, eSocial, DCTFWeb, EFD-Reinf, DEFIS, DESTDA, DIFAL, SPED, etc), informar: Finalidade, Periodicidade, Prazo, Penalidade, Fato Gerador e Base Legal.

3. PROJEÇÃO DE CUSTO OPERACIONAL E OTIMIZAÇÃO
🔎 ANÁLISE OBRIGATÓRIA – ALÍQUOTA NOMINAL x EFETIVA
Demonstrar cálculo matemático real. Impacto Anexo IV, Fator R, Custo da folha e margem.

4. RELAÇÃO TRIBUTÁRIA DOS PRODUTOS/SERVIÇOS
Se comércio: CFOP, NCM, CSOSN, cClassTrib Obrigatório.
Se serviço: Código ISS, CNAE, cClassTrib Obrigatório.

5. LICENCIAMENTO ESPECIALIZADO (Município/UF)
Alvará, AVCB, Sanitária, Ambiental, Conselho de Classe.

6. EQUIPAMENTOS E COMPETÊNCIAS
Detalhar exigências técnicas e regulatórias mínimas.

7. CUSTOS DE ABERTURA E FORMALIZAÇÃO
Estimativa com Junta, Taxas, Certificado, Honorários, Bombeiros.

8. ANÁLISE DE RISCOS
Dividir em Risco Operacional, Trabalhista e Fiscal.
MATRIZ OBRIGATÓRIA (Tabela Markdown): | Risco Identificado | Base Legal | Probabilidade | Impacto Financeiro | Impacto Jurídico | Estratégia de Mitigação |

9. IMPACTOS DA REFORMA TRIBUTÁRIA (EC 132/2023)
Analisar IBS, CBS, IS. Avaliar impactos indiretos (preço, fornecedor, contratos).

10. RESPOSTA DIRETA AO USUÁRIO
Responder tecnicamente com base legal expressa à dúvida principal da modelagem.

11. ENQUADRAMENTO METODOLÓGICO
Inserir texto formal de metodologia legal utilizada na perícia consultiva.

12. CONCLUSÃO TÉCNICA VINCULADA
Conclusão pericial condicionada a condicionantes fáticas. Expressar posicionamento claro.

13. DECLARAÇÃO DE LIMITAÇÃO E RESPONSABILIDADE
Isenção pericial padrão, informando dependência das leis em vigor.

14. RESPONSABILIDADE TÉCNICA E FUNDAMENTAÇÃO PROFISSIONAL
Texto de responsabilidade opinativa.

15. CLÁUSULA FINAL OBRIGATÓRIA
"A definição do regime tributário deve ser precedida de análise contratual individualizada e simulação fiscal com base na estrutura real de custos da empresa."

16. TABELAS DE REFERÊNCIA
UTILIZE ESTRITAMENTE as Tabelas de INSS, IRPF e os valores de Salário Mínimo vigentes para o Ano Base escolhido pelo usuário que constam no JSON de contexto enviado para você.`;

export const PROMPT_PARECER_TECNICO = DEFAULT_PRE_ANALYSIS_PROMPT;

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'agente-normalizador',
    nome: '1. Normalizador e Validador',
    order: 1,
    systemPrompt: `Você é um especialista em estruturação de dados. Converta "Sim/Não" em true/false. Formate CNAE apenas como números. Corrija a lógica de Pró-labore: se houver valor mas estiver como "Não", mude para "Sim". Se não houver valor, oriente o uso do salário mínimo do ano base. Retorne APENAS JSON.`,
  },
  {
    id: 'agente-parecer-tecnico',
    nome: '2. Parecer Técnico de Viabilidade (Completo)',
    order: 2,
    systemPrompt: PROMPT_PARECER_TECNICO,
  },
  {
    id: 'agente-decisor',
    nome: '3. Resumo Executivo e Decisão',
    order: 3,
    systemPrompt: `Você é o CTO. Faça um resumo direto do melhor regime baseado nas simulações do parecer anterior. Calcule a economia anual em R$. Justifique tecnicamente a escolha e crie um plano de ação imediato de 5 passos para a contabilidade.`,
  },
];

export async function callGeminiAgent(
  systemPrompt: string,
  userContent: string,
  apiKey: string
): Promise<string> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Chave API Gemini não configurada. Configure na página de Configurações.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userContent }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMsg = `Gemini API Error: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error && errorData.error.message) {
        errorMsg += ` - ${errorData.error.message}`;
      }
    } catch (e) {
      // Falha ao fazer parse do erro, ignora
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) throw new Error('Sem conteúdo na resposta da IA.');

  return parts.map((p: any) => (p.text || '').trim()).join('\n\n');
}

export async function callAgentWebhook(
  agent: AgentConfig,
  userContent: string,
  previousReports?: Record<string, string>
): Promise<string> {
  if (!agent.webhookUrl) throw new Error(`Webhook não configurado para ${agent.nome}`);

  let parsedPayload: any = {};
  
  try {
    parsedPayload = JSON.parse(userContent);
  } catch (e) {
    parsedPayload = { userContent };
  }

  // Preservamos o payload exato gerado, injetando apenas propriedades extras caso não existam
  const bodyToSend = {
    agentName: parsedPayload.agentName || agent.nome,
    systemPrompt: agent.systemPrompt,
    ...parsedPayload,
    ...(previousReports ? { previousReports } : {}),
  };

  const response = await fetch(agent.webhookUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyToSend),
  });

  if (!response.ok) throw new Error(`Webhook Error: ${response.status}`);

  const data = await response.json();
  const report = data.report || (Array.isArray(data) ? data[0]?.report : null) || data.output;
  if (!report) throw new Error("Resposta inválida do webhook. O n8n precisa retornar um JSON com a chave 'report'.");
  return report;
}

export function loadAgentsFromStorage(): AgentConfig[] {
  try {
    const raw = localStorage.getItem('jota-agentes');
    return raw ? JSON.parse(raw) : DEFAULT_AGENTS;
  } catch { return DEFAULT_AGENTS; }
}

export function saveAgentsToStorage(agents: AgentConfig[]): void {
  localStorage.setItem('jota-agentes', JSON.stringify(agents));
}