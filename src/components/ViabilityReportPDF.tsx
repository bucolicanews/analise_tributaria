import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const ORANGE = '#f97316';
const ORANGE_LIGHT = '#fff7ed';
const ORANGE_BORDER = '#fed7aa';
const DARK = '#0f172a';
const SLATE = '#334155';
const MUTED = '#64748b';
const LIGHT_MUTED = '#94a3b8';
const BORDER = '#e2e8f0';
const BG_LIGHT = '#f8fafc';
const BG_ROW_ALT = '#f1f5f9';
const GREEN = '#16a34a';
const GREEN_LIGHT = '#f0fdf4';
const RED = '#dc2626';
const RED_LIGHT = '#fef2f2';
const BLUE = '#1d4ed8';
const BLUE_LIGHT = '#eff6ff';

const styles = StyleSheet.create({
  page: {
    paddingTop: 55,
    paddingHorizontal: 36,
    paddingBottom: 70,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: SLATE,
    backgroundColor: '#ffffff',
  },

  coverPage: {
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#ffffff',
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  coverStripe: {
    backgroundColor: ORANGE,
    height: 8,
    width: '100%',
  },
  coverBody: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 20,
  },
  coverBrand: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 36,
  },
  coverBrandName: {
    fontSize: 48,
    fontFamily: 'Helvetica-Bold',
    color: ORANGE,
    letterSpacing: 4,
  },
  coverBrandSub: {
    fontSize: 11,
    color: MUTED,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  coverDivider: {
    width: 60,
    height: 2,
    backgroundColor: ORANGE,
    marginVertical: 8,
  },
  coverTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 1,
  },
  coverSubtitle: {
    fontSize: 11,
    color: MUTED,
    textAlign: 'center',
    marginBottom: 32,
  },
  coverClientBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 4,
    borderLeftColor: ORANGE,
    padding: 16,
    width: '80%',
    borderRadius: 4,
    backgroundColor: '#fff',
    marginBottom: 32,
  },
  coverClientRow: {
    marginBottom: 10,
  },
  clientLabel: {
    fontSize: 7,
    color: LIGHT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  clientValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
  },

  tocContainer: {
    width: '80%',
    marginTop: 4,
  },
  tocTitle: {
    fontSize: 8,
    color: LIGHT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  tocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: BG_ROW_ALT,
  },
  tocItemText: {
    fontSize: 9,
    color: SLATE,
    flex: 1,
  },
  tocItemNum: {
    fontSize: 8,
    color: LIGHT_MUTED,
    marginRight: 8,
    fontFamily: 'Helvetica-Bold',
  },

  pageHeader: {
    position: 'absolute',
    top: 16,
    left: 36,
    right: 36,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageHeaderBrand: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: ORANGE,
  },
  pageHeaderSep: {
    fontSize: 9,
    color: BORDER,
  },
  pageHeaderCompany: {
    fontSize: 8,
    color: MUTED,
  },
  pageHeaderDate: {
    fontSize: 8,
    color: LIGHT_MUTED,
  },

  footer: {
    position: 'absolute',
    bottom: 22,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'column',
  },
  footerTextMain: {
    fontSize: 7,
    color: SLATE,
    fontFamily: 'Helvetica-Bold',
  },
  footerTextSub: {
    fontSize: 7,
    color: LIGHT_MUTED,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerQrLabel: {
    fontSize: 6,
    color: '#cbd5e1',
    textAlign: 'right',
    width: 56,
  },
  footerQrCode: {
    width: 36,
    height: 36,
  },
  footerPageNum: {
    fontSize: 7,
    color: LIGHT_MUTED,
  },

  h1: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: ORANGE,
    marginTop: 14,
    marginBottom: 6,
    paddingBottom: 4,
    paddingTop: 2,
    borderBottomWidth: 1,
    borderBottomColor: ORANGE_BORDER,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  h2: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: SLATE,
    marginTop: 10,
    marginBottom: 4,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: ORANGE,
  },
  h3: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: SLATE,
    marginTop: 8,
    marginBottom: 3,
    textDecoration: 'underline',
  },
  paragraph: {
    fontSize: 9,
    color: SLATE,
    marginBottom: 4,
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 8,
  },
  bulletDot: {
    fontSize: 10,
    color: ORANGE,
    marginRight: 5,
    marginTop: -1,
  },
  bulletText: {
    fontSize: 9,
    color: SLATE,
    flex: 1,
    lineHeight: 1.4,
  },
  numberedRow: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 8,
  },
  numberedNum: {
    fontSize: 9,
    color: ORANGE,
    fontFamily: 'Helvetica-Bold',
    marginRight: 5,
    width: 14,
  },
  numberedText: {
    fontSize: 9,
    color: SLATE,
    flex: 1,
    lineHeight: 1.4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginVertical: 8,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: ORANGE,
    backgroundColor: ORANGE_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 6,
    borderRadius: 2,
  },
  blockquoteText: {
    fontSize: 9,
    color: SLATE,
    lineHeight: 1.4,
  },
  calloutRed: {
    backgroundColor: RED_LIGHT,
    borderLeftWidth: 3,
    borderLeftColor: RED,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 4,
    borderRadius: 2,
  },
  calloutGreen: {
    backgroundColor: GREEN_LIGHT,
    borderLeftWidth: 3,
    borderLeftColor: GREEN,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 4,
    borderRadius: 2,
  },
  calloutBlue: {
    backgroundColor: BLUE_LIGHT,
    borderLeftWidth: 3,
    borderLeftColor: BLUE,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 4,
    borderRadius: 2,
  },
  calloutText: {
    fontSize: 9,
    lineHeight: 1.4,
  },

  tableWrapper: {
    marginVertical: 6,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: BG_ROW_ALT,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableBodyRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BG_ROW_ALT,
  },
  tableBodyRowAlt: {
    flexDirection: 'row',
    backgroundColor: BG_LIGHT,
    borderBottomWidth: 1,
    borderBottomColor: BG_ROW_ALT,
  },
  tableCellHeader: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: SLATE,
    paddingHorizontal: 6,
    paddingVertical: 4,
    flex: 1,
    textTransform: 'uppercase',
  },
  tableCellBody: {
    fontSize: 8,
    color: SLATE,
    paddingHorizontal: 6,
    paddingVertical: 4,
    flex: 1,
    lineHeight: 1.3,
  },

  signatureBlock: {
    marginTop: 40,
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  signatureLine: {
    width: 220,
    borderBottomWidth: 1,
    borderBottomColor: SLATE,
    marginBottom: 6,
  },
  signatureName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: SLATE,
  },
  signatureCrc: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
  },
  signatureDigital: {
    fontSize: 7,
    color: LIGHT_MUTED,
    marginTop: 3,
  },
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

function parseBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <Text key={i} style={{ fontFamily: 'Helvetica-Bold' }}>{part.slice(2, -2)}</Text>;
    }
    return <Text key={i}>{part}</Text>;
  });
}

function stripMd(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/`(.+?)`/g, '$1');
}

const MarkdownRenderer = ({ content }: { content: string }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;
  let tableRowCount = 0;

  const flushTable = (key: string) => {
    if (tableRows.length === 0) return;
    const [headerRow, , ...bodyRows] = tableRows;
    elements.push(
      <View key={key} style={styles.tableWrapper}>
        {headerRow && (
          <View style={styles.tableHeaderRow}>
            {headerRow.map((cell, ci) => (
              <Text key={ci} style={styles.tableCellHeader}>{stripMd(cell)}</Text>
            ))}
          </View>
        )}
        {bodyRows.map((row, ri) => (
          <View key={ri} style={ri % 2 === 0 ? styles.tableBodyRow : styles.tableBodyRowAlt}>
            {row.map((cell, ci) => (
              <Text key={ci} style={styles.tableCellBody}>{stripMd(cell)}</Text>
            ))}
          </View>
        ))}
      </View>
    );
    tableRows = [];
    tableRowCount = 0;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (/^\|/.test(trimmed)) {
      inTable = true;
      const cells = trimmed.split('|').map(c => c.trim()).filter(c => c.length > 0);
      if (!cells.every(c => /^[-:\s]+$/.test(c))) {
        tableRows.push(cells);
        tableRowCount++;
      }
      return;
    } else if (inTable) {
      inTable = false;
      flushTable(`table-${idx}`);
    }

    if (!trimmed) {
      elements.push(<View key={idx} style={{ height: 4 }} />);
      return;
    }
    if (/^#{1}\s/.test(trimmed) && !/^#{2,}/.test(trimmed)) {
      elements.push(<Text key={idx} style={styles.h1}>{trimmed.replace(/^#\s+/, '')}</Text>);
      return;
    }
    if (/^#{2}\s/.test(trimmed) && !/^#{3,}/.test(trimmed)) {
      elements.push(<Text key={idx} style={styles.h2}>{trimmed.replace(/^#{2}\s+/, '')}</Text>);
      return;
    }
    if (/^#{3,4}\s/.test(trimmed)) {
      elements.push(<Text key={idx} style={styles.h3}>{trimmed.replace(/^#{3,4}\s+/, '')}</Text>);
      return;
    }
    if (/^>\s/.test(trimmed)) {
      const text = trimmed.replace(/^>\s+/, '');
      const lc = text.toLowerCase();
      const isRisk = lc.includes('risco') || lc.includes('crítico') || lc.includes('urgente') || lc.includes('atenção');
      const isGood = lc.includes('otimiz') || lc.includes('vantaj') || lc.includes('recomend');
      const calloutStyle = isRisk ? styles.calloutRed : isGood ? styles.calloutGreen : styles.calloutBlue;
      elements.push(
        <View key={idx} style={calloutStyle}>
          <Text style={[styles.calloutText, { color: isRisk ? RED : isGood ? GREEN : BLUE }]}>{parseBold(text)}</Text>
        </View>
      );
      return;
    }
    if (/^---+$/.test(trimmed)) {
      elements.push(<View key={idx} style={styles.divider} />);
      return;
    }
    if (/^\*\s/.test(trimmed) || /^-\s/.test(trimmed)) {
      const text = trimmed.replace(/^[-*]\s+/, '');
      elements.push(
        <View key={idx} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{parseBold(text)}</Text>
        </View>
      );
      return;
    }
    if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (match) {
        elements.push(
          <View key={idx} style={styles.numberedRow}>
            <Text style={styles.numberedNum}>{match[1]}.</Text>
            <Text style={styles.numberedText}>{parseBold(match[2])}</Text>
          </View>
        );
        return;
      }
    }
    elements.push(
      <Text key={idx} style={styles.paragraph}>{parseBold(trimmed)}</Text>
    );
  });

  if (inTable) flushTable('table-end');

  return <View>{elements}</View>;
};

const PageHeader = ({ companyName, currentDate }: { companyName: string; currentDate: string }) => (
  <View style={styles.pageHeader} fixed>
    <View style={styles.pageHeaderLeft}>
      <Text style={styles.pageHeaderBrand}>JOTA</Text>
      <Text style={styles.pageHeaderSep}>|</Text>
      <Text style={styles.pageHeaderCompany}>{companyName} — Relatório Técnico de Viabilidade</Text>
    </View>
    <Text style={styles.pageHeaderDate}>{currentDate}</Text>
  </View>
);

const Footer = ({
  companyName,
  accountantName,
  accountantCrc,
  qrCodeDataUrl,
}: {
  companyName: string;
  accountantName: string;
  accountantCrc: string;
  qrCodeDataUrl?: string;
}) => (
  <View style={styles.footer} fixed>
    <View style={styles.footerLeft}>
      <Text style={styles.footerTextMain}>
        {accountantName ? `Resp. Técnico: ${accountantName} | CRC: ${accountantCrc}` : 'Jota Contabilidade'}
      </Text>
      <Text style={styles.footerTextSub}>Documento gerado eletronicamente — Jota Contabilidade</Text>
    </View>
    <View style={styles.footerRight}>
      {qrCodeDataUrl ? (
        <>
          <Text style={styles.footerQrLabel}>Valide a autenticidade deste documento</Text>
          <Image src={qrCodeDataUrl} style={styles.footerQrCode} />
        </>
      ) : null}
      <Text style={styles.footerPageNum} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
    </View>
  </View>
);

export const ViabilityReportPDF = ({
  reportMarkdown,
  clientName,
  clientCity,
  clientState,
  accountantName,
  accountantCrc,
  qrCodeDataUrl,
  companyName,
}: ViabilityReportPDFProps) => {
  const currentDate = new Date().toLocaleDateString('pt-BR');

  const tocItems = reportMarkdown
    .split('\n')
    .filter(line => /^#\s/.test(line.trim()) && !/^#{2,}/.test(line.trim()))
    .map(line => line.trim().replace(/^#\s+/, ''));

  return (
    <Document>
      {/* CAPA */}
      <Page size="A4" style={{ ...styles.page, paddingTop: 0, paddingHorizontal: 0, paddingBottom: 0 }}>
        <View style={styles.coverPage}>
          <View style={styles.coverStripe} />

          <View style={styles.coverBody}>
            <View style={styles.coverBrand}>
              <Text style={styles.coverBrandName}>JOTA</Text>
              <View style={styles.coverDivider} />
              <Text style={styles.coverBrandSub}>Contabilidade</Text>
            </View>

            <Text style={styles.coverTitle}>Relatório Técnico de Viabilidade</Text>
            <Text style={styles.coverSubtitle}>Análise Tributária e Operacional — Lei Complementar 214/2025</Text>

            <View style={styles.coverClientBox}>
              <View style={styles.coverClientRow}>
                <Text style={styles.clientLabel}>Cliente / Interessado</Text>
                <Text style={styles.clientValue}>{clientName || 'Não informado'}</Text>
              </View>
              <View style={styles.coverClientRow}>
                <Text style={styles.clientLabel}>Localização</Text>
                <Text style={styles.clientValue}>{clientCity} — {clientState}</Text>
              </View>
              <View>
                <Text style={styles.clientLabel}>Data de Emissão</Text>
                <Text style={styles.clientValue}>{currentDate}</Text>
              </View>
            </View>

            {tocItems.length > 0 && (
              <View style={styles.tocContainer}>
                <Text style={styles.tocTitle}>Estrutura do Relatório</Text>
                {tocItems.map((item, idx) => (
                  <View key={idx} style={styles.tocItem}>
                    <Text style={styles.tocItemNum}>{String(idx + 1).padStart(2, '0')}</Text>
                    <Text style={styles.tocItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{ paddingHorizontal: 36, paddingBottom: 16 }}>
            <Footer
              companyName={companyName}
              accountantName={accountantName}
              accountantCrc={accountantCrc}
              qrCodeDataUrl={qrCodeDataUrl}
            />
          </View>
        </View>
      </Page>

      {/* CONTEÚDO */}
      <Page size="A4" style={styles.page} wrap>
        <PageHeader companyName={companyName} currentDate={currentDate} />

        <View style={{ marginTop: 16 }}>
          <MarkdownRenderer content={reportMarkdown} />
        </View>

        {accountantName && (
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{accountantName}</Text>
            <Text style={styles.signatureCrc}>Contador Responsável — CRC: {accountantCrc}</Text>
            <Text style={styles.signatureDigital}>Assinado digitalmente</Text>
          </View>
        )}

        <Footer
          companyName={companyName}
          accountantName={accountantName}
          accountantCrc={accountantCrc}
          qrCodeDataUrl={qrCodeDataUrl}
        />
      </Page>
    </Document>
  );
};
