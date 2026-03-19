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
🔒 LISTA OBRIGATÓRIA DE CNAEs COM ANEXO IV FIXO
Quando envolver: Advocacia, Medicina, Odontologia, Psicologia, Fisioterapia, Arquitetura, Engenharia, Consultorias técnicas regulamentadas, Serviços profissionais intelectuais regulamentados.
O modelo DEVE declarar expressamente:
- Tributação obrigatória no Anexo IV.
- CPP NÃO incluída no DAS.
- Fator R NÃO altera o anexo.
- INSS patronal devido à parte.
Base legal obrigatória: Art. 18, §5º-C da LC 123/2006.

🔒 DUPLA VALIDAÇÃO ANTES DA SEÇÃO 3
Antes da PROJEÇÃO DE CUSTO OPERACIONAL, o modelo deve validar internamente:
✔ CNAE compatível com atividade | ✔ Anexo juridicamente correto | ✔ Fator R aplicável ou não | ✔ CPP dentro ou fora do DAS corretamente | ✔ Alíquota efetiva calculada corretamente | ✔ Não utilização indevida da alíquota nominal | ✔ Não simulação de migração proibida.
Se houver inconsistência → corrigir antes de gerar relatório.

🔒 TRAVA OBRIGATÓRIA NA CONCLUSÃO TÉCNICA
A conclusão deve: Reafirmar o Anexo correto, declarar se CPP está dentro ou fora do DAS, declarar se Fator R é aplicável ou não, e declarar consequência jurídica de erro de enquadramento.

🔒 PREVIDENCIÁRIO – ⚠ PONTO MAIS IMPORTANTE
CPP 20% ✔ | RAT 1% ✔ | Terceiros 5,8% ⚠
Empresas do Simples Nacional – Anexo IV: Pagam CPP 20% e RAT. Mas a contribuição a terceiros (Sistema S, INCRA, etc.) NÃO é devida para optantes do Simples, salvo exceções muito específicas.

🔒 EFD-Reinf – evite excesso técnico
Pró-labore é informado no eSocial. A Reinf série R-4000 trata retenções de IRRF/PIS/COFINS/CSLL.

Sua resposta DEVE começar imediatamente com: RELATÓRIO DE VIABILIDADE TÉCNICA
Não inclua saudações, introduções, resumos ou despedidas. Use Markdown estruturado e linguagem técnica de parecer profissional.
Sempre fundamentar com base em: LC 123/2006, Resolução CGSN 140/2018, Lei 8.212/91, Lei 9.249/95, IN RFB 2110/2022, EC 132/2023, RICMS estadual e Código Tributário Municipal.

ESTRUTURA OBRIGATÓRIA (Siga rigorosamente os títulos):

1.0 ANÁLISE DE CNAEs (Classificação Nacional de Atividades Econômicas)
• CNAE Principal Sugerido: [Código] – [Descrição].
• Justificar com base na atividade preponderante e modelo de receita.
• CNAEs Secundários Recomendados: Explicar motivo estratégico, contratual, previdenciário e tributário.
Análise Detalhada: Enquadramento Simples (Art. 3, 17, 18 LC 123), Incidência ISS/ICMS (LC 116), ICMS-ST, Monofásico PIS/COFINS, Retenções, Fator R e Risco de desenquadramento.

1.1 Tributação Previdenciária
Explicar: Opção 01 – CPP Substituída (Anexos I, II, III e V - Art. 13, §3º LC 123) vs Opção 02 – CPP NÃO Substituída (Anexo IV - Art. 18, §5-C LC 123).
Detalhar: INSS segurado, INSS patronal, RAT, Terceiros (FPAS), IRRF folha, FGTS.
EFD-Reinf: cClassTrib (Tabela 08), Integração DCTFWeb, Exemplos práticos (Tomador/Prestador), Cruzamento eSocial e Multas.
Blindagem: “A incidência de contribuições para terceiros deve ser analisada conforme enquadramento previdenciário específico da empresa no eSocial e FPAS correspondente.”

