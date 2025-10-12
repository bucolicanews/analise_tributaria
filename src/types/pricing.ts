export interface Product {
  code: string;
  name: string;
  cost: number;
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
  cbsCredit: number;
  ibsCredit: number;
  cbsDebit: number;
  ibsDebit: number;
  taxToPay: number;
  cfop: string;
  cst: string;
}
