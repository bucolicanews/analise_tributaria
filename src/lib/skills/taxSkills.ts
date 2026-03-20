import { calculateSimplesNacionalEffectiveRate } from "../simplesNacional";
import { findCClassByNcm, checkIfNcmHasSelectiveTax } from "../tax/taxClassificationService";

export interface DynamicSkill {
  id: string;
  name: string;
  description: string;
  parameters: any; 
  executionType: 'local_js' | 'webhook' | 'knowledge_base';
  jsCode?: string;
  webhookUrl?: string;
  knowledgeBaseText?: string;
  isActive: boolean;
}

/**
 * ENGINE TRIBUTÁRIA PROFISSIONAL - JOTA
 */
export const SYSTEM_SKILLS: Record<string, Function> = {
  // 1. CONSULTA DE ENDEREÇO
  get_address_by_cep: async (args: { cep: string | number }) => {
    const cleanCep = String(args.cep).replace(/\D/g, '');
    if (cleanCep.length !== 8) return { error: "CEP inválido", status: "erro" };
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (data.erro) return { error: "CEP não localizado", status: "erro" };
      return { ...data, status: "sucesso" };
    } catch (e) {
      return { error: "Falha no serviço de CEP", status: "erro" };
    }
  },

  // 2. COMPARADOR DE REGIMES (ENGINE PROFISSIONAL)
  compare_tax_regimes: (args: { 
    faturamento_mensal: number; 
    faturamento_12m: number; 
    tipo_atividade: 'comercio' | 'servico';
    folha_12m: number;
    icms_percentual?: number;
    iss_percentual?: number;
  }) => {
    // A. Fator R
    const r = args.faturamento_12m > 0 ? (args.folha_12m / args.faturamento_12m) : 0;
    const anexoServico = r >= 0.28 ? "Anexo III" : "Anexo V";
    const anexoFinal = args.tipo_atividade === 'comercio' ? "Anexo I" : anexoServico;

    // B. Simples Nacional (Usando tabelas reais do sistema)
    const efetivaSimples = calculateSimplesNacionalEffectiveRate(anexoFinal, args.faturamento_12m);
    const impostoSimples = args.faturamento_mensal * (efetivaSimples / 100);

    // C. Lucro Presumido (Completo)
    const presuncao = args.tipo_atividade === 'comercio' ? 0.08 : 0.32;
    const basePresumido = args.faturamento_mensal * presuncao;
    
    const irpjBase = basePresumido * 0.15;
    const adicionalIrpj = basePresumido > 20000 ? (basePresumido - 20000) * 0.10 : 0;
    const csll = basePresumido * 0.09;
    const pis = args.faturamento_mensal * 0.0065;
    const cofins = args.faturamento_mensal * 0.03;
    
    const icms = args.tipo_atividade === 'comercio' ? args.faturamento_mensal * (args.icms_percentual || 0.18) : 0;
    const iss = args.tipo_atividade === 'servico' ? args.faturamento_mensal * (args.iss_percentual || 0.05) : 0;
    
    const totalPresumido = irpjBase + adicionalIrpj + csll + pis + cofins + icms + iss;

    return {
      fator_r: {
        valor: (r * 100).toFixed(2) + "%",
        anexo_aplicado: anexoFinal
      },
      simples: {
        aliquota_efetiva: efetivaSimples.toFixed(2) + "%",
        imposto_mensal: impostoSimples
      },
      presumido: {
        detalhe: {
          irpj_base: irpjBase,
          adicional_10: adicionalIrpj,
          csll, pis, cofins, icms, iss
        },
        imposto_mensal: totalPresumido,
        aliquota_efetiva: ((totalPresumido / args.faturamento_mensal) * 100).toFixed(2) + "%"
      },
      veredito: {
        melhor_regime: impostoSimples < totalPresumido ? "Simples Nacional" : "Lucro Presumido",
        economia_mensal: Math.abs(impostoSimples - totalPresumido)
      },
      status: "sucesso"
    };
  },

  // 3. CÁLCULO DE PRÓ-LABORE (CORRIGIDO)
  calculate_pro_labore_net: (args: { valor_bruto: number }) => {
    const inss = args.valor_bruto * 0.11;
    const baseIR = args.valor_bruto - inss;
    
    let aliquota = 0;
    let deducao = 0;

    // Tabela 2026
    if (baseIR <= 2428.80) {
      aliquota = 0;
    } else if (baseIR <= 2826.65) {
      aliquota = 0.075; deducao = 182.16;
    } else if (baseIR <= 3751.05) {
      aliquota = 0.15; deducao = 394.16;
    } else if (baseIR <= 4664.68) {
      aliquota = 0.225; deducao = 675.49;
    } else {
      aliquota = 0.275; deducao = 908.73;
    }

    const ir = (baseIR * aliquota) - deducao;
    const valorIR = Math.max(0, ir);

    return {
      bruto: args.valor_bruto,
      desconto_inss_11: inss,
      base_calculo_ir: baseIR,
      imposto_renda: valorIR,
      valor_liquido: args.valor_bruto - inss - valorIR,
      status: "sucesso"
    };
  },

  // 4. INFO TÉCNICA NCM
  get_ncm_technical_info: (args: { ncm: string }) => {
    const cleanNcm = String(args.ncm).replace(/\D/g, '');
    return {
      ncm: cleanNcm,
      incide_imposto_seletivo: checkIfNcmHasSelectiveTax(cleanNcm),
      classe_tributaria_reforma: findCClassByNcm(cleanNcm) || "Padrão",
      status: "sucesso"
    };
  }
};

