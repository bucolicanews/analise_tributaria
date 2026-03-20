import { calculateSimplesNacionalEffectiveRate } from "../simplesNacional";
import { findCClassByNcm, checkIfNcmHasSelectiveTax } from "../tax/taxClassificationService";

export interface DynamicSkill {
  id: string;
  name: string;
  description: string;
  parameters: any; 
  executionType: 'local_js' | 'webhook' | 'knowledge_base' | 'web_scraping';
  jsCode?: string;
  webhookUrl?: string;
  knowledgeBaseText?: string;
  url?: string;
  selector?: string;
  isActive: boolean;
}

export const JOTA_TOOLS_MANIFEST: any[] = [];

const AsyncFunction = (async () => {}).constructor as any;

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
    description: 'Realiza o comparativo matemático real entre Simples Nacional e Lucro Presumido, incluindo Fator R, Indústria, Isenções e ST.',
    parameters: {
      type: 'object',
      properties: {
        faturamento_mensal: { type: 'number', description: 'Receita mensal da empresa' },
        faturamento_12m: { type: 'number', description: 'Faturamento acumulado dos últimos 12 meses' },
        folha_12m: { type: 'number', description: 'Folha de pagamento acumulada dos últimos 12 meses' },
        tipo_atividade: { type: 'string', enum: ['comercio', 'servico', 'industria'] },
        icms_percentual: { type: 'number', description: 'Alíquota de ICMS (ex: 0.17)', default: 0.17 },
        icms_isento: { type: 'boolean', description: 'Indica se há isenção de ICMS (comum em Granjas)', default: false },
        icms_st: { type: 'boolean', description: 'Se o produto está sujeito à Substituição Tributária', default: false },
        iss_percentual: { type: 'number', description: 'Alíquota de ISS (ex: 0.05)', default: 0.05 },
        margem_lucro: { type: 'number', description: 'Margem de lucro alvo para o cálculo', default: 0.15 }
      },
      required: ['faturamento_mensal', 'faturamento_12m', 'folha_12m', 'tipo_atividade']
    },
    executionType: 'local_js',
    isActive: true,
    jsCode: `
const faturamento = args.faturamento_mensal || 0;
const faturamento12m = args.faturamento_12m || (faturamento * 12);
const folha12m = args.folha_12m || 0;
const tipo = args.tipo_atividade || "comercio";

if (faturamento <= 0) return { error: "Faturamento inválido" };

let anexo = "Anexo I";
if (tipo === 'servico') {
  const r = folha12m / faturamento12m;
  anexo = r >= 0.28 ? "Anexo III" : "Anexo V";
} else if (tipo === 'industria') {
  anexo = "Anexo II";
}

const efetivaSimples = helpers.calculateSimplesNacionalEffectiveRate(anexo, faturamento12m);
let impostoSimples = faturamento * (efetivaSimples / 100);

if (args.icms_st || args.icms_isento) {
  impostoSimples = impostoSimples * 0.66; 
}

const presuncaoIRPJ = (tipo === 'comercio' || tipo === 'industria') ? 0.08 : 0.32;
const baseIRPJ = faturamento * presuncaoIRPJ;
const presuncaoCSLL = (tipo === 'comercio' || tipo === 'industria') ? 0.12 : 0.32;
const baseCSLL = faturamento * presuncaoCSLL;

const irpj = baseIRPJ * 0.15;
const adicional = baseIRPJ > 20000 ? (baseIRPJ - 20000) * 0.10 : 0;
const csll = baseCSLL * 0.09;
const pis = faturamento * 0.0065;
const cofins = faturamento * 0.03;
const icms = (tipo !== 'servico' && !args.icms_isento && !args.icms_st) ? faturamento * (args.icms_percentual || 0.17) : 0;
const iss = tipo === 'servico' ? faturamento * (args.iss_percentual || 0.05) : 0;

const totalPresumido = irpj + adicional + csll + pis + cofins + icms + iss;

return {
  fator_r: tipo === 'servico' ? { percentual: ((folha12m/faturamento12m)*100).toFixed(2) + "%", anexo } : "N/A",
  simples: {
    anexo,
    aliquota_efetiva: efetivaSimples.toFixed(2) + "%",
    valor_mensal: impostoSimples,
    observacao: (args.icms_st || args.icms_isento) ? "Cálculo com segregação de ICMS (ST/Isento)" : "Tributação integral no DAS"
  },
  presumido: {
    presuncao: { irpj: (presuncaoIRPJ*100)+"%", csll: (presuncaoCSLL*100)+"%" },
    detalhamento: { irpj: irpj + adicional, csll, pis_cofins: pis + cofins, icms, iss },
    total: totalPresumido,
    aliquota_efetiva: ((totalPresumido / faturamento) * 100).toFixed(2) + "%"
  },
  veredito: {
    melhor_regime: impostoSimples < totalPresumido ? "Simples Nacional" : "Lucro Presumido",
    economia_mensal: Math.abs(impostoSimples - totalPresumido),
    recomendacao: impostoSimples < totalPresumido 
      ? "O Simples Nacional é mais vantajoso para este nível de faturamento." 
      : "O Lucro Presumido apresenta vantagem tributária, principalmente devido aos créditos ou isenções de ICMS."
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
  },
  {
    id: 'sys-4',
    name: 'consultar_portal_nfe',
    description: 'Busca os últimos Informes Técnicos e novidades diretamente no Portal Nacional da NF-e.',
    parameters: {
      type: 'object',
      properties: {
        termo_busca: { type: 'string', description: 'Opcional: termo para filtrar os informes (ex: 2024.001)' }
      }
    },
    executionType: 'local_js',
    isActive: true,
    jsCode: `
