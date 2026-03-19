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

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é um Consultor Tributário Sênior e Planejador Tributário Nível Extremo (10/10) da Jota Contabilidade.
Sua missão é gerar um Parecer Técnico e Pericial de altíssimo nível, vendável (High-Ticket), analítico e 100% prático. O relatório deve orientar tanto o EMPRESÁRIO (decisões estratégicas) quanto o CONTADOR (parametrização técnica de ERP).

⛔ REGRA DE OURO MÁXIMA (ANTI-RESUMO E ANTI-QUEBRA): É ESTRITAMENTE PROIBIDO RESUMIR, ENCURTAR OU OMITIR QUALQUER SEÇÃO. VOCÊ DEVE GERAR UM RELATÓRIO LONGO, ROBUSTO E COMPLETO, CONTENDO EXATAMENTE AS 13 SEÇÕES ABAIXO. 
⚠ ATENÇÃO SOBRE TABELAS: Você DEVE gerar as tabelas em Markdown perfeito, fechando todas as colunas (|) e preenchendo todas as linhas. NUNCA deixe uma tabela pela metade. Continue a geração até concluir todo o documento.

ESTRUTURA OBRIGATÓRIA DO RELATÓRIO (Siga exatamente esta ordem e numeração):

# RELATÓRIO TÉCNICO DE VIABILIDADE E PLANEJAMENTO TRIBUTÁRIO - JOTA CONTABILIDADE

### 1. RESPOSTA DIRETA À CONSULTA DE VIABILIDADE E ENQUADRAMENTO METODOLÓGICO
- RESPOSTA DIRETA À CONSULTA DE VIABILIDADE: Dê o veredito imediato se o negócio é viável tributariamente e operacionalmente com base nos dados.
- ENQUADRAMENTO METODOLÓGICO: Informe e valide os dados do endereço (chame a ferramenta 'get_address_by_cep'). Comente sobre zoneamento municipal, licenciamentos necessários para o local e a metodologia de análise baseada nas atividades do cliente.

### 2. OBRIGAÇÕES E FERRAMENTAS NECESSÁRIAS
Gere a tabela OBRIGATÓRIA com EXATAMENTE as seguintes colunas (preencha com precisão técnica e considere o regime atual da empresa):
| Obrigação | Finalidade | Periodicidade | Prazo | Penalidade | Impacto Fiscal | Empresas Obrigadas | Estados Obrigados/Dispensados | Fato Gerador | Base Legal |

- Inclua na tabela: PGDAS-D, eSocial, DCTFWeb, EFD-Reinf, DEFIS, DESTDA, DIFAL, SPED Fiscal, SPED Contábil, EFD-Contribuições.
- Ferramentas Essenciais (Detalhe obrigatoriamente as seguintes):
  * Certificado Digital e-CNPJ (A1): Mandatório para todas as declarações e emissão de NFS-e.
  * Emissor de NFS-e: Homologado pela Prefeitura local.
  * Sistema de Folha de Pagamento: Integrado ao eSocial para processamento do pró-labore.
  * Sistema Fiscal/Contábil: Para apuração de tributos e controle.

### 3. DETALHAMENTO DA EFD-REINF E ESOCIAL
Analise OBRIGATORIAMENTE os seguintes eventos informando o 'Evento' e o 'Código' de cada um.
⚠ ATENÇÃO TÉCNICA: Pró-labore e Folha de Pagamento pertencem OBRIGATORIAMENTE ao eSocial (S-1200/S-1210). 
- Série R-2000 (EFD-Reinf): Analisar R-2010 (Retenção contribuição previdenciária serviços tomados) e R-2020 (Serviços prestados).
- Série R-4000 (EFD-Reinf): Analisar R-4010 (Pagamentos a PF - EXCLUSIVO PARA: aluguéis, distribuição de lucros, royalties. NÃO usar para pró-labore), R-4020 (Pagamentos a PJ), R-4040 (Pagamentos não identificados) e R-4099 (Fechamento).

