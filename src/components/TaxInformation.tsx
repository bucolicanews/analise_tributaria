import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText } from 'lucide-react';

// Dados de exemplo baseados na sua solicitação
const taxData = {
  regime: {
    crt: "3 (Regime Normal)",
    cfops: [
      { code: "5405", description: "Venda de mercadoria (ST) como substituído.", items: "1 a 8" },
      { code: "5102", description: "Venda de mercadoria de terceiros.", items: "9 a 18" },
      { code: "5101", description: "Venda de produção do estabelecimento.", items: "19 a 23" },
    ],
  },
  icms: [
    { cst: "60", description: "ICMS cobrado anteriormente por ST.", items: "1 ao 8 (Roscas e Wafers)" },
    { cst: "00", description: "Tributada integralmente (Alíquota de 19%).", items: "9 ao 23 (Batatas e Salgadinhos)" },
  ],
  pis: { cst: "01", description: "Operação Tributável com Alíquota Básica", rate: "1,65%" },
  cofins: { cst: "01", description: "Operação Tributável com Alíquota Básica", rate: "7,60%" },
  ipi: { cst: "51", description: "Saída tributada com alíquota zero / Suspensão", enq: "999 (Outros)" },
  classification: [
    { category: "Biscoitos/Roscas", ncm: "1905.31.00", cest: "17.053.00 / 17.053.01" },
    { category: "Wafers", ncm: "1905.32.00", cest: "17.057.00" },
    { category: "Batatas Onduladas", ncm: "2005.20.00", cest: "17.032.00" },
    { category: "Salgadinhos de Trigo", ncm: "1905.90.90", cest: "17.031.01" },
    { category: "Salgadinhos de Milho", ncm: "1904.10.00", cest: "17.030.00" },
  ],
  summary: {
    icmsBase: "R$ 1.195,75",
    icmsValue: "R$ 227,19",
    pisValue: "R$ 25,62",
    cofinsValue: "R$ 118,02",
    totalValue: "R$ 1.780,08",
  },
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-md font-semibold mt-4 mb-2 border-b pb-1">{children}</h3>
);

export const TaxInformation = () => {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Análise Tributária da Nota Fiscal
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <p className="text-muted-foreground mb-4">
          Com base no arquivo XML, aqui estão os principais códigos tributários utilizados na operação.
        </p>

        <SectionTitle>1. Códigos de Operação e Regime</SectionTitle>
        <div className="space-y-2">
          <p><strong>CRT (Código de Regime Tributário):</strong> <Badge variant="outline">{taxData.regime.crt}</Badge></p>
          <div>
            <strong>CFOPs (Código Fiscal de Operações):</strong>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              {taxData.regime.cfops.map(cfop => (
                <li key={cfop.code}>
                  <span className="font-semibold">{cfop.code}:</span> {cfop.description} (Itens {cfop.items})
                </li>
              ))}
            </ul>
          </div>
        </div>

        <SectionTitle>2. ICMS (Imposto sobre Circulação de Mercadorias)</SectionTitle>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CST/CSOSN</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Itens no XML</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxData.icms.map(item => (
              <TableRow key={item.cst}>
                <TableCell><Badge>{item.cst}</Badge></TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.items}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <SectionTitle>3. PIS e COFINS</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-md bg-muted/50">
            <p className="font-semibold">PIS</p>
            <p><strong>CST:</strong> <Badge variant="secondary">{taxData.pis.cst}</Badge> - {taxData.pis.description}</p>
            <p><strong>Alíquota:</strong> {taxData.pis.rate}</p>
          </div>
          <div className="p-3 rounded-md bg-muted/50">
            <p className="font-semibold">COFINS</p>
            <p><strong>CST:</strong> <Badge variant="secondary">{taxData.cofins.cst}</Badge> - {taxData.cofins.description}</p>
            <p><strong>Alíquota:</strong> {taxData.cofins.rate}</p>
          </div>
        </div>

        <SectionTitle>4. IPI (Imposto sobre Produtos Industrializados)</SectionTitle>
        <div className="p-3 rounded-md bg-muted/50">
          <p><strong>CST IPI:</strong> <Badge variant="secondary">{taxData.ipi.cst}</Badge> - {taxData.ipi.description}</p>
          <p><strong>Código de Enquadramento:</strong> {taxData.ipi.enq}</p>
        </div>

        <SectionTitle>5. Classificação Fiscal (NCM) e CEST</SectionTitle>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoria</TableHead>
              <TableHead>NCM</TableHead>
              <TableHead>CEST</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxData.classification.map(item => (
              <TableRow key={item.ncm}>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.ncm}</TableCell>
                <TableCell>{item.cest}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <SectionTitle>6. Resumo Financeiro da Tributação</SectionTitle>
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Base de Cálculo ICMS</p>
            <p className="font-semibold">{taxData.summary.icmsBase}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valor Total do ICMS</p>
            <p className="font-semibold text-destructive">{taxData.summary.icmsValue}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valor Total do PIS</p>
            <p className="font-semibold text-destructive">{taxData.summary.pisValue}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valor Total do COFINS</p>
            <p className="font-semibold text-destructive">{taxData.summary.cofinsValue}</p>
          </div>
          <div className="col-span-2 md:col-span-1">
            <p className="text-xs text-muted-foreground">Valor Total da Nota</p>
            <p className="font-bold text-lg text-primary">{taxData.summary.totalValue}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};