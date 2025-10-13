import React from 'react';
import { SummarySection } from './SummarySection';
import { SummaryCard } from './SummaryCard';

interface SalesSummaryProps {
  totalSellingBestSale: number;
  totalSellingMinSale: number;
  // breakEvenPoint: number; // Removido
}

export const SalesSummary: React.FC<SalesSummaryProps> = ({
  totalSellingBestSale,
  totalSellingMinSale,
  // breakEvenPoint, // Removido
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
      {/* Card Ponto de Equilíbrio removido daqui */}
    </SummarySection>
  );
};