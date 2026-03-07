import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { CalculatedProduct } from '@/types/pricing';

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 9, color: '#333333', backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#f97316', paddingBottom: 10 },
  brandBlock: { flexDirection: 'column' },
  brandTitle: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#f97316' },
  brandSubtitle: { fontSize: 8, color: '#64748b', textTransform: 'uppercase' },
  reportInfo: { alignItems: 'flex-end' },
  reportTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#1e293b' },
  reportDate: { fontSize: 9, color: '#94a3b8', marginTop: 4 },
  bestResultCard: { padding: 15, backgroundColor: '#f0fdf4', borderRadius: 4, borderWidth: 1, borderColor: '#bbf7d0', marginBottom: 20 },
  bestResultTitle: { fontSize: 10, color: '#15803d', marginBottom: 6, textTransform: 'uppercase', fontFamily: 'Helvetica-Bold' },
  bestResultText: { fontSize: 14, color: '#166534', fontFamily: 'Helvetica-Bold' },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#334155', marginBottom: 10, marginTop: 15, textTransform: 'uppercase', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 2, borderBottomColor: '#e2e8f0' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableRowGroupHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tableRowHighlight: { flexDirection: 'row', backgroundColor: '#f0fdf4', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableWrapper: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, marginBottom: 20 },
  colHeader: { padding: 8, fontFamily: 'Helvetica-Bold', fontSize: 8, textTransform: 'uppercase', color: '#475569' },
  col: { padding: 8 },
  cellRight: { textAlign: 'right', fontSize: 9, fontFamily: 'Helvetica' },
  cellRightBold: { textAlign: 'right', fontSize: 9, fontFamily: 'Helvetica-Bold' },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#94a3b8' },
  colorDestructive: { color: '#ef4444' },
  colorSuccess: { color: '#16a34a' },
  colorPrimary: { color: '#f97316' },
  textMuted: { color: '#64748b' }
});

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatPercent = (value: number) => value.toFixed(2) + '%';

