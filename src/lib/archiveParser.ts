import JSZip from "jszip";
import { parseXml } from "./xmlParser";
import { Product } from "@/types/pricing";

const MAX_XML_FILES = 100;

export const parseZipXmls = async (zipFile: File): Promise<{ products: Product[]; xmlCount: number }> => {
  const zip = await JSZip.loadAsync(zipFile);
  const xmlFiles: { name: string; content: string }[] = [];
  let internalXmlCount = 0;

  for (const filename in zip.files) {
    if (zip.files.hasOwnProperty(filename) && filename.toLowerCase().endsWith(".xml")) {
      if (internalXmlCount >= MAX_XML_FILES) {
        throw new Error(`Limite de ${MAX_XML_FILES} arquivos XML excedido no ZIP.`);
      }
      const content = await zip.files[filename].async("text");
      xmlFiles.push({ name: filename, content });
      internalXmlCount++;
    }
  }

  if (xmlFiles.length === 0) {
    throw new Error("Nenhum arquivo XML encontrado no ZIP.");
  }

  const allProducts: Product[] = [];
  for (const xmlFile of xmlFiles) {
    try {
      const products = await parseXml(xmlFile.content);
      allProducts.push(...products);
    } catch (error) {
      console.warn(`Erro ao processar XML '${xmlFile.name}':`, error);
      // Continue processing other XMLs even if one fails
    }
  }

  return { products: allProducts, xmlCount: internalXmlCount };
};