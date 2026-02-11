interface Faixa {
  min: number;
  max: number;
  aliquota: number;
  parcelaADeduzir: number;
}

const ANEXO_I_COMERCIO: Faixa[] = [
  { min: 0, max: 180000, aliquota: 4.0, parcelaADeduzir: 0 },
  { min: 180000.01, max: 360000, aliquota: 7.3, parcelaADeduzir: 5940 },
  { min: 360000.01, max: 720000, aliquota: 9.5, parcelaADeduzir: 13860 },
  { min: 720000.01, max: 1800000, aliquota: 10.7, parcelaADeduzir: 22500 },
  { min: 1800000.01, max: 3600000, aliquota: 14.3, parcelaADeduzir: 87300 },
  { min: 3600000.01, max: 4800000, aliquota: 19.0, parcelaADeduzir: 378000 },
];

const ANEXO_II_INDUSTRIA: Faixa[] = [
  { min: 0, max: 180000, aliquota: 4.5, parcelaADeduzir: 0 },
  { min: 180000.01, max: 360000, aliquota: 7.8, parcelaADeduzir: 5940 },
  { min: 360000.01, max: 720000, aliquota: 10.0, parcelaADeduzir: 13860 },
  { min: 720000.01, max: 1800000, aliquota: 11.2, parcelaADeduzir: 22500 },
  { min: 1800000.01, max: 3600000, aliquota: 14.7, parcelaADeduzir: 85500 },
  { min: 3600000.01, max: 4800000, aliquota: 30.0, parcelaADeduzir: 720000 },
];

const ANEXO_III_SERVICOS: Faixa[] = [
  { min: 0, max: 180000, aliquota: 6.0, parcelaADeduzir: 0 },
  { min: 180000.01, max: 360000, aliquota: 11.2, parcelaADeduzir: 9360 },
  { min: 360000.01, max: 720000, aliquota: 13.5, parcelaADeduzir: 17640 },
  { min: 720000.01, max: 1800000, aliquota: 16.0, parcelaADeduzir: 35640 },
  { min: 1800000.01, max: 3600000, aliquota: 21.0, parcelaADeduzir: 125640 },
  { min: 3600000.01, max: 4800000, aliquota: 33.0, parcelaADeduzir: 648000 },
];

const ANEXO_IV_SERVICOS: Faixa[] = [
  { min: 0, max: 180000, aliquota: 4.5, parcelaADeduzir: 0 },
  { min: 180000.01, max: 360000, aliquota: 9.0, parcelaADeduzir: 8100 },
  { min: 360000.01, max: 720000, aliquota: 10.2, parcelaADeduzir: 12420 },
  { min: 720000.01, max: 1800000, aliquota: 14.0, parcelaADeduzir: 39780 },
  { min: 1800000.01, max: 3600000, aliquota: 22.0, parcelaADeduzir: 183780 },
  { min: 3600000.01, max: 4800000, aliquota: 33.0, parcelaADeduzir: 828000 },
];

const ANEXO_V_SERVICOS: Faixa[] = [
  { min: 0, max: 180000, aliquota: 15.5, parcelaADeduzir: 0 },
  { min: 180000.01, max: 360000, aliquota: 18.0, parcelaADeduzir: 4500 },
  { min: 360000.01, max: 720000, aliquota: 19.5, parcelaADeduzir: 9900 },
  { min: 720000.01, max: 1800000, aliquota: 20.5, parcelaADeduzir: 17100 },
  { min: 1800000.01, max: 3600000, aliquota: 23.0, parcelaADeduzir: 62100 },
  { min: 3600000.01, max: 4800000, aliquota: 30.5, parcelaADeduzir: 540000 },
];

const anexoTables: { [key: string]: Faixa[] } = {
  "Anexo I": ANEXO_I_COMERCIO,
  "Anexo II": ANEXO_II_INDUSTRIA,
  "Anexo III": ANEXO_III_SERVICOS,
  "Anexo IV": ANEXO_IV_SERVICOS,
  "Anexo V": ANEXO_V_SERVICOS,
};

export const calculateSimplesNacionalEffectiveRate = (anexo: string, rbt12: number): number => {
  if (!anexo || rbt12 <= 0 || !anexoTables[anexo]) {
    return 0;
  }

  const table = anexoTables[anexo];
  const faixa = table.find(f => rbt12 >= f.min && rbt12 <= f.max);

  if (!faixa) {
    return 0;
  }

  // Fórmula: (RBT12 * Alíquota Nominal - Parcela a Deduzir) / RBT12
  const effectiveRate = ((rbt12 * (faixa.aliquota / 100)) - faixa.parcelaADeduzir) / rbt12;

  return effectiveRate * 100; // Retorna como porcentagem
};