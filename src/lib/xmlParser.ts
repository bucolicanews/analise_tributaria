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

      // 1. VERIFICAR O TIPO DE ARQUIVO PELA TAG RAIZ
      const rootTagName = xmlDoc.documentElement?.localName?.toLowerCase();
      if (rootTagName === 'cteproc' || rootTagName === 'cte') {
          throw new Error("Arquivo inválido: Este é um Conhecimento de Transporte (CTe). Por favor, envie a Nota Fiscal de Produto (NFe) correspondente.");
      }
      if (rootTagName === 'nfse' || rootTagName === 'compnfse') {
          throw new Error("Arquivo inválido: Este é uma Nota Fiscal de Serviço (NFSe). O sistema processa apenas Notas Fiscais de Produto (NFe).");
      }

      // 2. VERIFICAR SE HÁ PRODUTOS
      const detElements = xmlDoc.getElementsByTagNameNS("*", "det");
      if (detElements.length === 0) {
        throw new Error("Nenhum produto (tag <det>) encontrado no XML. Verifique se o arquivo é uma NFe de produto válida.");
      }

      // 3. SE FOR UMA NFe VÁLIDA, PROSSEGUIR COM A VALIDAÇÃO DE CNPJ
      if (companyCnpj && companyCnpj.trim() !== "") {
        const cleanedCompanyCnpj = companyCnpj.replace(/\D/g, '');
        
        if (type === 'purchase') {
          const destElement = getElement(xmlDoc, "dest");
          const destCnpj = destElement ? getText(destElement, "CNPJ") : null;
          const cleanedDestCnpj = destCnpj?.replace(/\D/g, '');
          if (!cleanedDestCnpj || cleanedDestCnpj !== cleanedCompanyCnpj) {
            throw new Error(`Nota de Compra Rejeitada: O CNPJ do destinatário (${destCnpj || 'N/A'}) não corresponde ao da sua empresa.`);
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

      // 4. PROCESSAR PRODUTOS
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