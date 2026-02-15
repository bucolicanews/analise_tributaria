import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, AlertTriangle, Calculator, Zap, Building2, Landmark, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalculationParams, FixedExpense, VariableExpense, TaxRegime, SelectiveTaxRate } from "@/types/pricing";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { calculateSimplesNacionalEffectiveRate } from "@/lib/simplesNacional";

interface ParametersFormProps {
  onCalculate: (params: CalculationParams) => void;
  disabled?: boolean;
}

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
  const [profitMargin, setProfitMargin] = useState<string>("12");
  const [taxRegime, setTaxRegime] = useState<TaxRegime>(TaxRegime.LucroPresumido);
  const [simplesNacionalRate, setSimplesNacionalRate] = useState<string>("0");
  const [generateIvaCredit, setGenerateIvaCredit] = useState<boolean>(false);
  const [irpjRate, setIrpjRate] = useState<string>("1.2");
  const [csllRate, setCsllRate] = useState<string>("1.08");
  const [irpjRateLucroReal, setIrpjRateLucroReal] = useState<string>("15");
  const [csllRateLucroReal, setCsllRateLucroReal] = useState<string>("9");
  const [payroll, setPayroll] = useState<string>("6500");
  const [inssPatronalRate, setInssPatronalRate] = useState<string>("28.8");
  const [totalStockUnits, setTotalStockUnits] = useState<string>("3000");
  const [lossPercentage, setLossPercentage] = useState<string>("1.5");
  
  const [cbsRate, setCbsRate] = useState<string>("8.8");
  const [ibsRate, setIbsRate] = useState<string>("17.7");
  const [defaultSelectiveTaxRate, setDefaultSelectiveTaxRate] = useState<string>("0");
  const [selectiveTaxRates, setSelectiveTaxRates] = useState<SelectiveTaxRate[]>([
    { ncm: "2203", rate: 10, description: "Cervejas" },
  ]);

  const [usePisCofins, setUsePisCofins] = useState<boolean>(true);
  const [icmsPercentage, setIcmsPercentage] = useState<string>("100");
  const [useSelectiveTaxDebit, setUseSelectiveTaxDebit] = useState<boolean>(true);
  const [useCbsDebit, setUseCbsDebit] = useState<boolean>(true);
  const [ibsDebitPercentage, setIbsDebitPercentage] = useState<string>("100");

  const [faturamento12Meses, setFaturamento12Meses] = useState<string>("540000");
  const [anexoSimples, setAnexoSimples] = useState<string>("Anexo I");
  const [tipoOperacao, setTipoOperacao] = useState<'Varejo' | 'Atacado'>('Varejo');

  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([
    { name: "Aluguel", value: 3500 },
    { name: "Luz/Água/Internet", value: 950 },
    { name: "Contador", value: 650 },
    { name: "IPTU/TLPL/Taxas", value: 250 },
    { name: "Uso e Consumo", value: 400 },
  ]);
  
  const [variableExpenses, setVariableExpenses] = useState<VariableExpense[]>([
    { name: "Comissão", percentage: 2 },
    { name: "Taxas Cartão", percentage: 3.5 },
    { name: "Embalagens", percentage: 1 },
  ]);

  const applyPreset = (type: 'simples' | 'hibrido' | 'presumido' | 'real') => {
    // Parâmetros de Mercado ME/EPP
    setLossPercentage("2");
    setTotalStockUnits("4000");
    setProfitMargin("15");
    
    // Lista de despesas realistas para ME
    const realisticFixed = [
        { name: "Aluguel", value: 3500 },
        { name: "Luz/Água/Internet", value: 950 },
        { name: "Contador", value: 700 },
        { name: "IPTU/Taxas", value: 300 },
        { name: "Manutenção/Consumo", value: 500 },
    ];
    
    const realisticVariable = [
        { name: "Comissão", percentage: 3 },
        { name: "Taxas Cartão", percentage: 3.5 },
        { name: "Embalagens/Frete", percentage: 1.5 },
    ];

    setFixedExpenses(realisticFixed);
    setVariableExpenses(realisticVariable);

    if (type === 'simples' || type === 'hibrido') {
        setFaturamento12Meses("540000"); // 45k/mês
        setAnexoSimples("Anexo I");
        setPayroll("6500"); // 2 funcionários salário mínimo + encargos simples
        setTaxRegime(TaxRegime.SimplesNacional);
        setGenerateIvaCredit(type === 'hibrido');
        setUsePisCofins(type === 'hibrido');
        setIcmsPercentage(type === 'hibrido' ? "100" : "0");
        setUseSelectiveTaxDebit(type === 'hibrido');
        setUseCbsDebit(type === 'hibrido');
        setIbsDebitPercentage(type === 'hibrido' ? "100" : "0");
    } else if (type === 'presumido') {
        setFaturamento12Meses("1800000"); // 150k/mês
        setPayroll("18000");
        setTaxRegime(TaxRegime.LucroPresumido);
        setIrpjRate("1.2");
        setCsllRate("1.08");
        setInssPatronalRate("28.8");
        setUsePisCofins(true);
        setIcmsPercentage("100");
        setUseSelectiveTaxDebit(true);
        setUseCbsDebit(true);
        setIbsDebitPercentage("100");
    } else if (type === 'real') {
        setFaturamento12Meses("4800000"); // 400k/mês
        setPayroll("45000");
        setTaxRegime(TaxRegime.LucroReal);
        setIrpjRateLucroReal("15");
        setCsllRateLucroReal("9");
        setInssPatronalRate("28.8");
        setUsePisCofins(true);
        setIcmsPercentage("100");
        setUseSelectiveTaxDebit(true);
        setUseCbsDebit(true);
        setIbsDebitPercentage("100");
    }
    toast.info(`Preset "${type.toUpperCase()}" aplicado com dados realistas de mercado.`);
  };

  useEffect(() => {
    if (taxRegime === TaxRegime.SimplesNacional) {
      const rbt12 = parseFloat(faturamento12Meses) || 0;
      if (anexoSimples && rbt12 > 0) {
        const rate = calculateSimplesNacionalEffectiveRate(anexoSimples, rbt12);
        setSimplesNacionalRate(rate.toFixed(2));
      } else {
        setSimplesNacionalRate("0");
      }
    }
  }, [faturamento12Meses, anexoSimples, taxRegime]);

  const maxProfitMargin = useMemo(() => {
    const totalVariableExpensesPercentage = variableExpenses.reduce((sum, exp) => sum + exp.percentage, 0);
    let totalTaxRate = 0;
    const cbs = useCbsDebit ? (parseFloat(cbsRate) || 0) : 0;
    const ibs = (parseFloat(ibsRate) || 0) * (parseFloat(ibsDebitPercentage) / 100);
    const maxSelectiveRate = Math.max(parseFloat(defaultSelectiveTaxRate) || 0, ...selectiveTaxRates.map(r => r.rate));
    const selective = useSelectiveTaxDebit ? maxSelectiveRate : 0;

    if (taxRegime === TaxRegime.LucroPresumido) {
      totalTaxRate = cbs + ibs + (parseFloat(irpjRate) || 0) + (parseFloat(csllRate) || 0) + selective;
    } else if (taxRegime === TaxRegime.LucroReal) {
      totalTaxRate = cbs + ibs + selective;
      const irpjCsllRate = (parseFloat(irpjRateLucroReal) || 0) / 100 + (parseFloat(csllRateLucroReal) || 0) / 100;
      return (100 - (totalVariableExpensesPercentage + totalTaxRate)) * (1 - irpjCsllRate);
    } else {
      const simples = parseFloat(simplesNacionalRate) || 0;
      totalTaxRate = generateIvaCredit ? simples + cbs + ibs + selective : simples + selective;
    }
    return 100 - (totalVariableExpensesPercentage + totalTaxRate);
  }, [variableExpenses, taxRegime, irpjRate, csllRate, generateIvaCredit, simplesNacionalRate, cbsRate, ibsRate, defaultSelectiveTaxRate, selectiveTaxRates, useCbsDebit, ibsDebitPercentage, useSelectiveTaxDebit, irpjRateLucroReal, csllRateLucroReal]);

  const currentProfit = parseFloat(profitMargin) || 0;
  const isProfitMarginInvalid = currentProfit > maxProfitMargin && maxProfitMargin > 0;

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profitMargin || !payroll || !totalStockUnits || !lossPercentage || !cbsRate || !ibsRate) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (maxProfitMargin <= 0 || isProfitMarginInvalid) {
      toast.error("Cálculo inviável com as alíquotas e margem atuais.");
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
      usePisCofins,
      icmsPercentage: parseFloat(icmsPercentage),
      useSelectiveTaxDebit,
      useCbsDebit,
      ibsDebitPercentage: parseFloat(ibsDebitPercentage),
      faturamento12Meses: parseFloat(faturamento12Meses) || undefined,
      anexoSimples: anexoSimples || undefined,
      tipoOperacao: tipoOperacao,
    });
    toast.success("Cálculos realizados com sucesso!");
  };

  return (
    <form onSubmit={handleCalculate} className="space-y-6">
      <div className="space-y-3 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold uppercase text-primary">Presets Realistas (Mercado BR)</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" size="sm" className="text-[10px] h-8 font-bold" onClick={() => applyPreset('simples')}>SIMPLES (ME)</Button>
            <Button type="button" variant="outline" size="sm" className="text-[10px] h-8 font-bold text-accent border-accent/30" onClick={() => applyPreset('hibrido')}>SIMPLES HÍBRIDO</Button>
            <Button type="button" variant="outline" size="sm" className="text-[10px] h-8 font-bold text-blue-500 border-blue-500/30" onClick={() => applyPreset('presumido')}>L. PRESUMIDO (EPP)</Button>
            <Button type="button" variant="outline" size="sm" className="text-[10px] h-8 font-bold text-success border-success/30" onClick={() => applyPreset('real')}>LUCRO REAL</Button>
        </div>
        <p className="text-[9px] text-muted-foreground italic">Configurações baseadas em custos reais de empresas brasileiras.</p>
      </div>

      <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={disabled || isProfitMarginInvalid || maxProfitMargin <= 0}>
        <Calculator className="h-4 w-4 mr-2" /> Gerar Relatório
      </Button>

      <div className="space-y-4 border-t border-border pt-4">
        <h3 className="font-bold text-lg">1. Contexto da Empresa</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="faturamento12Meses">Faturamento 12 Meses (R$)</Label>
            <Input id="faturamento12Meses" type="number" step="0.01" value={faturamento12Meses} onChange={(e) => setFaturamento12Meses(e.target.value)} disabled={disabled} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipoOperacao">Tipo de Operação</Label>
            <Select onValueChange={(value: 'Varejo' | 'Atacado') => setTipoOperacao(value)} value={tipoOperacao} disabled={disabled}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Varejo">Varejo (Consumidor Final)</SelectItem>
                <SelectItem value="Atacado">Atacado (Revenda)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <Label className="font-bold text-lg">2. Regime Tributário</Label>
        <Select onValueChange={(value: TaxRegime) => {
          setTaxRegime(value);
          if (value !== TaxRegime.SimplesNacional) setGenerateIvaCredit(false);
        }} value={taxRegime} disabled={disabled}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TaxRegime.SimplesNacional}>Simples Nacional</SelectItem>
            <SelectItem value={TaxRegime.LucroPresumido}>Lucro Presumido</SelectItem>
            <SelectItem value={TaxRegime.LucroReal}>Lucro Real</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6 border-t border-border pt-4">
        <h3 className="font-bold text-lg">3. Impostos e Transição</h3>
        <div className="space-y-3 rounded-md border p-4 bg-muted/20">
          <Label className="font-semibold">Alíquotas do Regime</Label>
          {taxRegime === TaxRegime.SimplesNacional && (
            <>
              <div className="space-y-2">
                <Label>Anexo</Label>
                <Select onValueChange={setAnexoSimples} value={anexoSimples} disabled={disabled}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Anexo I">Anexo I - Comércio</SelectItem>
                    <SelectItem value="Anexo II">Anexo II - Indústria</SelectItem>
                    <SelectItem value="Anexo III">Anexo III - Serviços</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alíquota Simples (%)</Label>
                <Input type="number" step="0.01" value={simplesNacionalRate} onChange={(e) => setSimplesNacionalRate(e.target.value)} disabled={disabled} readOnly={true} />
              </div>
              <div className="flex items-center justify-between pt-2">
                <Label className="text-xs">Gerar Crédito IVA (Simples Híbrido)</Label>
                <Switch checked={generateIvaCredit} onCheckedChange={setGenerateIvaCredit} disabled={disabled} />
              </div>
            </>
          )}
          {taxRegime === TaxRegime.LucroPresumido && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>IRPJ (%)</Label><Input type="number" step="0.01" value={irpjRate} onChange={(e) => setIrpjRate(e.target.value)} disabled={disabled} /></div>
              <div className="space-y-2"><Label>CSLL (%)</Label><Input type="number" step="0.01" value={csllRate} onChange={(e) => setCsllRate(e.target.value)} disabled={disabled} /></div>
            </div>
          )}
          {taxRegime === TaxRegime.LucroReal && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>IRPJ LR (%)</Label><Input type="number" step="0.01" value={irpjRateLucroReal} onChange={(e) => setIrpjRateLucroReal(e.target.value)} disabled={disabled} /></div>
              <div className="space-y-2"><Label>CSLL LR (%)</Label><Input type="number" step="0.01" value={csllRateLucroReal} onChange={(e) => setCsllRateLucroReal(e.target.value)} disabled={disabled} /></div>
            </div>
          )}
        </div>

        {(taxRegime !== TaxRegime.SimplesNacional || generateIvaCredit) && (
          <div className="space-y-3 rounded-md border p-4">
            <Label className="font-semibold">Reforma (IBS/CBS)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>CBS (%)</Label><Input type="number" value={cbsRate} onChange={(e) => setCbsRate(e.target.value)} disabled={disabled} /></div>
              <div className="space-y-2"><Label>IBS (%)</Label><Input type="number" value={ibsRate} onChange={(e) => setIbsRate(e.target.value)} disabled={disabled} /></div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <Label className="font-bold text-lg">4. Lucro Líquido Alvo (%)</Label>
        <Input type="number" value={profitMargin} onChange={(e) => setProfitMargin(e.target.value)} disabled={disabled} />
        <MaxProfitIndicator maxProfit={maxProfitMargin} currentProfit={currentProfit} isInvalid={isProfitMarginInvalid} />
      </div>

      <div className="space-y-6 border-t border-border pt-4">
        <h3 className="font-bold text-lg">5. Custos Fixos Detalhados</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Folha Total (R$)</Label><Input type="number" value={payroll} onChange={(e) => setPayroll(e.target.value)} disabled={disabled} /></div>
          <div className="space-y-2"><Label>Estoque Total (Unid)</Label><Input type="number" value={totalStockUnits} onChange={(e) => setTotalStockUnits(e.target.value)} disabled={disabled} /></div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><Label>Outros Custos Fixos</Label><Button type="button" size="sm" variant="outline" onClick={() => setFixedExpenses([...fixedExpenses, { name: "", value: 0 }])} disabled={disabled}><Plus className="h-4 w-4" /></Button></div>
          {fixedExpenses.map((exp, idx) => (
            <div key={idx} className="flex gap-2">
              <Input placeholder="Despesa" value={exp.name} onChange={(e) => { const n = [...fixedExpenses]; n[idx].name = e.target.value; setFixedExpenses(n); }} disabled={disabled} />
              <Input type="number" value={exp.value} onChange={(e) => { const n = [...fixedExpenses]; n[idx].value = parseFloat(e.target.value) || 0; setFixedExpenses(n); }} disabled={disabled} />
              <Button type="button" size="icon" variant="ghost" onClick={() => setFixedExpenses(fixedExpenses.filter((_, i) => i !== idx))} disabled={disabled}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <h3 className="font-bold text-lg">6. Despesas Variáveis</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><Label>Taxas e Comissões (%)</Label><Button type="button" size="sm" variant="outline" onClick={() => setVariableExpenses([...variableExpenses, { name: "", percentage: 0 }])} disabled={disabled}><Plus className="h-4 w-4" /></Button></div>
          {variableExpenses.map((exp, idx) => (
            <div key={idx} className="flex gap-2">
              <Input placeholder="Ex: Taxa Cartão" value={exp.name} onChange={(e) => { const n = [...variableExpenses]; n[idx].name = e.target.value; setVariableExpenses(n); }} disabled={disabled} />
              <Input type="number" value={exp.percentage} onChange={(e) => { const n = [...variableExpenses]; n[idx].percentage = parseFloat(e.target.value) || 0; setVariableExpenses(n); }} disabled={disabled} />
              <Button type="button" size="icon" variant="ghost" onClick={() => setVariableExpenses(variableExpenses.filter((_, i) => i !== idx))} disabled={disabled}><Trash2 className="h-4 w-4" /></Button>
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