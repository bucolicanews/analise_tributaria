import React from 'react';
import { SummarySection } from './SummarySection';
import { SummaryCard } from './SummaryCard';

interface ExpenseSummaryProps {
  totalFixedExpenses: number;
  totalVariableExpensesValueBestSale: number;
  totalVariableExpensesValueMinSale: number;
  cfu: number; // New prop: Custo Fixo por Unidade Interna
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

  // Cálculos Unitários
  const unitVariableExpensesBestSale = totalInnerUnitsInXML > 0 ? totalVariableExpensesValueBestSale / totalInnerUnitsInXML : 0;
  const unitVariableExpensesMinSale = totalInnerUnitsInXML > 0 ? totalVariableExpensesValueMinSale / totalInnerUnitsInXML : 0;

  return (
    <SummarySection title="Despesas">
      {/* Linha 1: Totais */}
      <SummaryCard
        title="Despesas Fixas Globais"
        value={totalFixedExpenses}
        description="Total de despesas fixas da empresa"
      />
      <SummaryCard
        title="Contrib. Nota p/ Desp. Fixas (Total)"
        value={fixedCostContributionOfNote}
        description="Contribuição total desta nota para as despesas fixas"
      />
      <SummaryCard
        title="Despesas Variáveis Totais (Alvo)"
        value={totalVariableExpensesValueBestSale}
      />
      <SummaryCard
        title="Despesas Variáveis Totais (Mínimo)"
        value={totalVariableExpensesValueMinSale}
      />

      {/* Linha 2: Unitários */}
      <SummaryCard
        title="Custo Fixo Rateado (Unitário)"
        value={cfu}
        description="Custo Fixo por Unidade Interna (CFU)"
      />
      <SummaryCard
        title="Despesas Variáveis Unitárias (Alvo)"
        value={unitVariableExpensesBestSale}
        description="Despesa variável média por unidade interna"
      />
      <SummaryCard
        title="Despesas Variáveis Unitárias (Mínimo)"
        value={unitVariableExpensesMinSale}
        description="Despesa variável mínima média por unidade interna"
      />
    </SummarySection>
  );
};