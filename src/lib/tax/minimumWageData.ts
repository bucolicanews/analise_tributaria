export interface MinimumWageEntry {
  id: string;
  year: string;
  value: number;
  label: string;
}

export const INITIAL_MINIMUM_WAGES: MinimumWageEntry[] = [
  { id: 'mw-2026', year: '2026', value: 1621.00, label: 'Janeiro de 2026 (Decreto 12.797/2025)' },
  { id: 'mw-2025', year: '2025', value: 1518.00, label: 'Janeiro de 2025 (Decreto 12.342/2024)' },
  { id: 'mw-2024', year: '2024', value: 1412.00, label: 'Janeiro de 2024 (Decreto 11.864/2024)' },
  { id: 'mw-2023-pos', year: '2023', value: 1320.00, label: 'Maio de 2023 (Lei 14.663/2023)' },
  { id: 'mw-2022', year: '2022', value: 1212.00, label: 'Janeiro de 2022 (Lei 14.358/2022)' },
];

export function getMinimumWages(): MinimumWageEntry[] {
  const stored = localStorage.getItem('jota-minimum-wages');
  return stored ? JSON.parse(stored) : INITIAL_MINIMUM_WAGES;
}

export function saveMinimumWages(wages: MinimumWageEntry[]) {
  localStorage.setItem('jota-minimum-wages', JSON.stringify(wages));
}