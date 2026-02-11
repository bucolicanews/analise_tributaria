export interface CstIbsCbsEntry {
  code: number | null;
  description: string | null;
  ind_gIBSCBS: number | null;
  ind_gIBSCBSMono: number | null;
  ind_gRed: number | null;
  ind_gDif: number | null;
  ind_gTransfCred: number | null;
  'ind_ gCredPresIBSZFM': number | null;
  ind_gAjusteCompet: number | null;
  ind_RedutorBC: number | null;
}

export const cstIbsCbsData: CstIbsCbsEntry[] = [
    {
        "code":0,
        "description":"Tributação integral",
        "ind_gIBSCBS":1,
        "ind_gIBSCBSMono":0,
        "ind_gRed":0,
        "ind_gDif":0,
        "ind_gTransfCred":0,
        "ind_ gCredPresIBSZFM":0,
        "ind_gAjusteCompet":0,
        "ind_RedutorBC":0
    },
    {
        "code":10,
        "description":"Tributação com alíquotas uniformes",
        "ind_gIBSCBS":1,
        "ind_gIBSCBSMono":0,
        "ind_gRed":0,
        "ind_gDif":0,
        "ind_gTransfCred":0,
        "ind_ gCredPresIBSZFM":0,
        "ind_gAjusteCompet":0,
        "ind_RedutorBC":0
    },
    {
        "code":11,
        "description":"Tributação com alíquotas uniformes reduzidas",
        "ind_gIBSCBS":1,
        "ind_gIBSCBSMono":0,
        "ind_gRed":1,
        "ind_gDif":0,
        "ind_gTransfCred":0,
        "ind_ gCredPresIBSZFM":0,
        "ind_gAjusteCompet":0,
        "ind_RedutorBC":0
    },
    {
        "code":200,
        "description":"Alíquota reduzida",
        "ind_gIBSCBS":1,
        "ind_gIBSCBSMono":0,
        "ind_gRed":1,
        "ind_gDif":0,
        "ind_gTransfCred":0,
        "ind_ gCredPresIBSZFM":0,
        "ind_gAjusteCompet":0,
        "ind_RedutorBC":0
    },
    {
        "code":220,
        "description":"Alíquota fixa",
        "ind_gIBSCBS":1,
        "ind_gIBSCBSMono":0,
        "ind_gRed":0,
        "ind_gDif":0,
        "ind_gTransfCred":0,
        "ind_ gCredPresIBSZFM":0,
        "ind_gAjusteCompet":0,
        "ind_RedutorBC":0
    },
    {
        "code":222,
        "description":"Redução de base de cálculo",
        "ind_gIBSCBS":1,
        "ind_gIBSCBSMono":0,
        "ind_gRed":0,
        "ind_gDif":0,
        "ind_gTransfCred":0,
        "ind_ gCredPresIBSZFM":0,
        "ind_gAjusteCompet":0,
        "ind_RedutorBC":1
    },
    {
        "code":221,
        "description":"Alíquota fixa proporcional",
        "ind_gIBSCBS":1,
        "ind_gIBSCBSMono":0,
        "ind_gRed":0,
        "ind_gDif":0,
        "ind_gTransfCred":0,
        "ind_ gCredPresIBSZFM":0,
        "ind_gAjusteCompet":0,
        "ind_RedutorBC":0
    },
    {
        "code":400,
        "description":"Isenção",
        "ind_gIBSCBS":0,
        "ind_gIBSCBSMono":0,
        "ind_gRed":0,
        "ind_gDif":0,
        "ind_gTransfCred":0,
        "ind_ gCredPresIBSZFM":0,
        "ind_gAjusteCompet":0,
        "ind_RedutorBC":0
    },
    {
        "code":410,
        "description":"Imunidade e não incidência",
        "ind_gIBSCBS":0,
        "ind_gIBSCBSMono":0,
        "ind_gRed":0,
        "ind_gDif":0,
        "ind_gTransfCred":0,
        "ind_ gCredPresIBSZFM":0,
        "ind_gAjusteCompet":0,
        "ind_RedutorBC":0
    },
    {
        "code":510,
        "description":"Diferimento",
        "ind_gIBSCBS":1,
        "ind_gIBSCBSMono":0,
        "ind_gRed":0,
        "ind_gDif":1,
        "ind_gTransfCred":0,
        "ind_ gCredPresIBSZFM":0,
        "ind_gAjusteCompet":0,
        "ind_RedutorBC":0
    },
    {
        "code":515,
        "description":"Diferimento com redução de alíquota",
        "ind_gIBSCBS":1,
        "ind_gIBSCBSMono":0,
        "ind_gRed":1,
        "ind_gDif":1,
        "ind_gTransfCred":0,
        "ind_ gCredPresIBSZFM":0,
        "ind_gAjusteCompet":0,
        "ind_RedutorBC":0
    },
    {
        "code":550,
        "description":"Suspensão",
        "ind_gIBSCBS":1,
        "ind_gIBSCBSMono":0,
        "ind_gRed":0,
        "ind_gDif":0,
        "ind_gTransfCred":0,
        "ind_ gCredPresIBSZFM":0,
        "ind_gAjusteCompet":0,
        "ind_RedutorBC":0
    },
    {
        "code":620,
        "description":"Tributação monofásica",
        "ind_gIBSCBS":0,
        "ind_gIBSCBSMono":1,
        "ind_gRed":0,
        "ind_gDif":0,
        "ind_gTransfCred":0,
        "ind_ gCredPresIBSZFM":0,
        "ind_gAjusteCompet":0,
        "ind_RedutorBC":0
    },
    {
        "code":800,
        "description":"Transferência de crédito",
        "ind_gIBSCBS":0,
        "ind_gIBSCBSMono":0,
        "ind_gRed":0,
        "ind_gDif":0,
        "ind_gTransfCred":1,
        "ind_ gCredPresIBSZFM":0,
        "ind_gAjusteCompet":0,
        "ind_RedutorBC":0
    },
    {
        "code":810,
        "description":"Ajuste de IBS na ZFM",
        "ind_gIBSCBS":0,
        "ind_gIBSCBSMono":0,
        "ind_gRed":0,
        "ind_gDif":0,
        "ind_gTransfCred":0,
        "ind_ gCredPresIBSZFM":1,
        "ind_gAjusteCompet":0,
        "ind_RedutorBC":0
    },
    {
        "code":811,
        "description":"Ajustes",
        "ind_gIBSCBS":0,
        "ind_gIBSCBSMono":0,
        "ind_gRed":0,
        "ind_gDif":0,
        "ind_gTransfCred":0,
        "ind_ gCredPresIBSZFM":0,
        "ind_gAjusteCompet":1,
        "ind_RedutorBC":0
    },
    {
        "code":820,
        "description":"Tributação em declaração de regime específico",
        "ind_gIBSCBS":0,
        "ind_gIBSCBSMono":0,
        "ind_gRed":0,
        "ind_gDif":0,
        "ind_gTransfCred":0,
        "ind_ gCredPresIBSZFM":0,
        "ind_gAjusteCompet":0,
        "ind_RedutorBC":0
    },
    {
        "code":830,
        "description":"Exclusão de base de cálculo",
        "ind_gIBSCBS":1,
        "ind_gIBSCBSMono":0,
        "ind_gRed":0,
        "ind_gDif":0,
        "ind_gTransfCred":0,
        "ind_ gCredPresIBSZFM":0,
        "ind_gAjusteCompet":0,
        "ind_RedutorBC":0
    }
];