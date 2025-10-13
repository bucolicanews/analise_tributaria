import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GlobalSummaryData } from '../ProductsTable';
import { cn } from '@/lib/utils';

interface OverallResultSummaryProps {
  totalProductAcquisitionCost: number;
  totalFixedExpenses: number;
  totalVariableExpensesPercent: number;
  summaryDataBestSale: GlobalSummaryData;
  summaryDataMinSale: GlobalSummaryData;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const OverallResultSummary: React.FC<OverallResultSummaryProps> = ({
  totalProductAcquisitionCost,
  totalFixedExpenses,
  totalVariableExpensesPercent,
  summaryDataBestSale,
  summaryDataMinSale,
}) => {
  // Calculations for Best Sale
  const grossProfitBestSale = summaryDataBestSale.totalSelling - totalProductAcquisitionCost;
  const variablePaymentsBestSale = summaryDataBestSale.totalVariableExpensesValue;
  const fixedPaymentsBestSale = totalFixedExpenses;
  const contributionBestSale = summaryDataBestSale.totalContributionMargin;
  const netProfitBestSale = summaryDataBestSale.totalProfit;

  // Calculations for Minimum Sale
  const grossProfitMinSale = summaryDataMinSale.totalSelling - totalProductAcquisitionCost;
  const variablePaymentsMinSale = summaryDataMinSale.totalVariableExpensesValue;
  const fixedPaymentsMinSale = totalFixedExpenses;
  const contributionMinSale = summaryDataMinSale.totalContributionMargin;
  const netProfitMinSale = summaryDataMinSale.totalProfit;

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="text-xl">Resultado Geral da Operação</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-sm font-mono">
          {/* Headers */}
          <div className="font-semibold text-muted-foreground">Métrica</div>
          <div className="font-semibold text-primary text-right">Cenário Alvo</div>
          <div className="font-semibold text-yellow-500 text-right">Cenário Mínimo</div>

          {/* Custo Total */}
          <div className="py-2 border-t border-border">Custo Total (Aquisição + Fixo)</div>
          <div className="py-2 border-t border-border text-right">{formatCurrency(totalProductAcquisitionCost + totalFixedExpenses)}</div>
          <div className="py-2 border-t border-border text-right">{formatCurrency(totalProductAcquisitionCost + totalFixedExpenses)}</div>

          {/* Valor de Venda */}
          <div className="py-2 border-t border-border">Valor de Venda</div>
          <div className="py-2 border-t border-border text-right text-primary font-bold">{formatCurrency(summaryDataBestSale.totalSelling)}</div>
          <div className="py-2 border-t border-border text-right text-yellow-500 font-bold">{formatCurrency(summaryDataMinSale.totalSelling)}</div>

          {/* Lucro Bruto */}
          <div className="py-2 border-t border-border">Lucro Bruto</div>
          <div className="py-2 border-t border-border text-right">{formatCurrency(grossProfitBestSale)}</div>
          <div className="py-2 border-t border-border text-right">{formatCurrency(grossProfitMinSale)}</div>

          {/* Pagamento Variáveis */}
          <div className="py-2 border-t border-border">Despesas Variáveis</div>
          <div className="py-2 border-t border-border text-right">{formatCurrency(variablePaymentsBestSale)}</div>
          <div className="py-2 border-t border-border text-right">{formatCurrency(variablePaymentsMinSale)}</div>

          {/* Pagamento das Fixas (já incluído no custo total, mas para visualização) */}
          <div className="py-2 border-t border-border">Despesas Fixas</div>
          <div className="py-2 border-t border-border text-right">{formatCurrency(fixedPaymentsBestSale)}</div>
          <div className="py-2 border-t border-border text-right">{formatCurrency(fixedPaymentsMinSale)}</div>

          {/* Impostos Totais */}
          <div className="py-2 border-t border-border">Impostos Líquidos</div>
          <div className="py-2 border-t border-border text-right text-destructive">{formatCurrency(summaryDataBestSale.totalTax)}</div>
          <div className="py-2 border-t border-border text-right text-destructive">{formatCurrency(summaryDataMinSale.totalTax)}</div>

          {/* Margem de Contribuição */}
          <div className="py-2 border-t border-border">Margem de Contribuição</div>
          <div className="py-2 border-t border-border text-right text-accent font-bold">{formatCurrency(contributionBestSale)}</div>
          <div className="py-2 border-t border-border text-right text-accent font-bold">{formatCurrency(contributionMinSale)}</div>

          {/* Lucro Líquido */}
          <div className="py-2 border-t border-border">Lucro Líquido</div>
          <div className="py-2 border-t border-border text-right text-success font-bold">{formatCurrency(netProfitBestSale)}</div>
          <div className="py-2 border-t border-border text-right text-success font-bold">{formatCurrency(netProfitMinSale)}</div>
        </div>
      </CardContent>
    </Card>
  );
};