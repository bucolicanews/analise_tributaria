import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 9, color: '#333333', backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#f97316', paddingBottom: 10 },
  brandBlock: { flexDirection: 'column' },
  brandTitle: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#f97316' },
  brandSubtitle: { fontSize: 8, color: '#64748b', textTransform: 'uppercase' },
  reportInfo: { alignItems: 'flex-end' },
  reportTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#1e293b' },
  reportDate: { fontSize: 9, color: '#94a3b8', marginTop: 4 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#334155', marginBottom: 10, marginTop: 15, textTransform: 'uppercase', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4 },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#94a3b8' },
  itemBlock: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4, marginBottom: 12 },
  itemHeader: { backgroundColor: '#f8fafc', padding: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  itemTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1e293b' },
  itemCode: { fontSize: 7, color: '#64748b', marginTop: 2 },
  riskAlert: { padding: 8, flexDirection: 'row' },
  riskTextTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  riskText: { fontSize: 7 },
  comparisonContainer: { flexDirection: 'row', padding: 8 },
  comparisonColumn: { flex: 1, backgroundColor: '#f8fafc', padding: 6, borderRadius: 3, marginRight: 5 },
  comparisonColumnLast: { flex: 1, backgroundColor: '#f0fdf4', padding: 6, borderRadius: 3, borderWidth: 1, borderColor: '#bbf7d0' },
  comparisonTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#475569', marginBottom: 4, textTransform: 'uppercase' },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 2, paddingBottom: 2, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailLabel: { fontSize: 7, color: '#475569' },
  detailValue: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  colorRed: { color: '#ef4444' },
  colorGreen: { color: '#22c55e' },
  colorBlue: { color: '#3b82f6' },
  colorYellow: { color: '#ca8a04' },
});

const DetailItem = ({ label, value, colorStyle = {} }: { label: string; value: string | number; colorStyle?: object }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, colorStyle]}>{String(value)}</Text>
  </View>
);

const AuditItem = ({ item }: { item: any }) => {
  const riskStyles: Record<string, { bg: string; color: string; title: string }> = {
    overpayment: { bg: '#eff6ff', color: '#2563eb', title: 'Ineficiencia Fiscal: Bitributacao (Pagamento a MAIOR)' },
    underpayment: { bg: '#fee2e2', color: '#dc2626', title: 'Inconformidade Fiscal: Risco de Passivo (Pagamento a MENOR)' },
    generic: { bg: '#fefce8', color: '#ca8a04', title: 'Divergencia Cadastral Identificada' },
    none: { bg: '#f0fdf4', color: '#16a34a', title: 'Conformidade Tributaria Identificada' },
  };
  const risk = riskStyles[item.riskType] || riskStyles.generic;

  return (
    <View style={styles.itemBlock} wrap={false}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.sale.name}</Text>
        <Text style={styles.itemCode}>Cod: {item.sale.code}</Text>
      </View>

      <View style={[styles.riskAlert, { backgroundColor: risk.bg }]}>
        <View>
          <Text style={[styles.riskTextTitle, { color: risk.color }]}>{risk.title}</Text>
          <Text style={[styles.riskText, { color: risk.color }]}>
            {item.riskType === 'overpayment' ? 'Produto com ST na entrada, mas tributado na venda.' :
             item.riskType === 'underpayment' ? 'Venda com segregacao de ST, mas entrada tributada.' :
             item.riskType === 'generic' ? 'Codigos (NCM, CST) divergentes entre compra e venda.' :
             'Cadastro de venda alinhado com a nota fiscal de entrada.'}
          </Text>
        </View>
      </View>

      <View style={styles.comparisonContainer}>
        <View style={styles.comparisonColumn}>
          <Text style={styles.comparisonTitle}>Situacao Atual (Venda)</Text>
          <DetailItem label="CSOSN/CST" value={item.sale.cst || '---'} />
          <DetailItem label="CST PIS/COFINS" value={item.sale.pisCst || '---'} />
          <DetailItem label="NCM" value={item.sale.ncm || '---'} />
        </View>
        <View style={styles.comparisonColumnLast}>
          <Text style={[styles.comparisonTitle, { color: '#15803d' }]}>Sugestao (Baseado na Compra)</Text>
          <DetailItem label="CSOSN/CST" value={item.calculated.suggestedCodes.icmsCstOrCsosn} />
          <DetailItem label="CST PIS/COFINS" value={item.calculated.suggestedCodes.pisCofinsCst} />
          <DetailItem label="NCM" value={item.calculated.ncm || '---'} />
          <DetailItem label="cClassTrib" value={item.calculated.cClassTrib || '1'} />
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
          <View style={styles.brandBlock}>
            <Text style={styles.brandTitle}>JOTA</Text>
            <Text style={styles.brandSubtitle}>CONTABILIDADE E INTELIGENCIA</Text>
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>Relatorio de Auditoria Fiscal</Text>
            <Text style={styles.reportDate}>{companyName}</Text>
            <Text style={styles.reportDate}>Emissao: {currentDate}</Text>
          </View>
        </View>

        {divergentItems.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Itens com Divergencia ({divergentItems.length})</Text>
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
            <Text style={styles.sectionTitle}>Itens Sem Vinculo ({unassociatedItems.length})</Text>
            {unassociatedItems.map((item, i) => <AuditItem key={i} item={item} />)}
          </View>
        )}

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