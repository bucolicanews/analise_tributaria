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
 * SKILLS PADRÃO (Agora como strings de código para serem editáveis)
 */
export const DEFAULT_DYNAMIC_SKILLS: DynamicSkill[] = [
  {
    id: 'sys-1',
    name: 'get_address_by_cep',
    description: 'Consulta endereço completo via CEP.',
    parameters: {
      type: 'object',
      properties: { cep: { type: 'string' } },
      required: ['cep']
    },
    executionType: 'local_js',
    isActive: true,
    jsCode: `
const cleanCep = String(args.cep).replace(/\\D/g, '');
if (cleanCep.length !== 8) return { error: "CEP inválido" };
try {
  const response = await fetch(\`https://viacep.com.br/ws/\${cleanCep}/json/\`);
  const data = await response.json();
  return data.erro ? { error: "CEP não localizado" } : data;
} catch (e) {
  return { error: "Falha no serviço de CEP" };
}
    `
  },
  {
    id: 'sys-2',
    name: 'compare_tax_regimes',
    description: 'Realiza o comparativo matemático real entre Simples Nacional e Lucro Presumido.',
    parameters: {
      type: 'object',
      properties: {
        faturamento_mensal: { type: 'number' },
        faturamento_12m: { type: 'number' },
        tipo_atividade: { type: 'string', enum: ['comercio', 'servico'] },
        folha_12m: { type: 'number' },
        icms_percentual: { type: 'number' },
        iss_percentual: { type: 'number' }
      },
      required: ['faturamento_mensal', 'faturamento_12m', 'tipo_atividade', 'folha_12m']
    },
    executionType: 'local_js',
    isActive: true,
    jsCode: `
// A. Fator R
const r = args.faturamento_12m > 0 ? (args.folha_12m / args.faturamento_12m) : 0;
const anexoServico = r >= 0.28 ? "Anexo III" : "Anexo V";
const anexoFinal = args.tipo_atividade === 'comercio' ? "Anexo I" : anexoServico;

// B. Simples Nacional (Usando helper do sistema)
const efetivaSimples = helpers.calculateSimplesNacionalEffectiveRate(anexoFinal, args.faturamento_12m);
const impostoSimples = args.faturamento_mensal * (efetivaSimples / 100);

// C. Lucro Presumido
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
  fator_r: { valor: (r * 100).toFixed(2) + "%", anexo: anexoFinal },
  simples: { aliquota: efetivaSimples.toFixed(2) + "%", valor: impostoSimples },
  presumido: { aliquota: ((totalPresumido / args.faturamento_mensal) * 100).toFixed(2) + "%", valor: totalPresumido },
  veredito: { 
    melhor_regime: impostoSimples < totalPresumido ? "Simples Nacional" : "Lucro Presumido",
    economia: Math.abs(impostoSimples - totalPresumido)
  }
};
    `
  },
  {
    id: 'sys-3',
    name: 'calculate_pro_labore_net',
    description: 'Calcula o valor líquido do pró-labore (INSS 11% + IRPF 2026).',
    parameters: {
      type: 'object',
      properties: { valor_bruto: { type: 'number' } },
      required: ['valor_bruto']
    },
    executionType: 'local_js',
    isActive: true,
    jsCode: `
const inss = args.valor_bruto * 0.11;
const baseIR = args.valor_bruto - inss;
let aliq = 0, ded = 0;
if (baseIR > 4664.68) { aliq = 0.275; ded = 908.73; }
else if (baseIR > 3751.05) { aliq = 0.225; ded = 675.49; }
else if (baseIR > 2826.65) { aliq = 0.15; ded = 394.16; }
else if (baseIR > 2428.80) { aliq = 0.075; ded = 182.16; }

const ir = Math.max(0, (baseIR * aliq) - ded);
return { bruto: args.valor_bruto, inss, ir, liquido: args.valor_bruto - inss - ir };
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
      return { error: `Falha no Webhook: \${e.message}` };
    }
  }

  if (skill.executionType === 'local_js' && skill.jsCode) {
    try {
      // Helpers injetados para facilitar o acesso a dados do sistema
      const helpers = { 
        calculateSimplesNacionalEffectiveRate, 
        findCClassByNcm, 
        checkIfNcmHasSelectiveTax 
      };
      
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction('args', 'helpers', skill.jsCode);
      return await fn(args, helpers);
    } catch (e: any) {
      return { error: `Erro no JS da Skill: \${e.message}` };
    }
  }

  return { error: "Configuração de execução inválida." };
}