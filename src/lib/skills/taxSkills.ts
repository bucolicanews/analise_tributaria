import { calculateSimplesNacionalEffectiveRate } from "../simplesNacional";
import { findCClassByNcm, checkIfNcmHasSelectiveTax } from "../tax/taxClassificationService";

/**
 * Esta biblioteca contém as "Skills" (Habilidades) que a IA pode "chamar"
 * para garantir precisão de 100% nos relatórios.
 */

export const JOTA_SKILLS = {
  /**
   * Skill: Cálculo exato de Simples Nacional
   */
  calculate_simples_nacional: (args: { faturamento_12m: number; anexo: string }) => {
    try {
      const rate = calculateSimplesNacionalEffectiveRate(args.anexo, args.faturamento_12m);
      return {
        aliquota_efetiva: rate,
        formula_aplicada: "((RBT12 * AliqNominal) - ParcelaDeduzir) / RBT12",
        status: "sucesso"
      };
    } catch (e) {
      return { status: "erro", mensagem: "Falha ao calcular alíquota." };
    }
  },

  /**
   * Skill: Consulta técnica de NCM
   */
  get_ncm_technical_info: (args: { ncm: string }) => {
    const cleanNcm = args.ncm.replace(/\D/g, '');
    const hasSelective = checkIfNcmHasSelectiveTax(cleanNcm);
    const cClass = findCClassByNcm(cleanNcm);
    
    return {
      ncm: cleanNcm,
      incide_imposto_seletivo: hasSelective,
      classe_tributaria_reforma: cClass || "Não encontrada (usar padrão)",
      status: "sucesso"
    };
  },

  /**
   * Skill: Análise de Fator R
   */
  analyze_fator_r: (args: { folha_12m: number; faturamento_12m: number }) => {
    const ratio = args.faturamento_12m > 0 ? (args.folha_12m / args.faturamento_12m) : 0;
    const percent = ratio * 100;
    const enquadramento = percent >= 28 ? "Anexo III (Vantajoso)" : "Anexo V (Carga Elevada)";
    
    return {
      percentual_fator_r: percent.toFixed(2) + "%",
      resultado_enquadramento: enquadramento,
      precisa_aumentar_prolabore: percent < 28,
      valor_ideal_folha_mensal: (args.faturamento_12m * 0.28) / 12,
      status: "sucesso"
    };
  },

  /**
   * Skill: Data Atual (para relatórios)
   */
  get_current_date_info: () => {
    const now = new Date();
    return {
      data_extenso: now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
      ano_base: now.getFullYear(),
      status: "sucesso"
    };
  }
};

// Definição dos manifestos (o que a IA "lê" para saber como usar a skill)
export const JOTA_TOOLS_MANIFEST = [
  {
    name: "calculate_simples_nacional",
    description: "Calcula a alíquota efetiva exata do Simples Nacional com base na Lei Complementar 123/2006. Use sempre que precisar de valores de impostos do Simples.",
    parameters: {
      type: "object",
      properties: {
        faturamento_12m: { type: "number", description: "Faturamento bruto acumulado dos últimos 12 meses (RBT12)" },
        anexo: { type: "string", enum: ["Anexo I", "Anexo II", "Anexo III", "Anexo IV", "Anexo V"], description: "O anexo do Simples Nacional" }
      },
      required: ["faturamento_12m", "anexo"]
    }
  },
  {
    name: "get_ncm_technical_info",
    description: "Consulta regras técnicas de um NCM, incluindo incidência de Imposto Seletivo e classificação na Reforma Tributária (IBS/CBS).",
    parameters: {
      type: "object",
      properties: {
        ncm: { type: "string", description: "O código NCM do produto (8 dígitos)" }
      },
      required: ["ncm"]
    }
  },
  {
    name: "analyze_fator_r",
    description: "Realiza a análise técnica do Fator R para empresas de serviços, definindo se tributam pelo Anexo III ou V.",
    parameters: {
      type: "object",
      properties: {
        folha_12m: { type: "number", description: "Soma da folha de pagamento + pró-labore dos últimos 12 meses" },
        faturamento_12m: { type: "number", description: "Faturamento bruto acumulado dos últimos 12 meses" }
      },
      required: ["folha_12m", "faturamento_12m"]
    }
  },
  {
    name: "get_current_date_info",
    description: "Retorna a data atual e informações de calendário para contextualizar o relatório.",
    parameters: { type: "object", properties: {} }
  }
];