import React, { useState, useEffect } from 'react';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CalculatedProduct, StrategicData, SupplierType, CustomerType } from '@/types/pricing';
import { toast } from 'sonner';

interface ProductStrategicDetailsProps {
  product: CalculatedProduct;
  onSave: (productCode: string, data: StrategicData) => void;
}

const defaultStrategicData: StrategicData = {
  purchaseProfile: { supplierType: 'distribuidor', creditEligible: true },
  salesProfile: { customerType: 'B2C', percentageB2B: 0 },
  regulatoryRisk: { essentialFoodCandidate: false, healthTaxRisk: false },
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
        <DialogTitle>Detalhes Estratégicos</DialogTitle>
        <DialogDescription>
          Adicione contexto de negócio para o produto: {product.name} ({product.code})
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-6">
        {/* Perfil de Compra */}
        <div className="space-y-3 p-3 border rounded-md">
          <h4 className="font-semibold">Perfil de Compra</h4>
          <div className="space-y-2">
            <Label>Tipo de Fornecedor</Label>
            <Select
              value={data.purchaseProfile.supplierType}
              onValueChange={(value: SupplierType) => setData(d => ({ ...d, purchaseProfile: { ...d.purchaseProfile, supplierType: value } }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="industria">Indústria (Crédito Cheio)</SelectItem>
                <SelectItem value="distribuidor">Distribuidor (Crédito Parcial/Nenhum)</SelectItem>
                <SelectItem value="importador">Importador</SelectItem>
                <SelectItem value="desconhecido">Desconhecido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Perfil de Venda */}
        <div className="space-y-3 p-3 border rounded-md">
          <h4 className="font-semibold">Perfil de Venda</h4>
          <div className="space-y-2">
            <Label>Tipo de Cliente Principal</Label>
            <Select
              value={data.salesProfile.customerType}
              onValueChange={(value: CustomerType) => setData(d => ({ ...d, salesProfile: { ...d.salesProfile, customerType: value } }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="B2C">Consumidor Final (B2C)</SelectItem>
                <SelectItem value="B2B">Empresa (B2B)</SelectItem>
                <SelectItem value="misto">Misto</SelectItem>
                <SelectItem value="desconhecido">Desconhecido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Risco Regulatório */}
        <div className="space-y-3 p-3 border rounded-md">
          <h4 className="font-semibold">Risco Regulatório (Reforma)</h4>
          <div className="flex items-center justify-between">
            <Label>Candidato à Cesta Básica (Alíq. Reduzida)?</Label>
            <Switch
              checked={data.regulatoryRisk.essentialFoodCandidate}
              onCheckedChange={checked => setData(d => ({ ...d, regulatoryRisk: { ...d.regulatoryRisk, essentialFoodCandidate: checked } }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Risco de "Imposto do Pecado" (Saúde)?</Label>
            <Switch
              checked={data.regulatoryRisk.healthTaxRisk}
              onCheckedChange={checked => setData(d => ({ ...d, regulatoryRisk: { ...d.regulatoryRisk, healthTaxRisk: checked } }))}
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary">Fechar</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button type="button" onClick={handleSave}>Salvar</Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
};