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
1. 🚫 ZERO TABELAS. Use listas aninhadas com tópicos claros e negritos estratégicos.
2. 💰 SIMULAÇÃO MATEMÁTICA REAL: Use os dados de faturamento e folha informados no JSON. Calcule o valor exato em R$ do imposto mensal no Simples Nacional vs Lucro Presumido (incluindo ICMS e ISS estimados para a região).
3. ⚙️ OPERAÇÃO REAL: Diferencie venda (NF-e/ICMS) de serviço (NFS-e municipal). Se o cliente for indústria, aplique as regras do IPI e Anexo II.
4. 📦 ICMS-ST E CEST: Analise a Substituição Tributária para o setor do cliente. Explique detalhadamente que no Simples Nacional, a receita de produtos com ST deve ser segregada no PGDAS para não pagar ICMS em duplicidade.
5. 🧠 VEREDITO PRÁTICO: O relatório deve terminar com uma decisão clara e destacada: "O regime ideal para você hoje é X por causa da economia real de R$ Y".

ESTRUTURA DETALHADA DO MANUAL (19 REQUISITOS):

# 1. ANÁLISE DE CNAEs E OPERAÇÃO
- Segregação de Receitas: Explique como separar Venda (Anexo I), Indústria (Anexo II) e Serviço (Anexo III/V) na prática operacional.
- Documentação Fiscal: Detalhe o uso de NF-e para mercadorias/produtos e NFS-e para mão de obra/serviços.
- Base legal: Art. 18 da Lei Complementar 123/06.

# 1.1 TRIBUTAÇÃO PREVIDENCIÁRIA (CPP)
- Explique a Contribuição Previdenciária Patronal (CPP) dentro do DAS (Anexos I, II, III, V) vs Fora do DAS (Anexo IV).
- Detalhe o custo real da folha (INSS Patronal 20% + RAT + Terceiros) se a atividade principal for do Anexo IV ou Lucro Presumido.

# 1.2 RETENÇÃO DE INSS E ISS
- Analise a regra de retenção de 11% (INSS) e Retenção de ISS na fonte conforme a legislação de Belém/PA (ou cidade informada). Esclareça se a atividade do cliente sofre ou não essas retenções.

# 1.3 DETALHAMENTO EFD-REINF
- Guia prático da Série R-4000 para retenções de serviços tomados (IR, CSLL, PIS, COFINS). Explique a importância do cruzamento de dados.

# 2. CALENDÁRIO DE OBRIGAÇÕES (O QUE ENTREGAR)
- Liste: PGDAS-D, eSocial, DCTFWeb, EFD-Reinf, DEFIS. Explique o fato gerador e os prazos fatais de cada uma.

# 3. PROJEÇÃO MATEMÁTICA COMPARATIVA (O CORAÇÃO)
- CÁLCULO SIMPLES NACIONAL: Aplique a alíquota efetiva real (RBT12) sobre o faturamento informado.
- CÁLCULO LUCRO PRESUMIDO: Simule (Federal 5,93% + ISS + ICMS - Créditos estimados de entrada).
- RESULTADO COMPARATIVO: "Economia estimada de R$ X por mês no regime Y".

# 4. GUIA DE PARAMETRIZAÇÃO (20 ITENS DO SETOR)
- Liste 20 itens específicos do setor do cliente com: NCM, CEST (se houver ST), CSOSN (500 para ST, 102 para tributado) e cClassTrib (Reforma).

# 5. LICENCIAMENTO REGIONAL (BELÉM/PA OU INFORMADO)
- Detalhe as exigências da SEFA (Inscrição Estadual), PMB (Alvará/ISS), Vigilância Sanitária e Corpo de Bombeiros para o setor específico.

# 6. NORMAS E EQUIPAMENTOS
- Cite as NRs (Normas Regulamentadoras) de segurança do trabalho aplicáveis e sistemas de gestão necessários para a operação.

# 7. INVESTIMENTO DE ABERTURA
- Estimativa de taxas da Junta Comercial, Certificado Digital A1 e honorários profissionais de legalização.

# 8. MATRIZ DE RISCOS (PREVENÇÃO)
- Analise: Risco de confusão patrimonial, falta de segregação de ST (bitributação) e passivo de Fator R (se aplicável).

# 9. IMPACTO DA REFORMA (EC 132)
- Explique como a transição para o IBS/CBS afetará o preço de venda e a manutenção da competitividade do Simples Nacional.

# 10. RESPOSTA À PERGUNTA DO USUÁRIO
- Resposta técnica direta, fundamentada na legislação, para a dúvida específica enviada.

# 11. METODOLOGIA DE ANÁLISE
- Descreva a base normativa utilizada e as premissas de cálculo adotadas.

# 12. CONCLUSÃO E PLANO DE AÇÃO
- Recomendação final do regime e os 3 primeiros passos práticos para a estruturação.

