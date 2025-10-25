import React from 'react';
import { SummarySection } from './SummarySection';
import { SummaryCard } from './SummaryCard';

interface UnitCostData {
  unitCostBruto: number;
  unitCostPlusLoss: number;
  unitCostPlusFixed: number;
  cfu: number;
  unitQuantity: number;
}

interface CostSummaryProps {
  totalProductAcquisitionCostBeforeLoss: number; // Custo Bruto Total
  totalProductAcquisitionCostAdjusted: number; // Custo + Perdas Total
  totalFixedExpenses: number; 
  cfu: number;
  totalQuantityOfAllProducts: number;
  unitCostData: UnitCostData | null; // Dados unitários se apenas 1 produto selecionado
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
  unitCostData,
}) => {
  
  const isUnitView = unitCostData !== null;

  // Determine values based on view mode
  const costBruto = isUnitView ? unitCostData.unitCostBruto : totalProductAcquisitionCostBeforeLoss;
  const costPlusLoss = isUnitView ? unitCostData.unitCostPlusLoss : totalProductAcquisitionCostAdjusted;
  const fixedContribution = isUnitView ? unitCostData.cfu : (cfu * totalQuantityOfAllProducts);
  const totalCost = isUnitView ? unitCostData.unitCostPlusFixed : (totalProductAcquisitionCostAdjusted + (cfu * totalQuantityOfAllProducts));

  // Calculate loss details
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

  // Determine titles
  const titleSuffix = isUnitView ? " (Unitário)" : " (Total da Nota)";
  const fixedTitle = isUnitView ? "Contrib. Fixa (Unitário)" : "Contrib. Nota p/ Desp. Fixas";
  const fixedDescription = isUnitView ? "Custo Fixo Rateado por Unidade (CFU)" : "Contribuição desta nota para as despesas fixas";
  const totalTitle = isUnitView ? "Custo Total (Unitário)" : "Custo Total";


  return (
    <SummarySection title={`Custos ${titleSuffix}`}>
      {/* 1. Custo Bruto */}
      <SummaryCard
        title={`Custo Bruto (Aquisição)`}
        value={costBruto}
        description="Custo de aquisição sem ajuste de perdas"
      />
      
      {/* 2. Custo + Perdas */}
      <SummaryCard
        title={lossPercentageTitle}
        value={costPlusLoss}
        valueClassName="text-yellow-500"
        description={lossDescription}
      />

      {/* 3. Participação nas Despesas Fixas */}
      <SummaryCard
        title={fixedTitle}
        value={fixedContribution}
        description={fixedDescription}
      />
      
      {/* 4. Custo Total */}
      <SummaryCard
        title={totalTitle}
        value={totalCost}
        valueClassName="text-primary"
        description="Custo Ajustado + Contribuição Despesas Fixas"
      />
    </SummarySection>
  );
};