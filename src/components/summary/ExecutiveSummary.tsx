import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlobalSummaryData } from '../ProductsTable';
import { cn } from '@/lib/utils';
import { DollarSign, TrendingUp, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { CalculationParams, TaxRegime } from '@/types/pricing';
import { CBS_RATE, IBS_RATE } from '@/lib/pricing';

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
  params: CalculationParams; // Adicionando parâmetros para detalhar despesas variáveis
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

// Novo componente para detalhamento da distribuição
const DistributionDetail: React.FC<{ 
  totalSelling: number; 
  totalTax: number; 
  totalVariableExpensesValue: number; 
  totalProfit: number;
  totalFixedCostContribution: number;
  params: CalculationParams;
  isUnitary: boolean;
}> = ({ 
  totalSelling, 
  totalTax, 
  totalVariableExpensesValue, 
  totalProfit,
  totalFixedCostContribution,
  params,
  isUnitary
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // O valor total distribuído é o Preço de Venda
  const totalDistributed = totalSelling;
  
  // Impostos (já calculados no summaryDataBestSale)
  const taxItems = [];
  if (params.taxRegime === TaxRegime.LucroPresumido) {
    taxItems.push(
      { name: "CBS Líquido", value: totalSelling * CBS_RATE, credit: totalSelling * CBS_RATE - totalTax * (totalSelling * CBS_RATE / totalTax) },
      { name: "IBS Líquido", value: totalSelling * IBS_RATE, credit: totalSelling * IBS_RATE - totalTax * (totalSelling * IBS_RATE / totalTax) },
      { name: "IRPJ", value: totalSelling * (params.irpjRate / 100) },
      { name: "CSLL", value: totalSelling * (params.csllRate / 100) }
    );
  } else if (params.taxRegime === TaxRegime.SimplesNacional) {
    if (params.generateIvaCredit) {
      taxItems.push(
        { name: "Simples Remanescente", value: totalSelling * (params.simplesNacionalRemanescenteRate / 100) },
        { name: "CBS Líquido", value: totalSelling * CBS_RATE },
        { name: "IBS Líquido", value: totalSelling * IBS_RATE }
      );
    } else {
      taxItems.push({ name: "Simples Nacional Cheio", value: totalSelling * (params.simplesNacionalRate / 100) });
    }
  }
  
  // Despesas Variáveis
  const variableItems = params.variableExpenses.map(exp => ({
    name: exp.name,
    value: totalSelling * (exp.percentage / 100)
  }));

  // Custo Fixo Rateado (CFU * Qtd)
  const fixedCostItem = {
    name: "Custo Fixo Rateado",
    value: totalFixedCostContribution
  };

  // Lucro Líquido
  const profitItem = {
    name: "Lucro Líquido",
    value: totalProfit
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-sm font-semibold text-primary/80 hover:text-primary transition-colors"
      >
        {isUnitary ? "Detalhe da Distribuição (Unid.)" : "Detalhe da Distribuição (Total)"}
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      
      {isOpen && (
        <div className="mt-2 space-y-1 text-xs font-mono bg-muted/50 p-3 rounded-md">
          <p className="font-bold text-foreground mb-2">
            Total Distribuído (Venda): {formatCurrency(totalSelling)}
          </p>
          
          {/* Detalhamento */}
          {taxItems.map((item, index) => (
            <div key={`tax-${index}`} className="flex justify-between text-destructive/80">
              <span>• {item.name} ({isUnitary ? (item.value / totalSelling * 100).toFixed(2) : (item.value / totalSelling * 100).toFixed(2)}%):</span>
              <span>{formatCurrency(item.value)}</span>
            </div>
          ))}
          
          {variableItems.map((item, index) => (
            <div key={`var-${index}`} className="flex justify-between text-yellow-500/80">
              <span>• {item.name} ({item.value / totalSelling * 100}%)</span>
              <span>{formatCurrency(item.value)}</span>
            </div>
          ))}

          <div className="flex justify-between text-muted-foreground">
            <span>• {fixedCostItem.name} (Rateio):</span>
            <span>{formatCurrency(fixedCostItem.value)}</span>
          </div>

          <div className="flex justify-between font-bold text-success pt-1 border-t border-border/50">
            <span>• {profitItem.name} ({params.profitMargin.toFixed(2)}%):</span>
            <span>{formatCurrency(profitItem.value)}</span>
          </div>
        </div>
      )}
    </div>
  );
};


export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  summaryDataBestSale,
  cumpData,
  totalProductAcquisitionCostAdjusted,
  totalInnerUnitsInXML,
  params,
}) => {
  // Valores Totais (da Nota)
  const totalCost = totalProductAcquisitionCostAdjusted + (cumpData ? cumpData.cfu * totalInnerUnitsInXML : 0);
  const totalSelling = summaryDataBestSale.totalSelling;
  const totalProfit = summaryDataBestSale.totalProfit;
  const totalFixedCostContribution = cumpData ? cumpData.cfu * totalInnerUnitsInXML : 0;
  
  // Custo de Aquisição Bruto (sem CFU)
  const totalAcquisitionCost = totalProductAcquisitionCostAdjusted; 
  
  // Lucro Bruto Total: Venda Total - Custo de Aquisição Ajustado (Custo + Perdas)
  const totalGrossProfit = totalSelling - totalAcquisitionCost;

  // Valores Unitários (CUMP - por unidade interna)
  const unitCost = cumpData?.cumpTotal || 0;
  const unitSelling = totalInnerUnitsInXML > 0 ? totalSelling / totalInnerUnitsInXML : 0;
  const unitProfit = totalInnerUnitsInXML > 0 ? totalProfit / totalInnerUnitsInXML : 0;
  const unitTax = totalInnerUnitsInXML > 0 ? summaryDataBestSale.totalTax / totalInnerUnitsInXML : 0;
  const unitVariableExpenses = totalInnerUnitsInXML > 0 ? summaryDataBestSale.totalVariableExpensesValue / totalInnerUnitsInXML : 0;
  const unitFixedCostContribution = cumpData?.cfu || 0;
  
  // Lucro Bruto Unitário: Venda Unitária - Custo de Aquisição Unitário Ajustado (CUMP Plus Loss)
  const unitAcquisitionCostAdjusted = cumpData?.cumpPlusLoss || 0;
  const unitGrossProfit = unitSelling - unitAcquisitionCostAdjusted;


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
              
              {/* NOVO: Lucro Bruto Total */}
              <SummaryItem
                title="Lucro Bruto (Nota)"
                value={totalGrossProfit}
                icon={<Package className="h-5 w-5 text-success" />}
                valueClassName="text-success"
                description="Venda Sugerida - Custo de Aquisição Ajustado"
              />

              <div className="space-y-2">
                <SummaryItem
                  title="Venda Sugerida (Nota)"
                  value={totalSelling}
                  icon={<TrendingUp className="h-5 w-5 text-primary" />}
                  valueClassName="text-primary"
                  description="Valor total de venda para atingir o lucro alvo"
                />
                <DistributionDetail 
                  totalSelling={totalSelling}
                  totalTax={summaryDataBestSale.totalTax}
                  totalVariableExpensesValue={summaryDataBestSale.totalVariableExpensesValue}
                  totalProfit={totalProfit}
                  totalFixedCostContribution={totalFixedCostContribution}
                  params={params}
                  isUnitary={false}
                />
              </div>
              <SummaryItem
                title="Lucro Líquido (Nota)"
                value={totalProfit}
                icon={<Package className="h-5 w-5 text-success" />}
                valueClassName="text-success"
                description={`Margem de Lucro Alvo: ${params.profitMargin.toFixed(2)}%`}
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
              
              {/* NOVO: Lucro Bruto Unitário */}
              <SummaryItem
                title="Lucro Bruto (Unitário)"
                value={unitGrossProfit}
                icon={<Package className="h-5 w-5 text-success" />}
                valueClassName="text-success"
                description="Venda Unitária - Custo de Aquisição Unitário Ajustado"
              />

              <div className="space-y-2">
                <SummaryItem
                  title="Venda Unitária (CUMP)"
                  value={unitSelling}
                  icon={<TrendingUp className="h-5 w-5 text-primary" />}
                  valueClassName="text-primary"
                  description="Preço médio sugerido por unidade interna"
                />
                <DistributionDetail 
                  totalSelling={unitSelling}
                  totalTax={unitTax}
                  totalVariableExpensesValue={unitVariableExpenses}
                  totalProfit={unitProfit}
                  totalFixedCostContribution={unitFixedCostContribution}
                  params={params}
                  isUnitary={true}
                />
              </div>
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