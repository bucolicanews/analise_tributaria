import { parseString } from "xml2js";
import { Product } from "@/types/pricing";

export const parseXml = (xmlContent: string): Promise<Product[]> => {
  return new Promise((resolve, reject) => {
    parseString(xmlContent, { explicitArray: false }, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        const nfe = result.nfeProc?.NFe?.infNFe;
        if (!nfe) {
          throw new Error("Estrutura XML inválida");
        }

        let dets = nfe.det;
        if (!Array.isArray(dets)) {
          dets = [dets];
        }

        const products: Product[] = dets.map((det: any) => {
          const prod = det.prod;
          const imposto = det.imposto;

          const code = prod.cProd || "";
          const name = prod.xProd || "";
          const cost = parseFloat(prod.vUnCom || "0");

          const pis = imposto?.PIS?.PISAliq || imposto?.PIS?.PISNT || {};
          const cofins = imposto?.COFINS?.COFINSAliq || imposto?.COFINS?.COFINSNT || {};

          const pisCredit = parseFloat(pis.vPIS || "0");
          const cofinsCredit = parseFloat(cofins.vCOFINS || "0");

          return {
            code,
            name,
            cost,
            pisCredit,
            cofinsCredit,
          };
        });

        resolve(products);
      } catch (error) {
        reject(error);
      }
    });
  });
};