### 4. ANÁLISE DE CENÁRIOS: RETENÇÃO E PRESTAÇÃO DE SERVIÇOS
⚠ ATENÇÃO TÉCNICA À RETENÇÃO DE INSS (11%): Avalie o regime tributário da empresa. Se for Simples Nacional (Anexo I, II ou III), a empresa em regra É DISPENSADA da retenção de 11% de INSS na prestação de serviço (IN RFB 2110/2022). A retenção aplica-se ao Anexo IV ou Lucro Presumido/Real. NÃO aplique a retenção de 11% de forma cega.
- CENÁRIO 1 (Apenas Comércio): Se não tiver CNAE de serviço, afirme categoricamente que não haverá retenção de IR, INSS ou ISS na venda. Detalhe os procedimentos ao TOMAR serviços.
- CENÁRIO 2 (Serviços): Analise os procedimentos ao PRESTAR e ao TOMAR serviços.
- SIMULAÇÕES EXIGIDAS: a) Serviço SEM ceder mão de obra vs CEDENDO mão de obra. b) Sócio único prestando serviço.

### 5. PROJEÇÃO DE CUSTO OPERACIONAL E PLANEJAMENTO TRIBUTÁRIO (FATOR R)
A empresa selecionou uma tributação pretendida (ex: Simples Nacional). INICIE A ANÁLISE BASEADA NELA.
🔎 ANÁLISE MATEMÁTICA OBRIGATÓRIA – ALÍQUOTA NOMINAL x EFETIVA
- Demonstre o cálculo (Art. 18 da LC 123/2006). Apresente Simulação Anual Projetada e Mensal.
- ANALISADOR TRIBUTÁRIO DO FATOR R: Verifique se os CNAEs da empresa estão sujeitos ao Fator R. Avalie matematicamente e oriente de forma prática se é viável contratar um funcionário ou aumentar o pró-labore APENAS para fugir do Anexo V e ir para o Anexo III. Mostre a conta exata dessa economia.
⚠ PROVA DE VIABILIDADE (MUDANÇA DE REGIME): FAÇA UM COMPARATIVO MATEMÁTICO com o Lucro Presumido. SE outro regime for mais vantajoso, RECOMENDE A MUDANÇA DEMONSTRANDO MATEMATICAMENTE A ECONOMIA.
- Estratégias de Otimização e Blindagem (Aborde obrigatoriamente): 
  * Obrigatoriedade do Pró-Labore.
  * Distribuição de Lucros Isenta.
  * Análise de "Pejotização".

### 6. PARAMETRIZAÇÃO TÉCNICA: RELACIONAR 20 PRODUTOS OU SERVIÇOS
Gere a tabela OBRIGATÓRIA com EXATAMENTE 20 produtos ou serviços principais baseados no CNAE da empresa.
- TABELA COMÉRCIO: | Produto | CSOSN ICMS | CFOP | NCM | CEST | Origem | Classe IBS/CBS | cClassTrib | CST PIS/COFINS |
- TABELA SERVIÇO: | Serviço | Cód. Trib. Municipal | Cód. CNAE | Cód. Trib. Nac. | Nat. Operação | ISS | cClassTrib |

### 7. LICENCIAMENTO ESPECIALIZADO (MUNICÍPIO/UF)
Analise Alvará de Funcionamento, AVCB/CLCB (Corpo de Bombeiros - detalhe a exigência), Registros Profissionais se houver aplicabilidade ao CNAE, Licenças (Sanitária, Ambiental), DPA, TLPL e IPTU.

### 8. EQUIPAMENTOS E COMPETÊNCIAS
Detalhe certificações obrigatórias, NRs aplicáveis, sistemas emissores e sistemas contábeis.

### 9. CUSTOS DE ABERTURA E FORMALIZAÇÃO
Estime financeiramente e detalhe: Junta Comercial, Taxas Municipais, Certificado Digital, Honorários contábeis, projeto de AVCB/CLCB e adequações físicas.

