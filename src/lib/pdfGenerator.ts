import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CalculatedProduct } from '@/types/pricing';
import { getClassificationDetails } from './tax/taxClassificationService';

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// Função para adicionar cabeçalho e rodapé em todas as páginas
const addHeaderFooter = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Cabeçalho
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('JOTA - Análise Tributária', 14, 20);
    
    // Rodapé
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const pageNumText = `Página ${i} de ${pageCount}`;
    doc.text(pageNumText, pageWidth - 14 - doc.getTextWidth(pageNumText), pageHeight - 10);
    doc.text(new Date().toLocaleDateString('pt-BR'), 14, pageHeight - 10);
  }
};

// Gera o PDF da Lista de Produtos em formato de tabela paisagem
export const generateProductListPdf = (products: CalculatedProduct[]) => {
  const doc = new jsPDF({
    orientation: 'landscape',
  });

  const head = [[
    'Produto', 'Código', 'Cód. Barras', 'NCM', 'CEST', 'CSOSN', 'CST PIS/COFINS', 'cClassTrib',
    'Custo Base Total', 'Custo Unid. Int.', 'Venda Mín. Unid. Int.', 'Venda Sug. Unid. Int.',
    'Venda Mín. Com.', 'Venda Sug. Com.'
  ]];

  const body: any[] = [];
  products.forEach(p => {
    // Product row
    body.push([
      p.name,
      p.code,
      p.ean || '-',
      p.ncm || '-',
      p.cest || '-',
      p.suggestedCodes.icmsCstOrCsosn,
      p.suggestedCodes.pisCofinsCst,
      p.cClassTrib || '1',
      formatCurrency(p.cost + (p.valueForFixedCost / p.quantity)),
      formatCurrency(p.costPerInnerUnit),
      formatCurrency(p.minSellingPricePerInnerUnit),
      formatCurrency(p.sellingPricePerInnerUnit),
      formatCurrency(p.minSellingPrice),
      formatCurrency(p.sellingPrice),
    ]);

    // Classification row
    const classificationDetails = p.cClassTrib ? getClassificationDetails(p.cClassTrib) : null;
    if (classificationDetails) {
      const classificationText = `Classificação IBS/CBS: cClassTrib: ${classificationDetails.cClass.code} | Nome: ${classificationDetails.cClass.name} | CST: ${classificationDetails.cst?.code} - ${classificationDetails.cst?.description} | Última Atualização: ${classificationDetails.cClass.lastUpdate}`;
      
      body.push([{
        content: classificationText,
        colSpan: 14,
        styles: {
          fillColor: [244, 244, 245], // muted
          textColor: [100, 116, 139], // muted-foreground
          fontSize: 6,
          cellPadding: 1.5,
        }
      }]);
    }
  });

  doc.setFontSize(18);
  doc.text('Lista de Produtos para Cadastro', 14, 30);

  autoTable(doc, {
    head,
    body,
    startY: 40,
    theme: 'grid',
    headStyles: { fillColor: [34, 139, 34] }, // Verde escuro
    styles: { fontSize: 7, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      8: { halign: 'right' },
      9: { halign: 'right' },
      10: { halign: 'right' },
      11: { halign: 'right' },
      12: { halign: 'right' },
      13: { halign: 'right' },
    }
  });

  addHeaderFooter(doc);
  doc.output('pdfobjectnewwindow');
};


// Gera o PDF do Relatório de Vendas (detalhado por produto)
export const generateSalesReportPdf = (products: CalculatedProduct[]) => {
  const doc = new jsPDF();
  let finalY = 0;

  doc.setFontSize(18);
  doc.text('Relatório Detalhado para Venda', 14, 22);

  products.forEach((product, index) => {
    let startY = index === 0 ? 35 : finalY + 15;

    if (startY > 250) {
      doc.addPage();
      finalY = 0;
      startY = 22;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const title = `${product.name} (${product.code})`;
    const splitTitle = doc.splitTextToSize(title, 180);
    doc.text(splitTitle, 14, startY);
    
    const currentY = startY + (splitTitle.length * 5);

    const body = [
      ['Custo Aquisição (Com.)', formatCurrency(product.cost)],
      ['Custo Fixo Rateado (Com.)', formatCurrency(product.valueForFixedCost / product.quantity)],
      ['Custo Base Total (Com.)', formatCurrency(product.cost + (product.valueForFixedCost / product.quantity))],
      ['Venda Mínima (Com.)', formatCurrency(product.minSellingPrice)],
      ['Venda Sugerida (Com.)', formatCurrency(product.sellingPrice)],
      ['Imposto Líquido (Com.)', formatCurrency(product.taxToPay)],
      ['Crédito p/ Cliente (Com.)', formatCurrency(product.ivaCreditForClient)],
      ['---', '---'],
      ['Custo (Unid. Int.)', formatCurrency(product.costPerInnerUnit)],
      ['Venda Mínima (Unid. Int.)', formatCurrency(product.minSellingPricePerInnerUnit)],
      ['Venda Sugerida (Unid. Int.)', formatCurrency(product.sellingPricePerInnerUnit)],
    ];

    autoTable(doc, {
      body,
      startY: currentY,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 1.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { halign: 'right' },
      },
      didDrawPage: (data) => {
        finalY = data.cursor?.y || 0;
      }
    });
    finalY = (doc as any).lastAutoTable.finalY;
  });

  addHeaderFooter(doc);
  doc.output('pdfobjectnewwindow');
};