import React from 'react';
import { SummarySection } from './SummarySection';
import { SummaryCard } from './SummaryCard';

interface SalesSummaryTotalProps {
  totalSellingBestSale: number;
  totalSellingMinSale: number;
}

export const SalesSummaryTotal: React.FC<SalesSummaryTotalProps> = ({
  totalSellingBestSale,
  totalSellingMinSale,
}) => {
  return (
    <SummarySection title="Vendas Totais da Nota">
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
    </SummarySection>
  );
};