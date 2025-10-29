import React, { useState } from "react";
import { Upload, FileText, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XmlUploader } from "@/components/XmlUploader";
import { ParametersForm } from "@/components/ParametersForm";
import { ProductsTable, GlobalSummaryData } from "@/components/ProductsTable";
import { CalculationMemory } from "@/components/CalculationMemory";
import { Product, CalculationParams, CalculatedProduct } from "@/types/pricing";
import { calculatePricing } from "@/lib/pricing";

// Estado global simulado para persistir dados entre rotas (em um app real, usaríamos Context ou Redux)
// Para este ambiente, manteremos o estado aqui e passaremos as funções de atualização.
let globalProducts: Product[] = [];
let globalParams: CalculationParams | null = null;
let globalSelectedProductCodes: Set<string> = new Set();
let globalSummary: GlobalSummaryData | null = null;

const Index = () => {
  const [products, setProducts] = useState<Product[]>(globalProducts);
  const [params, setParams] = useState<CalculationParams | null>(globalParams);
  const [showMemory, setShowMemory] = useState(false);
  const [summary, setSummary] = useState<GlobalSummaryData | null>(globalSummary);
  const [selectedProductCodes, setSelectedProductCodes] = useState<Set<string>>(globalSelectedProductCodes);

  const handleXmlParsed = (parsedProducts: Product[]) => {
    globalProducts = parsedProducts;
    setProducts(parsedProducts);
    
    const initialSelection = new Set(parsedProducts.map(p => p.code));
    globalSelectedProductCodes = initialSelection;
    setSelectedProductCodes(initialSelection);
  };

  const handleCalculate = (calculationParams: CalculationParams) => {
    globalParams = calculationParams;
    setParams(calculationParams);
  };

  const handleSummaryCalculated = (newSummary: GlobalSummaryData) => {
    globalSummary = newSummary;
    setSummary(newSummary);
  };

  const handleSelectionChange = (newSelection: Set<string>) => {
    globalSelectedProductCodes = newSelection;
    setSelectedProductCodes(newSelection);
  };

  // Filtrar produtos para cálculo e exibição
  const productsToDisplay = products.filter(p => selectedProductCodes.has(p.code));

  // Calcular o CFU para o ProductRetailInfo e CalculationMemory
  const inssPatronalValue = params && params.taxRegime !== "Simples Nacional"
    ? params.payroll * (params.inssPatronalRate / 100)
    : 0;
  const totalFixedExpenses = params ? params.fixedExpenses.reduce((sum, exp) => sum + exp.value, 0) + params.payroll + inssPatronalValue : 0;
  const cfu = params && params.totalStockUnits > 0 ? totalFixedExpenses / params.totalStockUnits : 0;

  // Calcular o primeiro produto selecionado para exibir na Memória de Cálculo (se houver produtos)
  const firstCalculatedProduct: CalculatedProduct | null = 
    productsToDisplay.length > 0 && params 
      ? calculatePricing(productsToDisplay[0], params, cfu) 
      : null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {summary && summary.breakEvenPoint > 0 && (
        <div className="text-center mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <h1 className="text-lg text-muted-foreground">
            <span className="font-semibold">Mínimo Operacional Mensal:</span>{" "}
            <span className="text-xl text-yellow-500 font-extrabold">{formatCurrency(summary.breakEvenPoint)}</span>
          </h1>
        </div>
      )}
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Upload and Parameters */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-card">
            <div className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Upload de XML</h2>
              </div>
              <XmlUploader onXmlParsed={handleXmlParsed} />
            </div>
          </Card>

          <Card className="shadow-card">
            <div className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Parâmetros de Cálculo</h2>
              </div>
              <ParametersForm 
                onCalculate={handleCalculate}
                disabled={products.length === 0}
              />
            </div>
          </Card>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2 space-y-6">
          {products.length > 0 && params ? (
            <React.Fragment>
              <Card className="shadow-elegant">
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      Relatório de Precificação ({productsToDisplay.length} de {products.length} produtos selecionados)
                    </h2>
                    <Button
                      variant={showMemory ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowMemory(!showMemory)}
                    >
                      {showMemory ? "Ocultar" : "Exibir"} Memória de Cálculo
                    </Button>
                  </div>
                  <ProductsTable 
                    products={products} // Passa todos os produtos para que a tabela possa gerenciar a seleção
                    params={params} 
                    onSummaryCalculated={handleSummaryCalculated} 
                    selectedProductCodes={selectedProductCodes}
                    onSelectionChange={handleSelectionChange}
                  />
                </div>
              </Card>

              {showMemory && firstCalculatedProduct && ( // Only show memory if there's a product to display
                <Card className="shadow-card">
                  <div className="p-6">
                    <CalculationMemory products={[firstCalculatedProduct]} params={params} />
                  </div>
                </Card>
              )}
            </React.Fragment>
          ) : (
            <Card className="shadow-card">
              <div className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <Calculator className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Nenhum cálculo realizado
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Faça o upload de um arquivo XML ou ZIP e preencha os parâmetros de
                  cálculo para gerar o relatório de precificação.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;

// Exportando o estado para ser usado na página de comparação
export { globalProducts, globalParams, globalSelectedProductCodes, globalSummary };