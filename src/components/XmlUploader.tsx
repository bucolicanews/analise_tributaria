import { useRef, useState } from "react";
import { Upload, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseXml } from "@/lib/xmlParser";
import { Product } from "@/types/pricing";
import { toast } from "sonner";

interface XmlUploaderProps {
  onXmlParsed: (products: Product[]) => void;
}

export const XmlUploader = ({ onXmlParsed }: XmlUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [productCount, setProductCount] = useState<number>(0);
  const [totalXmlCount, setTotalXmlCount] = useState<number>(0); // State for total XMLs processed

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setFileNames([]);
    setProductCount(0);
    setTotalXmlCount(0);

    let allProducts: Product[] = [];
    let currentProcessedXmlCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setFileNames((prev) => [...prev, file.name]);

        if (file.name.toLowerCase().endsWith(".xml")) {
          currentProcessedXmlCount++;
          const text = await file.text();
          const products = await parseXml(text);
          allProducts.push(...products);
        } else {
          toast.error("Formato inválido", {
            description: `O arquivo '${file.name}' não é um XML. Por favor, selecione apenas arquivos XML.`,
          });
          continue;
        }
      }

      if (currentProcessedXmlCount > 100) {
        toast.error("Limite de arquivos excedido", {
          description: `Foram processados ${currentProcessedXmlCount} arquivos XML, mas o limite é de 100.`,
        });
        // Truncate products if the limit is exceeded, to prevent processing too many
        allProducts = allProducts.slice(0, 100 * 100); 
      }

      setProductCount(allProducts.length);
      setTotalXmlCount(currentProcessedXmlCount);
      onXmlParsed(allProducts);

      toast.success("Arquivos processados com sucesso!", {
        description: `${allProducts.length} produto(s) encontrado(s) em ${currentProcessedXmlCount} arquivo(s) XML.`,
      });
    } catch (error: any) {
      toast.error("Erro ao processar arquivos", {
        description: error.message || "Verifique se os arquivos estão no formato correto.",
      });
      setFileNames([]);
      setProductCount(0);
      setTotalXmlCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-lg border-2 border-dashed border-primary/30 bg-muted/30 p-8 text-center transition-colors hover:border-primary hover:bg-muted/50"
      >
        <Upload className="mx-auto h-12 w-12 text-primary mb-4" />
        <p className="text-sm font-medium mb-1 text-foreground">
          Clique para selecionar arquivos XML
        </p>
        <p className="text-xs text-muted-foreground">
          Até 100 Notas Fiscais Eletrônicas (NFe)
        </p>
      </div>

      {fileNames.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            {productCount > 0 ? (
              <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {fileNames.length === 1 ? fileNames[0] : `${fileNames.length} arquivos selecionados`}
              </p>
              {totalXmlCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {productCount} produto(s) encontrado(s) em {totalXmlCount} arquivo(s) XML
                </p>
              )}
            </div>
          </div>
          {fileNames.length > 1 && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Arquivos:</p>
              <ul className="max-h-24 overflow-y-auto text-xs text-muted-foreground space-y-1">
                {fileNames.map((name, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    <FileText className="h-3 w-3" /> {name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Processando arquivos...</p>
        </div>
      )}
    </div>
  );
};