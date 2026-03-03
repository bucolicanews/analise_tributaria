import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface AgentReportPDFProps {
  agentName: string;
  reportMarkdown: string;
  companyName?: string;
  accountantName?: string;
  accountantCrc?: string;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 40,
    paddingBottom: 55,
    paddingHorizontal: 40,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af',
  },
  headerCompany: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: '#1e40af',
    marginBottom: 2,
  },
  headerAgentName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#374151',
    marginBottom: 2,
  },
  headerDate: {
    fontSize: 8,
    color: '#6b7280',
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#1e40af',
    marginTop: 14,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  subSectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#374151',
    marginTop: 10,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 9,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 1.4,
  },
  boldText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#374151',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginVertical: 8,
  },
  tableContainer: {
    marginTop: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 3,
  },
  tableHeader: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#1e40af',
    flex: 1,
    paddingHorizontal: 4,
  },
  tableCell: {
    fontSize: 8,
    color: '#374151',
    flex: 1,
    paddingHorizontal: 4,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 8,
  },
  bulletDot: {
    fontSize: 9,
    color: '#1e40af',
    marginRight: 4,
    marginTop: 0,
  },
  bulletText: {
    fontSize: 9,
    color: '#374151',
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#9ca3af',
  },
});

function parseMarkdownToBlocks(markdown: string) {
  const lines = markdown.split('\n');
  const blocks: Array<{ type: string; content: string; level?: number }> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      blocks.push({ type: 'empty', content: '' });
      continue;
    }
    if (/^#{1,2}\s/.test(trimmed)) {
      blocks.push({ type: 'h1', content: trimmed.replace(/^#{1,2}\s+/, '') });
    } else if (/^###\s/.test(trimmed)) {
      blocks.push({ type: 'h2', content: trimmed.replace(/^###\s+/, '') });
    } else if (/^####\s/.test(trimmed)) {
      blocks.push({ type: 'h3', content: trimmed.replace(/^####\s+/, '') });
    } else if (/^[-*]\s/.test(trimmed)) {
      blocks.push({ type: 'bullet', content: trimmed.replace(/^[-*]\s+/, '') });
    } else if (/^---+$/.test(trimmed)) {
      blocks.push({ type: 'divider', content: '' });
    } else if (/^\|/.test(trimmed)) {
      blocks.push({ type: 'tablerow', content: trimmed });
    } else {
      blocks.push({ type: 'paragraph', content: trimmed });
    }
  }
  return blocks;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1');
}

function renderBlock(block: { type: string; content: string }, index: number) {
  switch (block.type) {
    case 'h1':
      return <Text key={index} style={styles.sectionTitle}>{stripMarkdown(block.content)}</Text>;
    case 'h2':
      return <Text key={index} style={styles.subSectionTitle}>{stripMarkdown(block.content)}</Text>;
    case 'h3':
      return <Text key={index} style={[styles.subSectionTitle, { fontSize: 9 }]}>{stripMarkdown(block.content)}</Text>;
    case 'bullet':
      return (
        <View key={index} style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{stripMarkdown(block.content)}</Text>
        </View>
      );
    case 'divider':
      return <View key={index} style={styles.divider} />;
    case 'tablerow': {
      const cells = block.content.split('|').map(c => c.trim()).filter(c => c.length > 0);
      const isSeparator = cells.every(c => /^[-:]+$/.test(c));
      if (isSeparator) return null;
      return (
        <View key={index} style={styles.tableRow}>
          {cells.map((cell, ci) => (
            <Text key={ci} style={styles.tableCell}>{stripMarkdown(cell)}</Text>
          ))}
        </View>
      );
    }
    case 'empty':
      return <Text key={index} style={{ fontSize: 4 }}>{' '}</Text>;
    default:
      return <Text key={index} style={styles.paragraph}>{stripMarkdown(block.content)}</Text>;
  }
}

export function AgentReportPDF({
  agentName,
  reportMarkdown,
  companyName = '',
  accountantName = '',
  accountantCrc = '',
}: AgentReportPDFProps) {
  const blocks = parseMarkdownToBlocks(reportMarkdown);
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {companyName ? <Text style={styles.headerCompany}>{companyName}</Text> : null}
          <Text style={styles.headerAgentName}>{agentName}</Text>
          <Text style={styles.headerDate}>Gerado em {today}</Text>
        </View>

        {blocks.map((block, i) => renderBlock(block, i))}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {accountantName ? `${accountantName}${accountantCrc ? ` — CRC: ${accountantCrc}` : ''}` : agentName}
          </Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
