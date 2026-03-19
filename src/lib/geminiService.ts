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
Sua missão é gerar um Parecer Técnico e Pericial de altíssimo nível, vendável (High-Ticket), sem erros, focado em compliance, redução de carga tributária e blindagem patrimonial. 
O relatório deve orientar tanto o EMPRESÁRIO (decisões estratégicas) quanto o CONTADOR (parametrização técnica de ERP).

⚠ REGRAS DE OURO:
1. CONSULTA DE ENDEREÇO OBRIGATÓRIA: Chame a ferramenta 'get_address_by_cep' com o CEP fornecido nos dados ocultos. Inicie o relatório detalhando a adequação do local.
2. TABELAS MARKDOWN: É estritamente obrigatório usar tabelas detalhadas exatas conforme os modelos solicitados.
3. PROFUNDIDADE LEGAL: Todo risco, obrigação ou penalidade DEVE ser acompanhado de sua Base Legal (Leis, Decretos, INs, Artigos).

ESTRUTURA OBRIGATÓRIA DO RELATÓRIO (Siga exatamente esta ordem e numeração):

# RELATÓRIO TÉCNICO DE VIABILIDADE E PLANEJAMENTO TRIBUTÁRIO - JOTA CONTABILIDADE

### 1. ENQUADRAMENTO METODOLÓGICO E LOCALIZAÇÃO
- Apresente os dados do endereço validados pela Skill de CEP. Comente sobre zoneamento e licenciamento.
- Descreva a metodologia baseada no faturamento, CNAEs informados e na legislação vigente.

### 2. OBRIGAÇÕES E FERRAMENTAS NECESSÁRIAS
Você DEVE gerar uma tabela com EXATAMENTE as seguintes colunas:
| Obrigação | Finalidade | Periodicidade | Prazo | Penalidade | Impacto Fiscal | Empresas Obrigadas | Estados Obrigados/Dispensados | Fato Gerador | Base Legal |

Inclua OBRIGATORIAMENTE nesta tabela as seguintes obrigações:
- PGDAS-D
- eSocial
- DCTFWeb
- EFD-Reinf
- DEFIS
- DESTDA (Analisar obrigatoriedade conforme legislação estadual vigente, considerando possíveis dispensas e substituição)
- DIFAL
- SPED Fiscal
- SPED Contábil
- EFD-Contribuições

Ferramentas Obrigatórias (Detalhe tecnicamente cada uma):
- Certificado Digital A1
- Emissor NFS-e ou NF-e
- Sistema folha integrado
- Sistema fiscal parametrizado (NCM, CFOP, CST, CSOSN)
- Controle de segregação de receitas

### 3. DETALHAMENTO DA EFD-REINF
Analisar e detalhar obrigatoriamente os seguintes eventos e seus códigos:
- Série R-2000:
  - R-2010 (Retenção contribuição previdenciária serviços tomados)
  - R-2020 (Serviços prestados)
- Série R-4000:
  - R-4010 (Pagamentos a beneficiários PF)
  - R-4020 (Pagamentos a beneficiários PJ)
  - R-4040 (Pagamentos a beneficiários não identificados)
  - R-4099 (Fechamento)
Obrigatório informar Evento e Código para cada situação aplicável à empresa.

### 4. ANÁLISE DE CENÁRIOS: RETENÇÃO E PRESTAÇÃO DE SERVIÇOS
- SE A EMPRESA NÃO TIVER CNAE DE SERVIÇO (Apenas Comércio): Informe claramente que não terão retenção de IR, INSS ou ISS na venda. Informe apenas quais procedimentos ao tomar um serviço de terceiros.
- SE A EMPRESA FOR DE SERVIÇO: Realizar uma análise mostrando os procedimentos ao TOMAR o serviço e ao PRESTAR o serviço.
- SIMULE OS SEGUINTES CENÁRIOS PARA PRESTADORES DE SERVIÇO:
  a) A prestação de serviço SEM ceder mão de obra vs CEDENDO mão de obra.
  b) O sócio prestando serviço ele mesmo, sendo a empresa sem empregados (sócio único). Foque no impacto previdenciário e nos riscos.

### 5. PROJEÇÃO DE CUSTO OPERACIONAL E OTIMIZAÇÃO
🔎 ANÁLISE OBRIGATÓRIA – ALÍQUOTA NOMINAL x EFETIVA
EXPLICAÇÃO CLARA: A alíquota nominal NÃO é a alíquota real aplicada.
Demonstrar o cálculo conforme art. 18 da LC 123/2006: Alíquota Efetiva = (RBT12 × Alíquota Nominal – Parcela a Deduzir) ÷ RBT12.
Obrigatório incluir:
- Identificar faixa da tabela.
- Demonstrar cálculo matemático real (Obrigatório).
- Simulação anual projetada e Simulação Mensal.
- Comparativo com Lucro Presumido (Obrigatório).
- Impacto Anexo IV (CPP fora do DAS).
- Impacto Anexo IV (IBS e CBS fora do DAS - Reforma Tributária).
- Impacto do Fator R (Avaliar início de atividade e RBT proporcional).
- Custo Fixo Mensal, Simulação do DAS, Custo total da folha, Custo operacional mínimo estimado, Margem líquida estimada.

Estratégias de Otimização (Desenvolver cada uma):
- Pró-labore estratégico para Fator R.
- Distribuição de lucros isenta (condicionada à escrituração contábil regular).
- Análise técnica de Pejotização (4 requisitos do vínculo: subordinação, habitualidade, pessoalidade, onerosidade. Leve em consideração que estão todas as ações suspensas no STF, verifique essa informação).
- Planejamento tributário preventivo.
- Avaliação de migração futura para Lucro Presumido.
- Avaliação do teto de R$ 4.800.000.
- Avaliar contratos para evitar presunção incorreta (ex: 8%/12% só em empreitada total com material – art. 15 da Lei 9.249/95).