interface ComparisonData {
  label: string;
  summary: {
    totalSelling: number;
    totalTax: number;
    totalTaxPercent: number;
    totalProfit: number;
    breakEvenPoint: number;
    totalCbsDebit: number;
    totalIbsDebit: number;
    totalCbsCredit: number;
    totalIbsCredit: number;
    totalCbsTaxToPay: number;
    totalIbsTaxToPay: number;
    totalIrpjToPay: number;
    totalCsllToPay: number;
    totalSimplesToPay: number;
    totalSelectiveTaxToPay: number;
    totalInssPatronalRateado: number;
  };
  products: CalculatedProduct[];
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
  const totalCols = results.length + 1;
  const colPct = (100 / totalCols).toFixed(1) + '%';

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandTitle}>JOTA</Text>
            <Text style={styles.brandSubtitle}>CONTABILIDADE E INTELIGENCIA</Text>
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>Comparativo de Regimes</Text>
            <Text style={styles.reportDate}>{companyName}</Text>
            <Text style={styles.reportDate}>{'Emissao: ' + currentDate}</Text>
          </View>
        </View>

        <View style={styles.bestResultCard}>
          <Text style={styles.bestResultTitle}>Recomendacao: Regime Mais Vantajoso</Text>
          <Text style={styles.bestResultText}>
            {bestResult.label + ', com Lucro Liquido de ' + formatCurrency(bestResult.summary.totalProfit)}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Resumo Global - Demonstracao de Resultado</Text>
        <View style={styles.tableWrapper}>
          <View style={styles.tableHeaderRow} fixed>
            <View style={[styles.colHeader, { width: colPct }]}><Text>Metrica Financeira</Text></View>
            {results.map(res => (
              <View key={res.label} style={[styles.colHeader, { width: colPct, textAlign: 'right' }]}>
                <Text>{res.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.tableRow}>
            <View style={[styles.col, { width: colPct }]}><Text style={[styles.colorPrimary, { fontFamily: 'Helvetica-Bold' }]}>Venda Sugerida Total</Text></View>
            {results.map(res => (
              <View key={res.label} style={[styles.col, { width: colPct }]}>
                <Text style={[styles.cellRightBold, styles.colorPrimary]}>{formatCurrency(res.summary.totalSelling)}</Text>
              </View>
            ))}
          </View>

          {/* GRUPO 1: IBS / CBS */}
          <View style={styles.tableRowGroupHeader}>
            <View style={{ padding: 8, width: '100%' }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#475569', textTransform: 'uppercase' }}>1. Apuracao IBS / CBS (Reforma)</Text>
            </View>
          </View>

          <View style={styles.tableRow}>
            <View style={[styles.col, { width: colPct }]}><Text style={{ fontFamily: 'Helvetica', fontSize: 8, color: '#64748b', paddingLeft: 10 }}>(+) Debito CBS (Venda)</Text></View>
            {results.map(res => (
              <View key={res.label} style={[styles.col, { width: colPct }]}>
                <Text style={[styles.cellRight, { color: '#64748b', fontSize: 8 }]}>{formatCurrency(res.summary.totalCbsDebit)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.col, { width: colPct }]}><Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#16a34a', paddingLeft: 10 }}>(-) Credito CBS (PIS/COFINS Compra)</Text></View>
            {results.map(res => (
              <View key={res.label} style={[styles.col, { width: colPct }]}>
                <Text style={[styles.cellRightBold, styles.colorSuccess, { fontSize: 8 }]}>{formatCurrency(res.summary.totalCbsCredit)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.col, { width: colPct }]}><Text style={{ fontFamily: 'Helvetica', fontSize: 8, color: '#64748b', paddingLeft: 10 }}>(+) Debito IBS (Venda)</Text></View>
            {results.map(res => (
              <View key={res.label} style={[styles.col, { width: colPct }]}>
                <Text style={[styles.cellRight, { color: '#64748b', fontSize: 8 }]}>{formatCurrency(res.summary.totalIbsDebit)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.col, { width: colPct }]}><Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#16a34a', paddingLeft: 10 }}>(-) Credito IBS (ICMS da Compra)</Text></View>
            {results.map(res => (
              <View key={res.label} style={[styles.col, { width: colPct }]}>
                <Text style={[styles.cellRightBold, styles.colorSuccess, { fontSize: 8 }]}>{formatCurrency(res.summary.totalIbsCredit)}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.tableRow, { backgroundColor: '#f8fafc' }]}>
            <View style={[styles.col, { width: colPct }]}><Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#ef4444', paddingLeft: 10 }}>(=) IBS + CBS a Pagar (Liquido)</Text></View>
            {results.map(res => (
              <View key={res.label} style={[styles.col, { width: colPct }]}>
                <Text style={[styles.cellRightBold, styles.colorDestructive, { fontSize: 8 }]}>{formatCurrency(res.summary.totalCbsTaxToPay + res.summary.totalIbsTaxToPay)}</Text>
              </View>
            ))}
          </View>

          {/* GRUPO 2: OUTROS IMPOSTOS */}
          <View style={styles.tableRowGroupHeader}>
            <View style={{ padding: 8, width: '100%' }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#475569', textTransform: 'uppercase' }}>2. Demais Tributos da Operacao</Text>
            </View>
          </View>

          <View style={styles.tableRow}>
            <View style={[styles.col, { width: colPct }]}><Text style={{ fontFamily: 'Helvetica', fontSize: 8, color: '#64748b', paddingLeft: 10 }}>(+) IRPJ e CSLL</Text></View>
            {results.map(res => (
              <View key={res.label} style={[styles.col, { width: colPct }]}>
                <Text style={[styles.cellRight, { color: '#64748b', fontSize: 8 }]}>{formatCurrency(res.summary.totalIrpjToPay + res.summary.totalCsllToPay)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.col, { width: colPct }]}><Text style={{ fontFamily: 'Helvetica', fontSize: 8, color: '#64748b', paddingLeft: 10 }}>(+) Simples Nacional (DAS)</Text></View>
            {results.map(res => (
              <View key={res.label} style={[styles.col, { width: colPct }]}>
                <Text style={[styles.cellRight, { color: '#64748b', fontSize: 8 }]}>{formatCurrency(res.summary.totalSimplesToPay)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.tableRow}>
            <View style={[styles.col, { width: colPct }]}><Text style={{ fontFamily: 'Helvetica', fontSize: 8, color: '#64748b', paddingLeft: 10 }}>(+) Imposto Seletivo (IS)</Text></View>
            {results.map(res => (
              <View key={res.label} style={[styles.col, { width: colPct }]}>
                <Text style={[styles.cellRight, { color: '#64748b', fontSize: 8 }]}>{formatCurrency(res.summary.totalSelectiveTaxToPay)}</Text>
              </View>
            ))}
          </View>

          {/* GRUPO 3: ENCARGOS SOBRE FOLHA */}
          <View style={styles.tableRowGroupHeader}>
            <View style={{ padding: 8, width: '100%' }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#475569', textTransform: 'uppercase' }}>3. Encargos sobre a Folha (Custo Fixo)</Text>
            </View>
          </View>
          
          <View style={styles.tableRow}>
            <View style={[styles.col, { width: colPct }]}><Text style={{ fontFamily: 'Helvetica', fontSize: 8, color: '#64748b', paddingLeft: 10 }}>(+) INSS Patronal Rateado</Text></View>
            {results.map(res => (
              <View key={res.label} style={[styles.col, { width: colPct }]}>
                <Text style={[styles.cellRight, { color: '#64748b', fontSize: 8 }]}>{formatCurrency(res.summary.totalInssPatronalRateado)}</Text>
              </View>
            ))}
          </View>

          {/* TOTAIS */}
          <View style={styles.tableRow}>
            <View style={[styles.col, { width: colPct }]}><Text style={[styles.colorDestructive, { fontFamily: 'Helvetica-Bold' }]}>(=) Impostos Liquidos Totais</Text></View>
            {results.map(res => (
              <View key={res.label} style={[styles.col, { width: colPct }]}>
                <Text style={[styles.cellRightBold, styles.colorDestructive]}>
                  {formatCurrency(res.summary.totalTax)}
                </Text>
                <Text style={{ fontSize: 6, color: '#ef4444', textAlign: 'right', marginTop: 1 }}>
                  ({formatPercent(res.summary.totalTaxPercent)})
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.tableRow, { backgroundColor: '#fee2e2' }]}>
            <View style={[styles.col, { width: colPct }]}><Text style={[styles.colorDestructive, { fontFamily: 'Helvetica-Bold' }]}>CARGA TOTAL (Impostos + INSS)</Text></View>
            {results.map(res => {
              const cargaTotal = res.summary.totalTax + res.summary.totalInssPatronalRateado;
              const cargaPct = res.summary.totalSelling > 0 ? (cargaTotal / res.summary.totalSelling) * 100 : 0;
              return (
              <View key={res.label} style={[styles.col, { width: colPct }]}>
                <Text style={[styles.cellRightBold, styles.colorDestructive]}>
                  {formatCurrency(cargaTotal)}
                </Text>
                <Text style={{ fontSize: 6, color: '#ef4444', textAlign: 'right', marginTop: 1 }}>
                  ({formatPercent(cargaPct)})
                </Text>
              </View>
            )})}
          </View>

          <View style={styles.tableRowHighlight}>
            <View style={[styles.col, { width: colPct }]}><Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#16a34a' }}>LUCRO LIQUIDO FINAL</Text></View>
            {results.map(res => (
              <View key={res.label} style={[styles.col, { width: colPct }]}>
                <Text style={[styles.cellRightBold, styles.colorSuccess, { fontSize: 11 }]}>
                  {formatCurrency(res.summary.totalProfit)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.tableRow}>
            <View style={[styles.col, { width: colPct }]}><Text style={{ fontFamily: 'Helvetica-Bold', color: '#64748b' }}>Ponto de Equilibrio</Text></View>
            {results.map(res => (
              <View key={res.label} style={[styles.col, { width: colPct }]}>
                <Text style={[styles.cellRight, { color: '#64748b' }]}>{formatCurrency(res.summary.breakEvenPoint)}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Analise de Precos por Produto (B2C vs B2B)</Text>
        <View style={styles.tableWrapper}>
          <View style={styles.tableHeaderRow} fixed>
            <View style={[styles.colHeader, { width: colPct }]}><Text>Produto / Custo</Text></View>
            {results.map(res => (
              <View key={res.label} style={[styles.colHeader, { width: colPct, textAlign: 'center' }]}>
                <Text>{res.label}</Text>
              </View>
            ))}
          </View>
          
          {results[0].products.map((_, index) => {
            return (
              <View key={index} style={styles.tableRow} wrap={false}>
                <View style={[styles.col, { width: colPct }]}>
                  <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8 }}>{results[0].products[index].name}</Text>
                  <Text style={{ fontSize: 7, color: '#64748b', marginTop: 2 }}>Cod: {results[0].products[index].code}</Text>
                  <Text style={{ fontSize: 7, color: '#64748b', marginTop: 1 }}>Custo Aq.: {formatCurrency(results[0].products[index].cost)}</Text>
                </View>
                {results.map(res => {
                  const prod = res.products[index];
                  const precoB2C = prod.sellingPrice;
                  const precoB2B = prod.sellingPrice - prod.ivaCreditForClient;
                  return (
                    <View key={res.label} style={[styles.col, { width: colPct, alignItems: 'center' }]}>
                      <View style={{ marginBottom: 4, alignItems: 'center', backgroundColor: '#fff7ed', padding: 4, borderRadius: 2, width: '90%' }}>
                        <Text style={{ fontSize: 5, color: '#ea580c', textTransform: 'uppercase' }}>Consumidor (B2C)</Text>
                        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#c2410c', marginTop: 2 }}>{formatCurrency(precoB2C)}</Text>
                      </View>
                      <View style={{ alignItems: 'center', backgroundColor: '#eff6ff', padding: 4, borderRadius: 2, width: '90%' }}>
                        <Text style={{ fontSize: 5, color: '#2563eb', textTransform: 'uppercase' }}>Empresa (B2B)</Text>
                        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#1d4ed8', marginTop: 2 }}>{formatCurrency(precoB2B)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>

        <View style={styles.footer} fixed>
          <View>
            <Text>{companyName}</Text>
            <Text>Relatorio gerado eletronicamente pelo Sistema Jota</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text>{accountantName ? ('Resp. Tecnico: ' + accountantName) : ''}</Text>
            <Text>{accountantCrc ? ('CRC: ' + accountantCrc) : ''}</Text>
          </View>
          <Text render={({ pageNumber, totalPages }) => ('Pagina ' + pageNumber + ' de ' + totalPages)} />
        </View>
      </Page>
    </Document>
  );
};