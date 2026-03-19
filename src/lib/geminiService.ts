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

⛔ REGRA DE OURO MÁXIMA (ANTI-RESUMO): É ESTRITAMENTE PROIBIDO RESUMIR, ENCURTAR OU OMITIR QUALQUER SEÇÃO. VOCÊ DEVE GERAR UM RELATÓRIO LONGO, ROBUSTO E COMPLETO, CONTENDO EXATAMENTE AS 12 SEÇÕES ABAIXO, COM TODOS OS CÁLCULOS, TABELAS E SIMULAÇÕES EXIGIDAS. SE FALTAR ESPAÇO, DETALHE O MÁXIMO POSSÍVEL.

ESTRUTURA OBRIGATÓRIA DO RELATÓRIO (Siga exatamente esta ordem e numeração):

# RELATÓRIO TÉCNICO DE VIABILIDADE E PLANEJAMENTO TRIBUTÁRIO - JOTA CONTABILIDADE

### 1. ENQUADRAMENTO METODOLÓGICO E LOCALIZAÇÃO
- Informe e valide os dados do endereço (chame a ferramenta 'get_address_by_cep'). 
- Comente sobre zoneamento municipal, licenciamentos necessários para o local e a metodologia de análise baseada nas atividades do cliente.

### 2. OBRIGAÇÕES E FERRAMENTAS NECESSÁRIAS
Gere a tabela OBRIGATÓRIA com EXATAMENTE as seguintes colunas (preencha com precisão técnica e considere o regime atual da empresa):
| Obrigação | Finalidade | Periodicidade | Prazo | Penalidade | Impacto Fiscal | Empresas Obrigadas | Estados Obrigados/Dispensados | Fato Gerador | Base Legal |

- Inclua na tabela: PGDAS-D, eSocial, DCTFWeb, EFD-Reinf, DEFIS, DESTDA, DIFAL, SPED Fiscal, SPED Contábil, EFD-Contribuições.
- Liste e detalhe as ferramentas obrigatórias: Certificado Digital A1, Emissor NFS-e ou NF-e, Sistema folha integrado, Sistema fiscal parametrizado (NCM, CFOP, CST, CSOSN), Controle de segregação de receitas.

### 3. DETALHAMENTO DA EFD-REINF E ESOCIAL
Analise OBRIGATORIAMENTE os seguintes eventos informando o 'Evento' e o 'Código' de cada um.
⚠ ATENÇÃO TÉCNICA: Pró-labore e Folha de Pagamento pertencem OBRIGATORIAMENTE ao eSocial (S-1200/S-1210). 
- Série R-2000 (EFD-Reinf): Analisar R-2010 (Retenção contribuição previdenciária serviços tomados) e R-2020 (Serviços prestados).
- Série R-4000 (EFD-Reinf): Analisar R-4010 (Pagamentos a PF - EXCLUSIVO PARA: aluguéis, distribuição de lucros, não usar para pró-labore), R-4020 (Pagamentos a PJ), R-4040 (Pagamentos não identificados) e R-4099 (Fechamento).

### 4. ANÁLISE DE CENÁRIOS: RETENÇÃO E PRESTAÇÃO DE SERVIÇOS
⚠ ATENÇÃO TÉCNICA À RETENÇÃO DE INSS (11%): Avalie o regime tributário da empresa. Se for Simples Nacional (Anexo I, II ou III), a empresa em regra É DISPENSADA da retenção de 11% de INSS na prestação de serviço (IN RFB 2110/2022). A retenção aplica-se ao Anexo IV ou Lucro Presumido/Real. NÃO aplique a retenção de 11% de forma cega.
- CENÁRIO 1 (Apenas Comércio): Se a empresa não tiver CNAE de serviço, afirme categoricamente que não haverá retenção de IR, INSS ou ISS na venda. Detalhe os procedimentos ao TOMAR serviços.
- CENÁRIO 2 (Serviços): Se tiver CNAE de serviço, analise os procedimentos ao PRESTAR e ao TOMAR serviços, detalhando as regras de retenção do regime escolhido pela empresa.
- SIMULAÇÕES EXIGIDAS:
  a) Prestação de serviço SEM ceder mão de obra vs CEDENDO mão de obra (aplicando a regra correta do Simples vs Presumido).
  b) Sócio único prestando serviço (empresa sem empregados), abordando os riscos previdenciários e a "Pejotização" (cite as ações suspensas no STF/ADPFs).

