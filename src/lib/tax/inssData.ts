export interface InssRange {
  min: number;
  max: number | null;
  rate: number;
  deduction: number;
}

export interface InssTable {
  id: string;
  label: string;
  year: string;
  ranges: InssRange[];
}

export const INITIAL_INSS_TABLES: InssTable[] = [
  {
    id: 'inss-2026',
    label: 'Período de 01/01/2026 a 31/12/2026',
    year: '2026',
    ranges: [
      { min: 0, max: 1621.00, rate: 7.5, deduction: 0 },
      { min: 1621.01, max: 2902.84, rate: 9.0, deduction: 24.32 },
      { min: 2902.85, max: 4354.27, rate: 12.0, deduction: 111.40 },
      { min: 4354.28, max: 8475.55, rate: 14.0, deduction: 198.49 },
    ]
  },
  {
    id: 'inss-2025',
    label: 'Período de 01/01/2025 a 31/12/2025',
    year: '2025',
    ranges: [
      { min: 0, max: 1518.00, rate: 7.5, deduction: 0 },
      { min: 1518.01, max: 2793.88, rate: 9.0, deduction: 22.77 },
      { min: 2793.89, max: 4190.83, rate: 12.0, deduction: 106.59 },
      { min: 4190.84, max: 8157.41, rate: 14.0, deduction: 190.40 },
    ]
  },
  {
    id: 'inss-2024',
    label: 'Período de 01/01/2024 a 31/12/2024',
    year: '2024',
    ranges: [
      { min: 0, max: 1412.00, rate: 7.5, deduction: 0 },
      { min: 1412.01, max: 2666.68, rate: 9.0, deduction: 21.18 },
      { min: 2666.69, max: 4000.03, rate: 12.0, deduction: 101.18 },
      { min: 4000.04, max: 7786.02, rate: 14.0, deduction: 181.18 },
    ]
  },
  {
    id: 'inss-2023-pos',
    label: 'Período de 01/05/2023 a 31/12/2023',
    year: '2023',
    ranges: [
      { min: 0, max: 1320.00, rate: 7.5, deduction: 0 },
      { min: 1320.01, max: 2571.29, rate: 9.0, deduction: 19.80 },
      { min: 2571.30, max: 3856.94, rate: 12.0, deduction: 96.94 },
      { min: 3856.95, max: 7507.49, rate: 14.0, deduction: 174.08 },
    ]
  },
  {
    id: 'inss-2023-pre',
    label: 'Período de 01/01/2023 a 30/04/2023',
    year: '2023',
    ranges: [
      { min: 0, max: 1302.00, rate: 7.5, deduction: 0 },
      { min: 1302.01, max: 2571.29, rate: 9.0, deduction: 19.53 },
      { min: 2571.30, max: 3856.94, rate: 12.0, deduction: 96.67 },
      { min: 3856.95, max: 7507.49, rate: 14.0, deduction: 173.81 },
    ]
  },
  {
    id: 'inss-2022',
    label: 'Período de 01/01/2022 a 31/12/2022',
    year: '2022',
    ranges: [
      { min: 0, max: 1212.00, rate: 7.5, deduction: 0 },
      { min: 1212.01, max: 2427.35, rate: 9.0, deduction: 18.18 },
      { min: 2427.36, max: 3641.03, rate: 12.0, deduction: 91.00 },
      { min: 3641.04, max: 7087.22, rate: 14.0, deduction: 163.82 },
    ]
  }
];

export function getInssTables(): InssTable[] {
  const stored = localStorage.getItem('jota-inss-tables');
  return stored ? JSON.parse(stored) : INITIAL_INSS_TABLES;
}

export function saveInssTables(tables: InssTable[]) {
  localStorage.setItem('jota-inss-tables', JSON.stringify(tables));
}