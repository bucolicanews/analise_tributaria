import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalculationParams, FixedExpense, VariableExpense } from "@/types/pricing";
import { toast } from "sonner";

interface ParametersFormProps {
  onCalculate: (params: CalculationParams) => void;
  disabled?: boolean;
}

export const ParametersForm = ({ onCalculate, disabled }: ParametersFormProps) => {
  const [profitMargin, setProfitMargin] = useState<string>("30");
  const [simplesNacional, setSimplesNacional] = useState<string>("6");
  const [payroll, setPayroll] = useState<string>("10000");
  
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
    
    if (!profitMargin || !simplesNacional || !payroll) {
      toast.error("Campos obrigatórios", {
        description: "Preencha todos os campos principais.",
      });
      return;
    }

    onCalculate({
      profitMargin: parseFloat(profitMargin),
      fixedExpenses,
      variableExpenses,
      simplesNacional: parseFloat(simplesNacional),
      payroll: parseFloat(payroll),
    });

    toast.success("Cálculos realizados com sucesso!");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="profit">Margem de Lucro (%)</Label>
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
        <Label htmlFor="simples">Simples Nacional (%)</Label>
        <Input
          id="simples"
          type="number"
          step="0.01"
          value={simplesNacional}
          onChange={(e) => setSimplesNacional(e.target.value)}
          disabled={disabled}
        />
      </div>

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