try {
  const targetUrl = 'https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=hXzemuyNHW4=';
  const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(targetUrl);
  
  const response = await fetch(proxyUrl);
  const data = await response.json();
  const html = data.contents;
  
  const matches = html.match(/<span id="[^"]+" class="tituloConteudo">([^<]+)<\\/span>/g) || [];
  const results = matches.map(m => m.replace(/<[^>]+>/g, '').trim()).slice(0, 10);
  
  return {
    fonte: targetUrl,
    ultimos_informes: results,
    aviso: "Para detalhes completos, a IA deve usar a busca do Google (Grounding) ou você deve configurar um Webhook no n8n para extrair o conteúdo dos PDFs."
  };
} catch (e) {
  return { error: "Erro ao acessar o portal: " + e.message };
}
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

export async function executeSkill(name: string, args: any, skillsOverride?: DynamicSkill[]): Promise<any> {
  const dynamicSkills = skillsOverride || loadDynamicSkills();
  const skill = dynamicSkills.find(s => s.name === name);

  if (!skill) {
    return { error: "Skill '" + name + "' não encontrada." };
  }

  // Se for um teste manual (skillsOverride presente), ignoramos o check de isActive para permitir testar antes de ativar
  if (!skillsOverride && !skill.isActive) {
    return { error: "Skill '" + name + "' está inativa." };
  }
  
  if (skill.executionType === 'knowledge_base') {
    return { status: "sucesso", conteudo_recuperado: skill.knowledgeBaseText || "" };
  }

  if (skill.executionType === 'web_scraping' && skill.url) {
    try {
      const targetUrl = skill.url;
      const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(targetUrl);
      const response = await fetch(proxyUrl);
      const data = await response.json();
      const html = data.contents;

      if (skill.selector) {
        const regex = new RegExp(skill.selector + '[^>]*>([^<]+)<', 'gi');
        const matches = html.match(regex) || [];
        const results = matches.map((m: string) => m.replace(/<[^>]+>/g, '').trim());
        return { status: "sucesso", url: targetUrl, dados_extraidos: results.slice(0, 20) };
      }

      const cleanText = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
                            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
                            .replace(/<[^>]+>/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim();
      
      return { status: "sucesso", url: targetUrl, conteudo: cleanText.substring(0, 5000) };
    } catch (e: any) {
      return { error: "Falha na navegação web: " + e.message };
    }
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
      
      let codeToExecute = skill.jsCode.trim();
      
      if (codeToExecute.startsWith('async function') || codeToExecute.startsWith('function')) {
          const firstBrace = codeToExecute.indexOf('{');
          const lastBrace = codeToExecute.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
              codeToExecute = codeToExecute.substring(firstBrace + 1, lastBrace);
          }
      }

      const fn = new AsyncFunction('args', 'helpers', codeToExecute);
      return await fn(args, helpers);
    } catch (e: any) {
      return { error: "Erro no JS da Skill: " + e.message };
    }
  }

  return { error: "Configuração de execução inválida." };
}