/**
 * MANIFESTO DE FERRAMENTAS (O QUE A IA ENXERGA)
 */
export const JOTA_TOOLS_MANIFEST = [
  {
    name: "get_address_by_cep",
    description: "Consulta endereço completo via CEP.",
    parameters: {
      type: "object",
      properties: { cep: { type: "string" } },
      required: ["cep"]
    }
  },
  {
    name: "compare_tax_regimes",
    description: "Realiza o comparativo matemático real entre Simples Nacional e Lucro Presumido, incluindo ICMS, ISS e Adicional de IRPJ. Use sempre que precisar decidir o melhor regime.",
    parameters: {
      type: "object",
      properties: {
        faturamento_mensal: { type: "number" },
        faturamento_12m: { type: "number" },
        tipo_atividade: { type: "string", enum: ["comercio", "servico"] },
        folha_12m: { type: "number" },
        icms_percentual: { type: "number", description: "Alíquota de ICMS (ex: 0.18 para 18%)" },
        iss_percentual: { type: "number", description: "Alíquota de ISS (ex: 0.05 para 5%)" }
      },
      required: ["faturamento_mensal", "faturamento_12m", "tipo_atividade", "folha_12m"]
    }
  },
  {
    name: "calculate_pro_labore_net",
    description: "Calcula o valor líquido do pró-labore, descontando 11% de INSS e aplicando a tabela de IRPF 2026.",
    parameters: {
      type: "object",
      properties: {
        valor_bruto: { type: "number" }
      },
      required: ["valor_bruto"]
    }
  },
  {
    name: "get_ncm_technical_info",
    description: "Consulta regras de NCM e Imposto Seletivo.",
    parameters: {
      type: "object",
      properties: { ncm: { type: "string" } },
      required: ["ncm"]
    }
  }
];

export const loadDynamicSkills = (): DynamicSkill[] => {
  const saved = localStorage.getItem('jota-dynamic-skills');
  return saved ? JSON.parse(saved) : [];
};

export const saveDynamicSkills = (skills: DynamicSkill[]) => {
  localStorage.setItem('jota-dynamic-skills', JSON.stringify(skills));
};

export async function executeSkill(name: string, args: any): Promise<any> {
  if (SYSTEM_SKILLS[name]) {
    return await SYSTEM_SKILLS[name](args);
  }

  const dynamicSkills = loadDynamicSkills();
  const skill = dynamicSkills.find(s => s.name === name);

  if (!skill || !skill.isActive) {
    return { error: `Skill '${name}' não encontrada ou inativa.` };
  }
  
  if (skill.executionType === 'knowledge_base') {
    return { status: "sucesso", conteudo_recuperado: skill.knowledgeBaseText || "" };
  }

  if (skill.executionType === 'webhook' && skill.webhookUrl) {
    try {
      const res = await fetch(skill.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      });
      return await res.json();
    } catch (e: any) {
      return { error: `Falha no Webhook: ${e.message}` };
    }
  }

  if (skill.executionType === 'local_js' && skill.jsCode) {
    try {
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction('args', skill.jsCode);
      return await fn(args);
    } catch (e: any) {
      return { error: `Erro no JS da Skill: ${e.message}` };
    }
  }

  return { error: "Configuração de execução inválida." };
}