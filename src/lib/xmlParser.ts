import { Product } from "@/types/pricing";

export const parseXml = (xmlContent: string): Promise<Product[]> => {
  return new Promise((resolve, reject) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

      // Check for parsing errors
      const parserError = xmlDoc.querySelector("parsererror");
      if (parserError) {
        throw new Error("Erro ao processar XML");
      }

      // Get all product items (det elements)
      const detElements = xmlDoc.querySelectorAll("det");
      
      if (detElements.length === 0) {
        throw new Error("Nenhum produto encontrado no XML");
      }

      const products: Product[] = Array.from(detElements).map((det) => {
        // Product info
        const prod = det.querySelector("prod");
        const code = prod?.querySelector("cProd")?.textContent || "";
        const name = prod?.querySelector("xProd")?.textContent || "";
        const costStr = prod?.querySelector("vUnCom")?.textContent || "0";
        const cost = parseFloat(costStr);
        const cfop = prod?.querySelector("CFOP")?.textContent || "";
        
        // Tax info - PIS
        const pisAliq = det.querySelector("PISAliq");
        const pisNT = det.querySelector("PISNT");
        const pisElement = pisAliq || pisNT;
        const pisCreditStr = pisElement?.querySelector("vPIS")?.textContent || "0";
        const pisCredit = parseFloat(pisCreditStr);

        // Tax info - COFINS
        const cofinsAliq = det.querySelector("COFINSAliq");
        const cofinsNT = det.querySelector("COFINSNT");
        const cofinsElement = cofinsAliq || cofinsNT;
        const cofinsCreditStr = cofinsElement?.querySelector("vCOFINS")?.textContent || "0";
        const cofinsCredit = parseFloat(cofinsCreditStr);
        
        // Tax info - ICMS (IBS)
        const icms = det.querySelector("ICMS");
        const icmsCreditStr = icms?.querySelector("vICMS, vCredICMSSN")?.textContent || "0";
        const icmsCredit = parseFloat(icmsCreditStr);
        
        // CST/CSOSN
        const cst = icms?.querySelector("CST, CSOSN")?.textContent || "";

        return {
          code,
          name,
          cost,
          pisCredit,
          cofinsCredit,
          icmsCredit,
          cfop,
          cst,
        };
      });

      resolve(products);
    } catch (error) {
      console.error("Erro ao processar XML:", error);
      reject(error);
    }
  });
};