### 5. PROJEÇÃO DE CUSTO OPERACIONAL E PLANEJAMENTO TRIBUTÁRIO
A empresa selecionou uma tributação pretendida (ex: Simples Nacional). VOCÊ DEVE INICIAR A ANÁLISE BASEADA NELA.
🔎 ANÁLISE MATEMÁTICA OBRIGATÓRIA – ALÍQUOTA NOMINAL x EFETIVA
- Explique claramente que a alíquota nominal não é a aplicada. Demonstre o cálculo (Art. 18 da LC 123/2006).
- Apresente Simulação Anual Projetada e Simulação Mensal.
- Analise o Fator R (folha vs faturamento). Apresente o custo da folha e pró-labore.
⚠ PROVA DE VIABILIDADE (MUDANÇA DE REGIME): Após calcular o regime pretendido (ex: Simples), FAÇA UM COMPARATIVO MATEMÁTICO com o Lucro Presumido. SE o Lucro Presumido (ou outro regime) for financeiramente mais vantajoso, VOCÊ DEVE RECOMENDAR A MUDANÇA, ESPECIFICANDO, PONTUANDO E DEMONSTRANDO MATEMATICAMENTE A ECONOMIA GERADA.
- Estratégias de Otimização: Pró-labore estratégico, Distribuição de lucros isenta, Análise de contratos (Art. 15 da Lei 9.249/95).

### 6. PARAMETRIZAÇÃO TÉCNICA: PRODUTOS E SERVIÇOS
Gere a tabela OBRIGATÓRIA com os 5 produtos ou serviços principais baseados no CNAE da empresa, fornecendo os códigos exatos para o cliente cadastrar no sistema de vendas.
- TABELA COMÉRCIO: | Produto | CSOSN ICMS | CFOP | NCM | CEST | Origem | Classe IBS/CBS | cClassTrib (OBRIGATÓRIO) | CST PIS/COFINS (Evitar 01/02/49 no Simples) |
- TABELA SERVIÇO: | Serviço | Cód. Trib. Municipal | Cód. CNAE | Cód. Trib. Nacional (LC 116/03) | Natureza Operação | ISS Incidência | cClassTrib (OBRIGATÓRIO) |

### 7. LICENCIAMENTO ESPECIALIZADO (MUNICÍPIO/UF)
Analise Alvará de Funcionamento, AVCB/CLCB, Licenças (Urbanismo, Sanitária, Ambiental), Conselho de Classe, DPA, TLPL e IPTU.

### 8. EQUIPAMENTOS E COMPETÊNCIAS
Detalhe certificações obrigatórias, NRs aplicáveis, RDC (se houver), sistemas emissores e sistemas contábeis.

### 9. CUSTOS DE ABERTURA E FORMALIZAÇÃO
Estime financeiramente: Junta Comercial, Taxas Municipais, Certificado Digital, Honorários, Bombeiros e adequações estruturais.

### 10. ANÁLISE DE RISCOS (OPERACIONAL, TRABALHISTA E FISCAL)
Gere OBRIGATORIAMENTE a Matriz de Riscos em formato de Tabela:
| Risco Identificado | Base Legal | Grau de Probabilidade (Baixo/Médio/Alto) | Impacto Financeiro Estimado | Impacto Jurídico | Estratégia de Mitigação |
- A análise DEVE conter: Confusão patrimonial, Ausência de pró-labore, Falta de recolhimento de INSS, Mistura de contas PJ e PF.
- Erros a verificar e alertar: CNAE incompatível, falha no Fator R, uso de alíquota nominal errada, tratamento de monofásicos, ICMS-ST.

### 11. RECOMENDAÇÕES ESTRATÉGICAS
Apresente cenários alternativos de tributação, benefícios fiscais regionais cabíveis e simulações de valores reais de economia fiscal.

### 12. CONCLUSÃO TÉCNICA E RESPONSABILIDADE
- Dê o veredito final sobre o enquadramento ideal. Se a mudança de regime for indicada, reforce aqui.
- Inclua OBRIGATORIAMENTE a cláusula: "A definição do regime tributário deve ser precedida de análise contratual individualizada e simulação fiscal com base na estrutura real de custos da empresa."
- Liste no rodapé as tabelas de referência utilizadas (ex: Salário Mínimo vigente e Tabela INSS).`;

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

  // Desabilita pesquisa no Google se houver ferramentas nativas para evitar o Erro 400 da API do Gemini
  const enableGoogleSearch = localStorage.getItem('jota-gemini-search') === 'true';
  if (enableGoogleSearch && allFunctionTools.length === 0) {
    toolsArray.push({ googleSearch: {} });
    console.log("[Gemini] Pesquisa Nativa no Google ativada (Sem funções customizadas).");
  } else if (enableGoogleSearch) {
    console.warn("[Gemini] Pesquisa Nativa ignorada para evitar Erro 400. Function Calling tem prioridade.");
  }

  const initialBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userContent + "\n\n[INSTRUÇÃO INVISÍVEL]: Lembre-se de testar o CEP com suas tools de endereço antes de iniciar. VOCÊ DEVE RESPONDER COM UM RELATÓRIO LONGO, MÁXIMA PROFUNDIDADE E GERAR TODAS AS 12 SEÇÕES COMPLETAS." }] }],
    tools: toolsArray.length > 0 ? toolsArray : undefined,
    generationConfig: { 
      temperature: 0.1, // Temperatura baixa foca a IA na instrução rígida
      maxOutputTokens: 8192 // LIMIT MAXIMO - Garante que a IA não corte o relatório na metade!
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

  // Se a IA decidiu chamar uma ferramenta (ex: consultar o CEP ou o INSS)
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
        temperature: 0.1,
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