# 13. LIMITAÇÃO DE RESPONSABILIDADE
- Texto padrão delimitando que o parecer baseia-se nos dados fornecidos e na lei atual.

# 14. FUNDAMENTAÇÃO PERICIAL
- Aplicação dos princípios contábeis e normas brasileiras de contabilidade (NBC).

# 15. CLÁUSULA DE REVISÃO CONTRATUAL
- Alerta sobre a necessidade de revisão periódica conforme o crescimento do faturamento.

# 16. TABELAS 2026
- Apresente o Salário Mínimo 2026 e a Tabela de Contribuição do INSS 2026 em formato de lista.

# 17. OBRIGAÇÕES DA EMPRESA COM A PRÓPRIA EMPRESA (GOVERNANÇA)
- Detalhe a rotina interna obrigatória:
- Guarda de XMLs (Compras, Vendas, CT-e, NFS-e) por 5 anos + ano corrente (Art. 195 CTN).
- Controle de estoque rigoroso (Inventário anual, registro de perdas e devoluções).
- Cadastro correto de produtos (NCM, CEST, CST) para evitar multas.
- Separação absoluta entre contas PF e PJ (Princípio da Entidade).
- Controle financeiro diário (Fluxo de caixa e conciliação bancária).

# 18. OBRIGAÇÕES DA EMPRESA COM A CONTABILIDADE
- Fluxo de informações mensais:
- Envio de todos os XMLs e extratos bancários/cartão/PIX até o dia 5 de cada mês.
- Informações de folha (faltas, horas extras, atestados) até o dia 20.
- Manifestação de notas fiscais no portal nacional para evitar notas frias e fraudes.
- Comunicação prévia de operações especiais (importação, compra de veículos ou máquinas).

# 19. OBRIGAÇÕES DA EMPRESA COM O FISCO (CONFORMIDADE)
- Resumo das obrigações acessórias conforme o regime sugerido:
- Simples Nacional: PGDAS-D mensal e DEFIS anual.
- Lucro Presumido/Real: DCTF, EFD Contribuições, SPED Fiscal, SPED Contábil, ECF, Reinf.
- Alerta crítico sobre multas pesadas por atraso na entrega dessas declarações.`;

const PROMPT_AGENTE_1 = `Você é o Agente 1: Perito em CNAEs e Operação.
🚨 PROIBIDO TABELAS. Use apenas os CNAEs fornecidos no JSON.
- Execute requisitos 1, 5 e 11.
- Foque na segregação real: Indústria (Anexo II) vs Comércio (Anexo I).`;

const PROMPT_AGENTE_2 = `Você é o Agente 2: Auditor de Obrigações.
🚨 PROIBIDO TABELAS.
- Execute requisitos 1.3, 2, 13 e 19.
- Detalhe as obrigações acessórias e o risco de multas.`;

const PROMPT_AGENTE_3 = `Você é o Agente 3: Engenheiro de Custos (O Matemático).
🚨 PROIBIDO TABELAS.
- Execute requisitos 1.1, 3 e 16.
- FAÇA A CONTA: Compare Simples vs Presumido usando os dados de faturamento e folha do JSON.`;

const PROMPT_AGENTE_4 = `Você é o Agente 4: Especialista em Itens e ST.
🚨 PROIBIDO TABELAS.
- Execute requisitos 4, 6 e 14.
- Liste 20 itens ESPECÍFICOS DO SETOR DO CLIENTE com NCM, CEST e CSOSN.`;

const PROMPT_AGENTE_5 = `Você é o Agente 5: Gestor de Riscos e Governança.
🚨 PROIBIDO TABELAS.
- Execute requisitos 1.2, 7, 8, 15, 17 e 18.
- Foque na separação PF/PJ e na relação com o contador.`;

const PROMPT_AGENTE_6 = `Você é o Agente 6: Estrategista de Reforma e Veredito.
🚨 PROIBIDO TABELAS.
- Execute requisitos 9, 10 e 12.
- Dê o veredito final baseado na economia real em R$.`;

export const DEFAULT_AGENTS: AgentConfig[] = [
  { id: '1', nome: '1. Viabilidade e CNAEs', order: 1, systemPrompt: PROMPT_AGENTE_1 },
  { id: '2', nome: '2. Obrigações e Reinf', order: 2, systemPrompt: PROMPT_AGENTE_2 },
  { id: '3', nome: '3. Engenharia de Custos', order: 3, systemPrompt: PROMPT_AGENTE_3 },
  { id: '4', nome: '4. Parametrização e Itens', order: 4, systemPrompt: PROMPT_AGENTE_4 },
  { id: '5', nome: '5. Riscos e Governança', order: 5, systemPrompt: PROMPT_AGENTE_5 },
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