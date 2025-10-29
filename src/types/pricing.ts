export enum TaxRegime {
  SimplesNacional = "Simples Nacional",
  LucroPresumido = "Lucro Presumido",
}

export interface Product {
  code: string;
  name: string;
  cost: number; // Custo por unidade comercial (e.g., por caixa)
  unit: string; // Unidade de medida comercial (e.g., CX, UN)
  quantity: number; // Quantidade de unidades comerciais (e.g., número de caixas)
  innerQuantity: number; // Nova: Quantidade de unidades internas por unidade comercial (e.g., 30 de '30X300G')
  pisCredit: number; // Crédito PIS por unidade comercial
  cofinsCredit: number; // Crédito COFINS por unidade comercial
  icmsCredit: number; // Crédito ICMS por unidade comercial
  cfop?: string;
  cst?: string;
}

export interface FixedExpense {
  name: string;
  value: number;
}

export interface VariableExpense {
  name: string;
  percentage: number;
}

export interface CalculationParams {
  profitMargin: number;
  fixedExpenses: FixedExpense[];
  variableExpenses: VariableExpense[];
  payroll: number;
  totalStockUnits: number; // Novo: Estoque Total de Unidades para rateio de custos fixos
  lossPercentage: number; // Novo: Porcentagem de perdas e quebras
  
  // Novos campos para regimes tributários
  taxRegime: TaxRegime;
  simplesNacionalRate: number; // Alíquota total do Simples Nacional (cheia)
  simplesNacionalRemanescenteRate: number; // Novo: Alíquota do Simples Nacional Remanescente (IRPJ, CSLL, CPP)
  generateIvaCredit: boolean; // Novo: Flag para Simples Nacional Híbrido (gerar crédito de IVA)
  irpjRate: number; // Alíquota IRPJ para Lucro Presumido
  csllRate: number; // Alíquota CSLL para Lucro Presumido

  // Novas alíquotas de impostos
  cbsRate: number;
  ibsRate: number;
  selectiveTaxRate: number;
}

export interface CalculatedProduct extends Product {
  // Valores por Unidade Comercial
  effectiveCost: number;
  sellingPrice: number;
  minSellingPrice: number;
  cbsCredit: number;
  ibsCredit: number;
  cbsDebit: number;
  ibsDebit: number;
  taxToPay: number; // Total tax to pay
  cbsTaxToPay: number; // CBS a pagar (débito - crédito)
  ibsTaxToPay: number; // IBS a pagar (débito - crédito)
  irpjToPay: number; // Novo: IRPJ a pagar
  csllToPay: number; // Novo: CSLL a pagar
  simplesToPay: number; // Novo: Simples Nacional a pagar
  selectiveTaxToPay: number; // Imposto Seletivo a pagar
  markupPercentage: number;

  // Novos campos: Detalhamento do Preço de Venda (por Unidade Comercial)
  valueForTaxes: number;
  valueForVariableExpenses: number;
  valueForFixedCost: number;
  valueForProfit: number;
  contributionMargin: number; // Margem de Contribuição por Unidade Comercial
  ivaCreditForClient: number; // Novo: Crédito de IVA gerado para o cliente (se aplicável)

  // Novos campos: Valores por Unidade Interna
  costPerInnerUnit: number;
  effectiveCostPerInnerUnit: number;
  sellingPricePerInnerUnit: number;
  minSellingPricePerInnerUnit: number;
  cbsCreditPerInnerUnit: number;
  ibsCreditPerInnerUnit: number;
  cbsDebitPerInnerUnit: number;
  ibsDebitPerInnerUnit: number;
  taxToPayPerInnerUnit: number;
  cbsTaxToPayPerInnerUnit: number;
  ibsTaxToPayPerInnerUnit: number;
  irpjToPayPerInnerUnit: number;
  csllToPayPerInnerUnit: number;
  simplesToPayPerInnerUnit: number;
  selectiveTaxToPayPerInnerUnit: number; // Imposto Seletivo por unidade interna

  cfop: string;
  cst: string;
  status: "OK" | "PREÇO CORRIGIDO"; // Novo: Status do produto
}