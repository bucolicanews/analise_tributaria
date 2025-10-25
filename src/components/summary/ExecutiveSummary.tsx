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
  totalProductAcquisitionCostBeforeLoss: number; // NOVO: Custo Bruto antes da perda
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// Função auxiliar para formatar números com alta precisão (para CFU)
const formatNumber = (value: number, decimals: number = 4) => {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

// Função auxiliar para formatar quantidades como inteiros com separador de milhares
const formatQuantity = (value: number) => {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
};

const SummaryCardWithDetail: React.FC<{ 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  valueClassName?: string; 
  description: string;
  detailContent: React.ReactNode;
}> = ({
  title,
  value,
  icon,
  valueClassName,
  description,
  detailContent,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  let effectiveValueClassName = valueClassName;
  
  // Se for Lucro Bruto ou Lucro Líquido (que usam text-success por padrão), verifica se é negativo
  if (value < 0 && (valueClassName === 'text-success' || valueClassName === 'text-primary')) {
    effectiveValueClassName = 'text-destructive';
  } else if (value >= 0 && effectiveValueClassName === 'text-destructive') {
    // Se for um valor que deve ser destrutivo (como imposto a pagar), mas é zero ou positivo, mantém a cor original
    effectiveValueClassName = 'text-success';
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-4 p-4 rounded-lg bg-card/50 border border-border/50 transition-shadow hover:shadow-card">
        <div className={cn("p-3 rounded-full", effectiveValueClassName === 'text-success' ? 'bg-success/20' : effectiveValueClassName === 'text-primary' ? 'bg-primary/20' : effectiveValueClassName === 'text-destructive' ? 'bg-destructive/20' : 'bg-muted/50')}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn("text-xl font-extrabold", effectiveValueClassName)}>{formatCurrency(value)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      
      {/* Detalhe Expansível */}
      <div className="border-t border-border pt-2">
        <button 
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Memória de Cálculo
          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        
        {isOpen && (
          <div className="mt-2 space-y-1 text-xs font-mono bg-muted/50 p-3 rounded-md">
            {detailContent}
          </div>
        )}
      </div>
    </div>
  );
};


// Novo componente para detalhamento da distribuição (mantido para Venda Sugerida)
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
  
  // Impostos (já calculados no summaryDataBestSale)
  const taxItems = [];
  if (params.taxRegime === TaxRegime.LucroPresumido) {
    // Simplificando a exibição para usar os totais líquidos do summaryDataBestSale, divididos pela venda total
    // Para manter a precisão, usaremos as alíquotas sobre o PV.
    taxItems.push(
      { name: "CBS Líquido", value: totalSelling * CBS_RATE },
      { name: "IBS Líquido", value: totalSelling * IBS_RATE },
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
  const totalVariableExpensesPercentage = params.variableExpenses.reduce(
    (sum, exp) => sum + exp.percentage,
    0
  );
  
  const variableItems = params.variableExpenses.map(exp => ({
    name: exp.name,
    value: totalSelling * (exp.percentage / 100),
    percentage: exp.percentage
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
        Detalhe da Distribuição ({isUnitary ? "Unid." : "Total"})
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
              <span>• {item.name} ({item.percentage.toFixed(2)}%):</span>
              <span>{formatCurrency(item.value)}</span>
            </div>
          ))}

          <div className="flex justify-between text-muted-foreground">
            <span>• {fixedCostItem.name} (Rateio):</span>
            <span>{formatCurrency(fixedCostItem.value)}</span>
          </div>

          <div className={cn("flex justify-between font-bold pt-1 border-t border-border/50", totalProfit < 0 ? "text-destructive" : "text-success")}>
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
  totalProductAcquisitionCostBeforeLoss, // Recebendo o custo bruto
}) => {
  // Valores Totais (da Nota)
  const totalCost = totalProductAcquisitionCostAdjusted + (cumpData ? cumpData.cfu * totalInnerUnitsInXML : 0);
  const totalSelling = summaryDataBestSale.totalSelling;
  const totalProfit = summaryDataBestSale.totalProfit;
  const totalFixedCostContribution = cumpData ? cumpData.cfu * totalInnerUnitsInXML : 0;
  const totalVariableExpensesPercent = params.variableExpenses.reduce((sum, exp) => sum + exp.percentage, 0);
  
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

  // --- Conteúdos de Detalhe (Memória de Cálculo) ---

  // Cálculo do Custo de Aquisição Ajustado (Total)
  const lossValueTotal = totalProductAcquisitionCostAdjusted - totalProductAcquisitionCostBeforeLoss;
  const detailCostTotal = (
    <>
      <p>• Custo de Aquisição Bruto: {formatCurrency(totalProductAcquisitionCostBeforeLoss)}</p>
      <p>• Valor de Perdas ({params.lossPercentage.toFixed(2)}%): {formatCurrency(lossValueTotal)}</p>
      <p className="font-semibold pt-1 border-t border-border/50">
        Custo de Aquisição Ajustado (Custo + Perdas): {formatCurrency(totalProductAcquisitionCostAdjusted)}
      </p>
      <p className="pt-2">
        • Contribuição Fixa Rateada (CFU * Qtd): {formatCurrency(totalFixedCostContribution)}
      </p>
      <p className="ml-4 text-muted-foreground">
        (Cálculo: {formatNumber(unitFixedCostContribution)} (CFU) x {formatQuantity(totalInnerUnitsInXML)} (Qtd. Unid. Internas))
      </p>
      <p className="font-bold pt-1 border-t border-border/50">
        Custo Total = {formatCurrency(totalProductAcquisitionCostAdjusted)} + {formatCurrency(totalFixedCostContribution)} = {formatCurrency(totalCost)}
      </p>
    </>
  );

  const detailGrossProfitTotal = (
    <>
      <p>• Venda Sugerida: {formatCurrency(totalSelling)}</p>
      <p>• Custo de Aquisição Ajustado (Custo + Perdas): {formatCurrency(totalAcquisitionCost)}</p>
      <p className="font-bold pt-1 border-t border-border/50">
        Lucro Bruto = {formatCurrency(totalSelling)} - {formatCurrency(totalAcquisitionCost)} = {formatCurrency(totalGrossProfit)}
      </p>
    </>
  );

  const detailNetProfitTotal = (
    <>
      <p>• Lucro Bruto: {formatCurrency(totalGrossProfit)}</p>
      <p>• Impostos Líquidos: {formatCurrency(summaryDataBestSale.totalTax)}</p>
      <p>• Despesas Variáveis: {formatCurrency(summaryDataBestSale.totalVariableExpensesValue)}</p>
      <p>• Contribuição Fixa Rateada: {formatCurrency(totalFixedCostContribution)}</p>
      <p className="font-bold pt-1 border-t border-border/50">
        Lucro Líquido = Lucro Bruto - Impostos - Despesas Variáveis - Contribuição Fixa = {formatCurrency(totalProfit)}
      </p>
    </>
  );

  // Cálculo do Custo de Aquisição Ajustado (Unitário)
  const unitAcquisitionCostBeforeLoss = cumpData?.cumpBruto || 0;
  const lossValueUnitary = unitAcquisitionCostAdjusted - unitAcquisitionCostBeforeLoss;
  const detailCostUnitary = (
    <>
      <p>• Custo de Aquisição Bruto (CUMP): {formatCurrency(unitAcquisitionCostBeforeLoss)}</p>
      <p>• Valor de Perdas ({params.lossPercentage.toFixed(2)}%): {formatCurrency(lossValueUnitary)}</p>
      <p className="font-semibold pt-1 border-t border-border/50">
        Custo de Aquisição Unitário Ajustado (CUMP + Perdas): {formatCurrency(unitAcquisitionCostAdjusted)}
      </p>
      <p>• Custo Fixo por Unidade (CFU): {formatCurrency(unitFixedCostContribution)}</p>
      <p className="font-bold pt-1 border-t border-border/50">
        Custo Unitário Total = {formatCurrency(unitAcquisitionCostAdjusted)} + {formatCurrency(unitFixedCostContribution)} = {formatCurrency(unitCost)}
      </p>
    </>
  );

  const detailGrossProfitUnitary = (
    <>
      <p>• Venda Unitária Sugerida: {formatCurrency(unitSelling)}</p>
      <p>• Custo de Aquisição Unitário Ajustado: {formatCurrency(unitAcquisitionCostAdjusted)}</p>
      <p className="font-bold pt-1 border-t border-border/50">
        Lucro Bruto Unitário = {formatCurrency(unitSelling)} - {formatCurrency(unitAcquisitionCostAdjusted)} = {formatCurrency(unitGrossProfit)}
      </p>
    </>
  );

  const detailNetProfitUnitary = (
    <>
      <p>• Lucro Bruto Unitário: {formatCurrency(unitGrossProfit)}</p>
      <p>• Impostos Líquidos Unitários: {formatCurrency(unitTax)}</p>
      <p>• Despesas Variáveis Unitárias: {formatCurrency(unitVariableExpenses)}</p>
      <p>• Custo Fixo Rateado Unitário: {formatCurrency(unitFixedCostContribution)}</p>
      <p className="font-bold pt-1 border-t border-border/50">
        Lucro Líquido Unitário = Lucro Bruto Unitário - Impostos - Despesas Variáveis - CFU = {formatCurrency(unitProfit)}
      </p>
    </>
  );


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
              
              {/* 1. Venda Sugerida (Nota) */}
              <div className="space-y-2">
                <SummaryCardWithDetail
                  title="Venda Sugerida (Nota)"
                  value={totalSelling}
                  icon={<TrendingUp className="h-5 w-5 text-primary" />}
                  valueClassName="text-primary"
                  description="Valor total de venda para atingir o lucro alvo"
                  detailContent={
                    <DistributionDetail 
                      totalSelling={totalSelling}
                      totalTax={summaryDataBestSale.totalTax}
                      totalVariableExpensesValue={summaryDataBestSale.totalVariableExpensesValue}
                      totalProfit={totalProfit}
                      totalFixedCostContribution={totalFixedCostContribution}
                      params={params}
                      isUnitary={false}
                    />
                  }
                />
              </div>

              {/* 2. Custo Total (Nota) */}
              <SummaryCardWithDetail
                title="Custo Total (Nota)"
                value={totalCost}
                icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
                description="Aquisição Ajustada + Contribuição Fixa"
                detailContent={detailCostTotal}
              />
              
              {/* 3. Lucro Bruto Total */}
              <SummaryCardWithDetail
                title="Lucro Bruto (Nota)"
                value={totalGrossProfit}
                icon={<Package className="h-5 w-5 text-success" />}
                valueClassName={totalGrossProfit < 0 ? "text-destructive" : "text-success"}
                description="Venda Sugerida - Custo de Aquisição Ajustado"
                detailContent={detailGrossProfitTotal}
              />

              {/* 4. Lucro Líquido (Nota) */}
              <SummaryCardWithDetail
                title="Lucro Líquido (Nota)"
                value={totalProfit}
                icon={<Package className="h-5 w-5 text-success" />}
                valueClassName={totalProfit < 0 ? "text-destructive" : "text-success"}
                description={`Margem de Lucro Alvo: ${params.profitMargin.toFixed(2)}%`}
                detailContent={detailNetProfitTotal}
              />
            </div>

            {/* Coluna 2: Unitários (CUMP) */}
            <div className="space-y-4 pt-6 lg:pt-0">
              <h3 className="text-lg font-semibold text-foreground">Valores Unitários Médios (CUMP)</h3>
              
              {/* 1. Venda Unitária (CUMP) */}
              <div className="space-y-2">
                <SummaryCardWithDetail
                  title="Venda Unitária (CUMP)"
                  value={unitSelling}
                  icon={<TrendingUp className="h-5 w-5 text-primary" />}
                  valueClassName="text-primary"
                  description="Preço médio sugerido por unidade interna"
                  detailContent={
                    <DistributionDetail 
                      totalSelling={unitSelling}
                      totalTax={unitTax}
                      totalVariableExpensesValue={unitVariableExpenses}
                      totalProfit={unitProfit}
                      totalFixedCostContribution={unitFixedCostContribution}
                      params={params}
                      isUnitary={true}
                    />
                  }
                />
              </div>

              {/* 2. Custo Unitário (CUMP) */}
              <SummaryCardWithDetail
                title="Custo Unitário (CUMP)"
                value={unitCost}
                icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
                description="Custo médio por unidade interna (varejo)"
                detailContent={detailCostUnitary}
              />
              
              {/* 3. Lucro Bruto Unitário */}
              <SummaryCardWithDetail
                title="Lucro Bruto (Unitário)"
                value={unitGrossProfit}
                icon={<Package className="h-5 w-5 text-success" />}
                valueClassName={unitGrossProfit < 0 ? "text-destructive" : "text-success"}
                description="Venda Unitária - Custo de Aquisição Unitário Ajustado"
                detailContent={detailGrossProfitUnitary}
              />

              {/* 4. Lucro Unitário (CUMP) */}
              <SummaryCardWithDetail
                title="Lucro Unitário (CUMP)"
                value={unitProfit}
                icon={<Package className="h-5 w-5 text-success" />}
                valueClassName={unitProfit < 0 ? "text-destructive" : "text-success"}
                description={`Lucro médio por unidade interna`}
                detailContent={detailNetProfitUnitary}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};