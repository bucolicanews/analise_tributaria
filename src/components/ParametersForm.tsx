import { useState, useMemo } from "react";
import { Plus, Trash2, AlertTriangle, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalculationParams, FixedExpense, VariableExpense, TaxRegime } from "@/types/pricing";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface ParametersFormProps {
  onCalculate: (params: CalculationParams) => void;
  disabled?: boolean;
}

// Componente auxiliar para exibir a margem máxima
const MaxProfitIndicator = ({ maxProfit, currentProfit, isInvalid }: { maxProfit: number, currentProfit: number, isInvalid: boolean }) => {
  const formatPercent = (value: number) => value.toFixed(2).replace('.', ',');
  
  if (maxProfit <= 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive font-semibold mt-1">
        <AlertTriangle className="h-4 w-4" />
        Cálculo Inviável: Despesas/Impostos {"\u2265"} 100%
      </div>
    );
  }

  return (
    <div className="mt-1 text-xs">
      <span className="text-muted-foreground">Margem Máxima Permitida: </span>
      <span className={isInvalid ? "text-destructive font-semibold" : "text-success font-semibold"}>
        {formatPercent(maxProfit)}%
      </span>
      {isInvalid && (
        <span className="text-destructive ml-2 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> Excedido!
        </span>
      )}
    </div>
  );
};


