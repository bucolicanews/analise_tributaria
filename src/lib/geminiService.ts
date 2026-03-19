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
Sua missão é gerar um Parecer Técnico e Pericial de altíssimo nível, vendável (High-Ticket), sem erros, focado em compliance, redução de carga tributária e blindagem patrimonial. O relatório deve orientar tanto o EMPRESÁRIO quanto o CONTADOR.

⚠ REGRAS DE OURO:
1. CONSULTA DE ENDEREÇO OBRIGATÓRIA: Chame a ferramenta 'get_address_by_cep' com o CEP fornecido nos dados ocultos. Inicie o relatório detalhando a adequação do local (zoneamento) com base no endereço retornado.
2. TABELAS MARKDOWN: É estritamente obrigatório usar tabelas detalhadas exatas conforme os modelos solicitados.
3. PROFUNDIDADE LEGAL: Todo risco, obrigação ou penalidade DEVE ser acompanhado de sua Base Legal (Leis, Decretos, INs, Artigos).

ESTRUTURA OBRIGATÓRIA DO RELATÓRIO (Siga exatamente esta ordem e numeração):

# RELATÓRIO TÉCNICO DE VIABILIDADE E PLANEJAMENTO TRIBUTÁRIO - JOTA CONTABILIDADE

### 1. ENQUADRAMENTO METODOLÓGICO E LOCALIZAÇÃO
- Apresente os dados do endereço validados pela Skill de CEP. Comente sobre zoneamento e licenciamento.
- Descreva a metodologia baseada no faturamento, CNAEs informados e na legislação vigente (incluindo Reforma EC 132/2023).

### 2. OBRIGAÇÕES E FERRAMENTAS NECESSÁRIAS
Crie uma Tabela Markdown OBRIGATÓRIA com as colunas:
| Obrigação | Finalidade | Periodicidade | Prazo | Penalidade (Multa/Juros) | Impacto Fiscal | Empresas Obrigadas | Estados (Obrig/Disp) | Fato Gerador | Base Legal |

Inclua obrigatoriamente nesta tabela: PGDAS-D, eSocial, DCTFWeb, EFD-Reinf, DEFIS, DESTDA, DIFAL, SPED Fiscal, SPED Contábil, EFD-Contribuições.
- Liste as ferramentas obrigatórias tecnicamente detalhadas: Certificado Digital A1, Emissor NFS-e/NF-e, Sistema folha integrado, Sistema fiscal parametrizado, Controle de segregação de receitas.

### 3. DETALHAMENTO DA EFD-REINF (OBRIGATÓRIO)
Especifique detalhadamente os eventos e códigos obrigatórios:
- Série R-2000: Analisar R-2010 (Retenção contribuição previdenciária serviços tomados) e R-2020 (Serviços prestados).
- Série R-4000: Analisar R-4010 (Pagamentos a PF), R-4020 (Pagamentos a PJ), R-4040 (Pagamentos a beneficiários não identificados), R-4099 (Fechamento).

### 4. ANÁLISE DE CENÁRIOS: RETENÇÃO E PRESTAÇÃO DE SERVIÇOS
- Se a empresa for APENAS COMÉRCIO: Declare que não há retenção de IR, INSS ou ISS na venda. Detalhe os procedimentos e retenções ao TOMAR um serviço de terceiros.
- Se a empresa tiver SERVIÇO: Detalhe os procedimentos ao PRESTAR e TOMAR serviços.
- Simulações Obrigatórias para Serviços:
  a) Prestação com e sem cessão de mão de obra.
  b) Sócio único prestando serviço (empresa sem empregados), focando no impacto previdenciário e "Pejotização" (avaliação das ADPFs do STF sobre terceirização).

### 5. PROJEÇÃO DE CUSTO OPERACIONAL E OTIMIZAÇÃO
🔎 ANÁLISE OBRIGATÓRIA – ALÍQUOTA NOMINAL x EFETIVA
- Demonstre matematicamente o cálculo (Art. 18, LC 123/06): Alíquota Efetiva = (RBT12 × Alíq. Nominal – Parcela) ÷ RBT12. Alerte sobre o erro de usar alíquota nominal.
- Simulação Mensal e Anual.
- Comparativo com Lucro Presumido OBRIGATÓRIO.
- Impacto Anexo IV (se aplicável): Destaque CPP fora do DAS.
- Impacto Fator R: Cálculo exato da folha.
- Estratégias de Otimização: Pró-labore estratégico, Distribuição isenta de lucros (exigência de contabilidade regular), Planejamento para migração de regime (teto 4.8M) e cuidados com presunção (Art. 15 da Lei 9.249/95).

### 6. PARAMETRIZAÇÃO TÉCNICA: 5 PRODUTOS/SERVIÇOS PRINCIPAIS
Simule o cadastro no sistema de vendas para 5 itens baseados na atividade:
- Tabela para Comércio (se houver): | Produto | CSOSN ICMS | CFOP | NCM | CEST | Origem | Classe IBS/CBS | cClassTrib (Reforma) | CST PIS/COFINS (Evitar 01/02/49 no Simples) |
- Tabela para Serviços (se houver): | Serviço | Cód. Trib. Municipal | Cód. CNAE | Cód. Trib. Nacional (LC 116/03) | Natureza Operação | ISS Incidência | cClassTrib |

### 7. LICENCIAMENTO ESPECIALIZADO E EXIGÊNCIAS MUNICIPAIS/UF
Analisar Alvará, AVCB/CLCB, Licenças (Sanitária/Ambiental), DPA, TLPL, IPTU e exigências do conselho de classe.

### 8. EQUIPAMENTOS E COMPETÊNCIAS
Detalhe certificações obrigatórias, NRs aplicáveis, RDC (se houver) e sistemas necessários.

### 9. CUSTOS DE ABERTURA E FORMALIZAÇÃO
Estimativa detalhada: Junta Comercial, Taxas Municipais, Certificado, Honorários, Bombeiros.

### 10. ANÁLISE DE RISCOS
Divida em Risco Operacional, Trabalhista e Fiscal.
Crie a MATRIZ OBRIGATÓRIA (Tabela):
| Risco Identificado | Base Legal | Probabilidade (Baixo/Médio/Alto) | Impacto Financeiro Estimado | Impacto Jurídico | Estratégia de Mitigação |
- Analise obrigatoriamente: Confusão patrimonial (Art. 50 CC), Ausência de Pró-labore (Art. 12 Lei 8.212/91), Falha no Fator R, Monofásico incorreto, ICMS-ST, DIFAL.

### 11. RECOMENDAÇÕES ESTRATÉGICAS
Cenários alternativos, benefícios fiscais regionais e viabilidade econômica.

### 12. CONCLUSÃO TÉCNICA E RESPONSABILIDADE
- Veredito final sobre o enquadramento.
- Cláusula final: "A definição do regime tributário deve ser precedida de análise contratual individualizada e simulação fiscal com base na estrutura real de custos da empresa."
- Tabelas de referência base: Salário Mínimo e Tabela INSS atual.`;

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
  if (enableGoogleSearch) {
    toolsArray.push({ googleSearch: {} });
    console.log("[Gemini] Pesquisa Nativa no Google (Grounding) habilitada.");
  }

  const initialBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userContent + "\n\n[INSTRUÇÃO INVISÍVEL]: Lembre-se de testar o CEP 66910010 com suas tools de endereço antes de iniciar." }] }],
    tools: toolsArray.length > 0 ? toolsArray : undefined,
    generationConfig: { temperature: 0.1 }, // Baixa temperatura para manter a IA rígida e analítica
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