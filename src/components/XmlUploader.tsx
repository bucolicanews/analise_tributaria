import { useRef, useState } from "react";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
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
  const [fileName, setFileName] = useState<string>("");
  const [productCount, setProductCount] = useState<number>(0);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xml")) {
      toast.error("Formato inválido", {
        description: "Por favor, selecione um arquivo XML.",
      });
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    try {
      const text = await file.text();
      const products = await parseXml(text);
      
      setProductCount(products.length);
      onXmlParsed(products);
      
      toast.success("XML processado com sucesso!", {
        description: `${products.length} produto(s) encontrado(s).`,
      });
    } catch (error) {
      toast.error("Erro ao processar XML", {
        description: "Verifique se o arquivo está no formato correto.",
      });
      setFileName("");
      setProductCount(0);
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
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-lg border-2 border-dashed border-primary/30 bg-muted/30 p-8 text-center transition-colors hover:border-primary hover:bg-muted/50"
      >
        <Upload className="mx-auto h-12 w-12 text-primary mb-4" />
        <p className="text-sm font-medium mb-1 text-foreground">
          Clique para selecionar o arquivo XML
        </p>
        <p className="text-xs text-muted-foreground">
          Nota Fiscal Eletrônica (NFe)
        </p>
      </div>

      {fileName && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            {productCount > 0 ? (
              <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName}</p>
              {productCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {productCount} produto(s) encontrado(s)
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Processando XML...</p>
        </div>
      )}
    </div>
  );
};
