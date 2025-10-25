import React from 'react';
import { SummarySection } from './SummarySection';
import { SummaryCard } from './SummaryCard';

interface CostSummaryTotalProps {
  totalProductAcquisitionCostBeforeLoss: number; // Custo Bruto Total
  totalProductAcquisitionCostAdjusted: number; // Custo + Perdas Total
  cfu: number;
  totalQuantityOfAllProducts: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const CostSummaryTotal: React.FC<CostSummaryTotalProps> = ({
  totalProductAcquisitionCostBeforeLoss,
  totalProductAcquisitionCostAdjusted,
  cfu,
  totalQuantityOfAllProducts,
}) => {
  
  const fixedCostContributionOfNote = cfu * totalQuantityOfAllProducts;
  const totalCost = totalProductAcquisitionCostAdjusted + fixedCostContributionOfNote;

  // Calculate loss details
  const costBruto = totalProductAcquisitionCostBeforeLoss;
  const costPlusLoss = totalProductAcquisitionCostAdjusted;
  const lossValue = costPlusLoss - costBruto;
  const lossPercentageIncrease = costBruto > 0 
    ? ((costPlusLoss / costBruto) - 1) * 100 
    : 0;
    
  const lossPercentageTitle = lossPercentageIncrease > 0 && lossPercentageIncrease !== Infinity
    ? `Custo + Perdas (+${lossPercentageIncrease.toFixed(2)}%)` 
    : "Custo Ajustado (Perdas)";

  const lossDescription = lossValue > 0 && lossValue !== Infinity
    ? `Custo de aquisição ajustado pela % de perdas. Valor para perdas: ${formatCurrency(lossValue)}`
    : "Custo de aquisição ajustado pela % de perdas.";

  return (
    <SummarySection title="Custos Totais da Nota">
      {/* 1. Custo Bruto Total */}
      <SummaryCard
        title={`Custo Bruto (Aquisição)`}
        value={costBruto}
        description="Custo de aquisição sem ajuste de perdas"
      />
      
      {/* 2. Custo + Perdas Total */}
      <SummaryCard
        title={lossPercentageTitle}
        value={costPlusLoss}
        valueClassName="text-yellow-500"
        description={lossDescription}
      />

      {/* 3. Participação nas Despesas Fixas Total */}
      <SummaryCard
        title="Contrib. Nota p/ Desp. Fixas"
        value={fixedCostContributionOfNote}
        description="Contribuição total desta nota para as despesas fixas"
      />
      
      {/* 4. Custo Total da Nota */}
      <SummaryCard
        title="Custo Total da Nota"
        value={totalCost}
        valueClassName="text-primary"
        description="Custo Ajustado + Contribuição Despesas Fixas"
      />
    </SummarySection>
  );
};