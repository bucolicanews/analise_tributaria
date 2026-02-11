import { useState, useMemo } from "react";
import { Plus, Trash2, AlertTriangle, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalculationParams, FixedExpense, VariableExpense, TaxRegime, SelectiveTaxRate } from "@/types/pricing";
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
  const [irpjRateLucroReal, setIrpjRateLucroReal] = useState<string>("15");
  const [csllRateLucroReal, setCsllRateLucroReal] = useState<string>("9");
  const [payroll, setPayroll] = useState<string>("10000");
  const [inssPatronalRate, setInssPatronalRate] = useState<string>("28.8");
  const [totalStockUnits, setTotalStockUnits] = useState<string>("5000");
  const [lossPercentage, setLossPercentage] = useState<string>("1");
  
  const [cbsRate, setCbsRate] = useState<string>("8.8");
  const [ibsRate, setIbsRate] = useState<string>("17.7");
  const [defaultSelectiveTaxRate, setDefaultSelectiveTaxRate] = useState<string>("0");
  const [selectiveTaxRates, setSelectiveTaxRates] = useState<SelectiveTaxRate[]>([
    { ncm: "2203", rate: 10, description: "Cervejas" },
  ]);

  // Parâmetros de Transição (Crédito)
  const [usePisCofins, setUsePisCofins] = useState<boolean>(true);
  const [icmsPercentage, setIcmsPercentage] = useState<string>("100");

  // Novos Parâmetros de Transição (Débito)
  const [useSelectiveTaxDebit, setUseSelectiveTaxDebit] = useState<boolean>(true);
  const [useCbsDebit, setUseCbsDebit] = useState<boolean>(true);
  const [ibsDebitPercentage, setIbsDebitPercentage] = useState<string>("100");

  // Novos campos de contexto
  const [faturamento12Meses, setFaturamento12Meses] = useState<string>("");
  const [anexoSimples, setAnexoSimples] = useState<string>("");
  const [tipoOperacao, setTipoOperacao] = useState<'Varejo' | 'Atacado'>('Varejo');


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
    // Para a margem máxima, consideramos a maior alíquota de IS possível como pior caso.
    const maxSelectiveRate = Math.max(parseFloat(defaultSelectiveTaxRate) || 0, ...selectiveTaxRates.map(r => r.rate));
    const selective = useSelectiveTaxDebit ? maxSelectiveRate : 0;

    if (taxRegime === TaxRegime.LucroPresumido) {
      const irpj = parseFloat(irpjRate) || 0;
      const csll = parseFloat(csllRate) || 0;
      totalTaxRate = cbs + ibs + irpj + csll + selective;
    } else if (taxRegime === TaxRegime.LucroReal) {
      totalTaxRate = cbs + ibs + selective;
      const totalOtherPercentages = totalVariableExpensesPercentage + totalTaxRate;
      const irpjCsllRate = (parseFloat(irpjRateLucroReal) || 0) / 100 + (parseFloat(csllRateLucroReal) || 0) / 100;
      return (100 - totalOtherPercentages) * (1 - irpjCsllRate);
    } else { // Simples Nacional
      if (generateIvaCredit) {
        const simples = parseFloat(simplesNacionalRate) || 0;
        totalTaxRate = simples + cbs + ibs + selective;
      } else {
        totalTaxRate = (parseFloat(simplesNacionalRate) || 0) + selective;
      }
    }

    const totalOtherPercentages = totalVariableExpensesPercentage + totalTaxRate;
    
    return 100 - totalOtherPercentages;
  }, [variableExpenses, taxRegime, irpjRate, csllRate, generateIvaCredit, simplesNacionalRate, cbsRate, ibsRate, defaultSelectiveTaxRate, selectiveTaxRates, useCbsDebit, ibsDebitPercentage, useSelectiveTaxDebit, irpjRateLucroReal, csllRateLucroReal]);

  const currentProfit = parseFloat(profitMargin) || 0;
  const isProfitMarginInvalid = currentProfit > maxProfitMargin && maxProfitMargin > 0;
  // ------------------------------------------


  const addFixedExpense = () => setFixedExpenses([...fixedExpenses, { name: "", value: 0 }]);
  const removeFixedExpense = (index: number) => setFixedExpenses(fixedExpenses.filter((_, i) => i !== index));
  const updateFixedExpense = (index: number, field: keyof FixedExpense, value: string | number) => {
    const updated = [...fixedExpenses];
    updated[index] = { ...updated[index], [field]: value };
    setFixedExpenses(updated);
  };

  const addVariableExpense = () => setVariableExpenses([...variableExpenses, { name: "", percentage: 0 }]);
  const removeVariableExpense = (index: number) => setVariableExpenses(variableExpenses.filter((_, i) => i !== index));
  const updateVariableExpense = (index: number, field: keyof VariableExpense, value: string | number) => {
    const updated = [...variableExpenses];
    updated[index] = { ...updated[index], [field]: value };
    setVariableExpenses(updated);
  };

  const addSelectiveTaxRate = () => setSelectiveTaxRates([...selectiveTaxRates, { ncm: "", rate: 0, description: "" }]);
  const removeSelectiveTaxRate = (index: number) => setSelectiveTaxRates(selectiveTaxRates.filter((_, i) => i !== index));
  const updateSelectiveTaxRate = (index: number, field: keyof SelectiveTaxRate, value: string | number) => {
    const updated = [...selectiveTaxRates];
    updated[index] = { ...updated[index], [field]: value };
    setSelectiveTaxRates(updated);
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profitMargin || !payroll || !inssPatronalRate || !totalStockUnits || !lossPercentage || !cbsRate || !ibsRate || !defaultSelectiveTaxRate || !icmsPercentage || !ibsDebitPercentage) {
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

    if (taxRegime === TaxRegime.LucroReal && (!irpjRateLucroReal || !csllRateLucroReal)) {
      toast.error("Campos obrigatórios", { description: "Preencha as alíquotas de IRPJ e CSLL para o Lucro Real." });
      return;
    }

    onCalculate({
      profitMargin: parseFloat(profitMargin),
      fixedExpenses,
      variableExpenses,
      payroll: parseFloat(payroll),
      inssPatronalRate: parseFloat(inssPatronalRate),
      totalStockUnits: parseInt(totalStockUnits, 10),
      lossPercentage: parseFloat(lossPercentage),
      taxRegime,
      simplesNacionalRate: parseFloat(simplesNacionalRate),
      generateIvaCredit,
      irpjRate: parseFloat(irpjRate),
      csllRate: parseFloat(csllRate),
      irpjRateLucroReal: parseFloat(irpjRateLucroReal),
      csllRateLucroReal: parseFloat(csllRateLucroReal),
      cbsRate: parseFloat(cbsRate),
      ibsRate: parseFloat(ibsRate),
      defaultSelectiveTaxRate: parseFloat(defaultSelectiveTaxRate),
      selectiveTaxRates,
      // Parâmetros de Transição
      usePisCofins,
      icmsPercentage: parseFloat(icmsPercentage),
      useSelectiveTaxDebit,
      useCbsDebit,
      ibsDebitPercentage: parseFloat(ibsDebitPercentage),
      // Novos campos de contexto
      faturamento12Meses: parseFloat(faturamento12Meses) || undefined,
      anexoSimples: anexoSimples || undefined,
      tipoOperacao: tipoOperacao,
    });

    toast.success("Cálculos realizados com sucesso!");
  };

  const isLucroPresumido = taxRegime === TaxRegime.LucroPresumido;
  const isLucroReal = taxRegime === TaxRegime.LucroReal;
  const isSimplesNacional = taxRegime === TaxRegime.SimplesNacional;
  const isSimplesHibrido = isSimplesNacional && generateIvaCredit;
  const showIvaDualRates = isLucroPresumido || isLucroReal || isSimplesHibrido;
  const showCreditControls = isLucroPresumido || isLucroReal; // Simples não usa crédito
  const showSelectiveTaxControls = isLucroPresumido || isLucroReal || isSimplesHibrido; // IS é relevante apenas para LP, LR ou Simples Híbrido

  return (
    <form onSubmit={handleCalculate} className="space-y-6">
      <Button 
        type="submit" 
        className="w-full bg-gradient-primary hover:opacity-90" 
        disabled={disabled || isProfitMarginInvalid || maxProfitMargin <= 0}
      >
        <Calculator className="h-4 w-4 mr-2" /> Gerar Relatório
      </Button>

      {/* 1. Contexto da Empresa */}
      <div className="space-y-4 border-t border-border pt-4">
        <h3 className="font-bold text-lg">1. Contexto da Empresa</h3>
        <div className="space-y-2">
          <Label htmlFor="faturamento12Meses">Receita Bruta (Últimos 12 Meses)</Label>
          <Input
            id="faturamento12Meses"
            type="number"
            step="0.01"
            placeholder="R$"
            value={faturamento12Meses}
            onChange={(e) => setFaturamento12Meses(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipoOperacao">Tipo de Operação Principal</Label>
          <Select onValueChange={(value: 'Varejo' | 'Atacado') => setTipoOperacao(value)} value={tipoOperacao} disabled={disabled}>
            <SelectTrigger id="tipoOperacao">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Varejo">Varejo (Consumidor Final)</SelectItem>
              <SelectItem value="Atacado">Atacado (Revenda)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 2. Regime Tributário */}
      <div className="space-y-2 border-t border-border pt-4">
        <Label htmlFor="taxRegime" className="font-bold text-lg">2. Regime Tributário</Label>
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
            <SelectItem value={TaxRegime.LucroReal}>Lucro Real</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 3. Impostos e Transição */}
      <div className="space-y-6 border-t border-border pt-4">
        <h3 className="font-bold text-lg">3. Impostos e Transição Tributária</h3>

        {/* 3.1. Alíquotas do Regime */}
        <div className="space-y-3 rounded-md border p-4">
          <Label className="font-semibold">Alíquotas do Regime</Label>
          
          {isSimplesNacional && (
            <>
              <div className="space-y-2">
                <Label htmlFor="anexoSimples">Anexo do Simples Nacional</Label>
                <Select onValueChange={(value) => setAnexoSimples(value)} value={anexoSimples} disabled={disabled}>
                  <SelectTrigger id="anexoSimples">
                    <SelectValue placeholder="Selecione o anexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Anexo I">Anexo I - Comércio</SelectItem>
                    <SelectItem value="Anexo II">Anexo II - Indústria</SelectItem>
                    <SelectItem value="Anexo III">Anexo III - Serviços</SelectItem>
                    <SelectItem value="Anexo IV">Anexo IV - Serviços</SelectItem>
                    <SelectItem value="Anexo V">Anexo V - Serviços</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="simples">Alíquota Efetiva do Simples Nacional (%)</Label>
                <Input
                  id="simples"
                  type="number"
                  step="0.01"
                  value={simplesNacionalRate}
                  onChange={(e) => setSimplesNacionalRate(e.target.value)}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">(Alíquota real calculada com base no faturamento)</p>
              </div>
              <div className="flex items-center justify-between space-x-2 border-t border-border pt-3">
                <Label htmlFor="generateIvaCredit" className="flex flex-col space-y-1">
                  <span>Gerar Crédito de IVA para Cliente (B2B)</span>
                  <span className="font-normal leading-snug text-muted-foreground text-xs">
                    (Simples Híbrido: Empresa pagará IBS/CBS por fora, além do Simples)
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

          {isLucroPresumido && (
            <>
              <div className="space-y-2">
                <Label htmlFor="irpj">Alíquota IRPJ (Presumido) (%)</Label>
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
                <Label htmlFor="csll">Alíquota CSLL (Presumido) (%)</Label>
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

          {isLucroReal && (
            <>
              <div className="space-y-2">
                <Label htmlFor="irpjLR">Alíquota IRPJ (Lucro Real) (%)</Label>
                <Input
                  id="irpjLR"
                  type="number"
                  step="0.01"
                  value={irpjRateLucroReal}
                  onChange={(e) => setIrpjRateLucroReal(e.target.value)}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="csllLR">Alíquota CSLL (Lucro Real) (%)</Label>
                <Input
                  id="csllLR"
                  type="number"
                  step="0.01"
                  value={csllRateLucroReal}
                  onChange={(e) => setCsllRateLucroReal(e.target.value)}
                  disabled={disabled}
                />
              </div>
            </>
          )}
        </div>

        {/* 3.2. IVA Dual (CBS/IBS) - Condicional */}
        {showIvaDualRates && (
          <div className="space-y-3 rounded-md border p-4">
            <Label className="font-semibold">Alíquotas IVA Dual (CBS/IBS)</Label>
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

        {/* 3.3. Imposto Seletivo (IS) - Condicional */}
        {showSelectiveTaxControls && (
          <div className="space-y-3 rounded-md border p-4">
            <Label className="font-semibold">Imposto Seletivo (IS)</Label>
            <div className="space-y-2">
              <Label htmlFor="defaultSelectiveTaxRate">Alíquota Padrão do Imposto Seletivo (%)</Label>
              <Input
                id="defaultSelectiveTaxRate"
                type="number"
                step="0.01"
                value={defaultSelectiveTaxRate}
                onChange={(e) => setDefaultSelectiveTaxRate(e.target.value)}
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">(Alíquota de fallback, usada se um NCM específico não for encontrado abaixo)</p>
            </div>
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <Label>Alíquotas Específicas por NCM</Label>
                <Button type="button" size="sm" variant="outline" onClick={addSelectiveTaxRate} disabled={disabled}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {selectiveTaxRates.map((rate, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <Input
                    placeholder="NCM (ex: 2203)"
                    value={rate.ncm}
                    onChange={(e) => updateSelectiveTaxRate(index, "ncm", e.target.value)}
                    disabled={disabled}
                  />
                  <Input
                    placeholder="%"
                    type="number"
                    step="0.01"
                    value={rate.rate}
                    onChange={(e) => updateSelectiveTaxRate(index, "rate", parseFloat(e.target.value) || 0)}
                    disabled={disabled}
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeSelectiveTaxRate(index)} disabled={disabled}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3.4. Parâmetros de Transição (Crédito - Entrada) - APENAS LUCRO PRESUMIDO/REAL */}
        {showCreditControls && (
          <div className="space-y-3 rounded-md border p-4">
            <Label className="font-semibold">Controles de Crédito (Entrada)</Label>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="usePisCofins" className="flex flex-col space-y-1">
                <span>Usar Créditos de PIS/COFINS (Entrada)</span>
                <span className="font-normal leading-snug text-muted-foreground text-xs">
                  (Simula a manutenção do crédito PIS/COFINS na transição)
                </span>
              </Label>
              <Switch id="usePisCofins" checked={usePisCofins} onCheckedChange={setUsePisCofins} disabled={disabled} />
            </div>
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
              <p className="text-xs text-muted-foreground">
                (Simula a manutenção do crédito ICMS na transição)
              </p>
            </div>
          </div>
        )}

        {/* 3.5. Parâmetros de Transição (Débito - Venda) - Condicional */}
        {(isLucroPresumido || isLucroReal || isSimplesHibrido) && (
          <div className="space-y-3 rounded-md border p-4">
            <Label className="font-semibold">Controles de Débito (Venda)</Label>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="useSelectiveTaxDebit" className="flex flex-col space-y-1">
                <span>Calcular Imposto Seletivo (IPI/IS)</span>
                <span className="font-normal leading-snug text-muted-foreground text-xs">
                  (Desative para simular a extinção do IPI/IS na venda)
                </span>
              </Label>
              <Switch id="useSelectiveTaxDebit" checked={useSelectiveTaxDebit} onCheckedChange={setUseSelectiveTaxDebit} disabled={disabled} />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="useCbsDebit" className="flex flex-col space-y-1">
                <span>Calcular CBS (PIS/COFINS)</span>
                <span className="font-normal leading-snug text-muted-foreground text-xs">
                  (Desative para simular a extinção do PIS/COFINS/CBS na venda)
                </span>
              </Label>
              <Switch id="useCbsDebit" checked={useCbsDebit} onCheckedChange={setUseCbsDebit} disabled={disabled} />
            </div>
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
        )}
        
        {isSimplesNacional && !isSimplesHibrido && (
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">
              No Simples Nacional Padrão, o Simples engloba a maioria dos impostos. Apenas o Imposto Seletivo (IS) seria pago por fora, mas para simplificação, assumimos IS = 0% neste cenário.
            </p>
          </div>
        )}
      </div>

      {/* 4. Margem de Lucro */}
      <div className="space-y-2 border-t border-border pt-4">
        <Label htmlFor="profit" className="font-bold text-lg">4. Margem de Lucro Líquida Alvo (%)</Label>
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

      {/* 5. Custos Fixos e Estoque */}
      <div className="space-y-6 border-t border-border pt-4">
        <h3 className="font-bold text-lg">5. Custos Fixos e Estoque</h3>
        
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

        {!isSimplesNacional && (
          <div className="space-y-2">
            <Label htmlFor="inssPatronalRate">Alíquota INSS Patronal + Terceiros (%)</Label>
            <Input
              id="inssPatronalRate"
              type="number"
              step="0.01"
              value={inssPatronalRate}
              onChange={(e) => setInssPatronalRate(e.target.value)}
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              (Contribuição sobre a folha. Ex: 28.8% para Lucro Presumido/Real)
            </p>
          </div>
        )}

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
          <p className="text-xs text-muted-foreground">
            (Usado para ratear custos fixos por unidade interna - CFU)
          </p>
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
            <Label>Outras Despesas Fixas</Label>
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
      </div>

      {/* 6. Despesas Variáveis */}
      <div className="space-y-3 border-t border-border pt-4">
        <h3 className="font-bold text-lg">6. Despesas Variáveis (Venda)</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Despesas Variáveis Percentuais</Label>
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
      </div>

      <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={disabled || isProfitMarginInvalid || maxProfitMargin <= 0}>
        <Calculator className="h-4 w-4 mr-2" /> Gerar Relatório
      </Button>
    </form>
  );
};