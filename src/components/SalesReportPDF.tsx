import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { CalculatedProduct } from '@/types/pricing';

// Registrando fontes (Helvetica é padrão e segura, mas podemos simular pesos)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf' },
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf', fontWeight: 'bold' },
  ]
});

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 9, color: '#333', backgroundColor: '#fff' },
  
  // Header Global
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottom: '2px solid #f97316', paddingBottom: 10 },
  brandBlock: { flexDirection: 'column' },
  brandTitle: { fontSize: 24, fontWeight: 'bold', color: '#f97316' },
  brandSubtitle: { fontSize: 8, color: '#64748b', letterSpacing: 2, textTransform: 'uppercase' },
  
  reportInfo: { alignItems: 'flex-end' },
  reportTitle: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', color: '#1e293b' },
  reportDate: { fontSize: 9, color: '#94a3b8', marginTop: 4 },

  // Cards de Resumo
  summaryContainer: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  summaryCard: { flex: 1, padding: 12, backgroundColor: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' },
  summaryLabel: { fontSize: 8, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', fontWeight: 'bold' },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  
  // Tabela
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#334155', marginBottom: 10, marginTop: 5, textTransform: 'uppercase' },
  tableContainer: { borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #f1f5f9', paddingVertical: 6, paddingHorizontal: 4, alignItems: 'center' },
  
  // Colunas da Tabela (Landscape)
  colProduct: { width: '30%' },
  colCode: { width: '10%' },
  colCost: { width: '12%', textAlign: 'right' },
  colTax: { width: '12%', textAlign: 'right' },
  colMargin: { width: '12%', textAlign: 'right' },
  colPrice: { width: '12%', textAlign: 'right' },
  colProfit: { width: '12%', textAlign: 'right' },

  textBold: { fontWeight: 'bold' },
  textSmall: { fontSize: 8, color: '#64748b' },
  
  // Footer
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, borderTop: '1px solid #e2e8f0', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#94a3b8' }
});

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const formatPercent = (value: number) => `${value.toFixed(2)}%`;

interface SalesReportPDFProps {
  products: CalculatedProduct[];
  companyName: string;
  accountantName: string;
  accountantCrc: string;
}

export const SalesReportPDF: React.FC<SalesReportPDFProps> = ({ products, companyName, accountantName, accountantCrc }) => {
  // Cálculos de Totais
  const totalCost = products.reduce((acc, p) => acc + (p.cost * p.quantity), 0);
  const totalSales = products.reduce((acc, p) => acc + (p.sellingPrice * p.quantity), 0);
  const totalProfit = products.reduce((acc, p) => acc + (p.valueForProfit * p.quantity), 0);
  const totalTaxes = products.reduce((acc, p) => acc + (p.taxToPay * p.quantity), 0);
  const avgMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

  const currentDate = new Date().toLocaleDateString('pt-BR');

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandTitle}>JOTA</Text>
            <Text style={styles.brandSubtitle}>CONTABILIDADE E INTELIGÊNCIA</Text>
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>Relatório Oficial de Precificação</Text>
            <Text style={styles.reportDate}>{companyName}</Text>
            <Text style={styles.reportDate}>Emissão: {currentDate}</Text>
          </View>
        </View>

        {/* Resumo Executivo (Cards) */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Custo Total Estoque</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalCost)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Faturamento Projetado</Text>
            <Text style={[styles.summaryValue, { color: '#f97316' }]}>{formatCurrency(totalSales)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Impostos Totais (Est.)</Text>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{formatCurrency(totalTaxes)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Lucro Líquido Projetado</Text>
            <Text style={[styles.summaryValue, { color: '#22c55e' }]}>{formatCurrency(totalProfit)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Margem Média</Text>
            <Text style={styles.summaryValue}>{formatPercent(avgMargin)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Detalhamento Técnico por Produto</Text>

        {/* Tabela de Produtos */}
        <View style={styles.tableContainer}>
          {/* Header da Tabela */}
          <View style={styles.tableHeader}>
            <View style={styles.colCode}><Text style={styles.summaryLabel}>CÓDIGO</Text></View>
            <View style={styles.colProduct}><Text style={styles.summaryLabel}>PRODUTO / NCM</Text></View>
            <View style={styles.colCost}><Text style={styles.summaryLabel}>CUSTO TOTAL (UN)</Text></View>
            <View style={styles.colTax}><Text style={styles.summaryLabel}>IMPOSTOS</Text></View>
            <View style={styles.colProfit}><Text style={styles.summaryLabel}>LUCRO LÍQ.</Text></View>
            <View style={styles.colPrice}><Text style={styles.summaryLabel}>VENDA SUGERIDA</Text></View>
            <View style={styles.colMargin}><Text style={styles.summaryLabel}>MARGEM %</Text></View>
          </View>

          {/* Linhas da Tabela */}
          {products.map((p, i) => {
             const fullCost = p.cost + (p.valueForFixedCost / p.quantity);
             const marginPct = p.sellingPrice > 0 ? ((p.sellingPrice - (p.cost + p.taxToPay + p.valueForVariableExpenses + (p.valueForFixedCost/p.quantity))) / p.sellingPrice) * 100 : 0;
             
             return (
              <View key={i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#fff' : '#f8fafc' }]} wrap={false}>
                <View style={styles.colCode}>
                  <Text style={{ fontWeight: 'bold' }}>{p.code}</Text>
                </View>
                <View style={styles.colProduct}>
                  <Text style={{ fontWeight: 'bold', fontSize: 8 }}>{p.name.substring(0, 45)}</Text>
                  <Text style={styles.textSmall}>NCM: {p.ncm || '-'} | CEST: {p.cest || '-'}</Text>
                </View>
                <View style={styles.colCost}>
                  <Text>{formatCurrency(fullCost)}</Text>
                </View>
                <View style={styles.colTax}>
                  <Text style={{ color: '#ef4444' }}>{formatCurrency(p.taxToPay)}</Text>
                </View>
                <View style={styles.colProfit}>
                  <Text style={{ color: '#22c55e', fontWeight: 'bold' }}>{formatCurrency(p.valueForProfit)}</Text>
                </View>
                <View style={styles.colPrice}>
                  <Text style={{ color: '#f97316', fontWeight: 'bold', fontSize: 10 }}>{formatCurrency(p.sellingPrice)}</Text>
                </View>
                <View style={styles.colMargin}>
                  <Text style={{ fontWeight: 'bold' }}>{formatPercent(marginPct)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Rodapé Fixo */}
        <View style={styles.footer} fixed>
          <View>
            <Text>{companyName}</Text>
            <Text>Relatório gerado eletronicamente pelo Sistema Jota</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text>{accountantName ? `Resp. Técnico: ${accountantName}` : ''}</Text>
            <Text>{accountantCrc ? `CRC: ${accountantCrc}` : ''}</Text>
          </View>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
};