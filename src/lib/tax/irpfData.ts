export interface IrpfRange {
  min: number;
  max: number | null;
  rate: number;
  deduction: number;
}

export interface IrpfReductionRule {
  min: number;
  max: number | null;
  description: string;
}

export interface IrpfTable {
  id: string;
  label: string;
  year: string;
  ranges: IrpfRange[];
  reductionRules: IrpfReductionRule[];
}

export const INITIAL_IRPF_TABLES: IrpfTable[] = [
  {
    id: 'irpf-2026',
    label: 'Tabela Mensal IRPF 2026',
    year: '2026',
    ranges: [
      { min: 0, max: 2428.80, rate: 0, deduction: 0 },
      { min: 2428.81, max: 2826.65, rate: 7.5, deduction: 182.16 },
      { min: 2826.66, max: 3751.05, rate: 15.0, deduction: 394.16 },
      { min: 3751.06, max: 4664.68, rate: 22.5, deduction: 675.49 },
      { min: 4664.69, max: null, rate: 27.5, deduction: 908.73 },
    ],
    reductionRules: [
      { min: 0, max: 5000.00, description: "Redução de até R$ 312,89 (limitado ao imposto devido)" },
      { min: 5000.01, max: 7350.00, description: "Fórmula: R$ 978,62 – (0,133145 x Renda Mensal)" },
      { min: 7350.01, max: null, description: "Sem redução aplicada" }
    ]
  }
];

export function getIrpfTables(): IrpfTable[] {
  const stored = localStorage.getItem('jota-irpf-tables');
  return stored ? JSON.parse(stored) : INITIAL_IRPF_TABLES;
}

export function saveIrpfTables(tables: IrpfTable[]) {
  localStorage.setItem('jota-irpf-tables', JSON.stringify(tables));
}