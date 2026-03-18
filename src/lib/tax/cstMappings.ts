export const getPisCofinsEntradaCST = (cstSaida: string): string => {
  switch (cstSaida) {
    case '01':
    case '02':
    case '03':
      return '50';
    case '04':
      return '70';
    case '05':
      return '75';
    case '06':
      return '73';
    case '07':
      return '71';
    case '08':
      return '74';
    case '09':
      return '72';
    case '49':
      return '98';
    default:
      return '99'; // Retorno padrão para casos não mapeados
  }
};
