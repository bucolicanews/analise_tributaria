import React, { useState } from "react"; // Adicionado 'React' aqui
import { Upload, FileText, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XmlUploader } from "@/components/XmlUploader";
import { ParametersForm } from "@/components/ParametersForm";
import { ProductsTable } from "@/components/ProductsTable";
import { CalculationMemory } from "@/components/CalculationMemory";
import { Product, CalculationParams, TaxRegime } from "@/types/pricing";

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [params, setParams] = useState<CalculationParams | null>(null);
  const [showMemory, setShowMemory] = useState(false);

  const handleXmlParsed = (parsedProducts: Product[]) => {
    setProducts(parsedProducts);
  };

  const handleCalculate = (calculationParams: CalculationParams) => {
    setParams(calculationParams);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-gradient-primary">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-black/30 p-2 backdrop-blur">
              <img src="/jota-contabilidade-logo.png" alt="Jota Contabilidade Logo" className="h-12 w-12" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black">Análise Reforma Tributária</h1>
              <p className="text-sm text-black/70">
                Jota Contabilidade - Rua Coronel José do Ó, nº1645, Mosqueiro/PA, CEP:66910010 - Fone: 91996293532
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
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
                        Relatório de Precificação
                      </h2>
                      <Button
                        variant={showMemory ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowMemory(!showMemory)}
                      >
                        {showMemory ? "Ocultar" : "Exibir"} Memória de Cálculo
                      </Button>
                    </div>
                    <ProductsTable products={products} params={params} />
                  </div>
                </Card>

                {showMemory && (
                  <Card className="shadow-card">
                    <div className="p-6">
                      <CalculationMemory products={products} params={params} />
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
                    Faça o upload de um arquivo XML e preencha os parâmetros de
                    cálculo para gerar o relatório de precificação.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          Desenvolvido por Jota Empresas - app_Dyad - ai Gemini
        </div>
      </footer>
    </div>
  );
};

export default Index;