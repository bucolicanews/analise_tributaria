export enum TaxRegime {
  SimplesNacional = "Simples Nacional",
  LucroPresumido = "Lucro Presumido",
  LucroReal = "Lucro Real",
}

// Granularidade Nível 10/10 conforme LC 214
export type EssentialityLevel = 'cesta_basica' | 'reducao_60' | 'padrao' | 'potencial_seletivo';

export interface Product {
  code: string;
  name: string;
  ean?: string; 
  cost: number; 
  unit: string; 
  quantity: number; 
  innerQuantity: number; 
  pisCredit: number; 
  cofinsCredit: number; 
  icmsCredit: number; 
  cfop?: string;
  cst?: string;
  ncm?: string;
  cest?: string;
  pisCst?: string;
  cofinsCst?: string;
  ipiCst?: string;
}

export interface FixedExpense {
  name: string;
  value: number;
}

export interface VariableExpense {
  name: string;
  percentage: number;
}

export interface SelectiveTaxRate {
  ncm: string;
  rate: number;
  description: string;
}

export type SupplierType = 'industria' | 'distribuidor' | 'importador' | 'desconhecido';
export type CustomerType = 'B2C' | 'B2B' | 'misto' | 'desconhecido';

export interface PurchaseProfile {
  supplierType: SupplierType;
  supplierRegime: TaxRegime | 'desconhecido';
  creditEligible: boolean;
}

export interface SalesProfile {
  customerType: CustomerType;
  percentageB2B: number;
  interestateSalesPercent: number; 
}

export interface RegulatoryRisk {
  essentialFoodCandidate: boolean;
  healthTaxRisk: boolean;
  essentiality: EssentialityLevel; 
}

export interface StrategicData {
  purchaseProfile: PurchaseProfile;
  salesProfile: SalesProfile;
  regulatoryRisk: RegulatoryRisk;
}

export interface CalculationParams {
  companyName?: string;
  companyCnpj?: string;
  companyCnaes?: string;
  companyState?: string; 
  companyLegalNature?: string; 
  
  profitMargin: number;
  taxPassThroughPercentage?: number; // NOVO: 0 a 100% de repasse
  
  fixedExpenses: FixedExpense[];
  variableExpenses: VariableExpense[];
  payroll: number;
  inssPatronalRate: number;
  totalStockUnits: number; 
  lossPercentage: number; 
  
  taxRegime: TaxRegime;
  simplesNacionalRate: number; 
  generateIvaCredit: boolean; 
  irpjRate: number; 
  csllRate: number; 
  irpjRateLucroReal: number; 
  csllRateLucroReal: number; 

  cbsRate: number;
  ibsRate: number;
  defaultSelectiveTaxRate: number; 
  selectiveTaxRates: SelectiveTaxRate[]; 

  usePisCofins: boolean; 
  icmsPercentage: number; 

  useSelectiveTaxDebit: boolean; 
  useCbsDebit: boolean; 
  ibsDebitPercentage: number; 

  faturamento12Meses?: number;
  anexoSimples?: string;
  tipoOperacao?: 'Varejo' | 'Atacado';

  fixedCostsTotal?: number;
}

export interface CalculatedProduct extends Product {
  effectiveCost: number;
  sellingPrice: number;
  minSellingPrice: number;
  cbsCredit: number;
  ibsCredit: number;
  cbsDebit: number;
  ibsDebit: number;
  taxToPay: number; 
  cbsTaxToPay: number; 
  ibsTaxToPay: number; 
  irpjToPay: number; 
  csllToPay: number; 
  simplesToPay: number; 
  selectiveTaxToPay: number; 
  markupPercentage: number;

  valueForTaxes: number;
  valueForVariableExpenses: number;
  valueForFixedCost: number;
  valueForProfit: number;
  contributionMargin: number; 
  ivaCreditForClient: number; 

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
  selectiveTaxToPayPerInnerUnit: number; 

  cfop: string;
  cst: string;
  status: "OK" | "PREÇO CORRIGIDO"; 

  taxAnalysis: {
    icms: 'Substituição Tributária' | 'Tributado Integralmente';
    pisCofins: 'Monofásico (Receita Segregada)' | 'Tributado (Alíquota Unificada no DAS)' | 'Débito e Crédito (Não Cumulativo)';
    wasNcmFound: boolean;
    incideIS: boolean;
  };

  suggestedCodes: {
    icmsCstOrCsosn: string;
    pisCofinsCst: string;
  };

  cClassTrib?: number;
  strategicData?: StrategicData;
}