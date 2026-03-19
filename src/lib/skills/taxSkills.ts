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
 * Skills nativas do sistema (Hardcoded para performance e segurança)
 */
export const SYSTEM_SKILLS: Record<string, Function> = {
  calculate_simples_nacional: (args: { faturamento_12m: number; anexo: string }) => {
    const rate = calculateSimplesNacionalEffectiveRate(args.anexo, args.faturamento_12m);
    return { aliquota_efetiva: rate, status: "sucesso" };
  },
  get_ncm_technical_info: (args: { ncm: string }) => {
    const cleanNcm = args.ncm.replace(/\D/g, '');
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
  }
};

/**
 * Manifesto de ferramentas para a IA (Padronizado como JOTA_TOOLS_MANIFEST)
 */
export const JOTA_TOOLS_MANIFEST = [
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
    description: "Consulta regras de NCM e Imposto Seletivo.",
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
  }
];

/**
 * Gerenciador de Armazenamento de Skills
 */
export const loadDynamicSkills = (): DynamicSkill[] => {
  const saved = localStorage.getItem('jota-dynamic-skills');
  return saved ? JSON.parse(saved) : [];
};

export const saveDynamicSkills = (skills: DynamicSkill[]) => {
  localStorage.setItem('jota-dynamic-skills', JSON.stringify(skills));
};

/**
 * Executor de Skills (O Coração do Agente)
 */
export async function executeSkill(name: string, args: any): Promise<any> {
  // 1. Tenta Skill de Sistema
  if (SYSTEM_SKILLS[name]) {
    return SYSTEM_SKILLS[name](args);
  }

  // 2. Tenta Skill Dinâmica
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
      const fn = new Function('args', skill.jsCode);
      return fn(args);
    } catch (e: any) {
      return { error: `Erro no JS da Skill: ${e.message}` };
    }
  }

  return { error: "Configuração de execução inválida." };
}