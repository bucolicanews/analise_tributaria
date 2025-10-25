import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlobalSummaryData } from '../ProductsTable';
import { cn } from '@/lib/utils';
import { DollarSign, TrendingUp, Package } from 'lucide-react';

interface CumpData {
  cumpBruto: number;
  cumpPlusLoss: number;
  cumpTotal: number;
  cfu: number;
}

interface ExecutiveSummaryProps {
  summaryDataBestSale: GlobalSummaryData;
  cumpData: CumpData | null;
  totalProductAcquisitionCostAdjusted: number; // Custo de Aquisição Total Ajustado (Custo + Perdas)
  totalInnerUnitsInXML: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const SummaryItem: React.FC<{ title: string; value: number; icon: React.ReactNode; valueClassName?: string; description: string }> = ({
  title,
  value,
  icon,
  valueClassName,
  description,
}) => (
  <div className="flex items-center space-x-4 p-4 rounded-lg bg-card/50 border border-border/50 transition-shadow hover:shadow-card">
    <div className={cn("p-3 rounded-full", valueClassName === 'text-success' ? 'bg-success/20' : valueClassName === 'text-primary' ? 'bg-primary/20' : 'bg-muted/50')}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className={cn("text-xl font-extrabold", valueClassName)}>{formatCurrency(value)}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  </div>
);

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  summaryDataBestSale,
  cumpData,
  totalProductAcquisitionCostAdjusted,
  totalInnerUnitsInXML,
}) => {
  // Valores Totais (da Nota)
  const totalCost = totalProductAcquisitionCostAdjusted + (cumpData ? cumpData.cfu * totalInnerUnitsInXML : 0);
  const totalSelling = summaryDataBestSale.totalSelling;
  const totalProfit = summaryDataBestSale.totalProfit;

  // Valores Unitários (CUMP - por unidade interna)
  const unitCost = cumpData?.cumpTotal || 0;
  const unitSelling = totalInnerUnitsInXML > 0 ? totalSelling / totalInnerUnitsInXML : 0;
  const unitProfit = totalInnerUnitsInXML > 0 ? totalProfit / totalInnerUnitsInXML : 0;

  return (
    <div className="space-y-6">
      <Card className="shadow-elegant border-primary/50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary">Resumo Executivo da Precificação (Cenário Alvo)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna 1: Totais da Nota */}
            <div className="space-y-4 border-b lg:border-b-0 lg:border-r border-border pr-6 pb-6 lg:pb-0">
              <h3 className="text-lg font-semibold text-foreground">Valores Totais da Nota</h3>
              <SummaryItem
                title="Custo Total (Nota)"
                value={totalCost}
                icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
                description="Aquisição Ajustada + Contribuição Fixa"
              />
              <SummaryItem
                title="Venda Sugerida (Nota)"
                value={totalSelling}
                icon={<TrendingUp className="h-5 w-5 text-primary" />}
                valueClassName="text-primary"
                description="Valor total de venda para atingir o lucro alvo"
              />
              <SummaryItem
                title="Lucro Líquido (Nota)"
                value={totalProfit}
                icon={<Package className="h-5 w-5 text-success" />}
                valueClassName="text-success"
                description={`Margem de Lucro Alvo: ${summaryDataBestSale.profitMarginPercent.toFixed(2)}%`}
              />
            </div>

            {/* Coluna 2: Unitários (CUMP) */}
            <div className="space-y-4 pt-6 lg:pt-0">
              <h3 className="text-lg font-semibold text-foreground">Valores Unitários Médios (CUMP)</h3>
              <SummaryItem
                title="Custo Unitário (CUMP)"
                value={unitCost}
                icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
                description="Custo médio por unidade interna (varejo)"
              />
              <SummaryItem
                title="Venda Unitária (CUMP)"
                value={unitSelling}
                icon={<TrendingUp className="h-5 w-5 text-primary" />}
                valueClassName="text-primary"
                description="Preço médio sugerido por unidade interna"
              />
              <SummaryItem
                title="Lucro Unitário (CUMP)"
                value={unitProfit}
                icon={<Package className="h-5 w-5 text-success" />}
                valueClassName="text-success"
                description={`Lucro médio por unidade interna`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};