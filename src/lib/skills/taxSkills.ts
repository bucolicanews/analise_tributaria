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

export const JOTA_TOOLS_MANIFEST: any[] = [];

/**
 * ENGINE TRIBUTÁRIA PROFISSIONAL JOTA - SOMENTE AS 3 ESSENCIAIS
 */
export const DEFAULT_DYNAMIC_SKILLS: DynamicSkill[] = [
  {
    id: 'sys-1',
    name: 'consultar_endereco_viacep',
    description: 'Consulta endereço completo via CEP.',
    parameters: {
      type: 'object',
      properties: { cep: { type: 'string' } },
      required: ['cep']
    },
    executionType: 'local_js',
    isActive: true,
    jsCode: "const cleanCep = String(args.cep).replace(/\\D/g, '');\nif (cleanCep.length !== 8) return { error: 'CEP inválido' };\ntry {\n  const response = await fetch('https://viacep.com.br/ws/' + cleanCep + '/json/');\n  const data = await response.json();\n  return data.erro ? { error: 'CEP não localizado' } : data;\n} catch (e) {\n  return { error: 'Falha no serviço de CEP' };\n}"
  },
  {
    id: 'sys-2',
    name: 'comparar_regimes_tributarios',
    description: 'Realiza o comparativo matemático real entre Simples Nacional e Lucro Presumido, incluindo Fator R.',
    parameters: {
      type: 'object',
      properties: {
        faturamento_mensal: { type: 'number' },
        faturamento_12m: { type: 'number' },
        folha_12m: { type: 'number' },
        tipo_atividade: { type: 'string', enum: ['comercio', 'servico'] },
        icms_percentual: { type: 'number', description: 'Ex: 0.12 para 12%' },
        iss_percentual: { type: 'number', description: 'Ex: 0.05 para 5%' }
      },
      required: ['faturamento_mensal', 'faturamento_12m', 'folha_12m', 'tipo_atividade']
    },
    executionType: 'local_js',
    isActive: true,
    jsCode: `
// 1. CÁLCULO FATOR R
const r = args.folha_12m / args.faturamento_12m;
const anexoCalculado = r >= 0.28 ? "Anexo III" : "Anexo V";
const anexoFinal = args.tipo_atividade === 'comercio' ? "Anexo I" : anexoCalculado;

// 2. SIMPLES NACIONAL
const tabelaSimples = {
  "Anexo I": { aliquota: 0.073, deducao: 5940 },
  "Anexo III": { aliquota: 0.06, deducao: 0 },
  "Anexo V": { aliquota: 0.155, deducao: 6250 }
};
const t = tabelaSimples[anexoFinal];
const efetivaSimples = ((args.faturamento_12m * t.aliquota) - t.deducao) / args.faturamento_12m;
const impostoSimples = args.faturamento_mensal * efetivaSimples;

// 3. LUCRO PRESUMIDO
const presuncao = args.tipo_atividade === 'comercio' ? 0.08 : 0.32;
const basePresumido = args.faturamento_mensal * presuncao;
const irpj = basePresumido * 0.15;
const adicionalIrpj = basePresumido > 20000 ? (basePresumido - 20000) * 0.10 : 0;
const csll = basePresumido * 0.09;
const pis = args.faturamento_mensal * 0.0065;
const cofins = args.faturamento_mensal * 0.03;
const icms = args.tipo_atividade === 'comercio' ? args.faturamento_mensal * (args.icms_percentual || 0.12) : 0;
const iss = args.tipo_atividade === 'servico' ? args.faturamento_mensal * (args.iss_percentual || 0.05) : 0;
const totalPresumido = irpj + adicionalIrpj + csll + pis + cofins + icms + iss;

return {
  fator_r: { valor: (r * 100).toFixed(2) + "%", anexo: anexoFinal },
  simples: { aliquota_efetiva: (efetivaSimples * 100).toFixed(2) + "%", valor_mensal: impostoSimples },
  presumido: { aliquota_efetiva: ((totalPresumido / args.faturamento_mensal) * 100).toFixed(2) + "%", valor_mensal: totalPresumido },
  veredito: {
    melhor_regime: impostoSimples < totalPresumido ? "Simples Nacional" : "Lucro Presumido",
    economia_mensal: Math.abs(impostoSimples - totalPresumido)
  }
};
    `
  },
  {
    id: 'sys-3',
    name: 'calcular_pro_labore_liquido',
    description: 'Calcula o valor líquido do pró-labore aplicando INSS (11%) e IRPF (Tabela 2026).',
    parameters: {
      type: 'object',
      properties: { valor_bruto: { type: 'number' } },
      required: ['valor_bruto']
    },
    executionType: 'local_js',
    isActive: true,
    jsCode: `
const valor = args.valor_bruto;
const inss = valor * 0.11;
const baseIR = valor - inss;
let aliq = 0, ded = 0;

if (baseIR <= 2428.80) { aliq = 0; }
else if (baseIR <= 2826.65) { aliq = 0.075; ded = 182.16; }
else if (baseIR <= 3751.05) { aliq = 0.15; ded = 394.16; }
else if (baseIR <= 4664.68) { aliq = 0.225; ded = 675.49; }
else { aliq = 0.275; ded = 908.73; }

const ir = Math.max(0, (baseIR * aliq) - ded);
return { bruto: valor, inss, base_ir: baseIR, ir, liquido: valor - inss - ir };
    `
  }
];

export const loadDynamicSkills = (): DynamicSkill[] => {
  const saved = localStorage.getItem('jota-dynamic-skills');
  return saved ? JSON.parse(saved) : DEFAULT_DYNAMIC_SKILLS;
};

export const saveDynamicSkills = (skills: DynamicSkill[]) => {
  localStorage.setItem('jota-dynamic-skills', JSON.stringify(skills));
};

export async function executeSkill(name: string, args: any): Promise<any> {
  const dynamicSkills = loadDynamicSkills();
  const skill = dynamicSkills.find(s => s.name === name);

  if (!skill || !skill.isActive) {
    return { error: "Skill '" + name + "' não encontrada ou inativa." };
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
      return { error: "Falha no Webhook: " + e.message };
    }
  }

  if (skill.executionType === 'local_js' && skill.jsCode) {
    try {
      const helpers = { 
        calculateSimplesNacionalEffectiveRate, 
        findCClassByNcm, 
        checkIfNcmHasSelectiveTax 
      };
      
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction('args', 'helpers', skill.jsCode);
      return await fn(args, helpers);
    } catch (e: any) {
      return { error: "Erro no JS da Skill: " + e.message };
    }
  }

  return { error: "Configuração de execução inválida." };
}