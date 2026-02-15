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
      const infNfseElement = getElement(xmlDoc, "infNfse");

      // Validação de CNPJ
      if (companyCnpj && companyCnpj.trim() !== "") {
        const cleanedCompanyCnpj = companyCnpj.replace(/\D/g, '');
        let partyCnpj: string | null = null;

        if (type === 'purchase') {
            const destElement = getElement(xmlDoc, "dest"); // For NFe
            partyCnpj = getText(destElement, "CNPJ");

            if (!partyCnpj) { // If not found, it might be an NFSe
                const tomadorElement = getElement(xmlDoc, "tomador") || getElement(xmlDoc, "TomadorServico");
                if (tomadorElement) {
                    // Try direct lookup first
                    partyCnpj = getText(tomadorElement, "Cnpj") || getText(tomadorElement, "cnpj");
                    // If failed, try nested lookup for complex NFSe layouts
                    if (!partyCnpj) {
                        const idTomador = getElement(tomadorElement, "IdentificacaoTomador");
                        const cpfCnpjElement = getElement(idTomador, "CpfCnpj");
                        partyCnpj = getText(cpfCnpjElement, "Cnpj") || getText(cpfCnpjElement, "CNPJ");
                    }
                }
            }
        } else { // type === 'sales'
            const emitElement = getElement(xmlDoc, "emit"); // For NFe
            partyCnpj = getText(emitElement, "CNPJ");

            if (!partyCnpj) { // If not found, it might be an NFSe
                const prestadorElement = getElement(xmlDoc, "prestador") || getElement(xmlDoc, "PrestadorServico");
                if (prestadorElement) {
                    // Try direct lookup first
                    partyCnpj = getText(prestadorElement, "Cnpj") || getText(prestadorElement, "cnpj");
                     // If failed, try nested lookup
                    if (!partyCnpj) {
                        const cpfCnpjElement = getElement(prestadorElement, "CpfCnpj");
                        partyCnpj = getText(cpfCnpjElement, "Cnpj") || getText(cpfCnpjElement, "CNPJ");
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
        // É uma NFe de Produto
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

          const pisParent = getElement(det, "PIS");
          const pisElement = pisParent ? (getElement(pisParent, "PISAliq") || getElement(pisParent, "PISNT")) : null;
          const pisCredit = parseFloat(getText(pisElement, "vPIS") || "0");
          const pisCst = getText(pisElement, "CST") || "";
          const pisBase = parseFloat(getText(pisElement, "vBC") || "0");
          const pisRate = parseFloat(getText(pisElement, "pPIS") || "0");

          const cofinsParent = getElement(det, "COFINS");
          const cofinsElement = cofinsParent ? (getElement(cofinsParent, "COFINSAliq") || getElement(cofinsParent, "COFINSNT")) : null;
          const cofinsCredit = parseFloat(getText(cofinsElement, "vCOFINS") || "0");
          const cofinsCst = getText(cofinsElement, "CST") || "";
          const cofinsBase = parseFloat(getText(cofinsElement, "vBC") || "0");
          const cofinsRate = parseFloat(getText(cofinsElement, "pCOFINS") || "0");
          
          const icmsParent = getElement(det, "ICMS");
          const vIcmsStr = getText(icmsParent, "vICMS");
          const vCredIcmsSnStr = getText(icmsParent, "vCredICMSSN");
          const icmsCredit = parseFloat(((vIcmsStr && parseFloat(vIcmsStr) > 0) ? vIcmsStr : vCredIcmsSnStr) || "0");
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
        // É uma NFSe de Serviço
        const servicoElement = getElement(infNfseElement, "servico");
        const valoresElement = getElement(servicoElement, "valores");

        const service: Product = {
          code: getText(servicoElement, "cServico") || 'SERVICO',
          name: getText(servicoElement, "discriminacao") || 'Serviço Prestado',
          cost: parseFloat(getText(valoresElement, "vServPrest") || "0"),
          quantity: 1,
          unit: 'SV',
          innerQuantity: 1,
          // Mapeando impostos de serviço para os campos existentes
          icmsCredit: parseFloat(getText(valoresElement, "vIss") || "0"), // ISS vira crédito de IBS
          pisCredit: parseFloat(getText(valoresElement, "vPis") || "0"),
          cofinsCredit: parseFloat(getText(valoresElement, "vCofins") || "0"),
          // Campos não aplicáveis a serviços
          ean: '', cfop: '', cst: '', ncm: '', cest: '', pisCst: '', cofinsCst: '', ipiCst: '',
          pisBase: 0, pisRate: 0, cofinsBase: 0, cofinsRate: 0,
        };
        products.push(service);
      } else {
        // Nenhum produto ou serviço encontrado
        if (rootTagName === 'cteproc' || rootTagName === 'cte') {
          throw new Error("Arquivo inválido: Este é um Conhecimento de Transporte (CTe). O sistema processa NFe e NFSe.");
        }
        throw new Error("Nenhum produto ou serviço encontrado no XML. Verifique se o arquivo é uma NFe ou NFSe válida.");
      }

      resolve(products);
    } catch (error) {
      console.error("Erro ao processar XML:", error);
      reject(error as Error);
    }
  });
};