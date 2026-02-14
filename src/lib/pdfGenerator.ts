import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CalculatedProduct } from '@/types/pricing';

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

// Gera o PDF da Lista de Produtos em formato de lista detalhada
export const generateProductListPdf = (products: CalculatedProduct[]) => {
  const doc = new jsPDF({
    orientation: 'portrait',
  });
  let finalY = 0;

  doc.setFontSize(18);
  doc.text('Lista de Produtos para Cadastro', 14, 22);

  products.forEach((product, index) => {
    let startY = index === 0 ? 35 : finalY + 10;

    // Adiciona nova página se não houver espaço suficiente para o próximo item
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
        ['Cód. Barras (EAN)', product.ean || '-'],
        ['NCM', product.ncm || '-'],
        ['CEST', product.cest || '-'],
        ['CSOSN (Saída)', product.suggestedCodes.icmsCstOrCsosn],
        ['CST PIS/COFINS (Saída)', product.suggestedCodes.pisCofinsCst],
        ['---', '---'],
        ['Custo Base Total (Com.)', formatCurrency(product.cost + (product.valueForFixedCost / product.quantity))],
        ['Venda Mínima (Com.)', formatCurrency(product.minSellingPrice)],
        ['Venda Sugerida (Com.)', formatCurrency(product.sellingPrice)],
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
  doc.save('Lista_de_Produtos.pdf');
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
  doc.save('Relatorio_de_Venda.pdf');
};