import React from 'react';
import { SummarySection } from './SummarySection';
import { SummaryCard } from './SummaryCard';

interface SalesSummaryUnitaryProps {
  totalSellingBestSale: number;
  totalSellingMinSale: number;
  totalInnerUnitsInXML: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const SalesSummaryUnitary: React.FC<SalesSummaryUnitaryProps> = ({
  totalSellingBestSale,
  totalSellingMinSale,
  totalInnerUnitsInXML,
}) => {
  if (totalInnerUnitsInXML === 0) return null;

  const avgSellingPriceBestSale = totalSellingBestSale / totalInnerUnitsInXML;
  const avgSellingPriceMinSale = totalSellingMinSale / totalInnerUnitsInXML;

  return (
    <SummarySection title="Vendas Unitárias (CUMP de Venda)">
      <SummaryCard
        title="Preço de Venda Médio (Alvo)"
        value={avgSellingPriceBestSale}
        valueClassName="text-primary"
        description="Preço médio por unidade interna (varejo)"
      />
      <SummaryCard
        title="Preço de Venda Médio (Mínimo)"
        value={avgSellingPriceMinSale}
        valueClassName="text-yellow-500"
        description="Preço mínimo médio por unidade interna"
      />
    </SummarySection>
  );
};