import React from 'react';
import { SummarySection } from './SummarySection';
import { SummaryCard } from './SummaryCard';

interface CumpData {
  cumpBruto: number;
  cumpPlusLoss: number;
  cumpTotal: number;
  cfu: number;
}

interface CostSummaryUnitaryProps {
  cumpData: CumpData | null; // Dados CUMP se houver produtos selecionados
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const CostSummaryUnitary: React.FC<CostSummaryUnitaryProps> = ({
  cumpData,
}) => {
  
  if (!cumpData) {
    return null; // Não exibe nada se não houver produtos selecionados para calcular o CUMP
  }

  const costBruto = cumpData.cumpBruto;
  const costPlusLoss = cumpData.cumpPlusLoss;
  const fixedContribution = cumpData.cfu;
  const totalCost = cumpData.cumpTotal;

  // Calculate loss details
  const lossValue = costPlusLoss - costBruto;
  const lossPercentageIncrease = costBruto > 0 
    ? ((costPlusLoss / costBruto) - 1) * 100 
    : 0;
    
  const lossPercentageTitle = lossPercentageIncrease > 0 && lossPercentageIncrease !== Infinity
    ? `Custo + Perdas (+${lossPercentageIncrease.toFixed(2)}%)` 
    : "Custo Ajustado (Perdas)";

  const lossDescription = lossValue > 0 && lossValue !== Infinity
    ? `Custo de aquisição unitário ajustado pela % de perdas. Valor para perdas: ${formatCurrency(lossValue)}`
    : "Custo de aquisição unitário ajustado pela % de perdas.";

  return (
    <SummarySection title="Custos Unitários (CUMP)">
      {/* 1. Custo Bruto Unitário */}
      <SummaryCard
        title={`Custo Bruto (Aquisição)`}
        value={costBruto}
        description="Custo de aquisição unitário médio ponderado"
      />
      
      {/* 2. Custo + Perdas Unitário */}
      <SummaryCard
        title={lossPercentageTitle}
        value={costPlusLoss}
        valueClassName="text-yellow-500"
        description={lossDescription}
      />

      {/* 3. Participação nas Despesas Fixas Unitário */}
      <SummaryCard
        title="Contrib. Fixa (Unitário)"
        value={fixedContribution}
        description="Custo Fixo Rateado por Unidade (CFU)"
      />
      
      {/* 4. Custo Total Unitário */}
      <SummaryCard
        title="Custo Total (Unitário)"
        value={totalCost}
        valueClassName="text-primary"
        description="Custo Ajustado Unitário + Contribuição Fixa Unitária"
      />
    </SummarySection>
  );
};