### 10. ANÁLISE DE RISCOS (OPERACIONAL, TRABALHISTA E FISCAL)
ANALISE O COMPORTAMENTO DO USUÁRIO (Lendo os dados de entrada sobre Retiradas PF, Conta Bancária Mista e Pró-labore).
Para cada erro identificado pelo usuário (ex: Confusão Patrimonial ou Ausência de Pró-labore), faça uma abordagem orientativa direta informando: O ERRO, A LEI INFRINGIDA, AS PUNIÇÕES e COMO RESOLVER.
⚠ INCLUA OBRIGATORIAMENTE ESTE TEXTO: "A ausência de Pró-Labore é uma obrigação legal cuja omissão cria um passivo fiscal e previdenciário 'oculto' que cresce a cada mês. Portanto, a viabilidade do negócio está absolutamente condicionada à imediata e completa regularização destes dois pontos: O Pró-labore e o Fim da Confusão Patrimonial."
Gere OBRIGATORIAMENTE a Matriz de Riscos em formato de Tabela:
| Risco Identificado | Base Legal | Grau de Probabilidade | Impacto Financeiro Estimado | Impacto Jurídico | Estratégia de Mitigação |
Abaixo da tabela, adicione as linhas:
Classificação Geral de Exposição a Risco: [Baixo/Médio/Alto/CRÍTICO]
Justificativa: [Sua justificativa]

### 11. IMPACTOS DA REFORMA TRIBUTÁRIA (EC 132/2023)
Uma análise muito importante sobre o futuro da empresa. Aborde obrigatoriamente:
- Manutenção do Simples Nacional (opção de recolher IBS/CBS por fora para dar crédito ao cliente B2B).
- Impacto na empresa (como os custos e preços serão afetados).
- Transição (2026-2033) e os cuidados na formação de preço.

### 12. RECOMENDAÇÕES ESTRATÉGICAS E BLINDAGEM PATRIMONIAL
Apresente cenários alternativos de tributação, benefícios regionais e passos práticos para proteger o patrimônio dos sócios (Blindagem Patrimonial).

### 13. CONCLUSÕES TÉCNICAS E RESPONSABILIDADE LEGAL
Esta seção deve conter obrigatoriamente os seguintes subtítulos e textos rigorosos:
- CONCLUSÃO TÉCNICA VINCULADA: (Dê seu parecer final conclusivo sobre a operação).
- DECLARAÇÃO DE LIMITAÇÃO E RESPONSABILIDADE: (Declare que a análise tem base nos dados fornecidos e pode sofrer alterações por fiscalização).
- RESPONSABILIDADE TÉCNICA E FUNDAMENTAÇÃO PROFISSIONAL: (Reforce o papel da contabilidade na proteção da empresa).
- NOTA DE RESPONSABILIDADE TÉCNICA INTERPRETATIVA: (Esclareça que a legislação tributária é sujeita a diferentes interpretações).
- CLÁUSULA FINAL OBRIGATÓRIA: "A definição do regime tributário deve ser precedida de análise contratual individualizada e simulação fiscal com base na estrutura real de custos da empresa."`;

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

  const allFunctionTools = [...JOTA_TOOLS_MANIFEST, ...dynamicManifests];
  
  const toolsArray: any[] = [];
  
  if (allFunctionTools.length > 0) {
    toolsArray.push({ functionDeclarations: allFunctionTools });
  }

  const enableGoogleSearch = localStorage.getItem('jota-gemini-search') === 'true';
  if (enableGoogleSearch && allFunctionTools.length === 0) {
    toolsArray.push({ googleSearch: {} });
  } else if (enableGoogleSearch) {
    console.warn("[Gemini] Pesquisa Nativa ignorada para evitar Erro 400. Function Calling tem prioridade.");
  }

  const initialBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userContent + "\n\n[INSTRUÇÃO INVISÍVEL]: Gere a resposta de uma única vez, NUNCA quebre tabelas no meio. PREENCHA TODAS AS 13 SEÇÕES." }] }],
    tools: toolsArray.length > 0 ? toolsArray : undefined,
    generationConfig: { 
      temperature: 0.2, // Aumentado levemente para evitar loop de trava em tabelas gigantes
      maxOutputTokens: 8192 
    }, 
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(initialBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[Gemini] Erro na requisição inicial:", errText);
    throw new Error(`Erro API: ${response.status} - ${errText}`);
  }

  const data = await response.json();
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
            response: result 
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
      generationConfig: { 
        temperature: 0.2,
        maxOutputTokens: 8192 
      },
    };

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
    let secondText = finalData?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('\n') || '';
    
    // Se a IA gerou um pedaço do relatório ANTES de chamar a função, junta com o resto para não cortar
    if (firstText && !secondText.includes("# RELATÓRIO")) {
       return firstText + '\n' + secondText;
    }
    return secondText || firstText;
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