export const ParametersForm = ({ onCalculate, disabled }: ParametersFormProps) => {
  const [profitMargin, setProfitMargin] = useState<string>("9.5");
  const [taxRegime, setTaxRegime] = useState<TaxRegime>(TaxRegime.LucroPresumido);
  const [simplesNacionalRate, setSimplesNacionalRate] = useState<string>("10");
  const [generateIvaCredit, setGenerateIvaCredit] = useState<boolean>(false);
  const [irpjRate, setIrpjRate] = useState<string>("1.2");
  const [csllRate, setCsllRate] = useState<string>("1.08");
  const [payroll, setPayroll] = useState<string>("10000");
  const [totalStockUnits, setTotalStockUnits] = useState<string>("5000");
  const [lossPercentage, setLossPercentage] = useState<string>("1");
  
  const [cbsRate, setCbsRate] = useState<string>("8.8");
  const [ibsRate, setIbsRate] = useState<string>("17.7");
  const [selectiveTaxRate, setSelectiveTaxRate] = useState<string>("0");

  // Parâmetros de Transição (Crédito)
  const [usePisCofins, setUsePisCofins] = useState<boolean>(true);
  const [icmsPercentage, setIcmsPercentage] = useState<string>("100");

  // Novos Parâmetros de Transição (Débito)
  const [useSelectiveTaxDebit, setUseSelectiveTaxDebit] = useState<boolean>(true);
  const [useCbsDebit, setUseCbsDebit] = useState<boolean>(true);
  const [ibsDebitPercentage, setIbsDebitPercentage] = useState<string>("100");


  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([
    { name: "Aluguel", value: 3000 },
  ]);
  
  const [variableExpenses, setVariableExpenses] = useState<VariableExpense[]>([
    { name: "Comissão", percentage: 5 },
  ]);

  // --- Lógica de Cálculo da Margem Máxima ---
  const maxProfitMargin = useMemo(() => {
    const totalVariableExpensesPercentage = variableExpenses.reduce(
      (sum, exp) => sum + exp.percentage,
      0
    );
    
    let totalTaxRate = 0;
    
    // Aplica os controles de débito na taxa de imposto
    const cbs = useCbsDebit ? (parseFloat(cbsRate) || 0) : 0;
    const ibs = (parseFloat(ibsRate) || 0) * (parseFloat(ibsDebitPercentage) / 100);
    const selective = useSelectiveTaxDebit ? (parseFloat(selectiveTaxRate) || 0) : 0;

    if (taxRegime === TaxRegime.LucroPresumido) {
      const irpj = parseFloat(irpjRate) || 0;
      const csll = parseFloat(csllRate) || 0;
      totalTaxRate = cbs + ibs + irpj + csll + selective;
    } else { // Simples Nacional
      if (generateIvaCredit) {
        const simples = parseFloat(simplesNacionalRate) || 0;
        // No Simples Híbrido, o Simples é pago integralmente, e CBS/IBS são pagos por fora (e controlados pelo débito)
        totalTaxRate = simples + cbs + ibs + selective;
      } else {
        // No Simples Padrão, apenas o Simples e o Imposto Seletivo são pagos
        totalTaxRate = (parseFloat(simplesNacionalRate) || 0) + selective;
      }
    }

    const totalOtherPercentages = totalVariableExpensesPercentage + totalTaxRate;
    
    return 100 - totalOtherPercentages;
  }, [variableExpenses, taxRegime, irpjRate, csllRate, generateIvaCredit, simplesNacionalRate, cbsRate, ibsRate, selectiveTaxRate, useCbsDebit, ibsDebitPercentage, useSelectiveTaxDebit]);

  const currentProfit = parseFloat(profitMargin) || 0;
  const isProfitMarginInvalid = currentProfit > maxProfitMargin && maxProfitMargin > 0;
  // ------------------------------------------


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

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profitMargin || !payroll || !totalStockUnits || !lossPercentage || !cbsRate || !ibsRate || !selectiveTaxRate || !icmsPercentage || !ibsDebitPercentage) {
      toast.error("Campos obrigatórios", {
        description: "Preencha todos os campos principais, de impostos e de transição.",
      });
      return;
    }

    if (maxProfitMargin <= 0) {
      toast.error("Cálculo Inviável", {
        description: "A soma das despesas variáveis e impostos é 100% ou mais. Reduza as alíquotas.",
      });
      return;
    }

    if (isProfitMarginInvalid) {
      toast.error("Margem de Lucro Excedida", {
        description: `A margem de lucro alvo (${currentProfit.toFixed(2)}%) excede a margem máxima permitida (${maxProfitMargin.toFixed(2)}%).`,
      });
      return;
    }

    if (taxRegime === TaxRegime.SimplesNacional && !simplesNacionalRate) {
      toast.error("Campo obrigatório", { description: "Preencha a Alíquota do Simples Nacional." });
      return;
    }

    if (taxRegime === TaxRegime.LucroPresumido && (!irpjRate || !csllRate)) {
      toast.error("Campos obrigatórios", { description: "Preencha as alíquotas de IRPJ e CSLL." });
      return;
    }

    onCalculate({
      profitMargin: parseFloat(profitMargin),
      fixedExpenses,
      variableExpenses,
      payroll: parseFloat(payroll),
      totalStockUnits: parseInt(totalStockUnits, 10),
      lossPercentage: parseFloat(lossPercentage),
      taxRegime,
      simplesNacionalRate: parseFloat(simplesNacionalRate),
      generateIvaCredit,
      irpjRate: parseFloat(irpjRate),
      csllRate: parseFloat(csllRate),
      cbsRate: parseFloat(cbsRate),
      ibsRate: parseFloat(ibsRate),
      selectiveTaxRate: parseFloat(selectiveTaxRate),
      // Parâmetros de Transição
      usePisCofins,
      icmsPercentage: parseFloat(icmsPercentage),
      useSelectiveTaxDebit,
      useCbsDebit,
      ibsDebitPercentage: parseFloat(ibsDebitPercentage),
    });

    toast.success("Cálculos realizados com sucesso!");
  };

  return (
    <form onSubmit={handleCalculate} className="space-y-6">
      <Button 
        type="submit" 
        className="w-full bg-gradient-primary hover:opacity-90" 
        disabled={disabled || isProfitMarginInvalid || maxProfitMargin <= 0}
      >
        <Calculator className="h-4 w-4 mr-2" /> Gerar Relatório
      </Button>

      <div className="space-y-2">
        <Label htmlFor="profit">Margem de Lucro Líquida Alvo (%)</Label>
        <Input
          id="profit"
          type="number"
          step="0.01"
          value={profitMargin}
          onChange={(e) => setProfitMargin(e.target.value)}
          disabled={disabled}
          className={isProfitMarginInvalid ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        <MaxProfitIndicator 
          maxProfit={maxProfitMargin} 
          currentProfit={currentProfit} 
          isInvalid={isProfitMarginInvalid} 
        />
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <Label className="font-semibold">Parâmetros de Transição Tributária</Label>
        
        {/* Controle de Crédito PIS/COFINS (Entrada) */}
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="usePisCofins" className="flex flex-col space-y-1">
            <span>Usar Créditos de PIS/COFINS (Entrada)</span>
            <span className="font-normal leading-snug text-muted-foreground text-xs">
              (Desative para simular a extinção do crédito)
            </span>
          </Label>
          <Switch
            id="usePisCofins"
            checked={usePisCofins}
            onCheckedChange={setUsePisCofins}
            disabled={disabled}
          />
        </div>
        
        {/* Controle de Crédito ICMS (Entrada) */}
        <div className="space-y-2">
          <Label htmlFor="icmsPercentage">Percentual de Crédito ICMS a ser considerado (%)</Label>
          <Input
            id="icmsPercentage"
            type="number"
            step="1"
            min="0"
            max="100"
            value={icmsPercentage}
            onChange={(e) => setIcmsPercentage(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="border-t border-border pt-3 space-y-3">
          <Label className="font-semibold text-sm">Controles de Débito (Venda)</Label>
          
          {/* Controle de Débito IPI/IS (Venda) */}
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="useSelectiveTaxDebit" className="flex flex-col space-y-1">
              <span>Calcular Imposto Seletivo (IPI/IS)</span>
              <span className="font-normal leading-snug text-muted-foreground text-xs">
                (Desative para simular a extinção do IPI/IS na venda)
              </span>
            </Label>
            <Switch
              id="useSelectiveTaxDebit"
              checked={useSelectiveTaxDebit}
              onCheckedChange={setUseSelectiveTaxDebit}
              disabled={disabled}
            />
          </div>

          {/* Controle de Débito PIS/COFINS/CBS (Venda) */}
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="useCbsDebit" className="flex flex-col space-y-1">
              <span>Calcular CBS (PIS/COFINS)</span>
              <span className="font-normal leading-snug text-muted-foreground text-xs">
                (Desative para simular a extinção do PIS/COFINS/CBS na venda)
              </span>
            </Label>
            <Switch
              id="useCbsDebit"
              checked={useCbsDebit}
              onCheckedChange={setUseCbsDebit}
              disabled={disabled}
            />
          </div>

          {/* Controle de Débito ICMS/ISS/IBS (Venda) */}
          <div className="space-y-2">
            <Label htmlFor="ibsDebitPercentage">Percentual de Débito IBS a ser considerado (%)</Label>
            <Input
              id="ibsDebitPercentage"
              type="number"
              step="1"
              min="0"
              max="100"
              value={ibsDebitPercentage}
              onChange={(e) => setIbsDebitPercentage(e.target.value)}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              (Simula a redução gradual do ICMS/ISS e o aumento do IBS na venda, começando em 100%)
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="taxRegime">Regime Tributário</Label>
        <Select onValueChange={(value: TaxRegime) => {
          setTaxRegime(value);
          if (value !== TaxRegime.SimplesNacional) {
            setGenerateIvaCredit(false);
          }
        }} value={taxRegime} disabled={disabled}>
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
        <>
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
          <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
            <Label htmlFor="generateIvaCredit" className="flex flex-col space-y-1">
              <span>Gerar Crédito de IVA para Cliente (B2B)</span>
              <span className="font-normal leading-snug text-muted-foreground text-xs">
                (Empresa do Simples pagará IBS/CBS por fora, além do Simples)
              </span>
            </Label>
            <Switch
              id="generateIvaCredit"
              checked={generateIvaCredit}
              onCheckedChange={setGenerateIvaCredit}
              disabled={disabled}
            />
          </div>
        </>
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

      {(taxRegime === TaxRegime.LucroPresumido || (taxRegime === TaxRegime.SimplesNacional && generateIvaCredit)) && (
        <div className="space-y-3 rounded-md border p-4">
          <Label className="font-semibold">IVA Dual (CBS/IBS)</Label>
          <div className="space-y-2">
            <Label htmlFor="cbsRate">Alíquota CBS (%)</Label>
            <Input
              id="cbsRate"
              type="number"
              step="0.01"
              value={cbsRate}
              onChange={(e) => setCbsRate(e.target.value)}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">(Substitui PIS/COFINS)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ibsRate">Alíquota IBS (%)</Label>
            <Input
              id="ibsRate"
              type="number"
              step="0.01"
              value={ibsRate}
              onChange={(e) => setIbsRate(e.target.value)}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">(Substitui ICMS/ISS)</p>
          </div>
        </div>
      )}

      <div className="space-y-3 rounded-md border p-4">
        <Label className="font-semibold">Imposto Seletivo (IS)</Label>
        <div className="space-y-2">
          <Label htmlFor="selectiveTaxRate">Alíquota Imposto Seletivo (%)</Label>
          <Input
            id="selectiveTaxRate"
            type="number"
            step="0.01"
            value={selectiveTaxRate}
            onChange={(e) => setSelectiveTaxRate(e.target.value)}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">(Incide sobre produtos prejudiciais à saúde/meio ambiente, similar ao IPI)</p>
        </div>
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

      <div className="space-y-2">
        <Label htmlFor="lossPercentage">Porcentagem de Perdas e Quebras (%)</Label>
        <Input
          id="lossPercentage"
          type="number"
          step="0.01"
          value={lossPercentage}
          onChange={(e) => setLossPercentage(e.target.value)}
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

      <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={disabled || isProfitMarginInvalid || maxProfitMargin <= 0}>
        <Calculator className="h-4 w-4 mr-2" /> Gerar Relatório
      </Button>
    </form>
  );
};