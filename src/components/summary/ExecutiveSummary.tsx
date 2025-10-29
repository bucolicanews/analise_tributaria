import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlobalSummaryData } from '../ProductsTable';
import { cn } from '@/lib/utils';
import { DollarSign, TrendingUp, Package, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { CalculationParams, TaxRegime } from '@/types/pricing';

// --- INTERFACES LOCAIS (CUMPRINDO O QUE FOI FORNECIDO) ---
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

// --- FUNÇÕES DE FORMATAÇÃO ---

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

// Função auxiliar para formatar números com alta precisão (para CFU)
const formatNumber = (value: number, decimals: number = 4) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
};

// Função auxiliar para formatar quantidades como inteiros com separador de milhares
const formatQuantity = (value: number) => {
    return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
};

// Componente auxiliar para linha de detalhe alinhada
// Se indent=true, o valor é recuado para a esquerda (ml-4) para parecer um subtotal.
const DetailLine: React.FC<{ label: string; value: number; className?: string; isNegative?: boolean; indent?: boolean }> = ({ label, value, className, isNegative = false, indent = false }) => (
    <div className={cn("flex justify-between", className)}>
        <span className={cn("flex-1", indent && "ml-4")}>{label}</span>
        <span className={cn("w-28 text-right", isNegative && "text-destructive", indent && "ml-4")}>{formatCurrency(value)}</span>
    </div>
);

// Função para obter detalhes de impostos (totais ou unitários)
const getTaxDetails = (summary: GlobalSummaryData, isUnitary: boolean, totalInnerUnitsInXML: number, params: CalculationParams) => {
    const divisor = isUnitary && totalInnerUnitsInXML > 0 ? totalInnerUnitsInXML : 1;

    const details = [];

    if (params.taxRegime === TaxRegime.LucroPresumido) {
        details.push(
            { name: "CBS a Pagar", value: summary.totalCbsTaxToPay / divisor, isNegative: true, className: "text-blue-500/60" },
            { name: "IBS a Pagar", value: summary.totalIbsTaxToPay / divisor, isNegative: true, className: "text-blue-500/60" },
            { name: "IRPJ a Pagar", value: summary.totalIrpjToPay / divisor, isNegative: true, className: "text-blue-500/60" },
            { name: "CSLL a Pagar", value: summary.totalCsllToPay / divisor, isNegative: true, className: "text-blue-500/60" },
            { name: "Imposto Seletivo", value: summary.totalSelectiveTaxToPay / divisor, isNegative: true, className: "text-blue-500/60" }
        );
    } else if (params.taxRegime === TaxRegime.SimplesNacional) {
        // Simples Nacional Padrão ou Híbrido sempre paga o Simples
        details.push(
            { name: "Simples Nacional", value: summary.totalSimplesToPay / divisor, isNegative: true, className: "text-blue-500/60" }
        );
        
        if (params.generateIvaCredit) {
            // Simples Híbrido paga CBS/IBS por fora
            details.push(
                { name: "CBS a Pagar", value: summary.totalCbsTaxToPay / divisor, isNegative: true, className: "text-blue-500/60" },
                { name: "IBS a Pagar", value: summary.totalIbsTaxToPay / divisor, isNegative: true, className: "text-blue-500/60" }
            );
        }
        
        // Imposto Seletivo é pago por fora em ambos os cenários (se a alíquota for > 0)
        if (params.selectiveTaxRate > 0) {
             details.push(
                { name: "Imposto Seletivo", value: summary.totalSelectiveTaxToPay / divisor, isNegative: true, className: "text-blue-500/60" }
            );
        }
    }
    return details.filter(d => d.value !== 0);
};


