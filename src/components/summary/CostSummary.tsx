import React from 'react';
import { SummarySection } from './SummarySection';
import { SummaryCard } from './SummaryCard';

interface CostSummaryProps {
  totalProductAcquisitionCostBeforeLoss: number; // Custo Bruto
  totalProductAcquisitionCostAdjusted: number; // Custo + Perdas
  totalFixedExpenses: number; 
  cfu: number;
  totalQuantityOfAllProducts: number;
}

export const CostSummary: React.FC<CostSummaryProps> = ({
  totalProductAcquisitionCostBeforeLoss,
  totalProductAcquisitionCostAdjusted,
  cfu,
  totalQuantityOfAllProducts,
}) => {
  const fixedCostContributionOfNote = cfu * totalQuantityOfAllProducts;
  const totalCost = totalProductAcquisitionCostAdjusted + fixedCostContributionOfNote;

  const lossPercentageIncrease = totalProductAcquisitionCostBeforeLoss > 0 
    ? ((totalProductAcquisitionCostAdjusted / totalProductAcquisitionCostBeforeLoss) - 1) * 100 
    : 0;
    
  const lossPercentageTitle = lossPercentageIncrease > 0 && lossPercentageIncrease !== Infinity
    ? `Custo + Perdas (+${lossPercentageIncrease.toFixed(2)}%)` 
    : "Custo Ajustado (Perdas)";

  return (
    <SummarySection title="Custos">
      {/* 1. Custo Bruto */}
      <SummaryCard
        title="Custo Bruto (Aquisição)"
        value={totalProductAcquisitionCostBeforeLoss}
        description="Custo de aquisição sem ajuste de perdas"
      />
      
      {/* 2. Custo + Perdas */}
      <SummaryCard
        title={lossPercentageTitle}
        value={totalProductAcquisitionCostAdjusted}
        valueClassName="text-yellow-500"
        description="Custo de aquisição ajustado pela % de perdas"
      />

      {/* 3. Participação nas Despesas Fixas */}
      <SummaryCard
        title="Contrib. Nota p/ Desp. Fixas"
        value={fixedCostContributionOfNote}
        description="Contribuição desta nota para as despesas fixas"
      />
      
      {/* 4. Custo Total */}
      <SummaryCard
        title="Custo Total"
        value={totalCost}
        valueClassName="text-primary"
        description="Custo Ajustado + Contribuição Despesas Fixas"
      />
    </SummarySection>
  );
};