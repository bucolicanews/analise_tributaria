import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalculationParams, FixedExpense, VariableExpense, TaxRegime } from "@/types/pricing";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ParametersFormProps {
  onCalculate: (params: CalculationParams) => void;
  disabled?: boolean;
}

export const ParametersForm = ({ onCalculate, disabled }: ParametersFormProps) => {
  const [profitMargin, setProfitMargin] = useState<string>("9.5"); // Default from prompt
  const [taxRegime, setTaxRegime] = useState<TaxRegime>(TaxRegime.LucroPresumido); // Default from prompt
  const [simplesNacionalRate, setSimplesNacionalRate] = useState<string>("10"); // Default from prompt
  const [irpjRate, setIrpjRate] = useState<string>("1.2"); // Default from prompt
  const [csllRate, setCsllRate] = useState<string>("1.08"); // Default from prompt
  const [payroll, setPayroll] = useState<string>("10000");
  const [totalStockUnits, setTotalStockUnits] = useState<string>("5000"); // Novo: Estoque Total de Unidades
  
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([
    { name: "Aluguel", value: 3000 },
  ]);
  
  const [variableExpenses, setVariableExpenses] = useState<VariableExpense[]>([
    { name: "Comissão", percentage: 5 },
  ]);

  const addFixedExpense = () => {
    setFixedExpenses([...fixedExpenses, { name: "", value: 0 }]);
  };

  const removeFixedExpense = (index: number) => {
    setFixedExpenses(fixedExpenses.filter((_, i) => i !== index));
  };

  const updateFixedExpense = (index: number, field: keyof FixedExpense, value: string | number) => {
    const updated = [...fixedExpenses];
    updated[index] = { ...updated[index], [field]: value };
    setFixedExpenses(updated);
  };

  const addVariableExpense = () => {
    setVariableExpenses([...variableExpenses, { name: "", percentage: 0 }]);
  };

  const removeVariableExpense = (index: number) => {
    setVariableExpenses(variableExpenses.filter((_, i) => i !== index));
  };

  const updateVariableExpense = (index: number, field: keyof VariableExpense, value: string | number) => {
    const updated = [...variableExpenses];
    updated[index] = { ...updated[index], [field]: value };
    setVariableExpenses(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profitMargin || !payroll || !totalStockUnits) {
      toast.error("Campos obrigatórios", {
        description: "Preencha todos os campos principais.",
      });
      return;
    }

    if (taxRegime === TaxRegime.SimplesNacional && !simplesNacionalRate) {
      toast.error("Campo obrigatório", {
        description: "Preencha a alíquota do Simples Nacional.",
      });
      return;
    }

    if (taxRegime === TaxRegime.LucroPresumido && (!irpjRate || !csllRate)) {
      toast.error("Campos obrigatórios", {
        description: "Preencha as alíquotas de IRPJ e CSLL.",
      });
      return;
    }

    onCalculate({
      profitMargin: parseFloat(profitMargin),
      fixedExpenses,
      variableExpenses,
      payroll: parseFloat(payroll),
      totalStockUnits: parseInt(totalStockUnits, 10), // Novo: Passando o estoque total
      taxRegime,
      simplesNacionalRate: parseFloat(simplesNacionalRate),
      irpjRate: parseFloat(irpjRate),
      csllRate: parseFloat(csllRate),
    });

    toast.success("Cálculos realizados com sucesso!");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="profit">Margem de Lucro Líquida Alvo (%)</Label>
        <Input
          id="profit"
          type="number"
          step="0.01"
          value={profitMargin}
          onChange={(e) => setProfitMargin(e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="taxRegime">Regime Tributário</Label>
        <Select onValueChange={(value: TaxRegime) => setTaxRegime(value)} value={taxRegime} disabled={disabled}>
          <SelectTrigger id="taxRegime">
            <SelectValue placeholder="Selecione o regime" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TaxRegime.SimplesNacional}>Simples Nacional</SelectItem>
            <SelectItem value={TaxRegime.LucroPresumido}>Lucro Presumido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {taxRegime === TaxRegime.SimplesNacional && (
        <div className="space-y-2">
          <Label htmlFor="simples">Alíquota Simples Nacional (%)</Label>
          <Input
            id="simples"
            type="number"
            step="0.01"
            value={simplesNacionalRate}
            onChange={(e) => setSimplesNacionalRate(e.target.value)}
            disabled={disabled}
          />
        </div>
      )}

      {taxRegime === TaxRegime.LucroPresumido && (
        <>
          <div className="space-y-2">
            <Label htmlFor="irpj">Alíquota IRPJ (%)</Label>
            <Input
              id="irpj"
              type="number"
              step="0.01"
              value={irpjRate}
              onChange={(e) => setIrpjRate(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="csll">Alíquota CSLL (%)</Label>
            <Input
              id="csll"
              type="number"
              step="0.01"
              value={csllRate}
              onChange={(e) => setCsllRate(e.target.value)}
              disabled={disabled}
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="payroll">Folha de Pagamento (R$)</Label>
        <Input
          id="payroll"
          type="number"
          step="0.01"
          value={payroll}
          onChange={(e) => setPayroll(e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="totalStockUnits">Estoque Total de Unidades (ETU)</Label>
        <Input
          id="totalStockUnits"
          type="number"
          step="1"
          value={totalStockUnits}
          onChange={(e) => setTotalStockUnits(e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Despesas Fixas</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addFixedExpense}
            disabled={disabled}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {fixedExpenses.map((expense, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder="Nome"
              value={expense.name}
              onChange={(e) => updateFixedExpense(index, "name", e.target.value)}
              disabled={disabled}
            />
            <Input
              placeholder="Valor"
              type="number"
              step="0.01"
              value={expense.value}
              onChange={(e) => updateFixedExpense(index, "value", parseFloat(e.target.value) || 0)}
              disabled={disabled}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => removeFixedExpense(index)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Despesas Variáveis</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addVariableExpense}
            disabled={disabled}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {variableExpenses.map((expense, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder="Nome"
              value={expense.name}
              onChange={(e) => updateVariableExpense(index, "name", e.target.value)}
              disabled={disabled}
            />
            <Input
              placeholder="%"
              type="number"
              step="0.01"
              value={expense.percentage}
              onChange={(e) => updateVariableExpense(index, "percentage", parseFloat(e.target.value) || 0)}
              disabled={disabled}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => removeVariableExpense(index)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={disabled}>
        Gerar Relatório
      </Button>
    </form>
  );
};