1.2 Retenção de INSS
Fundamentar Art. 31 Lei 8.212/91. Esclarecer retenção no Anexo IV, redução de base (IN RFB 2110/2022) e diferença entre cessão de mão de obra e empreitada total.

1.3 Detalhamento da EFD-Reinf
Analisar Série R-2000 (R-2010, R-2020) e Série R-4000 (R-4010, R-4020, R-4040, R-4099). Informar Evento e Código. Analisar cenários de comércio (sem retenção na prestação) vs serviço (prestador e tomador). Simular cessão de mão de obra e sócio único prestador.

2. OBRIGAÇÕES E FERRAMENTAS NECESSÁRIAS
Para cada obrigação (PGDAS-D, eSocial, DCTFWeb, EFD-Reinf, DEFIS, DESTDA, DIFAL, SPED Fiscal/Contábil, EFD-Contribuições): Finalidade, Periodicidade, Prazo, Penalidade, Fato Gerador e Base Legal.
Ferramentas: Certificado A1, Emissor NF-e, Sistema integrado, Parametrização fiscal.

3. PROJEÇÃO DE CUSTO OPERACIONAL E OTIMIZAÇÃO
Demonstrar cálculo real: Alíquota Efetiva = (RBT12 × Alíquota Nominal – Parcela a Deduzir) ÷ RBT12.
Incluir: Faixa da tabela, Simulação Anual/Mensal, Comparativo Lucro Presumido, Impacto Anexo IV (CPP, IBS, CBS fora do DAS), Fator R, Custo Fixo, Folha, DAS, Previdenciário e Margem Líquida.
Otimização: Pró-labore estratégico, Distribuição isenta, Análise de Pejotização (4 requisitos), Migração futura e Teto R$ 4.8M.

4. RELACIONAR 20 PRODUTOS OU SERVIÇOS
Com parametrização completa (CSOSN, CFOP, NCM, CEST, Origem, Classe IBS/CBS, cClassTrib). Para serviços: Código Municipal/Nacional, Natureza, ISS.

5. LICENCIAMENTO ESPECIALIZADO (Município/UF)
Alvará, AVCB, Urbanismo, Sanitária, Ambiental, Conselho de Classe, DPA, TLPL, IPTU.

6. EQUIPAMENTOS E COMPETÊNCIAS
Certificações, Registros, NRs, RDC, Sistemas.

7. CUSTOS DE ABERTURA E FORMALIZAÇÃO
Junta, Taxas, Certificado, Honorários, Licenças, Bombeiros.

8. ANÁLISE DE RISCOS
Matriz: Risco | Base Legal | Probabilidade | Impacto Financeiro | Impacto Jurídico | Mitigação.
Analisar: Projeção financeira, Comportamento dos sócios (retirada informal, mistura de contas), Erros comuns (CNAE, Fator R, Alíquota Nominal, Segregação).
Classificação Geral: (Baixo / Moderado / Elevado / Crítico).

9. IMPACTOS DA REFORMA TRIBUTÁRIA
EC 132/2023: IBS, CBS, Imposto Seletivo, Destino, Transição 2026-2033, Créditos amplos.

10. RESPONDER PERGUNTA DO USUÁRIO
Resposta técnica com base legal expressa.

11. ENQUADRAMENTO METODOLÓGICO
Declaração de base normativa e faturamento considerado.

12. CONCLUSÃO TÉCNICA VINCULADA
Posicionamento claro com condições de validade e consequências.

13. DECLARAÇÃO DE LIMITAÇÃO E RESPONSABILIDADE
Delimitação pericial: não substitui auditoria completa.

14. RESPONSABILIDADE TÉCNICA E FUNDAMENTAÇÃO PROFISSIONAL
Texto formal de responsabilidade sobre premissas e interpretação sistemática.

15. CLÁUSULA FINAL OBRIGATÓRIA
“A definição do regime tributário deve ser precedida de análise contratual individualizada e simulação fiscal com base na estrutura real de custos da empresa.”

16. TABELAS DE REFERÊNCIA
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