// NCMs extraídos da Lei Complementar 214/2025 - Anexo XVII
// Este conjunto contém capítulos NCM ou códigos específicos sujeitos ao Imposto Seletivo (IS).
// A lógica de busca deve verificar por prefixos. Por exemplo, se "8703" estiver no conjunto,
// qualquer NCM que comece com "8703" (ex: "87032310") está sujeito ao IS.

export const selectiveTaxNcmSet = new Set<string>([
  // Veículos
  "8703",
  "870421",
  "870431",
  "87044100",
  "87045100",
  "87046000",
  "87049000",
  // Aeronaves e Embarcações
  "8802",
  "8903",
  // Produtos fumígenos
  "2401",
  "2402",
  "2403",
  "2404",
  // Bebidas alcóolicas
  "2203",
  "2204",
  "2205",
  "2206",
  "2208",
  // Bebidas açucaradas
  "22021000",
  // Bens minerais
  "2601",
  "27090010",
  "27111100",
  "27112100",
]);

// Exceções específicas às regras gerais acima.
export const selectiveTaxNcmExceptionsSet = new Set<string>([
  "88026000", // Veículos espaciais (incluindo satélites) e seus veículos de lançamento e veículos suborbitais
]);