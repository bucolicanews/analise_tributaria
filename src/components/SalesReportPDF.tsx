import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { CalculatedProduct } from '@/types/pricing';

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
  summaryContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, padding: 10, backgroundColor: '#f8fafc', borderRadius: 4, border: '1px solid #e2e8f0' },
  summaryLabel: { fontSize: 7, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', fontWeight: 'bold' },
  summaryValue: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#334155', marginBottom: 10, marginTop: 5, textTransform: 'uppercase' },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, borderTop: '1px solid #e2e8f0', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#94a3b8' },
  
  // Estilos para os blocos de produto
  productBlock: { border: '1px solid #e2e8f0', borderRadius: 4, marginBottom: 12, pageBreakInside: 'avoid' },
  productHeader: { backgroundColor: '#f8fafc', padding: 10, borderBottom: '1px solid #e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  productTitle: { fontSize: 11, fontWeight: 'bold', color: '#1e293b', width: '75%' },
  productCode: { fontSize: 8, color: '#64748b', marginTop: 2 },
  productMainPriceContainer: { alignItems: 'flex-end' },
  productMainPriceLabel: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase' },
  productMainPrice: { fontSize: 14, fontWeight: 'bold', color: '#f97316' },
  productBody: { padding: 10, flexDirection: 'row', gap: 10 },
  productColumn: { flex: 1 },
  columnTitle: { fontSize: 9, fontWeight: 'bold', color: '#334155', marginBottom: 5, borderBottom: '1px solid #e2e8f0', paddingBottom: 3, textTransform: 'uppercase' },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottom: '1px dotted #f1f5f9' },
  detailLabel: { fontSize: 8, color: '#475569' },
  detailValue: { fontSize: 8, fontWeight: 'bold', color: '#0f172a' },
  
  // Cores para valores
  colorYellow: { color: '#ca8a04' },
  colorPrimary: { color: '#f97316' },
  colorDestructive: { color: '#ef4444' },
  colorSuccess: { color: '#22c55e' },
});

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const formatPercent = (value: number) => `${value.toFixed(2)}%`;

const DetailItem = ({ label, value, isBold = false, colorStyle = {} }: { label: string; value: string | number; isBold?: boolean; colorStyle?: object }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, isBold ? { fontWeight: 'bold' } : {}, colorStyle]}>{value}</Text>
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
          <View style={styles.brandBlock}><Text style={styles.brandTitle}>JOTA</Text><Text style={styles.brandSubtitle}>CONTABILIDADE E INTELIGÊNCIA</Text></View>
          <View style={styles.reportInfo}><Text style={styles.reportTitle}>Relatório Oficial de Precificação</Text><Text style={styles.reportDate}>{companyName}</Text><Text style={styles.reportDate}>Emissão: {currentDate}</Text></View>
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>Custo Total Estoque</Text><Text style={styles.summaryValue}>{formatCurrency(totalCost)}</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>Faturamento Projetado</Text><Text style={[styles.summaryValue, { color: '#f97316' }]}>{formatCurrency(totalSales)}</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>Impostos Totais (Est.)</Text><Text style={[styles.summaryValue, { color: '#ef4444' }]}>{formatCurrency(totalTaxes)}</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>Lucro Líquido Projetado</Text><Text style={[styles.summaryValue, { color: '#22c55e' }]}>{formatCurrency(totalProfit)}</Text></View>
          <View style={styles.summaryCard}><Text style={styles.summaryLabel}>Margem Média</Text><Text style={styles.summaryValue}>{formatPercent(avgMargin)}</Text></View>
        </View>

        <Text style={styles.sectionTitle}>Detalhamento Técnico por Produto</Text>

        {products.map((p, i) => {
          const fixedCostPerCommercialUnit = (p.valueForFixedCost / p.quantity) || 0;
          const totalBaseCost = p.cost + fixedCostPerCommercialUnit;
          const productProfit = p.sellingPrice - p.cost - p.taxToPay - p.valueForVariableExpenses - fixedCostPerCommercialUnit;
          const productProfitMargin = p.sellingPrice > 0 ? (productProfit / p.sellingPrice) * 100 : 0;
          
          return (
            <View key={i} style={styles.productBlock} wrap={false}>
              <View style={styles.productHeader}>
                <View><Text style={styles.productTitle}>{p.name}</Text><Text style={styles.productCode}>Cód: {p.code} | NCM: {p.ncm || 'N/A'}</Text></View>
                <View style={styles.productMainPriceContainer}><Text style={styles.productMainPriceLabel}>Venda Sug. (Unid. Int.)</Text><Text style={styles.productMainPrice}>{formatCurrency(p.sellingPricePerInnerUnit)}</Text></View>
              </View>
              
              <View style={styles.productBody}>
                <View style={styles.productColumn}>
                  <Text style={styles.columnTitle}>Unidade de Compra</Text>
                  <DetailItem label="Unid. Com." value={p.unit} />
                  <DetailItem label="Qtd. Estoque" value={p.quantity.toFixed(2)} />
                  <DetailItem label="Custo Aquisição" value={formatCurrency(p.cost)} />
                  <DetailItem label="Custo Fixo Rateado" value={formatCurrency(fixedCostPerCommercialUnit)} />
                  <DetailItem label="Custo Total Base" value={formatCurrency(totalBaseCost)} isBold={true} />
                  <DetailItem label="Venda Mínima" value={formatCurrency(p.minSellingPrice)} colorStyle={styles.colorYellow} />
                  <DetailItem label="Venda Sugerida" value={formatCurrency(p.sellingPrice)} colorStyle={styles.colorPrimary} isBold={true} />
                </View>
                
                <View style={styles.productColumn}>
                  <Text style={styles.columnTitle}>Unidade de Venda</Text>
                  <DetailItem label="Qtd. Interna" value={p.innerQuantity} />
                  <DetailItem label="Custo Unid. Int." value={formatCurrency(p.costPerInnerUnit)} />
                  <DetailItem label="Venda Mín. Unid. Int." value={formatCurrency(p.minSellingPricePerInnerUnit)} colorStyle={styles.colorYellow} />
                  <DetailItem label="Venda Sug. Unid. Int." value={formatCurrency(p.sellingPricePerInnerUnit)} colorStyle={styles.colorPrimary} isBold={true} />
                </View>
                
                <View style={styles.productColumn}>
                  <Text style={styles.columnTitle}>Análise Financeira</Text>
                  <DetailItem label="Imposto Líquido" value={formatCurrency(p.taxToPay)} colorStyle={styles.colorDestructive} />
                  <DetailItem label="Crédito p/ Cliente" value={formatCurrency(p.ivaCreditForClient)} colorStyle={styles.colorSuccess} />
                  <DetailItem label="Markup Aplicado" value={formatPercent(p.markupPercentage)} isBold={true} />
                  <DetailItem label="Margem de Lucro" value={formatPercent(productProfitMargin)} colorStyle={styles.colorSuccess} isBold={true} />
                </View>
              </View>
            </View>
          );
        })}
        
        <View style={styles.footer} fixed>
          <View><Text>{companyName}</Text><Text>Relatório gerado eletronicamente pelo Sistema Jota</Text></View>
          <View style={{ alignItems: 'flex-end' }}><Text>{accountantName ? `Resp. Técnico: ${accountantName}` : ''}</Text><Text>{accountantCrc ? `CRC: ${accountantCrc}` : ''}</Text></View>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};