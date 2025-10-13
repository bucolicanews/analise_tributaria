import React from 'react';
import { SummarySection } from './SummarySection';
import { SummaryCard } from './SummaryCard';

interface ExpenseSummaryProps {
  totalFixedExpenses: number;
  totalVariableExpensesValueBestSale: number;
  totalVariableExpensesValueMinSale: number;
}

export const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({
  totalFixedExpenses,
  totalVariableExpensesValueBestSale,
  totalVariableExpensesValueMinSale,
}) => {
  return (
    <SummarySection title="Despesas">
      <SummaryCard
        title="Despesas Fixas Totais"
        value={totalFixedExpenses}
      />
      <SummaryCard
        title="Despesas Variáveis Totais (Alvo)"
        value={totalVariableExpensesValueBestSale}
      />
      <SummaryCard
        title="Despesas Variáveis Totais (Mínimo)"
        value={totalVariableExpensesValueMinSale}
      />
    </SummarySection>
  );
};