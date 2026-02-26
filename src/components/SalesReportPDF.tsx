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
  summaryContainer: { flexDirection: 'row', marginBottom: 20 },
  summaryCard: { flex: 1, padding: 10, backgroundColor: '#f8fafc', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 6 },
  summaryCardLast: { flex: 1, padding: 10, backgroundColor: '#f8fafc', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  summaryLabel: { fontSize: 7, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', fontFamily: 'Helvetica-Bold' },
  summaryValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#334155', marginBottom: 10, marginTop: 5, textTransform: 'uppercase' },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#94a3b8' },
  productBlock: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, marginBottom: 12 },
  productHeader: { backgroundColor: '#f8fafc', padding: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  productTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1e293b', width: '75%' },
  productCode: { fontSize: 8, color: '#64748b', marginTop: 2 },
  productMainPriceContainer: { alignItems: 'flex-end' },
  productMainPriceLabel: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase' },
  productMainPrice: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#f97316' },
  productBody: { padding: 10, flexDirection: 'row' },
  productColumn: { flex: 1, marginRight: 8 },
  productColumnLast: { flex: 1 },
  columnTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#334155', marginBottom: 5, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 3, textTransform: 'uppercase' },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 3, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailLabel: { fontSize: 8, color: '#475569' },
  detailValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  colorYellow: { color: '#ca8a04' },
  colorPrimary: { color: '#f97316' },
  colorDestructive: { color: '#ef4444' },
  colorSuccess: { color: '#22c55e' },
});

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatPercent = (value: number) => value.toFixed(2) + '%';

const DetailItem = ({ label, value, colorStyle = {} }: { label: string; value: string | number; colorStyle?: object }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, colorStyle]}>{String(value)}</Text>
  </View>
);

interface SalesReportPDFProps {
  products: CalculatedProduct[];
  companyName: string;
  accountantName: string;
  accountantCrc: string;
}

export const SalesReportPDF: React.FC<SalesReportPDFProps> = ({ products, companyName, accountantName, accountantCrc }) => {
  const totalCost = products.reduce((acc, p) => acc + (p.cost * p.quantity), 0);
  const totalSales = products.reduce((acc, p) => acc + (p.sellingPrice * p.quantity), 0);
  const totalProfit = products.reduce((acc, p) => acc + (p.valueForProfit * p.quantity), 0);
  const totalTaxes = products.reduce((acc, p) => acc + (p.taxToPay * p.quantity), 0);
  const avgMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
  const currentDate = new Date().toLocaleDateString('pt-BR');

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandTitle}>JOTA</Text>
            <Text style={styles.brandSubtitle}>CONTABILIDADE E INTELIGENCIA</Text>
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>Relatorio Oficial de Precificacao</Text>
            <Text style={styles.reportDate}>{companyName}</Text>
            <Text style={styles.reportDate}>{'Emissao: ' + currentDate}</Text>
          </View>
        </View>

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
            <Text style={styles.summaryLabel}>Lucro Liquido Projetado</Text>
            <Text style={[styles.summaryValue, { color: '#22c55e' }]}>{formatCurrency(totalProfit)}</Text>
          </View>
          <View style={styles.summaryCardLast}>
            <Text style={styles.summaryLabel}>Margem Media</Text>
            <Text style={styles.summaryValue}>{formatPercent(avgMargin)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Detalhamento Tecnico por Produto</Text>

        {products.map((p, i) => {
          const fixedCostPerUnit = (p.valueForFixedCost / p.quantity) || 0;
          const totalBaseCost = p.cost + fixedCostPerUnit;
          const productProfit = p.sellingPrice - p.cost - p.taxToPay - p.valueForVariableExpenses - fixedCostPerUnit;
          const productProfitMargin = p.sellingPrice > 0 ? (productProfit / p.sellingPrice) * 100 : 0;

          return (
            <View key={i} style={styles.productBlock} wrap={false}>
              <View style={styles.productHeader}>
                <View>
                  <Text style={styles.productTitle}>{p.name}</Text>
                  <Text style={styles.productCode}>{'Cod: ' + p.code + ' | NCM: ' + (p.ncm || 'N/A')}</Text>
                </View>
                <View style={styles.productMainPriceContainer}>
                  <Text style={styles.productMainPriceLabel}>Venda Sug. (Unid. Int.)</Text>
                  <Text style={styles.productMainPrice}>{formatCurrency(p.sellingPricePerInnerUnit)}</Text>
                </View>
              </View>

              <View style={styles.productBody}>
                <View style={styles.productColumn}>
                  <Text style={styles.columnTitle}>Unidade de Compra</Text>
                  <DetailItem label="Unid. Com." value={p.unit} />
                  <DetailItem label="Qtd. Estoque" value={p.quantity.toFixed(2)} />
                  <DetailItem label="Custo Aquisicao" value={formatCurrency(p.cost)} />
                  <DetailItem label="Custo Fixo Rateado" value={formatCurrency(fixedCostPerUnit)} />
                  <DetailItem label="Custo Total Base" value={formatCurrency(totalBaseCost)} />
                  <DetailItem label="Venda Minima" value={formatCurrency(p.minSellingPrice)} colorStyle={styles.colorYellow} />
                  <DetailItem label="Venda Sugerida" value={formatCurrency(p.sellingPrice)} colorStyle={styles.colorPrimary} />
                </View>

                <View style={styles.productColumn}>
                  <Text style={styles.columnTitle}>Unidade de Venda</Text>
                  <DetailItem label="Qtd. Interna" value={p.innerQuantity} />
                  <DetailItem label="Custo Unid. Int." value={formatCurrency(p.costPerInnerUnit)} />
                  <DetailItem label="Venda Min. Unid. Int." value={formatCurrency(p.minSellingPricePerInnerUnit)} colorStyle={styles.colorYellow} />
                  <DetailItem label="Venda Sug. Unid. Int." value={formatCurrency(p.sellingPricePerInnerUnit)} colorStyle={styles.colorPrimary} />
                </View>

                <View style={styles.productColumnLast}>
                  <Text style={styles.columnTitle}>Analise Financeira</Text>
                  <DetailItem label="Imposto Liquido" value={formatCurrency(p.taxToPay)} colorStyle={styles.colorDestructive} />
                  <DetailItem label="Credito p/ Cliente" value={formatCurrency(p.ivaCreditForClient)} colorStyle={styles.colorSuccess} />
                  <DetailItem label="Markup Aplicado" value={formatPercent(p.markupPercentage)} />
                  <DetailItem label="Margem de Lucro" value={formatPercent(productProfitMargin)} colorStyle={styles.colorSuccess} />
                </View>
              </View>
            </View>
          );
        })}

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
