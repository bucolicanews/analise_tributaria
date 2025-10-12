export interface Product {
  code: string;
  name: string;
  cost: number;
  unit: string; // New field: Unidade de medida
  quantity: number; // New field: Quantidade comercial
  pisCredit: number;
  cofinsCredit: number;
  icmsCredit: number;
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
  simplesNacional: number;
  payroll: number;
}

export interface CalculatedProduct extends Product {
  effectiveCost: number;
  sellingPrice: number;
  minSellingPrice: number; // New field: Menor valor a ser vendido (cobre custo efetivo + despesas variáveis + simples nacional)
  cbsCredit: number;
  ibsCredit: number;
  cbsDebit: number;
  ibsDebit: number;
  taxToPay: number; // Total tax to pay
  cbsTaxToPay: number; // New field: CBS a pagar (débito - crédito)
  ibsTaxToPay: number; // New field: IBS a pagar (débito - crédito)
  markupPercentage: number; // New field: Porcentagem de markup aplicada
  cfop: string;
  cst: string;
}