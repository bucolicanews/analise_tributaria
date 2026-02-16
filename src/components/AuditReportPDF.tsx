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
  
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#334155', marginBottom: 10, marginTop: 15, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: 4 },
  
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, borderTop: '1px solid #e2e8f0', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#94a3b8' },
  
  itemBlock: { border: '1px solid #e2e8f0', borderRadius: 4, marginBottom: 12, pageBreakInside: 'avoid' },
  itemHeader: { backgroundColor: '#f8fafc', padding: 8, borderBottom: '1px solid #e2e8f0' },
  itemTitle: { fontSize: 10, fontWeight: 'bold', color: '#1e293b' },
  itemCode: { fontSize: 7, color: '#64748b', marginTop: 2 },
  
  riskAlert: { padding: 8, flexDirection: 'row' },
  riskTextTitle: { fontSize: 8, fontWeight: 'bold', marginBottom: 2 },
  riskText: { fontSize: 7 },
  
  comparisonContainer: { flexDirection: 'row', padding: 8, gap: 10 },
  comparisonColumn: { flex: 1, backgroundColor: '#f8fafc', padding: 6, borderRadius: 3 },
  comparisonTitle: { fontSize: 7, fontWeight: 'bold', color: '#475569', marginBottom: 4, textTransform: 'uppercase' },
  
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2, borderBottom: '1px dotted #f1f5f9' },
  detailLabel: { fontSize: 7, color: '#475569' },
  detailValue: { fontSize: 7, fontWeight: 'bold', color: '#0f172a' },
  
  colorRed: { color: '#ef4444' },
  colorGreen: { color: '#22c55e' },
  colorBlue: { color: '#3b82f6' },
  colorYellow: { color: '#ca8a04' },
});

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const DetailItem = ({ label, value, isBold = false, colorStyle = {} }: { label: string; value: string | number; isBold?: boolean; colorStyle?: object }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, isBold ? { fontWeight: 'bold' } : {}, colorStyle]}>{String(value)}</Text>
  </View>
);

const AuditItem = ({ item }: { item: any }) => {
  const riskStyles = {
    overpayment: { bg: '#eff6ff', color: '#2563eb', title: 'Ineficiência Fiscal: Bitributação (Pagamento a MAIOR)' },
    underpayment: { bg: '#fee2e2', color: '#dc2626', title: 'Inconformidade Fiscal: Risco de Passivo (Pagamento a MENOR)' },
    generic: { bg: '#fefce8', color: '#ca8a04', title: 'Divergência Cadastral Identificada' },
    none: { bg: '#f0fdf4', color: '#16a34a', title: 'Conformidade Tributária Identificada' },
  };
  const risk = riskStyles[item.riskType] || riskStyles.generic;

  return (
    <View style={styles.itemBlock} wrap={false}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.sale.name}</Text>
        <Text style={styles.itemCode}>Cód: {item.sale.code}</Text>
      </View>
      
      <View style={[styles.riskAlert, { backgroundColor: risk.bg }]}>
        <View>
          <Text style={[styles.riskTextTitle, { color: risk.color }]}>{risk.title}</Text>
          <Text style={[styles.riskText, { color: risk.color }]}>
            {item.riskType === 'overpayment' ? "Produto com ST na entrada, mas tributado na venda." :
             item.riskType === 'underpayment' ? "Venda com segregação de ST, mas entrada tributada." :
             item.riskType === 'generic' ? "Códigos (NCM, CST) divergentes entre compra e venda." :
             "Cadastro de venda alinhado com a nota fiscal de entrada."}
          </Text>
        </View>
      </View>

      <View style={styles.comparisonContainer}>
        <View style={styles.comparisonColumn}>
          <Text style={styles.comparisonTitle}>Situação Atual (Venda)</Text>
          <DetailItem label="CSOSN/CST" value={item.sale.cst || '---'} />
          <DetailItem label="CST PIS/COFINS" value={item.sale.pisCst || '---'} />
          <DetailItem label="NCM" value={item.sale.ncm || '---'} />
        </View>
        <View style={[styles.comparisonColumn, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1 }]}>
          <Text style={[styles.comparisonTitle, { color: '#15803d' }]}>Sugestão (Baseado na Compra)</Text>
          <DetailItem label="CSOSN/CST" value={item.calculated.suggestedCodes.icmsCstOrCsosn} />
          <DetailItem label="CST PIS/COFINS" value={item.calculated.suggestedCodes.pisCofinsCst} />
          <DetailItem label="NCM" value={item.calculated.ncm || '---'} />
        </View>
      </View>
    </View>
  );
};

interface AuditReportPDFProps {
  divergentItems: any[];
  okItems: any[];
  unassociatedItems: any[];
  companyName: string;
  accountantName: string;
  accountantCrc: string;
}

export const AuditReportPDF: React.FC<AuditReportPDFProps> = ({ divergentItems, okItems, unassociatedItems, companyName, accountantName, accountantCrc }) => {
  const currentDate = new Date().toLocaleDateString('pt-BR');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandBlock}><Text style={styles.brandTitle}>JOTA</Text><Text style={styles.brandSubtitle}>CONTABILIDADE E INTELIGÊNCIA</Text></View>
          <View style={styles.reportInfo}><Text style={styles.reportTitle}>Relatório de Auditoria Fiscal</Text><Text style={styles.reportDate}>{companyName}</Text><Text style={styles.reportDate}>Emissão: {currentDate}</Text></View>
        </View>

        {divergentItems.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Itens com Divergência ({divergentItems.length})</Text>
            {divergentItems.map((item, i) => <AuditItem key={i} item={item} />)}
          </View>
        )}

        {okItems.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Itens Corretos ({okItems.length})</Text>
            {okItems.map((item, i) => <AuditItem key={i} item={item} />)}
          </View>
        )}

        {unassociatedItems.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Itens Sem Vínculo ({unassociatedItems.length})</Text>
            {unassociatedItems.map((item, i) => <AuditItem key={i} item={item} />)}
          </View>
        )}
        
        <View style={styles.footer} fixed>
          <View><Text>{companyName}</Text><Text>Relatório gerado eletronicamente pelo Sistema Jota</Text></View>
          <View style={{ alignItems: 'flex-end' }}><Text>{accountantName ? `Resp. Técnico: ${accountantName}` : ''}</Text><Text>{accountantCrc ? `CRC: ${accountantCrc}` : ''}</Text></View>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};