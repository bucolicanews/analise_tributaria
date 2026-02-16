import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Registrando fontes
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf' },
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf', fontWeight: 'bold' },
  ]
});

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 9, color: '#333', backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottom: '2px solid #f97316', paddingBottom: 10 },
  brandBlock: { flexDirection: 'column' },
  brandTitle: { fontSize: 24, fontWeight: 'bold', color: '#f97316' },
  brandSubtitle: { fontSize: 8, color: '#64748b', letterSpacing: 2, textTransform: 'uppercase' },
  reportInfo: { alignItems: 'flex-end' },
  reportTitle: { fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', color: '#1e293b' },
  reportDate: { fontSize: 9, color: '#94a3b8', marginTop: 4 },
  
  bestResultCard: { padding: 15, backgroundColor: '#f0fdf4', borderRadius: 4, border: '1px solid #bbf7d0', marginBottom: 20 },
  bestResultTitle: { fontSize: 10, color: '#15803d', marginBottom: 6, textTransform: 'uppercase', fontWeight: 'bold' },
  bestResultText: { fontSize: 14, color: '#166534', fontWeight: 'bold' },
  
  table: { display: "table", width: "auto", borderStyle: "solid", borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, marginBottom: 20 },
  tableRow: { flexDirection: "row", borderBottomColor: '#f1f5f9', borderBottomWidth: 1 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: '#f8fafc', borderBottomColor: '#e2e8f0', borderBottomWidth: 2 },
  tableColHeader: { width: "20%", padding: 8, fontWeight: 'bold', fontSize: 8, textTransform: 'uppercase', color: '#475569' },
  tableCol: { width: "20%", padding: 8 },
  tableCell: { fontSize: 9 },
  tableCellRight: { textAlign: 'right' },
  
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, borderTop: '1px solid #e2e8f0', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#94a3b8' },
  
  colorDestructive: { color: '#ef4444' },
  colorSuccess: { color: '#22c55e' },
});

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const formatPercent = (value: number) => `${value.toFixed(2)}%`;

interface ComparisonData {
  label: string;
  summary: {
    totalSelling: number;
    totalTax: number;
    totalTaxPercent: number;
    totalProfit: number;
    breakEvenPoint: number;
  };
}

interface ComparisonReportPDFProps {
  results: ComparisonData[];
  bestResult: ComparisonData;
  companyName: string;
  accountantName: string;
  accountantCrc: string;
}

export const ComparisonReportPDF: React.FC<ComparisonReportPDFProps> = ({ results, bestResult, companyName, accountantName, accountantCrc }) => {
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const colWidth = `${100 / (results.length + 1)}%`;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandBlock}><Text style={styles.brandTitle}>JOTA</Text><Text style={styles.brandSubtitle}>CONTABILIDADE E INTELIGÊNCIA</Text></View>
          <View style={styles.reportInfo}><Text style={styles.reportTitle}>Comparativo de Regimes</Text><Text style={styles.reportDate}>{companyName}</Text><Text style={styles.reportDate}>Emissão: {currentDate}</Text></View>
        </View>

        <View style={styles.bestResultCard}>
          <Text style={styles.bestResultTitle}>Recomendação: Regime Mais Vantajoso</Text>
          <Text style={styles.bestResultText}>
            {bestResult.label}, com Lucro Líquido de {formatCurrency(bestResult.summary.totalProfit)}
          </Text>
        </View>

        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableHeaderRow} fixed>
            <View style={[styles.tableColHeader, { width: colWidth }]}><Text>Métrica</Text></View>
            {results.map(res => (
              <View key={res.label} style={[styles.tableColHeader, { width: colWidth, textAlign: 'right' }]}><Text>{res.label}</Text></View>
            ))}
          </View>
          
          {/* Body Rows */}
          <View style={styles.tableRow}>
            <View style={[styles.tableCol, { width: colWidth }]}><Text style={{ fontWeight: 'bold' }}>Venda Sugerida</Text></View>
            {results.map(res => (
              <View key={res.label} style={[styles.tableCol, { width: colWidth }]}><Text style={[styles.tableCell, styles.tableCellRight]}>{formatCurrency(res.summary.totalSelling)}</Text></View>
            ))}
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.tableCol, { width: colWidth }]}><Text style={{ fontWeight: 'bold' }}>Impostos Líquidos</Text></View>
            {results.map(res => (
              <View key={res.label} style={[styles.tableCol, { width: colWidth }]}><Text style={[styles.tableCell, styles.tableCellRight, styles.colorDestructive]}>{formatCurrency(res.summary.totalTax)} ({formatPercent(res.summary.totalTaxPercent)})</Text></View>
            ))}
          </View>
          <View style={[styles.tableRow, { backgroundColor: '#f0fdf4' }]}>
            <View style={[styles.tableCol, { width: colWidth }]}><Text style={{ fontWeight: 'bold' }}>LUCRO LÍQUIDO</Text></View>
            {results.map(res => (
              <View key={res.label} style={[styles.tableCol, { width: colWidth }]}><Text style={[styles.tableCell, styles.tableCellRight, styles.colorSuccess, { fontWeight: 'bold', fontSize: 11 }]}>{formatCurrency(res.summary.totalProfit)}</Text></View>
            ))}
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.tableCol, { width: colWidth }]}><Text style={{ fontWeight: 'bold' }}>Ponto de Equilíbrio</Text></View>
            {results.map(res => (
              <View key={res.label} style={[styles.tableCol, { width: colWidth }]}><Text style={[styles.tableCell, styles.tableCellRight]}>{formatCurrency(res.summary.breakEvenPoint)}</Text></View>
            ))}
          </View>
        </View>
        
        <View style={styles.footer} fixed>
          <View><Text>{companyName}</Text><Text>Relatório gerado eletronicamente pelo Sistema Jota</Text></View>
          <View style={{ alignItems: 'flex-end' }}><Text>{accountantName ? `Resp. Técnico: ${accountantName}` : ''}</Text><Text>{accountantCrc ? `CRC: ${accountantCrc}` : ''}</Text></View>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};