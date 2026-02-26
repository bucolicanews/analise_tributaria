import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingHorizontal: 40,
    paddingBottom: 80,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
  },
  coverPage: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  coverLogo: {
    width: 100,
    height: 100,
    marginBottom: 30,
  },
  coverTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  coverSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 40,
  },
  coverClientBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    width: '80%',
    borderRadius: 4,
    backgroundColor: '#fff',
    marginBottom: 40,
  },
  clientLabel: {
    fontSize: 8,
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  clientValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 10,
  },
  section: {
    marginBottom: 15,
  },
  header: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#f97316',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
    paddingBottom: 4,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  subHeader: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    marginTop: 6,
    marginBottom: 4,
  },
  text: {
    marginBottom: 6,
    textAlign: 'justify',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 10,
  },
  bulletDot: {
    width: 10,
    fontSize: 10,
    color: '#f97316',
  },
  bulletContent: {
    flex: 1,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
    color: '#000',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  qrCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrCode: {
    width: 40,
    height: 40,
    marginLeft: 8,
  },
  signatureBlock: {
    marginTop: 50,
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  signatureLine: {
    width: 250,
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8',
    marginBottom: 8,
  },
  signatureText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
  },
  signatureSubText: {
    fontSize: 8,
    color: '#64748b',
  },
  toc: {
    marginTop: 50,
    width: '100%',
  },
  tocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingTop: 5,
    paddingBottom: 5,
  }
});

interface ViabilityReportPDFProps {
  reportMarkdown: string;
  clientName: string;
  clientCity: string;
  clientState: string;
  accountantName: string;
  accountantCrc: string;
  qrCodeDataUrl: string;
  companyName: string;
}

const MarkdownRenderer = ({ content }: { content: string }) => {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <View>
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('# ')) {
          return <Text key={index} style={styles.header}>{trimmed.replace('# ', '')}</Text>;
        }
        if (trimmed.startsWith('## ')) {
          return <Text key={index} style={styles.subHeader}>{trimmed.replace('## ', '')}</Text>;
        }
        if (trimmed.startsWith('- ')) {
          return (
            <View key={index} style={styles.bulletPoint}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletContent}>
                {parseBoldText(trimmed.replace('- ', ''))}
              </Text>
            </View>
          );
        }
        if (!trimmed) {
          return <View key={index} style={{ height: 5 }} />;
        }
        return (
          <Text key={index} style={styles.text}>
            {parseBoldText(trimmed)}
          </Text>
        );
      })}
    </View>
  );
};

const parseBoldText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <Text key={i} style={styles.bold}>{part.replace(/\*\*/g, '')}</Text>;
    }
    return <Text key={i}>{part}</Text>;
  });
};

export const ViabilityReportPDF = ({
  reportMarkdown,
  clientName,
  clientCity,
  clientState,
  accountantName,
  accountantCrc,
  qrCodeDataUrl,
  companyName
}: ViabilityReportPDFProps) => {
  const currentDate = new Date().toLocaleDateString('pt-BR');

  const tocItems = reportMarkdown.split('\n')
    .filter(line => line.trim().startsWith('# '))
    .map(line => line.trim().replace('# ', ''));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <View style={{ marginBottom: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 40, color: '#f97316', fontFamily: 'Helvetica-Bold' }}>JOTA</Text>
            <Text style={{ fontSize: 10, color: '#64748b' }}>CONTABILIDADE</Text>
          </View>

          <Text style={styles.coverTitle}>Relatório Técnico de Viabilidade</Text>
          <Text style={styles.coverSubtitle}>Análise Tributária e Operacional Lei 214/2025</Text>

          <View style={styles.coverClientBox}>
            <Text style={styles.clientLabel}>CLIENTE / INTERESSADO</Text>
            <Text style={styles.clientValue}>{clientName || "Não informado"}</Text>

            <Text style={styles.clientLabel}>LOCALIZAÇÃO</Text>
            <Text style={styles.clientValue}>{clientCity} - {clientState}</Text>

            <Text style={styles.clientLabel}>DATA DE EMISSÃO</Text>
            <Text style={styles.clientValue}>{currentDate}</Text>
          </View>

          {tocItems.length > 0 && (
            <View style={styles.toc}>
              <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 10, color: '#475569' }}>ESTRUTURA DO RELATÓRIO</Text>
              {tocItems.map((item, idx) => (
                <View key={idx} style={styles.tocItem}>
                  <Text style={{ color: '#64748b' }}>{idx + 1}. {item}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <Footer companyName={companyName} accountantName={accountantName} accountantCrc={accountantCrc} />
      </Page>

      <Page size="A4" style={styles.page} wrap>
        <View style={{ position: 'absolute', top: 30, left: 40, right: 40, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between' }} fixed>
          <Text style={{ fontSize: 8, color: '#94a3b8' }}>{companyName} - Relatório Técnico</Text>
          <Text style={{ fontSize: 8, color: '#94a3b8' }}>{currentDate}</Text>
        </View>

        <View style={{ marginTop: 20 }}>
          <MarkdownRenderer content={reportMarkdown} />
        </View>

        {accountantName && (
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>{accountantName}</Text>
            <Text style={styles.signatureSubText}>Contador Responsável - CRC: {accountantCrc}</Text>
            <Text style={{ fontSize: 8, color: '#94a3b8', marginTop: 4 }}>Assinado digitalmente</Text>
          </View>
        )}

        <Footer companyName={companyName} accountantName={accountantName} accountantCrc={accountantCrc} qrCodeDataUrl={qrCodeDataUrl} fixed />
      </Page>
    </Document>
  );
};

const Footer = ({ companyName, accountantName, accountantCrc, qrCodeDataUrl, fixed = false }: any) => (
  <View style={styles.footer} fixed={fixed}>
    <View>
      <Text style={styles.footerText}>{companyName}</Text>
      <Text style={styles.footerText}>Documento gerado eletronicamente - Jota Contabilidade</Text>
      {accountantName && (
        <Text style={{ fontSize: 8, color: '#334155', fontFamily: 'Helvetica-Bold', marginTop: 2 }}>
          Resp. Técnico: {accountantName} | CRC: {accountantCrc}
        </Text>
      )}
    </View>
    <View style={styles.qrCodeContainer}>
      <Text style={{ fontSize: 6, color: '#cbd5e1', textAlign: 'right', width: 60 }}>
        Valide a autenticidade deste documento
      </Text>
      {qrCodeDataUrl && <Image src={qrCodeDataUrl} style={styles.qrCode} />}
    </View>
    <Text style={{ position: 'absolute', bottom: 0, right: -20, fontSize: 8, color: '#cbd5e1' }} render={({ pageNumber, totalPages }) => (
      `${pageNumber} / ${totalPages}`
    )} fixed />
  </View>
);
