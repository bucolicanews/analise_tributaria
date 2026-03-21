// =====================================================
// INPUT BASE
// =====================================================
const input = $json?.body ?? {};

// =====================================================
// HELPERS (SEGURANÇA E FORMATOS)
// =====================================================

// Evita undefined/null
const safe = (value, fallback = "") =>
  value !== undefined && value !== null ? value : fallback;

// Número seguro
const num = (value, fallback = 0) => {
  const n = Number(value);
  return isNaN(n) ? fallback : n;
};

// Boolean seguro
const bool = (value) => {
  if (value === true || value === "true" || value === 1) return true;
  if (value === false || value === "false" || value === 0) return false;
  return false;
};

// JSON seguro (evita quebrar prompt)
const jsonSafe = (obj) => {
  try {
    return JSON.stringify(obj ?? {}, null, 0);
  } catch {
    return "{}";
  }
};

const percent = (value) => {
  const n = Number(value);
  if (isNaN(n)) return "0.00";
  return n.toFixed(2);
};

// =====================================================
// EXTRAÇÃO SEGURA
// =====================================================

const empresa = input.empresa ?? {};
const operacional = input.operacional ?? {};
const financeiro = input.financeiro ?? {};
const trabalhista = input.societario_trabalhista ?? {};
const riscos = input.conformidade_riscos ?? {};
const tabelas = input.tabelasReferencia ?? {};
const contexto = input.contexto ?? {};

// =====================================================
// FORMATAÇÕES
// =====================================================

// CNAEs formatados
const cnaes = (operacional.cnaes ?? [])
  .map(
    (c) =>
      `${safe(c.codigo_formatado)} - ${safe(c.descricao)} (${safe(c.tipo)})`
  )
  .join("\n");

// Financeiro
const segregacao = financeiro.faturamento?.segregacao ?? {};
const anexos = financeiro.faturamento?.anexo_simples_sugerido ?? {};
const fatorR = financeiro.fator_r ?? {};
const custos = financeiro.custos_operacionais ?? {};
const tributos = financeiro.tributos_locais ?? {};
const abertura = financeiro.custos_abertura ?? {};

// Trabalhista
const quadro = trabalhista.quadro_pessoal ?? {};
const prolabore = trabalhista.pro_labore ?? {};

// Riscos
const alertas = riscos.alertas_criticos ?? {};

// =====================================================
// PROMPT USER (ROBUSTO)
// =====================================================

const prompt_user = `
Realize a VALIDAÇÃO TÉCNICA dos dados abaixo.

⚠️ REGRAS:
- NÃO recalcular valores já fornecidos
- NÃO estimar dados
- Apenas VALIDAR coerência técnica

=========================
CONTEXTO
=========================
- Ano Base: ${safe(contexto.anoBase)}
- Objetivo: ${safe(contexto.objetivo)}

=========================
DADOS DA EMPRESA
=========================
- Razão Social: ${safe(empresa.razaoSocial)}
- Natureza Jurídica: ${safe(empresa.naturezaJuridica)}
- Classificação Fiscal: ${safe(empresa.classificacaoFiscal)}
- Capital Social: R$ ${num(empresa.capitalSocial)}
- Sócios: ${num(empresa.numSocios)}
- Localização: ${safe(empresa.localizacao?.municipio)} - ${safe(empresa.localizacao?.estado)}
- Tributação Pretendida: ${safe(empresa.tributacaoPretendida)}

=========================
ATIVIDADES (CNAE)
=========================
${cnaes}

- Descrição: ${safe(operacional.ideiaNegocio)}

=========================
FATURAMENTO
=========================
- Anual: ${num(financeiro.faturamento?.anual_total)}
- Mensal: ${num(financeiro.faturamento?.mensal_medio)}

=========================
SEGREGAÇÃO DE RECEITA
=========================
- Comércio: ${percent(segregacao.comercio_percent)}% (R$ ${num(segregacao.comercio_valor)})
- Serviço: ${percent(segregacao.servico_percent)}% (R$ ${num(segregacao.servico_valor)})
- Variáveis (%): ${percent(custos.variaveis_percentual)}%
- ISS: ${percent(tributos.iss_municipio)}%
- ICMS: ${percent(tributos.icms_estado)}%

=========================
ANEXOS SUGERIDOS (SISTEMA)
=========================
- Comércio: ${safe(anexos.comercio)}
- Serviço: ${safe(anexos.servico)}

=========================
APLICAÇÃO DO FATOR R
=========================
- Aplica-se somente sobre SERVIÇOS
- Percentual de serviço: ${num(segregacao.servico_percent)}%

=========================
FATOR R (PRÉ-CALCULADO)
=========================
⚠️ REGRA: considerar apenas últimos 12 meses

- Sujeito ao Fator R: ${bool(fatorR.sujeito_fator_r)}
- Folha 12 meses: ${num(fatorR.folha_12_meses)}
- Faturamento 12 meses: ${num(fatorR.faturamento_12_meses)}
- Percentual: ${percent(fatorR.percentual_atual ?? fatorR.percentual)}%
- Resultado: ${safe(fatorR.resultado)}
- Folha ideal estimada: ${num(fatorR.valor_ideal_folha_mensal)}

⚠️ NÃO recalcular Fator R
⚠️ VALIDAR coerência entre percentual do Fator R e resultado informado

=========================
FOLHA E PRÓ-LABORE
=========================
- Funcionários: ${num(quadro.num_funcionarios)}
- Folha mensal: ${num(quadro.folha_salarial_mensal)}

- Pró-labore declarado: ${bool(prolabore.declara_prolabore)}
- Valor declarado: ${num(prolabore.valor_declarado)}
- Valor estimado: ${num(prolabore.valor_estimado)}
- Recolhe INSS/IR: ${bool(prolabore.recolhe_inss_ir)}

- Retirada informal: ${bool(trabalhista.retira_valores_pf)}

=========================
CUSTOS OPERACIONAIS
=========================
- Fixos mensais: ${num(custos.fixos_mensais)}
- Variáveis (%): ${num(custos.variaveis_percentual)}

=========================
TRIBUTOS LOCAIS
=========================
- ISS: ${num(tributos.iss_municipio)}%
- ICMS: ${num(tributos.icms_estado)}%

=========================
CUSTOS DE ABERTURA
=========================
- Legalização: ${num(abertura.honorarios_legalizacao)}
- Assessoria mensal: ${num(abertura.assessoria_mensal)}
- Junta/Cartório: ${num(abertura.junta_cartorio)}
- Bombeiro: ${num(abertura.bombeiro_licencas)}

=========================
RISCOS IDENTIFICADOS (SISTEMA)
=========================
- Confusão patrimonial: ${bool(alertas.confusao_patrimonial)}
- Retirada informal: ${bool(alertas.retirada_informal)}
- Risco previdenciário: ${bool(alertas.risco_previdenciario)}

=========================
TABELAS DE REFERÊNCIA (USO OBRIGATÓRIO)
=========================
INSS: ${jsonSafe(tabelas.inss)}
IRPF: ${jsonSafe(tabelas.irpf)}
`;

