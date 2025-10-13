import React from 'react';
import { SummarySection } from './SummarySection';
import { SummaryCard } from './SummaryCard';

interface CostSummaryProps {
  totalProductAcquisitionCost: number;
  totalFixedExpenses: number; // This will now be the global fixed expenses
  cfu: number;
  totalQuantityOfAllProducts: number; // New prop
}

export const CostSummary: React.FC<CostSummaryProps> = ({
  totalProductAcquisitionCost,
  totalFixedExpenses,
  cfu,
  totalQuantityOfAllProducts,
}) => {
  const fixedCostContributionOfNote = cfu * totalQuantityOfAllProducts;
  const totalCost = totalProductAcquisitionCost + fixedCostContributionOfNote; // Novo cálculo para Custo Total

  return (
    <SummarySection title="Custos">
      <SummaryCard
        title="Custo Total Aquisição"
        value={totalProductAcquisitionCost}
      />
      <SummaryCard
        title="Contrib. Nota p/ Desp. Fixas"
        value={fixedCostContributionOfNote}
        description="Contribuição desta nota para as despesas fixas"
      />
      <SummaryCard
        title="Custo Fixo por Unidade (CFU)"
        value={cfu}
        description="Rateio dos custos fixos por unidade de estoque"
      />
      <SummaryCard
        title="Custo Total"
        value={totalCost}
        valueClassName="text-primary"
        description="Aquisição + Contribuição Despesas Fixas"
      />
    </SummarySection>
  );
};