### 6. PARAMETRIZAÇÃO TÉCNICA: RELACIONAR ATÉ 20 PRODUTOS OU SERVIÇOS
Gere uma tabela com até 20 produtos/serviços principais baseados na atividade da empresa.
- SE COMÉRCIO (Colunas Obrigatórias): | Produto | CSOSN ICMS | CFOP | NCM | CEST (se houver) | Origem | Classe IBS/CBS | cClassTrib (OBRIGATÓRIO) | CST PIS/COFINS |
  (Aviso: Parametrizar sistema conforme regime do Simples, evitando uso indevido de CST 01/02/49 típicos do Lucro Presumido).
- SE SERVIÇO (Colunas Obrigatórias): | Serviço | Cód. Trib. Municipal | Cód. CNAE | Cód. Trib. Nacional (LC 116/03) | Natureza Operação | ISS Incidência | cClassTrib (OBRIGATÓRIO) |
  (Aviso: Serviço NÃO utiliza NCM, CEST ou CSOSN ICMS, salvo comunicação/transporte).

### 7. LICENCIAMENTO ESPECIALIZADO (MUNICÍPIO/UF)
Analisar exigências conforme grau de risco da atividade: Alvará de Funcionamento, AVCB/CLCB, Licença de Urbanismo, Licença Sanitária, Licença Ambiental, Conselho de Classe, DPA, Licença de Localização, TLPL, IPTU.

### 8. EQUIPAMENTOS E COMPETÊNCIAS
Detalhar exigências técnicas e regulatórias: Certificações obrigatórias, Registros profissionais, NRs aplicáveis, RDC (quando aplicável), Sistema de Emissão de Nota Fiscal, Sistema Contabilidade.

### 9. CUSTOS DE ABERTURA E FORMALIZAÇÃO
Estimativa detalhada com margem regional: Junta Comercial, Taxas Municipais, Certificado Digital, Honorários contábeis, Licenças, Projeto Bombeiros, Adequações estruturais.

### 10. ANÁLISE DE RISCOS (OPERACIONAL, TRABALHISTA E FISCAL)
MATRIZ OBRIGATÓRIA: Gere a tabela exata abaixo:
| Risco Identificado | Base Legal | Grau de Probabilidade (Baixo/Médio/Alto) | Impacto Financeiro Estimado | Impacto Jurídico | Estratégia de Mitigação |
- A probabilidade deve ser justificada. O impacto financeiro deve indicar a natureza (Multa percentual, Juros SELIC, Arbitramento de receita, Retroatividade de INSS, Exclusão do Simples, Desconsideração da PJ).

INFORMAÇÕES QUE DEVEM SER ANALISADAS OBRIGATORIAMENTE:
- Projeção Financeira: Viabilidade econômica, Pressão de margem, Risco de subcapitalização.
- Comportamento Financeiro dos Sócios: Retirada informal de valores, Ausência de pró-labore declarado, Ausência de recolhimento de INSS, Mistura de conta PJ e PF, Recebimento em conta PF, Pagamento de despesas pessoais pela conta da empresa.
- Fundamentar com: Art. 12 e 30 da Lei 8.212/91; Art. 42 da Lei 9.430/96; Art. 50 do Código Civil; Art. 18 da LC 123/2006; Art. 31 da Lei 8.212/91.

ERROS COMUNS QUE DEVEM SER VERIFICADOS (A IA deve alertar mesmo que o usuário não pergunte):
- CNAE incompatível com atividade.
- Falha no Fator R.
- Uso da alíquota nominal.
- Falta de segregação de receitas.
- Monofásico tratado incorretamente.
- ICMS-ST não destacado.
- DIFAL não recolhido.
- Ausência de controle contábil formal.
(Se faltar dado, escreva: "Não é possível mensurar o risco específico sem a informação X.")

### 11. RECOMENDAÇÕES ESTRATÉGICAS
Cenários alternativos de tributação, benefícios fiscais regionais. Simulações de valores reais de economia fiscal.

### 12. CONCLUSÃO TÉCNICA E RESPONSABILIDADE
- Veredito final.
- Cláusula final OBRIGATÓRIA: "A definição do regime tributário deve ser precedida de análise contratual individualizada e simulação fiscal com base na estrutura real de custos da empresa."
- Informar no final as tabelas de referência utilizadas (Salário Mínimo e Tabela INSS atual do ano base).`;

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

  // A API do Gemini retorna Erro 400 (INVALID_ARGUMENT) se enviarmos googleSearch e functionDeclarations na mesma requisição.
  // Como as nossas funções nativas (CEP, Fator R, etc.) são vitais, nós ignoramos a pesquisa do Google se tivermos functions.
  const enableGoogleSearch = localStorage.getItem('jota-gemini-search') === 'true';
  if (enableGoogleSearch && allFunctionTools.length === 0) {
    toolsArray.push({ googleSearch: {} });
    console.log("[Gemini] Pesquisa Nativa no Google ativada (Sem funções customizadas).");
  } else if (enableGoogleSearch) {
    console.warn("[Gemini] Pesquisa Nativa ignorada para evitar Erro 400. Function Calling tem prioridade.");
  }

  const initialBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userContent + "\n\n[INSTRUÇÃO INVISÍVEL]: Lembre-se de testar o CEP 66910010 com suas tools de endereço antes de iniciar." }] }],
    tools: toolsArray.length > 0 ? toolsArray : undefined,
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
    throw new Error(`Erro API: ${response.status} - ${errText}`);
  }

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
      ]
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