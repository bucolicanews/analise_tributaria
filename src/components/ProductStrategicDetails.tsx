import React, { useState, useEffect } from 'react';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { CalculatedProduct, StrategicData, SupplierType, CustomerType, EssentialityLevel, TaxRegime } from '@/types/pricing';
import { toast } from 'sonner';

interface ProductStrategicDetailsProps {
  product: CalculatedProduct;
  onSave: (productCode: string, data: StrategicData) => void;
}

const defaultStrategicData: StrategicData = {
  purchaseProfile: { supplierType: 'distribuidor', supplierRegime: 'desconhecido', creditEligible: true },
  salesProfile: { customerType: 'B2C', percentageB2B: 0, interestateSalesPercent: 0 },
  regulatoryRisk: { essentialFoodCandidate: false, healthTaxRisk: false, essentiality: 'standard' },
};

export const ProductStrategicDetails: React.FC<ProductStrategicDetailsProps> = ({ product, onSave }) => {
  const [data, setData] = useState<StrategicData>(product.strategicData || defaultStrategicData);

  useEffect(() => {
    setData(product.strategicData || defaultStrategicData);
  }, [product]);

  const handleSave = () => {
    onSave(product.code, data);
    toast.success(`Dados estratégicos para "${product.name}" salvos.`);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Análise Estratégica (Reforma)</DialogTitle>
        <DialogDescription>Ajuste o perfil de operação para {product.name}</DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-6">
        <div className="space-y-3 p-3 border rounded-md">
          <h4 className="font-semibold text-primary">Classificação LC 214 (Reforma)</h4>
          <div className="space-y-2">
            <Label>Alíquota / Essencialidade</Label>
            <Select
              value={data.regulatoryRisk.essentiality}
              onValueChange={(value: EssentialityLevel) => setData(d => ({ ...d, regulatoryRisk: { ...d.regulatoryRisk, essentiality: value } }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="zero">Cesta Básica Nacional (Alíquota Zero)</SelectItem>
                <SelectItem value="reduced">Cesta Básica Estendida (60% Redução)</SelectItem>
                <SelectItem value="standard">Tributação Padrão (IBS/CBS Cheio)</SelectItem>
                <SelectItem value="superfluous">Imposto Seletivo (Incentivo ao Desestímulo)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3 p-3 border rounded-md">
          <h4 className="font-semibold">Perfil do Fornecedor (Lado Compra)</h4>
          <div className="space-y-2">
            <Label>Regime do Fornecedor</Label>
            <Select
              value={data.purchaseProfile.supplierRegime}
              onValueChange={(value: any) => setData(d => ({ ...d, purchaseProfile: { ...d.purchaseProfile, supplierRegime: value } }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="desconhecido">Não Informado</SelectItem>
                <SelectItem value={TaxRegime.SimplesNacional}>Simples Nacional</SelectItem>
                <SelectItem value={TaxRegime.LucroPresumido}>Lucro Presumido</SelectItem>
                <SelectItem value={TaxRegime.LucroReal}>Lucro Real</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">O regime do fornecedor determina o seu crédito financeiro de IBS/CBS.</p>
          </div>
        </div>

        <div className="space-y-3 p-3 border rounded-md">
          <h4 className="font-semibold">Perfil de Mercado</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vendas para outros Estados (%)</Label>
              <Input 
                type="number" 
                value={data.salesProfile.interestateSalesPercent} 
                onChange={e => setData(d => ({ ...d, salesProfile: { ...d.salesProfile, interestateSalesPercent: parseFloat(e.target.value) || 0 } }))} 
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Cliente</Label>
              <Select
                value={data.salesProfile.customerType}
                onValueChange={(value: CustomerType) => setData(d => ({ ...d, salesProfile: { ...d.salesProfile, customerType: value } }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="B2C">Consumidor Final (B2C)</SelectItem>
                  <SelectItem value="B2B">Revenda/Indústria (B2B)</SelectItem>
                  <SelectItem value="misto">Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild><Button variant="secondary">Fechar</Button></DialogClose>
        <DialogClose asChild><Button onClick={handleSave}>Salvar Contexto</Button></DialogClose>
      </DialogFooter>
    </>
  );
};