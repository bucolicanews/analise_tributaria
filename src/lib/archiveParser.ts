import JSZip from "jszip";
import { parseXml } from "./xmlParser";
import { Product } from "@/types/pricing";

const MAX_XML_FILES = 100;

export const parseZipXmls = async (zipFile: File): Promise<Product[]> => {
  const zip = await JSZip.loadAsync(zipFile);
  const xmlFiles: { name: string; content: string }[] = [];

  for (const filename in zip.files) {
    if (zip.files.hasOwnProperty(filename) && filename.toLowerCase().endsWith(".xml")) {
      if (xmlFiles.length >= MAX_XML_FILES) {
        throw new Error(`Limite de ${MAX_XML_FILES} arquivos XML excedido no ZIP.`);
      }
      const content = await zip.files[filename].async("text");
      xmlFiles.push({ name: filename, content });
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

  return allProducts;
};