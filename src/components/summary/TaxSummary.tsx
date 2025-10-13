import React from 'react';
import { SummarySection } from './SummarySection';
import { SummaryCard } from './SummaryCard';
import { CalculationParams, TaxRegime } from '@/types/pricing';
import { GlobalSummaryData } from '../ProductsTable';

interface TaxSummaryProps {
  params: CalculationParams;
  summaryDataBestSale: GlobalSummaryData;
  summaryDataMinSale: GlobalSummaryData;
  totalOptionCost: number;
}

export const TaxSummary: React.FC<TaxSummaryProps> = ({
  params,
  summaryDataBestSale,
  summaryDataMinSale,
  totalOptionCost,
}) => {
  return (
    <SummarySection title="Impostos">
      <SummaryCard
        title="Impostos Líquidos (Alvo)"
        value={summaryDataBestSale.totalTax}
        description={`(${summaryDataBestSale.totalTaxPercent.toFixed(2)}% da Venda)`}
        valueClassName="text-destructive"
      />
      <SummaryCard
        title="Impostos Líquidos (Mínimo)"
        value={summaryDataMinSale.totalTax}
        description={`(${summaryDataMinSale.totalTaxPercent.toFixed(2)}% da Venda)`}
        valueClassName="text-destructive"
      />

      {params.taxRegime === TaxRegime.LucroPresumido && (
        <React.Fragment>
          <SummaryCard
            title="IRPJ a Pagar (Alvo)"
            value={summaryDataBestSale.totalIrpjToPay}
            valueClassName="text-destructive"
          />
          <SummaryCard
            title="CSLL a Pagar (Alvo)"
            value={summaryDataBestSale.totalCsllToPay}
            valueClassName="text-destructive"
          />
        </React.Fragment>
      )}

      {params.taxRegime === TaxRegime.SimplesNacional && (
        <React.Fragment>
          <SummaryCard
            title="Simples Nacional a Pagar (Alvo)"
            value={summaryDataBestSale.totalSimplesToPay}
            valueClassName="text-destructive"
          />
          {params.generateIvaCredit && (
            <SummaryCard
              title="Simples Nacional a Pagar (Remanescente)"
              value={summaryDataBestSale.totalSimplesToPay}
              valueClassName="text-destructive"
              description="Alíquota remanescente para IRPJ, CSLL, CPP"
            />
          )}
          <SummaryCard
            title="Custo da Opção Híbrida"
            value={totalOptionCost}
            valueClassName="text-yellow-500"
            description="Diferença de impostos entre Simples Padrão e Híbrido"
          />
        </React.Fragment>
      )}

      {(params.taxRegime === TaxRegime.LucroPresumido || (params.taxRegime === TaxRegime.SimplesNacional && params.generateIvaCredit)) && (
        <React.Fragment>
          <SummaryCard
            title="Crédito CBS Total"
            value={summaryDataBestSale.totalCbsCredit}
            valueClassName="text-success"
          />
          <SummaryCard
            title="Débito CBS Total"
            value={summaryDataBestSale.totalCbsDebit}
            valueClassName="text-destructive"
          />
          <SummaryCard
            title="CBS a Pagar Total"
            value={summaryDataBestSale.totalCbsTaxToPay}
          />
          <SummaryCard
            title="Crédito IBS Total"
            value={summaryDataBestSale.totalIbsCredit}
            valueClassName="text-success"
          />
          <SummaryCard
            title="Débito IBS Total"
            value={summaryDataBestSale.totalIbsDebit}
            valueClassName="text-destructive"
          />
          <SummaryCard
            title="IBS a Pagar Total"
            value={summaryDataBestSale.totalIbsTaxToPay}
          />
          <SummaryCard
            title="IVA Crédito p/ Cliente"
            value={summaryDataBestSale.totalIvaCreditForClient}
            valueClassName="text-success"
            description="Crédito de IVA gerado para o cliente (se aplicável)"
          />
        </React.Fragment>
      )}
    </SummarySection>
  );
};