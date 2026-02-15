import { Product } from "@/types/pricing";

// Helper to get a specific element by tag name, ignoring namespace
const getElement = (element: Element | Document, tagName: string): Element | null => {
    const nodes = element.getElementsByTagNameNS('*', tagName);
    return nodes.length > 0 ? nodes[0] : null;
}

// Helper to get text content of the first element with a given tag name, ignoring namespace
const getText = (element: Element | null, tagName: string): string | null => {
    if (!element) return null;
    const node = getElement(element, tagName);
    return node ? node.textContent : null;
};

export const parseXml = (
  xmlContent: string,
  companyCnpj: string | null,
  type: 'purchase' | 'sales'
): Promise<Product[]> => {
  return new Promise((resolve, reject) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

      const parserError = xmlDoc.querySelector("parsererror");
      if (parserError) {
        throw new Error("Erro ao processar XML. O arquivo pode estar corrompido.");
      }

      // Validação de CNPJ
      if (companyCnpj && companyCnpj.trim() !== "") {
        const cleanedCompanyCnpj = companyCnpj.replace(/\D/g, '');
        
        if (type === 'purchase') {
          let recipientCnpj: string | null = null;
          const destElement = getElement(xmlDoc, "dest");
          const tomaElement = getElement(xmlDoc, "toma"); // Tag para tomador de serviço em CTe

          if (destElement) {
            recipientCnpj = getText(destElement, "CNPJ");
          } else if (tomaElement) {
            recipientCnpj = getText(tomaElement, "CNPJ");
          }
          
          const cleanedRecipientCnpj = recipientCnpj?.replace(/\D/g, '');

          if (!cleanedRecipientCnpj || cleanedRecipientCnpj !== cleanedCompanyCnpj) {
            throw new Error(`Nota de Compra Rejeitada: O CNPJ do destinatário/tomador (${recipientCnpj || 'N/A'}) não corresponde ao da sua empresa.`);
          }
        } else { // type === 'sales'
          const emitElement = getElement(xmlDoc, "emit");
          const emitCnpj = emitElement ? getText(emitElement, "CNPJ") : null;
          const cleanedEmitCnpj = emitCnpj?.replace(/\D/g, '');
          if (!cleanedEmitCnpj || cleanedEmitCnpj !== cleanedCompanyCnpj) {
            throw new Error(`Nota de Venda Rejeitada: O CNPJ do emitente (${emitCnpj || 'N/A'}) não corresponde ao da sua empresa.`);
          }
        }
      }

      const detElements = xmlDoc.getElementsByTagNameNS("*", "det");
      if (detElements.length === 0) {
        const isCTe = getElement(xmlDoc, "infCte") !== null;
        const isNFSe = getElement(xmlDoc, "infNfse") !== null;
        if (isCTe) {
          throw new Error("Nenhum produto encontrado. Este arquivo parece ser um Conhecimento de Transporte (CTe), que não contém lista de produtos. Por favor, envie uma Nota Fiscal de Produto (NFe).");
        }
        if (isNFSe) {
          throw new Error("Nenhum produto encontrado. Este arquivo parece ser uma Nota Fiscal de Serviço (NFSe), que não contém lista de produtos. Por favor, envie uma Nota Fiscal de Produto (NFe).");
        }
        throw new Error("Nenhum produto (tag <det>) encontrado no XML. Verifique se o arquivo é uma NFe válida.");
      }

      const products: Product[] = Array.from(detElements).map((det) => {
        const prod = getElement(det, "prod")!;
        const code = getText(prod, "cProd") || "";
        const name = getText(prod, "xProd") || "";
        const ean = getText(prod, "cEAN") || "";
        const costStr = getText(prod, "vUnCom") || "0";
        const cost = parseFloat(costStr);
        const unit = getText(prod, "uCom") || "UN";
        const quantityStr = getText(prod, "qCom") || "0";
        const quantity = parseFloat(quantityStr);
        const cfop = getText(prod, "CFOP") || "";
        const ncm = getText(prod, "NCM") || "";
        const cest = getText(prod, "CEST") || "";
        
        let innerQuantity = 1;
        const innerQuantityMatch = name.match(/(\d+)[xX]\d+G?/);
        if (innerQuantityMatch && innerQuantityMatch[1]) {
          innerQuantity = parseInt(innerQuantityMatch[1], 10);
        }

        const pisParent = getElement(det, "PIS");
        const pisElement = pisParent ? (getElement(pisParent, "PISAliq") || getElement(pisParent, "PISNT")) : null;
        const pisCreditStr = getText(pisElement, "vPIS");
        const pisCredit = parseFloat(pisCreditStr || "0");
        const pisCst = getText(pisElement, "CST") || "";
        const pisBaseStr = getText(pisElement, "vBC");
        const pisRateStr = getText(pisElement, "pPIS");
        const pisBase = parseFloat(pisBaseStr || "0");
        const pisRate = parseFloat(pisRateStr || "0");

        const cofinsParent = getElement(det, "COFINS");
        const cofinsElement = cofinsParent ? (getElement(cofinsParent, "COFINSAliq") || getElement(cofinsParent, "COFINSNT")) : null;
        const cofinsCreditStr = getText(cofinsElement, "vCOFINS");
        const cofinsCredit = parseFloat(cofinsCreditStr || "0");
        const cofinsCst = getText(cofinsElement, "CST") || "";
        const cofinsBaseStr = getText(cofinsElement, "vBC");
        const cofinsRateStr = getText(cofinsElement, "pCOFINS");
        const cofinsBase = parseFloat(cofinsBaseStr || "0");
        const cofinsRate = parseFloat(cofinsRateStr || "0");
        
        const icmsParent = getElement(det, "ICMS");
        const vIcmsStr = getText(icmsParent, "vICMS");
        const vCredIcmsSnStr = getText(icmsParent, "vCredICMSSN");
        const icmsCreditStr = (vIcmsStr && parseFloat(vIcmsStr) > 0) ? vIcmsStr : vCredIcmsSnStr;
        const icmsCredit = parseFloat(icmsCreditStr || "0");
        
        const cstStr = getText(icmsParent, "CST");
        const csosnStr = getText(icmsParent, "CSOSN");
        const cst = cstStr || csosnStr || "";

        const ipiParent = getElement(det, "IPI");
        const ipiElement = ipiParent ? (getElement(ipiParent, "IPITrib") || getElement(ipiParent, "IPINT")) : null;
        const ipiCst = getText(ipiElement, "CST") || "";

        return {
          code, name, ean, cost, unit, quantity,
          innerQuantity: innerQuantity > 0 ? innerQuantity : 1,
          pisCredit, cofinsCredit, icmsCredit, cfop, cst, ncm, cest,
          pisCst, cofinsCst, ipiCst, pisBase, pisRate, cofinsBase, cofinsRate,
        };
      });

      resolve(products);
    } catch (error) {
      console.error("Erro ao processar XML:", error);
      reject(error as Error);
    }
  });
};