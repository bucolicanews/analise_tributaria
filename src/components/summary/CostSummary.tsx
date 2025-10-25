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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const CostSummary: React.FC<CostSummaryProps> = ({
  totalProductAcquisitionCostBeforeLoss,
  totalProductAcquisitionCostAdjusted,
  cfu,
  totalQuantityOfAllProducts,
}) => {
  const fixedCostContributionOfNote = cfu * totalQuantityOfAllProducts;
  const totalCost = totalProductAcquisitionCostAdjusted + fixedCostContributionOfNote;

  const lossValue = totalProductAcquisitionCostAdjusted - totalProductAcquisitionCostBeforeLoss;

  const lossPercentageIncrease = totalProductAcquisitionCostBeforeLoss > 0 
    ? ((totalProductAcquisitionCostAdjusted / totalProductAcquisitionCostBeforeLoss) - 1) * 100 
    : 0;
    
  const lossPercentageTitle = lossPercentageIncrease > 0 && lossPercentageIncrease !== Infinity
    ? `Custo + Perdas (+${lossPercentageIncrease.toFixed(2)}%)` 
    : "Custo Ajustado (Perdas)";

  const lossDescription = lossValue > 0 && lossValue !== Infinity
    ? `Custo de aquisição ajustado pela % de perdas. Valor para perdas: ${formatCurrency(lossValue)}`
    : "Custo de aquisição ajustado pela % de perdas.";

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
        description={lossDescription}
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