// =====================================================
// PROMPT SYSTEM (REFINADO)
// =====================================================

const prompt_model = `
Você é um especialista tributário sênior.

Sua função é VALIDAR E JUSTIFICAR tecnicamente os dados, apontando inconsistências, riscos e coerência estrutural.

=========================
REGRAS
=========================
- NÃO recalcular valores fornecidos
- NÃO estimar dados
- NÃO gerar texto fora do JSON
- Priorizar SEMPRE os dados do input
- NÃO usar conhecimento externo para INSS/IRPF
- diagnostico_geral.nivel_risco deve refletir a observação de maior criticidade identificada
- - Sempre gerar observações relevantes
- Caso não haja inconsistências ou riscos relevantes, incluir ao menos 3 observações do tipo "oportunidade"
- Cada observação deve ser técnica, específica e baseada nos dados fornecidos
- NÃO gerar observações genéricas
- NÃO aceitar passivamente os riscos informados
- Identificar novos riscos com base nos dados
- Validar se os riscos informados fazem sentido
- Considerar que atividades do Anexo V possuem CPP fora do DAS
- Considerar que atividades do Anexo I possuem CPP dentro do DAS
- Validar se há mistura de regimes previdenciários (CPP dentro e fora do DAS)
- Marcar fator_r.coerente = true quando o percentual estiver compatível com o resultado informado (ex: abaixo de 28% → Anexo V)
- Marcar fator_r.coerente = false quando houver divergência entre percentual e resultado
- Os campos de cpp são mutuamente exclusivos:
  - Se misto = true → no_das = false e fora_das = false
  - Se no_das = true → fora_das = false e misto = false
  - Se fora_das = true → no_das = false e misto = false
- status deve ser apenas: "correto" ou "incorreto"
- tipo deve ser exatamente um dos valores:
  ["inconsistencia", "risco", "alerta", "oportunidade"]
- nivel_risco deve ser exatamente:
  ["baixo", "medio", "alto", "critico"]
- Sempre gerar observações relevantes
- Caso não haja inconsistências ou riscos relevantes, incluir ao menos 3 observações do tipo "oportunidade"
- diagnostico_geral.nivel_risco deve refletir a observação mais grave identificada

=========================
VALIDAÇÕES
=========================
1. CNAE x atividade
2. CNAE x anexo
3. Segregação de receita
4. Fator R (aplicabilidade + coerência)
5. CPP (dentro ou fora do DAS)
6. Impedimentos ao Simples Nacional
7. Riscos trabalhistas e fiscais
8. Validar se o enquadramento do anexo é compatível com a incidência de CPP
9. Validar coerência entre CNAEs, natureza da atividade e percentuais de segregação
10. Validar coerência entre folha, pró-labore e incidência de INSS
11. Validar coerência entre faturamento, segregação e CNAEs
12. Validar coerência entre retirada informal e ausência de pró-labore


=========================
SAÍDA (JSON)
=========================
{
  "cnae_valido": true,
  "anexos": [
  {
    "atividade": "",
    "anexo_correto": "",
    "status": "",
    "justificativa": ""
  }
  ],
  "segregacao": true,
  "fator_r": {
    "aplicavel": true,
  "percentual": 0,
  "resultado": "",
  "coerente": false
  },
  "cpp": {
   "no_das": false,
  "fora_das": false,
  "misto": false
  },
  "impedimentos": [],
  "observacoes": [
  {
    "tipo": "",
    "descricao": "",
    "impacto": ""
  }
  ],
  "diagnostico_geral": {
  "nivel_risco": "",
  "resumo": ""
}
}
`;

// =====================================================
// OUTPUT FINAL
// =====================================================

return [
  {
    json: {
      messages: [
        { role: "system", content: prompt_model.trim() },
        { role: "user", content: prompt_user.trim() }
      ]
    }
  }
];
