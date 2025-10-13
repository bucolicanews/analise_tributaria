import React from 'react';
import { SummarySection } from './SummarySection';
import { SummaryCard } from './SummaryCard';

interface SalesSummaryProps {
  totalSellingBestSale: number;
  totalSellingMinSale: number;
  breakEvenPoint: number;
}

export const SalesSummary: React.FC<SalesSummaryProps> = ({
  totalSellingBestSale,
  totalSellingMinSale,
  breakEvenPoint,
}) => {
  return (
    <SummarySection title="Vendas">
      <SummaryCard
        title="Valor de Venda Total (Alvo)"
        value={totalSellingBestSale}
        valueClassName="text-primary"
      />
      <SummaryCard
        title="Valor de Venda Total (Mínimo)"
        value={totalSellingMinSale}
        valueClassName="text-yellow-500"
        description="Cobre custos variáveis e impostos diretos"
      />
      <SummaryCard
        title="Ponto de Equilíbrio"
        value={breakEvenPoint}
        valueClassName="text-yellow-500"
        description="Faturamento mínimo para cobrir custos"
      />
    </SummarySection>
  );
};