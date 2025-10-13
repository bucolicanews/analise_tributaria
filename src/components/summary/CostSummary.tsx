import React from 'react';
import { SummarySection } from './SummarySection';
import { SummaryCard } from './SummaryCard';

interface CostSummaryProps {
  totalProductAcquisitionCost: number;
  totalFixedExpenses: number;
  cfu: number;
}

export const CostSummary: React.FC<CostSummaryProps> = ({
  totalProductAcquisitionCost,
  totalFixedExpenses,
  cfu,
}) => {
  return (
    <SummarySection title="Custos">
      <SummaryCard
        title="Custo Total Aquisição"
        value={totalProductAcquisitionCost}
      />
      <SummaryCard
        title="Despesas Fixas Totais"
        value={totalFixedExpenses}
      />
      <SummaryCard
        title="Custo Fixo por Unidade (CFU)"
        value={cfu}
        description="Rateio dos custos fixos por unidade de estoque"
      />
    </SummarySection>
  );
};