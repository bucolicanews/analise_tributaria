import { Product } from "@/types/pricing";

// Helper to get a specific element by tag name, ignoring namespace
const getElement = (element: Element | Document | null, tagName: string): Element | null => {
    if (!element) return null;
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
        let partyCnpj: string | null = null;

        if (type === 'purchase') {
            const destElement = getElement(xmlDoc, "dest");
            partyCnpj = getText(destElement, "CNPJ");
        } else {
            const emitElement = getElement(xmlDoc, "emit");
            partyCnpj = getText(emitElement, "CNPJ");
        }
        
        const cleanedPartyCnpj = partyCnpj?.replace(/\D/g, '');
        if (cleanedPartyCnpj && cleanedPartyCnpj !== cleanedCompanyCnpj) {
          throw new Error(`Nota Rejeitada: O CNPJ da nota (${partyCnpj}) não corresponde ao da sua empresa.`);
        }
      }

      const detElements = xmlDoc.getElementsByTagNameNS("*", "det");
      let products: Product[] = [];

      if (detElements.length > 0) {
        products = Array.from(detElements).map((det) => {
          const prod = getElement(det, "prod")!;
          const code = getText(prod, "cProd") || "";
          const name = getText(prod, "xProd") || "";
          const ean = getText(prod, "cEAN") || "";
          const costStr = getText(prod, "vUnCom") || "0";
          const cost = parseFloat(costStr);
          const quantity = parseFloat(getText(prod, "qCom") || "0");
          const unit = getText(prod, "uCom") || "UN";
          const ncm = getText(prod, "NCM") || "";
          const cest = getText(prod, "CEST") || "";
          const cfop = getText(prod, "CFOP") || "";

          // CRÉDITOS PIS/COFINS (CBS)
          const pisElement = getElement(det, "PIS");
          const pisVal = parseFloat(getText(pisElement, "vPIS") || "0");
          
          const cofinsElement = getElement(det, "COFINS");
          const cofinsVal = parseFloat(getText(cofinsElement, "vCOFINS") || "0");

          // CRÉDITOS IPI (Incorporado na CBS na Reforma)
          const ipiElement = getElement(det, "IPI");
          const ipiVal = parseFloat(getText(ipiElement, "vIPI") || "0");

          // CRÉDITOS ICMS + ST (IBS)
          const icmsElement = getElement(det, "ICMS");
          const icmsVal = parseFloat(getText(icmsElement, "vICMS") || "0");
          const icmsSTVal = parseFloat(getText(icmsElement, "vICMSST") || "0");
          const icmsSNVal = parseFloat(getText(icmsElement, "vCredICMSSN") || "0");

          const pisCst = getText(getElement(pisElement, "PISAliq") || getElement(pisElement, "PISNT"), "CST") || "";
          const cofinsCst = getText(getElement(cofinsElement, "COFINSAliq") || getElement(cofinsElement, "COFINSNT"), "CST") || "";
          const icmsCst = getText(icmsElement, "CST") || getText(icmsElement, "CSOSN") || "";

          return {
            code, name, ean, cost, unit, quantity,
            innerQuantity: 1, // Default, será ajustado pelo nome se houver padrão
            pisCredit: quantity > 0 ? (pisVal + (ipiVal / 2)) / quantity : 0, // IPI rateado entre CBS/IBS na simulação
            cofinsCredit: quantity > 0 ? cofinsVal / quantity : 0,
            icmsCredit: quantity > 0 ? (icmsVal + icmsSTVal + icmsSNVal + (ipiVal / 2)) / quantity : 0,
            cfop, cst: icmsCst, ncm, cest, pisCst, cofinsCst,
            ipiCst: getText(ipiElement, "CST") || "",
          };
        });
      }

      resolve(products);
    } catch (error) {
      reject(error as Error);
    }
  });
};