// Card Padrão com Detalhe Expansível
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
    
    // Lógica para cor em caso de valor negativo
    if (value < 0 && (valueClassName === 'text-success' || valueClassName === 'text-primary' || valueClassName === 'text-accent')) {
        effectiveValueClassName = 'text-destructive';
    } else if (value >= 0 && effectiveValueClassName === 'text-destructive') {
        effectiveValueClassName = 'text-success';
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center space-x-4 p-4 rounded-lg bg-card/50 border border-border/50 transition-shadow hover:shadow-card">
                <div className={cn("p-3 rounded-full", effectiveValueClassName === 'text-success' ? 'bg-success/20' : effectiveValueClassName === 'text-primary' ? 'bg-primary/20' : effectiveValueClassName === 'text-accent' ? 'bg-accent/20' : effectiveValueClassName === 'text-destructive' ? 'bg-destructive/20' : 'bg-muted/50')}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className={cn("text-xl font-extrabold", effectiveValueClassName)}>{formatCurrency(value)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
            </div>
            
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


// Detalhamento de Distribuição (Com Fixo)
const DistributionDetail: React.FC<{ 
    totalSelling: number;
    totalTax: number; 
    totalVariableExpensesValue: number; 
    totalProfit: number; // Lucro Líquido com Fixo
    totalGrossProfitWithFixed: number; // Lucro Bruto com Fixo (Resultado Operacional)
    totalNetProfitWithoutFixed: number; // Lucro Líquido sem Fixo (Margem de Contribuição Líquida)
    params: CalculationParams;
    summaryDataBestSale: GlobalSummaryData;
    totalCost: number;
    totalAcquisitionCost: number;
    totalFixedCostContribution: number;
    isUnitary: boolean;
    totalInnerUnitsInXML: number;
}> = ({ 
    totalSelling, 
    totalTax, 
    totalVariableExpensesValue, 
    totalProfit,
    totalGrossProfitWithFixed,
    totalNetProfitWithoutFixed,
    params,
    summaryDataBestSale,
    totalCost,
    totalAcquisitionCost,
    totalFixedCostContribution,
    isUnitary,
    totalInnerUnitsInXML,
}) => {
    
    // Detalhamento das Despesas Variáveis (sempre por item)
    const variableDetails = params.variableExpenses.map(exp => {
        const value = totalSelling * (exp.percentage / 100);
        return { name: exp.name, value };
    });
    
    const taxDetails = getTaxDetails(summaryDataBestSale, isUnitary, totalInnerUnitsInXML, params);

    return (
        <div className="mt-2 space-y-1 text-xs font-mono">
            {/* CÁLCULO DO PONTO DE PARTIDA (Lucro Bruto c/ Fixo) */}
            <p className="font-bold text-foreground mb-2 border-b border-border/50 pb-1">
                CÁLCULO DO PONTO DE PARTIDA (Lucro Bruto c/ Fixo):
            </p>
            <div className="ml-2 space-y-1">
                <DetailLine label="Venda Sugerida (Receita Bruta):" value={totalSelling} className="font-semibold text-primary" />
                <DetailLine label="(-) Custo Aquisição Ajustado (s/ Fixo):" value={totalAcquisitionCost} className="text-muted-foreground" isNegative={true} />
                <DetailLine label="(-) Custo Fixo Rateado (CFU):" value={totalFixedCostContribution} className="text-muted-foreground" isNegative={true} />
                
                <div className={cn("flex justify-between font-bold pt-1 border-t border-border/50", totalGrossProfitWithFixed < 0 ? "text-destructive" : "text-success")}>
                    <span className="flex-1">Lucro Bruto com Fixo (Resultado Operacional):</span>
                    <span className="w-28 text-right">{formatCurrency(totalGrossProfitWithFixed)}</span>
                </div>
            </div>


            {/* DEDUÇÕES FINAIS */}
            <p className="font-semibold mt-3 mb-1 border-t border-border/50 pt-2">Deduções para Lucro Líquido:</p>

            <div className="space-y-1 ml-2">
                <DetailLine label={`(-) Impostos Líquidos:`} value={totalTax} className="font-medium text-blue-500/100" isNegative={true} />
                {taxDetails.map((item, index) => (
                    <DetailLine 
                        key={`tax-${index}`} 
                        label={`• ${item.name}:`} 
                        value={item.value} 
                        className={cn("text-blue-500/60", item.className)} 
                        isNegative={item.isNegative} 
                        indent={true} 
                    />
                ))}
            </div>
            
            <div className="space-y-1 ml-2 mt-2">
                <DetailLine label={`(-) Despesas Variáveis:`} value={totalVariableExpensesValue} className="font-medium text-blue-500/100" isNegative={true} />
                {variableDetails.map((item, index) => (
                    <DetailLine 
                        key={`var-${index}`} 
                        label={`• ${item.name}:`} 
                        value={item.value} 
                        className="text-blue-500/60" 
                        isNegative={true} 
                        indent={true} 
                    />
                ))}
            </div>

            <div className={cn("flex justify-between font-bold pt-3 border-t border-border/50", totalProfit < 0 ? "text-destructive" : "text-success")}>
                <span className="flex-1">Lucro Líquido Final:</span>
                <span className="w-28 text-right">{formatCurrency(totalProfit)}</span>
            </div>
            
            <div className={cn("flex justify-between font-bold pt-1", totalNetProfitWithoutFixed < 0 ? "text-destructive" : "text-accent")}>
                <span className="flex-1">Margem Contribuição Líquida:</span>
                <span className="w-28 text-right">{formatCurrency(totalNetProfitWithoutFixed)}</span>
            </div>
            
            <p className="text-muted-foreground mt-2">
                (Fórmula: Lucro Bruto com Fixo - Impostos Líquidos - Despesas Variáveis)
            </p>
        </div>
    );
};

// Detalhamento de Margem de Contribuição (Sem Fixo)
const ContributionDetail: React.FC<{ 
    totalSelling: number;
    totalTax: number; 
    totalVariableExpensesValue: number; 
    totalNetProfitWithoutFixed: number; // Lucro Líquido sem Fixo
    params: CalculationParams;
    totalGrossProfitWithoutFixed: number; // Lucro Bruto sem Fixo (Margem de Contribuição Bruta)
    summaryDataBestSale: GlobalSummaryData;
    totalAcquisitionCost: number;
    isUnitary: boolean; // Novo: Para controlar se estamos exibindo valores unitários
    totalInnerUnitsInXML: number;
}> = ({ 
    totalSelling, 
    totalTax, 
    totalVariableExpensesValue, 
    totalNetProfitWithoutFixed,
    params,
    totalGrossProfitWithoutFixed,
    summaryDataBestSale,
    totalAcquisitionCost,
    isUnitary,
    totalInnerUnitsInXML,
}) => {
    
    // Detalhamento das Despesas Variáveis (sempre por item)
    const variableDetails = params.variableExpenses.map(exp => {
        const value = totalSelling * (exp.percentage / 100);
        return { name: exp.name, value };
    });
    
    const taxDetails = getTaxDetails(summaryDataBestSale, isUnitary, totalInnerUnitsInXML, params);

    return (
        <div className="mt-2 space-y-1 text-xs font-mono">
             {/* CÁLCULO DA MARGEM (Lucro Bruto s/ Fixo) */}
            <p className="font-bold text-foreground mb-2 border-b border-border/50 pb-1">
                CÁLCULO DA MARGEM (Lucro Bruto s/ Fixo):
            </p>
            <div className="ml-2 space-y-1">
                <DetailLine label="Venda Sugerida (Receita Bruta):" value={totalSelling} className="font-semibold text-primary" />
                <DetailLine label="(-) Custo Aquisição Ajustado:" value={totalAcquisitionCost} className="text-muted-foreground" isNegative={true} />
                
                <div className={cn("flex justify-between font-bold pt-1 border-t border-border/50", totalGrossProfitWithoutFixed < 0 ? "text-destructive" : "text-success")}>
                    <span className="flex-1">Lucro Bruto sem Fixo (Margem Contrib. Bruta):</span>
                    <span className="w-28 text-right">{formatCurrency(totalGrossProfitWithoutFixed)}</span>
                </div>
            </div>

            {/* DEDUÇÕES FINAIS */}
            <p className="font-semibold mt-3 mb-1 border-t border-border/50 pt-2">Deduções para Lucro Líquido sem Fixo:</p>

            <div className="space-y-1 ml-2">
                <DetailLine label={`(-) Impostos Líquidos:`} value={totalTax} className="font-medium text-blue-500/100" isNegative={true} />
                {taxDetails.map((item, index) => (
                    <DetailLine 
                        key={`tax-${index}`} 
                        label={`• ${item.name}:`} 
                        value={item.value} 
                        className={cn("text-blue-500/60", item.className)} 
                        isNegative={item.isNegative} 
                        indent={true} 
                    />
                ))}
            </div>
            
            <div className="space-y-1 ml-2 mt-2">
                <DetailLine label={`(-) Despesas Variáveis:`} value={totalVariableExpensesValue} className="font-medium text-blue-500/100" isNegative={true} />
                {variableDetails.map((item, index) => (
                    <DetailLine 
                        key={`var-${index}`} 
                        label={`• ${item.name}:`} 
                        value={item.value} 
                        className="text-blue-500/60" 
                        isNegative={true} 
                        indent={true} 
                    />
                ))}
            </div>

            <div className={cn("flex justify-between font-bold pt-3 border-t border-border/50", totalNetProfitWithoutFixed < 0 ? "text-destructive" : "text-accent")}>
                <span className="flex-1">Lucro Líquido sem Fixo Final:</span>
                <span className="w-28 text-right">{formatCurrency(totalNetProfitWithoutFixed)}</span>
            </div>
            
            <p className="text-muted-foreground mt-2">
                (Fórmula: Lucro Bruto sem Fixo - Impostos Líquidos - Despesas Variáveis)
            </p>
        </div>
    );
};


// Card de Distribuição da Venda (Bloco 1 - Com Fixo)
const DistributionSummaryCardComponent: React.FC<{
    title: string;
    totalSelling: number;
    totalTax: number;
    totalVariableExpensesValue: number;
    totalProfitWithFixed: number;
    totalFixedCostContribution: number;
    params: CalculationParams;
    isUnitary: boolean;
    totalGrossProfitWithFixed: number; 
    totalNetProfitWithoutFixed: number;
    summaryDataBestSale: GlobalSummaryData;
    totalCost: number;
    totalAcquisitionCost: number;
    totalInnerUnitsInXML: number;
}> = ({
    title,
    totalSelling,
    totalTax,
    totalVariableExpensesValue,
    totalProfitWithFixed, 
    totalFixedCostContribution,
    params,
    isUnitary,
    totalGrossProfitWithFixed,
    totalNetProfitWithoutFixed,
    summaryDataBestSale,
    totalCost,
    totalAcquisitionCost,
    totalInnerUnitsInXML,
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    
    const valueClassName = totalGrossProfitWithFixed < 0 ? 'text-destructive' : 'text-success';
    const netProfitWithFixedClassName = totalProfitWithFixed < 0 ? 'text-destructive' : 'text-success'; 

    return (
        <div className="space-y-2">
            <div className="flex items-center space-x-4 p-4 rounded-lg bg-card/50 border border-border/50 transition-shadow hover:shadow-card">
                <div className={cn("p-3 rounded-full", valueClassName === 'text-success' ? 'bg-success/20' : 'bg-destructive/20')}>
                    <Package className={cn("h-5 w-5", valueClassName)} />
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    
                    {/* EXIBINDO LUCRO BRUTO COM FIXO (Resultado Operacional) */}
                    <p className={cn("text-xl font-extrabold", valueClassName)}>{formatCurrency(totalGrossProfitWithFixed)}</p>
                    
                    
                    {/* EXIBINDO LUCRO LÍQUIDO COM FIXO (O valor final de R$ 1.536,70 negativo) */}
                    <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs font-medium text-muted-foreground">Lucro Líquido com o Fixo</p>
                        <p className={cn("text-lg font-bold", netProfitWithFixedClassName)}>
                            {formatCurrency(totalProfitWithFixed)}
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="border-t border-border pt-2">
                <button 
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                    Detalhe da Distribuição ({isUnitary ? "Unid." : "Total"})
                    {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                
                {isOpen && (
                    <div className="mt-2 space-y-1 text-xs font-mono bg-muted/50 p-3 rounded-md">
                        <DistributionDetail
                            totalSelling={totalSelling}
                            totalTax={totalTax}
                            totalVariableExpensesValue={totalVariableExpensesValue}
                            totalProfit={totalProfitWithFixed}
                            totalGrossProfitWithFixed={totalGrossProfitWithFixed}
                            totalNetProfitWithoutFixed={totalNetProfitWithoutFixed}
                            summaryDataBestSale={summaryDataBestSale}
                            params={params}
                            totalCost={totalCost}
                            totalAcquisitionCost={totalAcquisitionCost}
                            totalFixedCostContribution={totalFixedCostContribution}
                            isUnitary={isUnitary}
                            totalInnerUnitsInXML={totalInnerUnitsInXML}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// Card de Distribuição da Margem (Bloco 2 - Sem Fixo)
const ContributionSummaryCard: React.FC<{
    title: string;
    totalSelling: number;
    totalTax: number;
    totalVariableExpensesValue: number;
    totalNetProfitWithoutFixed: number;
    params: CalculationParams;
    isUnitary: boolean;
    totalGrossProfitWithoutFixed: number;
    summaryDataBestSale: GlobalSummaryData;
    totalAcquisitionCost: number;
    totalInnerUnitsInXML: number;
}> = ({
    title,
    totalSelling,
    totalTax,
    totalVariableExpensesValue,
    totalNetProfitWithoutFixed,
    params,
    isUnitary,
    totalGrossProfitWithoutFixed,
    summaryDataBestSale,
    totalAcquisitionCost,
    totalInnerUnitsInXML,
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    
    const valueClassName = totalGrossProfitWithoutFixed < 0 ? 'text-destructive' : 'text-success';

    return (
        <div className="space-y-2">
            <div className="flex items-center space-x-4 p-4 rounded-lg bg-card/50 border border-border/50 transition-shadow hover:shadow-card">
                <div className={cn("p-3 rounded-full", valueClassName === 'text-success' ? 'bg-success/20' : 'bg-destructive/20')}>
                    <Package className={cn("h-5 w-5", valueClassName)} />
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className={cn("text-xl font-extrabold", valueClassName)}>{formatCurrency(totalGrossProfitWithoutFixed)}</p>
                   
                    
                    <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs font-medium text-muted-foreground">Lucro Líquido sem Fixo</p>
                        <p className={cn("text-lg font-bold", totalNetProfitWithoutFixed < 0 ? 'text-destructive' : 'text-accent')}>{formatCurrency(totalNetProfitWithoutFixed)}</p>
                    </div>
                </div>
            </div>
            
            <div className="border-t border-border pt-2">
                <button 
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                    Distribuioção 
                    {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                
                {isOpen && (
                    <div className="mt-2 space-y-1 text-xs font-mono bg-muted/50 p-3 rounded-md">
                        <ContributionDetail
                            totalSelling={totalSelling}
                            totalTax={totalTax}
                            totalVariableExpensesValue={totalVariableExpensesValue}
                            totalNetProfitWithoutFixed={totalNetProfitWithoutFixed}
                            params={params}
                            totalGrossProfitWithoutFixed={totalGrossProfitWithoutFixed}
                            summaryDataBestSale={summaryDataBestSale}
                            totalAcquisitionCost={totalAcquisitionCost}
                            isUnitary={isUnitary}
                            totalInnerUnitsInXML={totalInnerUnitsInXML}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL (ExecutveSummary) ---
export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
    summaryDataBestSale,
    cumpData,
    totalProductAcquisitionCostAdjusted,
    totalInnerUnitsInXML,
    params,
    totalProductAcquisitionCostBeforeLoss,
}) => {
    // --- CÁLCULOS E DEFINIÇÕES (TOTAIS) ---
    const totalFixedCostContribution = cumpData ? cumpData.cfu * totalInnerUnitsInXML : 0;
    const totalCost = totalProductAcquisitionCostAdjusted + totalFixedCostContribution; // Custo Total
    const totalSelling = summaryDataBestSale.totalSelling; // Venda Sugerida (Receita Bruta)
    
    // CORREÇÃO: Variável que estava faltando e causava o ReferenceError
    const lossValueTotal = totalProductAcquisitionCostAdjusted - totalProductAcquisitionCostBeforeLoss;

    // Cálculos de Porcentagem e Markup
    const totalVariableExpensesPercent = params.variableExpenses.reduce(
        (sum, exp) => sum + exp.percentage,
        0
    );
    
    let totalTaxRate = 0;
    
    // Aplica os controles de débito na taxa de imposto
    const cbsRateEffective = params.useCbsDebit ? params.cbsRate : 0;
    const ibsRateEffective = params.ibsRate * (params.ibsDebitPercentage / 100);
    const selectiveTaxRateEffective = params.useSelectiveTaxDebit ? params.selectiveTaxRate : 0;

    if (params.taxRegime === TaxRegime.LucroPresumido) {
        const irpj = params.irpjRate || 0;
        const csll = params.csllRate || 0;
        totalTaxRate = cbsRateEffective + ibsRateEffective + irpj + csll + selectiveTaxRateEffective;
    } else { // Simples Nacional
        if (params.generateIvaCredit) {
            const simples = params.simplesNacionalRate || 0;
            totalTaxRate = simples + cbsRateEffective + ibsRateEffective + selectiveTaxRateEffective;
        } else {
            totalTaxRate = (params.simplesNacionalRate || 0) + selectiveTaxRateEffective;
        }
    }
    
    const totalOtherPercentages = totalVariableExpensesPercent + totalTaxRate + params.profitMargin;
    const markupDivisor = 1 - (totalOtherPercentages / 100);
    
    // Lucros Totais
    const totalAcquisitionCost = totalProductAcquisitionCostAdjusted; // Custo de Aquisição Ajustado (s/ Fixo)
    const totalGrossProfitWithoutFixed = totalSelling - totalAcquisitionCost; // Margem Contribuição Bruta
    const totalGrossProfitWithFixed = totalSelling - totalCost; // Resultado Operacional Bruto
    const totalNetProfitWithoutFixed = totalGrossProfitWithoutFixed - summaryDataBestSale.totalTax - summaryDataBestSale.totalVariableExpensesValue; // Margem Contribuição Líquida
    const totalProfitWithFixed = totalGrossProfitWithFixed - summaryDataBestSale.totalTax - summaryDataBestSale.totalVariableExpensesValue; // Lucro Líquido Final

    // --- CÁLCULOS E DEFINIÇÕES (UNITÁRIOS) ---
    const unitAcquisitionCostBeforeLoss = cumpData?.cumpBruto || 0;
    const unitAcquisitionCostAdjusted = cumpData?.cumpPlusLoss || 0;
    const unitFixedCostContribution = cumpData?.cfu || 0;
    const unitCost = cumpData?.cumpTotal || 0;
    
    // CORREÇÃO: Variável que estava faltando e causava o ReferenceError
    const lossValueUnitary = unitAcquisitionCostAdjusted - unitAcquisitionCostBeforeLoss; 
    
    const unitSelling = totalInnerUnitsInXML > 0 ? totalSelling / totalInnerUnitsInXML : 0;
    const unitTax = totalInnerUnitsInXML > 0 ? summaryDataBestSale.totalTax / totalInnerUnitsInXML : 0;
    const unitVariableExpenses = totalInnerUnitsInXML > 0 ? summaryDataBestSale.totalVariableExpensesValue / totalInnerUnitsInXML : 0;
    
    // Lucros Unitários
    const unitGrossProfitWithoutFixed = unitSelling - unitAcquisitionCostAdjusted;
    const unitGrossProfitWithFixed = unitSelling - unitCost;
    const unitNetProfitWithoutFixed = unitGrossProfitWithoutFixed - unitTax - unitVariableExpenses;
    const unitProfitWithFixed = unitGrossProfitWithFixed - unitTax - unitVariableExpenses;


    // --- CONTEÚDOS DE DETALHE (Memória de Cálculo) ---
    
    // Detalhe 1: Custo Total (Nota)
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
                (Cálculo: {formatNumber(unitFixedCostContribution)} (CFU) x {formatQuantity(totalInnerUnitsInXML)} unidades (Qtd. Unid. Internas))
            </p>
            <p className="font-bold pt-1 border-t border-border/50">
                Custo Total = {formatCurrency(totalProductAcquisitionCostAdjusted)} (Custo Aquisição Ajustado) + {formatCurrency(totalFixedCostContribution)} (Contribuição Fixa Rateada) = {formatCurrency(totalCost)}
            </p>
        </>
    );
    
    const detailGrossProfitWithFixed = (
        <>
            <p>• Venda Sugerida: {formatCurrency(totalSelling)}</p>
            <p>• Custo Total (Aquisição Ajustada + Contribuição Fixa): {formatCurrency(totalCost)}</p>
            <p className={cn("font-bold pt-1 border-t border-border/50", totalGrossProfitWithFixed < 0 ? "text-destructive" : "text-success")}>
                Lucro Bruto com Fixo = {formatCurrency(totalSelling)} (Venda) - {formatCurrency(totalCost)} (Custo Total) = {formatCurrency(totalGrossProfitWithFixed)}
            </p>
            {totalGrossProfitWithFixed < 0 && (
                <p className="text-destructive mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Alerta: O Lucro Bruto com Fixo está negativo. Sugerimos diminuir os custos fixos ou aumentar o preço de venda.
                </p>
            )}
        </>
    );

    const detailGrossProfitWithoutFixed = (
        <>
            <p>• Venda Sugerida: {formatCurrency(totalSelling)}</p>
            <p>• Custo de Aquisição Ajustado (Custo + Perdas): {formatCurrency(totalAcquisitionCost)}</p>
            <p className={cn("font-bold pt-1 border-t border-border/50", totalGrossProfitWithoutFixed < 0 ? "text-destructive" : "text-success")}>
                Lucro Bruto sem Fixo = {formatCurrency(totalSelling)} (Venda Sugerida) - {formatCurrency(totalAcquisitionCost)} (Custo Aquisição Ajustado) = {formatCurrency(totalGrossProfitWithoutFixed)}
            </p>
        </>
    );

    const detailNetProfitWithoutFixed = (
        <>
            <p>• Lucro Bruto sem Fixo: {formatCurrency(totalGrossProfitWithoutFixed)}</p>
            <p>• Impostos Líquidos: {formatCurrency(summaryDataBestSale.totalTax)}</p>
            <p>• Despesas Variáveis: {formatCurrency(summaryDataBestSale.totalVariableExpensesValue)}</p>
            <p className={cn("font-bold pt-1 border-t border-border/50", totalNetProfitWithoutFixed < 0 ? "text-destructive" : "text-accent")}>
                Lucro Líquido sem Fixo = {formatCurrency(totalGrossProfitWithoutFixed)} (Lucro Bruto sem Fixo) - {formatCurrency(summaryDataBestSale.totalTax)} (Impostos) - {formatCurrency(summaryDataBestSale.totalVariableExpensesValue)} (Despesas Variáveis) = {formatCurrency(totalNetProfitWithoutFixed)}
            </p>
        </>
    );

    const detailNetProfitWithFixed = (
        <>
            <p>• Lucro Bruto com Fixo: {formatCurrency(totalGrossProfitWithFixed)}</p>
            <p>• Impostos Líquidos: {formatCurrency(summaryDataBestSale.totalTax)}</p>
            <p>• Despesas Variáveis: {formatCurrency(summaryDataBestSale.totalVariableExpensesValue)}</p>
            <p className={cn("font-bold pt-1 border-t border-border/50", totalProfitWithFixed < 0 ? "text-destructive" : "text-success")}>
                Lucro Líquido com Fixo = {formatCurrency(totalGrossProfitWithFixed)} (Lucro Bruto com Fixo) - {formatCurrency(summaryDataBestSale.totalTax)} (Impostos) - {formatCurrency(summaryDataBestSale.totalVariableExpensesValue)} (Despesas Variáveis) = {formatCurrency(totalProfitWithFixed)}
            </p>
            {totalProfitWithFixed < 0 && (
                <p className="text-destructive mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Alerta: O Lucro Líquido com Fixo está negativo. Sugerimos diminuir os custos fixos ou aumentar o preço de venda.
                </p>
            )}
        </>
    );

    const detailSellingPriceTotal = (
        <>
            <p className="font-semibold mb-2">1. Markup Divisor</p>
            <p className="ml-4">
                1 - (Despesas Variáveis% + Impostos% + Lucro Alvo%)
            </p>
            <p className="ml-4 text-muted-foreground">
                1 - ({totalVariableExpensesPercent.toFixed(2)}% + {totalTaxRate.toFixed(2)}% + {params.profitMargin.toFixed(2)}%) = {(markupDivisor * 100).toFixed(2)}%
            </p>
            <p className="ml-4 font-bold">
                Markup Divisor = {markupDivisor.toFixed(4)}
            </p>
            
            <p className="font-semibold mt-3 mb-2 border-t border-border/50 pt-2">2. Custo Base para Markup</p>
            <p className="ml-4 font-bold">
                Custo Base Total: {formatCurrency(totalCost)}
            </p>

            <p className="font-semibold mt-3 mb-2 border-t border-border/50 pt-2">3. Venda Sugerida</p>
            <p className="ml-4">
                Custo Base Total ÷ Markup Divisor
            </p>
            <p className="ml-4 font-bold text-primary">
                {formatCurrency(totalCost)} ÷ {markupDivisor.toFixed(4)} = {formatCurrency(totalSelling)}
            </p>
        </>
    );

    const detailSellingPriceUnitary = (
        <>
            <p className="font-semibold mb-2">1. Markup Divisor</p>
            <p className="ml-4 font-bold">
                Markup Divisor = {markupDivisor.toFixed(4)}
            </p>
            
            <p className="font-semibold mt-3 mb-2 border-t border-border/50 pt-2">2. Custo Base para Markup</p>
            <p className="ml-4 font-bold">
                Custo Base Unitário: {formatCurrency(unitCost)}
            </p>

            <p className="font-semibold mt-3 mb-2 border-t border-border/50 pt-2">3. Venda Sugerida</p>
            <p className="ml-4">
                Custo Base Unitário ÷ Markup Divisor
            </p>
            <p className="ml-4 font-bold text-primary">
                {formatCurrency(unitCost)} ÷ {markupDivisor.toFixed(4)} = {formatCurrency(unitSelling)}
            </p>
        </>
    );

    const detailCostUnitary = (
        <>
            <p>• Custo de Aquisição Bruto (CUMP): {formatCurrency(unitAcquisitionCostBeforeLoss)}</p>
            <p>• Valor de Perdas ({params.lossPercentage.toFixed(2)}%): {formatCurrency(lossValueUnitary)}</p>
            <p className="font-semibold pt-1 border-t border-border/50">
                Custo de Aquisição Unitário Ajustado (CUMP + Perdas): {formatCurrency(unitAcquisitionCostAdjusted)}
            </p>
            <p className="pt-2">
                • Custo Fixo por Unidade (CFU): {formatCurrency(unitFixedCostContribution)}
            </p>
            <p className="font-bold pt-1 border-t border-border/50">
                Custo Unitário Total = {formatCurrency(unitAcquisitionCostAdjusted)} (Custo Aquisição Ajustado) + {formatCurrency(unitFixedCostContribution)} (CFU) = {formatCurrency(unitCost)}
            </p>
        </>
    );
    
    const detailGrossProfitWithFixedUnitary = (
        <>
            <p>• Venda Unitária Sugerida: {formatCurrency(unitSelling)}</p>
            <p>• Custo Unitário Total (CUMP): {formatCurrency(unitCost)}</p>
            <p className={cn("font-bold pt-1 border-t border-border/50", unitGrossProfitWithFixed < 0 ? "text-destructive" : "text-success")}>
                Lucro Bruto com Fixo Unitário = {formatCurrency(unitSelling)} (Venda) - {formatCurrency(unitCost)} (Custo Total) = {formatCurrency(unitGrossProfitWithFixed)}
            </p>
            {unitGrossProfitWithFixed < 0 && (
                <p className="text-destructive mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Alerta: O Lucro Bruto com Fixo está negativo. Sugerimos diminuir os custos fixos ou aumentar o preço de venda.
                </p>
            )}
        </>
    );

    const detailGrossProfitWithoutFixedUnitary = (
        <>
            <p>• Venda Unitária Sugerida: {formatCurrency(unitSelling)}</p>
            <p>• Custo de Aquisição Unitário Ajustado: {formatCurrency(unitAcquisitionCostAdjusted)}</p>
            <p className={cn("font-bold pt-1 border-t border-border/50", unitGrossProfitWithoutFixed < 0 ? "text-destructive" : "text-success")}>
                Lucro Bruto sem Fixo Unitário = {formatCurrency(unitSelling)} (Venda Unitária) - {formatCurrency(unitAcquisitionCostAdjusted)} (Custo Aquisição Ajustado) = {formatCurrency(unitGrossProfitWithoutFixed)}
            </p>
        </>
    );

    const detailNetProfitWithoutFixedUnitary = (
        <>
            <p>• Lucro Bruto sem Fixo Unitário: {formatCurrency(unitGrossProfitWithoutFixed)}</p>
            <p>• Impostos Líquidos Unitários: {formatCurrency(unitTax)}</p>
            <p>• Despesas Variáveis Unitárias: {formatCurrency(unitVariableExpenses)}</p>
            <p className={cn("font-bold pt-1 border-t border-border/50", unitNetProfitWithoutFixed < 0 ? "text-destructive" : "text-accent")}>
                Lucro Líquido sem Fixo Unitário = {formatCurrency(unitGrossProfitWithoutFixed)} (Lucro Bruto sem Fixo) - {formatCurrency(unitTax)} (Impostos) - {formatCurrency(unitVariableExpenses)} (Despesas Variáveis) = {formatCurrency(unitNetProfitWithoutFixed)}
            </p>
        </>
    );

    const detailNetProfitWithFixedUnitary = (
        <>
            <p>• Lucro Bruto com Fixo Unitário: {formatCurrency(unitGrossProfitWithFixed)}</p>
            <p>• Impostos Líquidos Unitários: {formatCurrency(unitTax)}</p>
            <p>• Despesas Variáveis Unitárias: {formatCurrency(unitVariableExpenses)}</p>
            <p className={cn("font-bold pt-1 border-t border-border/50", unitProfitWithFixed < 0 ? "text-destructive" : "text-success")}>
                Lucro Líquido com Fixo Unitário = {formatCurrency(unitGrossProfitWithFixed)} (Lucro Bruto com Fixo) - {formatCurrency(unitTax)} (Impostos) - {formatCurrency(unitVariableExpenses)} (Despesas Variáveis) = {formatCurrency(unitProfitWithFixed)}
            </p>
            {unitProfitWithFixed < 0 && (
                <p className="text-destructive mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Alerta: O Lucro Líquido com Fixo está negativo. Sugerimos diminuir os custos fixos ou aumentar o preço de venda.
                </p>
            )}
        </>
    );


    return (
        <div className="space-y-6">
            <Card className="shadow-elegant border-primary/50">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-primary">Resumo Executivo da Precificação (Cenário Alvo)</CardTitle>
                </CardHeader>
                <CardContent>
                    
                    {/* BLOCO 1: Distribuição da Venda (Com Fixo) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 pb-6 border-b border-border">
                        <DistributionSummaryCardComponent
                            title="Lucro Bruto com Fixo"
                            totalSelling={totalSelling}
                            totalTax={summaryDataBestSale.totalTax}
                            totalVariableExpensesValue={summaryDataBestSale.totalVariableExpensesValue}
                            totalProfitWithFixed={totalProfitWithFixed}
                            totalFixedCostContribution={totalFixedCostContribution}
                            params={params}
                            isUnitary={false}
                            totalGrossProfitWithFixed={totalGrossProfitWithFixed}
                            totalNetProfitWithoutFixed={totalNetProfitWithoutFixed}
                            summaryDataBestSale={summaryDataBestSale}
                            totalCost={totalCost}
                            totalAcquisitionCost={totalAcquisitionCost}
                            totalInnerUnitsInXML={totalInnerUnitsInXML}
                        />
                        <DistributionSummaryCardComponent
                            title="Lucro Bruto com Fixo (Un)"
                            totalSelling={unitSelling}
                            totalTax={unitTax}
                            totalVariableExpensesValue={unitVariableExpenses}
                            totalProfitWithFixed={unitProfitWithFixed}
                            totalFixedCostContribution={unitFixedCostContribution}
                            params={params}
                            isUnitary={true}
                            totalGrossProfitWithFixed={unitGrossProfitWithFixed}
                            totalNetProfitWithoutFixed={unitNetProfitWithoutFixed}
                            summaryDataBestSale={summaryDataBestSale}
                            totalCost={unitCost}
                            totalAcquisitionCost={unitAcquisitionCostAdjusted}
                            totalInnerUnitsInXML={totalInnerUnitsInXML}
                        />
                    </div>
                    
                    {/* BLOCO 2: Distribuição da Margem de Contribuição (Sem Fixo) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 pb-6 border-b border-border">
                        <ContributionSummaryCard
                            title="Lucro Bruto sem Fixo Total"
                            totalSelling={totalSelling}
                            totalTax={summaryDataBestSale.totalTax}
                            totalVariableExpensesValue={summaryDataBestSale.totalVariableExpensesValue}
                            totalNetProfitWithoutFixed={totalNetProfitWithoutFixed}
                            params={params}
                            isUnitary={false}
                            totalGrossProfitWithoutFixed={totalGrossProfitWithoutFixed}
                            summaryDataBestSale={summaryDataBestSale}
                            totalAcquisitionCost={totalAcquisitionCost}
                            totalInnerUnitsInXML={totalInnerUnitsInXML}
                        />
                        <ContributionSummaryCard
                            title="Lucro Bruto sem Fixo (Un)"
                            totalSelling={unitSelling}
                            totalTax={unitTax}
                            totalVariableExpensesValue={unitVariableExpenses}
                            totalNetProfitWithoutFixed={unitNetProfitWithoutFixed}
                            params={params}
                            isUnitary={true}
                            totalGrossProfitWithoutFixed={unitGrossProfitWithoutFixed}
                            summaryDataBestSale={summaryDataBestSale}
                            totalAcquisitionCost={unitAcquisitionCostAdjusted}
                            totalInnerUnitsInXML={totalInnerUnitsInXML}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Coluna 1: Totais da Nota */}
                        <div className="space-y-4 border-b lg:border-b-0 lg:border-r border-border pr-6 pb-6 lg:pb-0">
                            <h3 className="text-lg font-semibold text-foreground">Valores Totais da Nota</h3>
                            
                            <div className="space-y-2">
                                <SummaryCardWithDetail
                                    title="Venda Sugerida (Nota)"
                                    value={totalSelling}
                                    icon={<TrendingUp className="h-5 w-5 text-primary" />}
                                    valueClassName="text-primary"
                                    description="Valor total de venda para atingir o lucro alvo"
                                    detailContent={detailSellingPriceTotal}
                                />
                            </div>

                            <SummaryCardWithDetail
                                title="Custo Total (Nota)"
                                value={totalCost}
                                icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
                                description="Aquisição Ajustada + Contribuição Fixa"
                                detailContent={detailCostTotal}
                            />
                            
                            <SummaryCardWithDetail
                                title="Lucro Bruto com Fixo (Nota)"
                                value={totalGrossProfitWithFixed}
                                icon={<Package className="h-5 w-5 text-success" />}
                                valueClassName={totalGrossProfitWithFixed < 0 ? "text-destructive" : "text-success"}
                                description="Venda Sugerida - Custo Total (Cobre todos os custos)"
                                detailContent={detailGrossProfitWithFixed}
                            />

                            <SummaryCardWithDetail
                                title="Lucro Bruto sem Fixo (Nota)"
                                value={totalGrossProfitWithoutFixed}
                                icon={<Package className="h-5 w-5 text-success" />}
                                valueClassName={totalGrossProfitWithoutFixed < 0 ? "text-destructive" : "text-success"}
                                description="Venda Sugerida - Custo de Aquisição Ajustado"
                                detailContent={detailGrossProfitWithoutFixed}
                            />
                            
                            <SummaryCardWithDetail
                                title="Lucro Líquido sem Fixo (Nota)"
                                value={totalNetProfitWithoutFixed}
                                icon={<Package className="h-5 w-5 text-accent" />}
                                valueClassName={totalNetProfitWithoutFixed < 0 ? "text-destructive" : "text-accent"}
                                description="Lucro Bruto sem Fixo - Impostos - Variáveis"
                                detailContent={detailNetProfitWithoutFixed}
                            />

                            <SummaryCardWithDetail
                                title="Lucro Líquido com Fixo (Nota)"
                                value={totalProfitWithFixed}
                                icon={<Package className="h-5 w-5 text-success" />}
                                valueClassName={totalProfitWithFixed < 0 ? "text-destructive" : "text-success"}
                                description={`Lucro Bruto com Fixo - Impostos - Variáveis`}
                                detailContent={detailNetProfitWithFixed}
                            />
                        </div>

                        {/* Coluna 2: Unitários (CUMP) */}
                        <div className="space-y-4 pt-6 lg:pt-0">
                            <h3 className="text-lg font-semibold text-foreground">Valores Unitários Médios (CUMP)</h3>
                            
                            <div className="space-y-2">
                                <SummaryCardWithDetail
                                    title="Venda Unitária (CUMP)"
                                    value={unitSelling}
                                    icon={<TrendingUp className="h-5 w-5 text-primary" />}
                                    valueClassName="text-primary"
                                    description="Preço médio sugerido por unidade interna"
                                    detailContent={detailSellingPriceUnitary}
                                />
                            </div>

                            <SummaryCardWithDetail
                                title="Custo Unitário (CUMP)"
                                value={unitCost}
                                icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
                                description="Custo médio por unidade interna (varejo)"
                                detailContent={detailCostUnitary}
                            />
                            
                            <SummaryCardWithDetail
                                title="Lucro Bruto com Fixo (Unitário)"
                                value={unitGrossProfitWithFixed}
                                icon={<Package className="h-5 w-5 text-success" />}
                                valueClassName={unitGrossProfitWithFixed < 0 ? "text-destructive" : "text-success"}
                                description="Venda Unitária - Custo Unitário Total"
                                detailContent={detailGrossProfitWithFixedUnitary}
                            />

                            <SummaryCardWithDetail
                                title="Lucro Bruto sem Fixo (Unitário)"
                                value={unitGrossProfitWithoutFixed}
                                icon={<Package className="h-5 w-5 text-success" />}
                                valueClassName={unitGrossProfitWithoutFixed < 0 ? "text-destructive" : "text-success"}
                                description="Venda Unitária - Custo de Aquisição Unitário Ajustado"
                                detailContent={detailGrossProfitWithoutFixedUnitary}
                            />
                            
                            <SummaryCardWithDetail
                                title="Lucro Líquido sem Fixo (Unitário)"
                                value={unitNetProfitWithoutFixed}
                                icon={<Package className="h-5 w-5 text-accent" />}
                                valueClassName={unitNetProfitWithoutFixed < 0 ? "text-destructive" : "text-accent"}
                                description="Lucro Bruto sem Fixo - Impostos - Variáveis"
                                detailContent={detailNetProfitWithoutFixedUnitary}
                            />

                            <SummaryCardWithDetail
                                title="Lucro Líquido com Fixo (Unitário)"
                                value={unitProfitWithFixed}
                                icon={<Package className="h-5 w-5 text-success" />}
                                valueClassName={unitProfitWithFixed < 0 ? "text-destructive" : "text-success"}
                                description={`Lucro Bruto com Fixo - Impostos - Variáveis`}
                                detailContent={detailNetProfitWithFixedUnitary}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};