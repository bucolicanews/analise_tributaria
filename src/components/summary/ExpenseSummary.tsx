import React from 'react';
import { SummarySection } from './SummarySection';
import { SummaryCard } from './SummaryCard';

interface ExpenseSummaryProps {
  totalFixedExpenses: number;
  totalVariableExpensesValueBestSale: number;
  totalVariableExpensesValueMinSale: number;
  cfu: number; // New prop
  totalInnerUnitsInXML: number; // Total de unidades internas (ETU da nota)
}

export const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({
  totalFixedExpenses,
  totalVariableExpensesValueBestSale,
  totalVariableExpensesValueMinSale,
  cfu,
  totalInnerUnitsInXML,
}) => {
  const fixedCostContributionOfNote = cfu * totalInnerUnitsInXML;

  return (
    <SummarySection title="Despesas">
      <SummaryCard
        title="Despesas Fixas Globais"
        value={totalFixedExpenses}
        description="Total de despesas fixas da empresa"
      />
      <SummaryCard
        title="Contrib. Nota p/ Desp. Fixas"
        value={fixedCostContributionOfNote}
        description="Contribuição desta nota para as despesas fixas"
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