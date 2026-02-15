import { Product } from "@/types/pricing";

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
          const destCnpj = xmlDoc.querySelector("dest > CNPJ")?.textContent;
          const cleanedDestCnpj = destCnpj?.replace(/\D/g, '');
          if (!cleanedDestCnpj || cleanedDestCnpj !== cleanedCompanyCnpj) {
            throw new Error(`Nota de Compra Rejeitada: O CNPJ do destinatário (${destCnpj || 'N/A'}) não corresponde ao da sua empresa.`);
          }
        } else { // type === 'sales'
          const emitCnpj = xmlDoc.querySelector("emit > CNPJ")?.textContent;
          const cleanedEmitCnpj = emitCnpj?.replace(/\D/g, '');
          if (!cleanedEmitCnpj || cleanedEmitCnpj !== cleanedCompanyCnpj) {
            throw new Error(`Nota de Venda Rejeitada: O CNPJ do emitente (${emitCnpj || 'N/A'}) não corresponde ao da sua empresa.`);
          }
        }
      }

      const detElements = xmlDoc.querySelectorAll("det");
      if (detElements.length === 0) {
        throw new Error("Nenhum produto encontrado no XML");
      }

      const products: Product[] = Array.from(detElements).map((det) => {
        const prod = det.querySelector("prod");
        const code = prod?.querySelector("cProd")?.textContent || "";
        const name = prod?.querySelector("xProd")?.textContent || "";
        const ean = prod?.querySelector("cEAN")?.textContent || "";
        const costStr = prod?.querySelector("vUnCom")?.textContent || "0";
        const cost = parseFloat(costStr);
        const unit = prod?.querySelector("uCom")?.textContent || "UN";
        const quantityStr = prod?.querySelector("qCom")?.textContent || "0";
        const quantity = parseFloat(quantityStr);
        const cfop = prod?.querySelector("CFOP")?.textContent || "";
        const ncm = prod?.querySelector("NCM")?.textContent || "";
        const cest = prod?.querySelector("CEST")?.textContent || "";
        
        let innerQuantity = 1;
        const innerQuantityMatch = name.match(/(\d+)[xX]\d+G?/);
        if (innerQuantityMatch && innerQuantityMatch[1]) {
          innerQuantity = parseInt(innerQuantityMatch[1], 10);
        }

        const pisAliq = det.querySelector("PISAliq");
        const pisNT = det.querySelector("PISNT");
        const pisElement = pisAliq || pisNT;
        const pisCreditStr = pisElement?.querySelector("vPIS")?.textContent || "0";
        const pisCredit = parseFloat(pisCreditStr);
        const pisCst = pisElement?.querySelector("CST")?.textContent || "";
        const pisBaseStr = pisAliq?.querySelector("vBC")?.textContent || "0";
        const pisRateStr = pisAliq?.querySelector("pPIS")?.textContent || "0";
        const pisBase = parseFloat(pisBaseStr);
        const pisRate = parseFloat(pisRateStr);

        const cofinsAliq = det.querySelector("COFINSAliq");
        const cofinsNT = det.querySelector("COFINSNT");
        const cofinsElement = cofinsAliq || cofinsNT;
        const cofinsCreditStr = cofinsElement?.querySelector("vCOFINS")?.textContent || "0";
        const cofinsCredit = parseFloat(cofinsCreditStr);
        const cofinsCst = cofinsElement?.querySelector("CST")?.textContent || "";
        const cofinsBaseStr = cofinsAliq?.querySelector("vBC")?.textContent || "0";
        const cofinsRateStr = cofinsAliq?.querySelector("pCOFINS")?.textContent || "0";
        const cofinsBase = parseFloat(cofinsBaseStr);
        const cofinsRate = parseFloat(cofinsRateStr);
        
        const icms = det.querySelector("ICMS");
        const icmsCreditStr = icms?.querySelector("vICMS, vCredICMSSN")?.textContent || "0";
        const icmsCredit = parseFloat(icmsCreditStr);
        
        const cst = icms?.querySelector("CST, CSOSN")?.textContent || "";

        const ipi = det.querySelector("IPI");
        const ipiCst = ipi?.querySelector("IPITrib > CST, IPINT > CST")?.textContent || "";

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
      reject(error);
    }
  });
};