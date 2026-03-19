import { calculateSimplesNacionalEffectiveRate } from "../simplesNacional";
import { findCClassByNcm, checkIfNcmHasSelectiveTax } from "../tax/taxClassificationService";

export interface DynamicSkill {
  id: string;
  name: string;
  description: string;
  parameters: any; // JSON Schema
  executionType: 'local_js' | 'webhook';
  jsCode?: string;
  webhookUrl?: string;
  isActive: boolean;
}

/**
 * Skills nativas do sistema (Lógica de Execução)
 */
export const SYSTEM_SKILLS: Record<string, Function> = {
  get_address_by_cep: async (args: { cep: string | number }) => {
    // Garante que o CEP seja uma string e limpa caracteres
    const cleanCep = String(args.cep).replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      return { error: "CEP inválido. Deve conter 8 dígitos.", status: "erro" };
    }
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        return { error: "CEP não localizado na base dos Correios.", status: "erro" };
      }
      
      // Retorno direto e limpo para a IA
      return {
        logradouro: data.logradouro || "Não informado",
        bairro: data.bairro || "Não informado",
        cidade: data.localidade,
        uf: data.uf,
        cep_consultado: cleanCep,
        status: "sucesso"
      };
    } catch (e) {
      return { error: "Serviço de consulta de CEP temporariamente indisponível.", status: "erro" };
    }
  },
  calculate_simples_nacional: (args: { faturamento_12m: number; anexo: string }) => {
    const rate = calculateSimplesNacionalEffectiveRate(args.anexo, args.faturamento_12m);
    return { aliquota_efetiva: rate, status: "sucesso" };
  },
  get_ncm_technical_info: (args: { ncm: string }) => {
    const cleanNcm = String(args.ncm).replace(/\D/g, '');
    return {
      ncm: cleanNcm,
      incide_imposto_seletivo: checkIfNcmHasSelectiveTax(cleanNcm),
      classe_tributaria_reforma: findCClassByNcm(cleanNcm) || "Padrão",
      status: "sucesso"
    };
  },
  analyze_fator_r: (args: { folha_12m: number; faturamento_12m: number }) => {
    const ratio = args.faturamento_12m > 0 ? (args.folha_12m / args.faturamento_12m) : 0;
    return {
      percentual_fator_r: (ratio * 100).toFixed(2) + "%",
      resultado_enquadramento: ratio >= 0.28 ? "Anexo III" : "Anexo V",
      status: "sucesso"
    };
  },
  calculate_irpf_prolabore: (args: { valor_pro_labore: number }) => {
    const v = args.valor_pro_labore;
    let imposto = 0;
    let faixa = "Isento";
    let aliquota = 0;
    let deducao = 0;

    if (v <= 2428.80) {
      imposto = 0;
    } else if (v <= 2826.65) {
      aliquota = 7.5; deducao = 182.16; faixa = "7,5%";
    } else if (v <= 3751.05) {
      aliquota = 15.0; deducao = 394.16; faixa = "15%";
    } else if (v <= 4664.68) {
      aliquota = 22.5; deducao = 675.49; faixa = "22,5%";
    } else {
      aliquota = 27.5; deducao = 908.73; faixa = "27,5%";
    }

    if (aliquota > 0) {
      imposto = (v * (aliquota / 100)) - deducao;
    }

    return {
      valor_bruto: v,
      imposto_devido: Math.max(0, imposto),
      aliquota_aplicada: faixa,
      valor_liquido: v - Math.max(0, imposto),
      ano_base: "2026",
      status: "sucesso"
    };
  },
  calculate_lucro_presumido: (args: { faturamento_mensal: number; tipo_atividade: 'comercio' | 'servico' }) => {
    const presuncao = args.tipo_atividade === 'comercio' ? 0.08 : 0.32;
    const baseCalculo = args.faturamento_mensal * presuncao;
    
    const irpj = baseCalculo * 0.15;
    const csll = baseCalculo * 0.09;
    const pis = args.faturamento_mensal * 0.0065;
    const cofins = args.faturamento_mensal * 0.03;
    
    return {
      base_presuncao_percentual: (presuncao * 100) + "%",
      irpj_valor: irpj,
      csll_valor: csll,
      pis_valor: pis,
      cofins_valor: cofins,
      total_tributos_federais: irpj + csll + pis + cofins,
      aliquota_efetiva_federal: ((irpj + csll + pis + cofins) / args.faturamento_mensal) * 100,
      status: "sucesso"
    };
  }
};

/**
 * Manifesto de Ferramentas (O que a IA enxerga)
 */
export const JOTA_TOOLS_MANIFEST = [
  {
    name: "get_address_by_cep",
    description: "Consulta o endereço completo (bairro, logradouro, cidade) a partir de um CEP. Use sempre que o usuário fornecer um CEP.",
    parameters: {
      type: "object",
      properties: {
        cep: { type: "string", description: "O CEP com ou sem hífen" }
      },
      required: ["cep"]
    }
  },
  {
    name: "calculate_simples_nacional",
    description: "Calcula a alíquota efetiva exata do Simples Nacional (LC 123/2006).",
    parameters: {
      type: "object",
      properties: {
        faturamento_12m: { type: "number" },
        anexo: { type: "string", enum: ["Anexo I", "Anexo II", "Anexo III", "Anexo IV", "Anexo V"] }
      },
      required: ["faturamento_12m", "anexo"]
    }
  },
  {
    name: "get_ncm_technical_info",
    description: "Consulta regras de NCM e Imposto Seletivo. Use SEMPRE para validar os produtos da lista.",
    parameters: {
      type: "object",
      properties: { ncm: { type: "string" } },
      required: ["ncm"]
    }
  },
  {
    name: "analyze_fator_r",
    description: "Analisa o Fator R para empresas de serviço.",
    parameters: {
      type: "object",
      properties: {
        folha_12m: { type: "number" },
        faturamento_12m: { type: "number" }
      },
      required: ["folha_12m", "faturamento_12m"]
    }
  },
  {
    name: "calculate_irpf_prolabore",
    description: "Calcula o Imposto de Renda Pessoa Física (IRPF) sobre o valor do pró-labore mensal (Tabela 2026).",
    parameters: {
      type: "object",
      properties: {
        valor_pro_labore: { type: "number" }
      },
      required: ["valor_pro_labore"]
    }
  },
  {
    name: "calculate_lucro_presumido",
    description: "Calcula os impostos federais (IRPJ, CSLL, PIS, COFINS) no regime de Lucro Presumido.",
    parameters: {
      type: "object",
      properties: {
        faturamento_mensal: { type: "number" },
        tipo_atividade: { type: "string", enum: ["comercio", "servico"] }
      },
      required: ["faturamento_mensal", "tipo_atividade"]
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