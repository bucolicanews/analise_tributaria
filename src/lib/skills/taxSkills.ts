import { calculateSimplesNacionalEffectiveRate } from "../simplesNacional";
import { findCClassByNcm, checkIfNcmHasSelectiveTax } from "../tax/taxClassificationService";

export interface DynamicSkill {
  id: string;
  name: string;
  description: string;
  suggestedInstruction?: string; // Novo campo para ajudar o usuário
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
    suggestedInstruction: 'Você tem acesso à ferramenta #consultar_endereco_viacep. Utilize-a para validar o endereço da empresa ou localizar o município correto sempre que um CEP for fornecido.',
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
    description: 'Realiza o comparativo matemático real entre Simples Nacional e Lucro Presumido.',
    suggestedInstruction: 'Você tem acesso à ferramenta #comparar_regimes_tributarios. Utilize-a obrigatoriamente para realizar simulações matemáticas precisas entre Simples Nacional e Lucro Presumido, garantindo que os valores em R$ sejam exatos.',
    parameters: {
      type: 'object',
      properties: {
        faturamento_mensal: { type: 'number', description: 'Receita mensal da empresa' },
        faturamento_12m: { type: 'number', description: 'Faturamento acumulado dos últimos 12 meses' },
        folha_12m: { type: 'number', description: 'Folha de pagamento acumulada dos últimos 12 meses' },
        tipo_atividade: { type: 'string', enum: ['comercio', 'servico', 'industria'] },
        icms_percentual: { type: 'number', description: 'Alíquota de ICMS (ex: 0.17)', default: 0.17 },
        icms_isento: { type: 'boolean', description: 'Indica se há isenção de ICMS', default: false },
        icms_st: { type: 'boolean', description: 'Se o produto está sujeito à ST', default: false },
        iss_percentual: { type: 'number', description: 'Alíquota de ISS (ex: 0.05)', default: 0.05 },
        margem_lucro: { type: 'number', description: 'Margem de lucro alvo', default: 0.15 }
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
    description: 'Calcula o valor líquido do pró-labore (INSS e IRPF 2026).',
    suggestedInstruction: 'Você tem acesso à ferramenta #calcular_pro_labore_liquido. Utilize-a para calcular o valor líquido real que o sócio receberá, aplicando as regras de INSS e IRPF 2026.',
    parameters: {
      type: 'object',
      properties: { valor_bruto: { type: 'number' } },
      required: ['valor_bruto']
    },
    executionType: 'local_js',
    isActive: true,
    jsCode: `
const bruto = args.valor_bruto;
const inss = bruto * 0.11;
const descontoSimplificado = 607.20;
const deducaoEfetiva = Math.max(inss, descontoSimplificado);
const baseIR = Math.max(0, bruto - deducaoEfetiva);

let aliq = 0, parcelaDeduzir = 0;
if (baseIR <= 2428.80) { aliq = 0; parcelaDeduzir = 0; }
else if (baseIR <= 2826.65) { aliq = 0.075; parcelaDeduzir = 182.16; }
else if (baseIR <= 3751.05) { aliq = 0.15; parcelaDeduzir = 394.16; }
else if (baseIR <= 4664.68) { aliq = 0.225; parcelaDeduzir = 675.49; }
else { aliq = 0.275; parcelaDeduzir = 908.73; }

const impostoCalculado = Math.max(0, (baseIR * aliq) - parcelaDeduzir);
let valorReducao = 0;
if (bruto <= 5000.00) {
  valorReducao = Math.min(impostoCalculado, 312.89);
} else if (bruto <= 7350.00) {
  valorReducao = Math.max(0, 978.62 - (0.133145 * bruto));
}

const irFinal = Math.max(0, impostoCalculado - valorReducao);

return { 
  bruto, 
  inss, 
  deducao_utilizada: deducaoEfetiva === inss ? "INSS (Dedução Legal)" : "Desconto Simplificado (R$ 607,20)",
  base_ir: baseIR, 
  ir_final: irFinal, 
  liquido: bruto - inss - irFinal,
  lei: "Lei 15.270/2025 (Vigência 2026)"
};
    `
  },
  {
    id: 'sys-4',
    name: 'consultar_portal_nfe',
    description: 'Busca os últimos Informes Técnicos no Portal Nacional da NF-e.',
    suggestedInstruction: 'Você tem acesso à ferramenta #consultar_portal_nfe. Utilize-a para verificar se existem Notas Técnicas recentes ou atualizações na legislação da NF-e.',
    parameters: {
      type: 'object',
      properties: {
        termo_busca: { type: 'string', description: 'Opcional: termo para filtrar os informes' }
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
  return { fonte: targetUrl, ultimos_informes: results };
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

  if (!skillsOverride && !skill.isActive) {
    return { error: "Skill '" + name + "' está inativa." };
  }
  
  if (skill.executionType === 'knowledge_base') {
    return { status: "sucesso", conteudo_recuperado: skill.knowledgeBaseText || "" };
  }

  if (skill.executionType === 'web_scraping' && skill.url) {
    const targetUrl = skill.url;
    const proxies = [
      (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`
    ];

    let lastError = "";
    
    for (const getProxyUrl of proxies) {
      try {
        const response = await fetch(getProxyUrl(targetUrl));
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        
        const text = await response.text();
        let html = "";

        try {
          const json = JSON.parse(text);
          html = json.contents || text;
        } catch (e) {
          html = text;
        }

        if (!html || html.trim().length === 0) throw new Error("Conteúdo vazio retornado.");

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        let targetElement: Element | null = doc.body;
        
        if (skill.selector) {
          targetElement = doc.querySelector(skill.selector);
          if (!targetElement) {
            return { error: `Seletor CSS '${skill.selector}' não encontrado na página.` };
          }
        }

        const noiseSelectors = 'script, style, nav, footer, header, .menu, .sidebar, #header, #footer, .breadcrumb, .social-share';
        const noise = targetElement.querySelectorAll(noiseSelectors);
        noise.forEach(n => n.remove());

        const rawText = (targetElement as HTMLElement).innerText || targetElement.textContent || "";
        const cleanText = rawText
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('\n');
        
        return { 
          status: "sucesso", 
          url: targetUrl, 
          conteudo: cleanText.substring(0, 12000) 
        };
      } catch (e: any) {
        lastError = e.message;
        continue;
      }
    }

    return { error: `Falha na navegação web. Último erro: ${lastError}` };
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