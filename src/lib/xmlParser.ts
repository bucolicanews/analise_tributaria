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

      // 1. VERIFICAR O TIPO DE ARQUIVO PELA TAG RAIZ E CONTEÚDO
      const rootTagName = xmlDoc.documentElement?.localName?.toLowerCase();
      const detElements = xmlDoc.getElementsByTagNameNS("*", "det");
      const infNfseElement = getElement(xmlDoc, "infNfse") || getElement(xmlDoc, "infNFSe");

      // Validação de CNPJ
      if (companyCnpj && companyCnpj.trim() !== "") {
        const cleanedCompanyCnpj = companyCnpj.replace(/\D/g, '');
        let partyCnpj: string | null = null;

        if (type === 'purchase') {
            const destElement = getElement(xmlDoc, "dest"); // For NFe
            partyCnpj = getText(destElement, "CNPJ");

            if (!partyCnpj) { // If not found, it might be an NFSe
                const tomadorElement = getElement(xmlDoc, "tomador") || getElement(xmlDoc, "TomadorServico") || getElement(xmlDoc, "toma");
                if (tomadorElement) {
                    partyCnpj = getText(tomadorElement, "CNPJ") || getText(tomadorElement, "Cnpj") || getText(tomadorElement, "cnpj");
                    if (!partyCnpj) {
                        const idTomador = getElement(tomadorElement, "IdentificacaoTomador");
                        const cpfCnpjElement = getElement(idTomador, "CpfCnpj");
                        partyCnpj = getText(cpfCnpjElement, "Cnpj") || getText(cpfCnpjElement, "CNPJ") || getText(cpfCnpjElement, "cnpj");
                    }
                }
            }
        } else { // type === 'sales'
            const emitElement = getElement(xmlDoc, "emit"); // For NFe
            partyCnpj = getText(emitElement, "CNPJ");

            if (!partyCnpj) { // If not found, it might be an NFSe
                const prestadorElement = getElement(xmlDoc, "prestador") || getElement(xmlDoc, "PrestadorServico") || getElement(xmlDoc, "prest");
                if (prestadorElement) {
                    partyCnpj = getText(prestadorElement, "CNPJ") || getText(prestadorElement, "Cnpj") || getText(prestadorElement, "cnpj");
                    if (!partyCnpj) {
                        const cpfCnpjElement = getElement(prestadorElement, "CpfCnpj");
                        partyCnpj = getText(cpfCnpjElement, "Cnpj") || getText(cpfCnpjElement, "CNPJ") || getText(cpfCnpjElement, "cnpj");
                    }
                }
            }
        }
        
        const cleanedPartyCnpj = partyCnpj?.replace(/\D/g, '');
        if (!cleanedPartyCnpj || cleanedPartyCnpj !== cleanedCompanyCnpj) {
          throw new Error(`Nota Rejeitada: O CNPJ do ${type === 'purchase' ? 'destinatário/tomador' : 'emitente/prestador'} (${partyCnpj || 'N/A'}) não corresponde ao da sua empresa.`);
        }
      }

      let products: Product[] = [];

      if (detElements.length > 0) {
        products = Array.from(detElements).map((det) => {
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

          // Pegamos os valores totais de imposto da linha e dividimos pela quantidade para ter o crédito unitário
          const pisParent = getElement(det, "PIS");
          const pisElement = pisParent ? (getElement(pisParent, "PISAliq") || getElement(pisParent, "PISNT")) : null;
          const pisCreditTotal = parseFloat(getText(pisElement, "vPIS") || "0");
          const pisCredit = quantity > 0 ? pisCreditTotal / quantity : 0;
          const pisCst = getText(pisElement, "CST") || "";
          const pisBase = parseFloat(getText(pisElement, "vBC") || "0");
          const pisRate = parseFloat(getText(pisElement, "pPIS") || "0");

          const cofinsParent = getElement(det, "COFINS");
          const cofinsElement = cofinsParent ? (getElement(cofinsParent, "COFINSAliq") || getElement(cofinsParent, "COFINSNT")) : null;
          const cofinsCreditTotal = parseFloat(getText(cofinsElement, "vCOFINS") || "0");
          const cofinsCredit = quantity > 0 ? cofinsCreditTotal / quantity : 0;
          const cofinsCst = getText(cofinsElement, "CST") || "";
          const cofinsBase = parseFloat(getText(cofinsElement, "vBC") || "0");
          const cofinsRate = parseFloat(getText(cofinsElement, "pCOFINS") || "0");
          
          const icmsParent = getElement(det, "ICMS");
          const vIcmsStr = getText(icmsParent, "vICMS");
          const vCredIcmsSnStr = getText(icmsParent, "vCredICMSSN");
          const icmsCreditTotal = parseFloat(((vIcmsStr && parseFloat(vIcmsStr) > 0) ? vIcmsStr : vCredIcmsSnStr) || "0");
          const icmsCredit = quantity > 0 ? icmsCreditTotal / quantity : 0;
          const cst = getText(icmsParent, "CST") || getText(icmsParent, "CSOSN") || "";

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
      } else if (infNfseElement) {
        const name = getText(xmlDoc, "xDescServ") || getText(xmlDoc, "discriminacao") || 'Serviço Prestado';
        const code = getText(xmlDoc, "cTribNac") || getText(xmlDoc, "cServico") || 'SERVICO';
        const vServ = getText(xmlDoc, "vServ");
        const vServPrest = getText(xmlDoc, "vServPrest");
        const cost = parseFloat(vServ || vServPrest || "0");

        const service: Product = {
          code, name, cost, quantity: 1, unit: 'SV', innerQuantity: 1,
          icmsCredit: parseFloat(getText(xmlDoc, "vISSQN") || getText(xmlDoc, "vIss") || "0"),
          pisCredit: parseFloat(getText(xmlDoc, "vPis") || "0"),
          cofinsCredit: parseFloat(getText(xmlDoc, "vCofins") || "0"),
          ean: '', cfop: '', cst: '', ncm: '', cest: '', pisCst: '', cofinsCst: '', ipiCst: '',
          pisBase: 0, pisRate: 0, cofinsBase: 0, cofinsRate: 0,
        };
        products.push(service);
      } else {
        if (rootTagName === 'cteproc' || rootTagName === 'cte') {
          throw new Error("Arquivo inválido: Este é um Conhecimento de Transporte (CTe). O sistema processa NFe e NFSe.");
        }
        throw new Error("Nenhum produto ou serviço encontrado no XML. Verifique se o arquivo é uma NFe ou NFSe válida.");
      }

      resolve(products);
    } catch (error) {
      reject(error as Error);
    }
  });
};