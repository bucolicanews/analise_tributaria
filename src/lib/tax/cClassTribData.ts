export interface CClassTribEntry {
  cstCode: number;
  cstDescription: string;
  code: number;
  name: string;
  description: string;
  lcSourceText: string | null;
  lcSource: string | null;
  aliquotaType: string;
  pRedIBS: number;
  pRedCBS: number;
  dIniVig: string;
  dFimVig: string | null;
  lastUpdate: string;
  anexo: number | null;
  link: string | null;
}

export const cClassTribData: CClassTribEntry[] = [
    {
        "cstCode":0,
        "cstDescription":"Tributação integral",
        "code":1,
        "name":"Situações tributadas integralmente pelo IBS e CBS.",
        "description":"Situações tributadas integralmente pelo IBS e CBS.",
        "lcSourceText":null,
        "lcSource":null,
        "aliquotaType":"Padrão",
        "pRedIBS":0,
        "pRedCBS":0,
        "dIniVig":"2026-01-01",
        "dFimVig":null,
        "lastUpdate":"2025-11-19",
        "anexo":null,
        "link":"https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm#art4"
    },
    {
        "cstCode":0,
        "cstDescription":"Tributação integral",
        "code":2,
        "name":"Exploração de via",
        "description":"Exploração de via, observado o art. 11 da Lei Complementar nº 214, de 2025.",
        "lcSourceText":"Art. 11. Considera-se local da operação com:\nVIII - serviço de exploração de via, mediante cobrança de valor a qualquer título, incluindo tarifas, pedágios e quaisquer outras formas de cobrança, o território de cada Município e Estado, ou do Distrito Federal, proporcionalmente à correspondente extensão da via explorada",
        "lcSource":"Art. 11, VIII",
        "aliquotaType":"Padrão",
        "pRedIBS":0,
        "pRedCBS":0,
        "dIniVig":"2026-01-01",
        "dFimVig":null,
        "lastUpdate":"2025-11-19",
        "anexo":null,
        "link":"https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm#art11"
    },
    // ... (rest of the data will be truncated for brevity in this view)
    {
        "cstCode":830,
        "cstDescription":"Exclusão de base de cálculo",
        "code":830001,
        "name":"Documento com exclusão da BC da CBS e do IBS de energia elétrica fornecida pela distribuidora à UC",
        "description":"Documento com exclusão da base de cálculo da CBS e do IBS refrente à energia elétrica fornecida pela distribuidora à unidade consumidora, conforme Art 28, parágrafos 3° e 4°.",
        "lcSourceText":"Art. 28. § 3º Exclui-se da base de cálculo da CBS e do IBS a energia elétrica fornecida pela distribuidora à unidade consumidora, na quantidade correspondente à energia injetada na rede de distribuição pela mesma unidade consumidora, acrescidos dos créditos de energia elétrica originados na própria unidade consumidora no mesmo mês, em meses anteriores ou em outra unidade consumidora do mesmo titular.\n § 4º A exclusão de que trata o § 3º deste artigo:\n I - aplica-se somente a consumidores participantes do Sistema de Compensação de Energia Elétrica, de que trata a Lei nº 14.300, de 6 de janeiro de 2022;\n II - aplica-se somente à compensação de energia elétrica produzida por microgeração e minigeração, cuja potência instalada seja, respectivamente, menor ou igual a 75 kW e superior a 75 kW e menor ou igual a 1 MW; e\n III - não se aplica ao custo de disponibilidade, à energia reativa, à demanda de potência, aos encargos de conexão ou uso do sistema de distribuição, aos componentes tarifárias não associadas ao custo da energia e a quaisquer outros valores cobrados pela distribuidora.",
        "lcSource":"Art 28, parágrafos 3° e 4°",
        "aliquotaType":"Sem alíquota",
        "pRedIBS":0,
        "pRedCBS":0,
        "dIniVig":"2026-01-01",
        "dFimVig":null,
        "lastUpdate":"2025-06-11",
        "anexo":null,
        "link":"https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm#art28"
    }
]