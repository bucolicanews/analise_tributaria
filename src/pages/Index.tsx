import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Index = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="empresa" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="contador">Contador</TabsTrigger>
          <TabsTrigger value="fisco">Fisco</TabsTrigger>
        </TabsList>
        <TabsContent value="empresa">
          <div className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">1️⃣ Obrigações da Empresa com a Própria Empresa</CardTitle>
                <CardDescription>Rotina interna obrigatória para manter a empresa regular e organizada. Essas obrigações decorrem principalmente de normas do Código Civil, Código Tributário Nacional, Lei das S.A., Legislação Trabalhista (CLT) e Legislação Fiscal.</CardDescription>
              <Button asChild variant="outline">
                        <a href="https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=resumo&tipoConteudo=7PhJ+gAVw2g=" target="_blank" rel="noopener noreferrer">
                          Consultra NF-e (DONWLOADS)
                        </a>
                      </Button>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>📂 1.1 Guarda e organização de documentos fiscais</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2 text-sm text-muted-foreground">Obrigatório conforme Art. 195 do CTN.</p>
                      <p className="font-semibold">A empresa deve:</p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        <li>Guardar XML das NF-e de compras por no mínimo 5 anos</li>
                        <li>Guardar XML das NF-e de vendas por 5 anos</li>
                        <li>Guardar XML de CT-e (fretes)</li>
                        <li>Guardar XML de NFS-e (serviços)</li>
                        <li>Também deve guardar: contratos, recibos, comprovantes bancários, extratos, guias de impostos, folha de pagamento.</li>
                      </ul>
                      <p className="mt-2 text-red-500">⚠️ Prazo mínimo: 5 anos + ano corrente</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>📊 1.2 Controle correto das operações fiscais</AccordionTrigger>
                    <AccordionContent>
                      <p className="font-semibold">A empresa deve:</p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        <li>Importar todas as notas de compra no sistema</li>
                        <li>Emitir nota fiscal para todas as vendas</li>
                        <li>Emitir nota fiscal de serviços</li>
                        <li>Registrar devoluções</li>
                        <li>Registrar cancelamentos</li>
                        <li>Registrar perdas de estoque</li>
                        <li>Registrar bonificações</li>
                        <li>Registrar transferências de estoque</li>
                        <li>Registrar consumo interno</li>
                        <li>Registrar brindes</li>
                      </ul>
                      <p className="mt-2 text-sm text-muted-foreground">Base legal: Convênios ICMS e legislação municipal de ISS</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>📦 1.3 Controle de estoque</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2 font-semibold">Obrigatório principalmente para:</p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        <li>Lucro Presumido</li>
                        <li>Lucro Real</li>
                        <li>Empresas industriais</li>
                        <li>Empresas com substituição tributária</li>
                      </ul>
                      <p className="mt-2 font-semibold">A empresa deve ter:</p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        <li>Inventário anual</li>
                        <li>Controle de entradas e saídas</li>
                        <li>Controle de perdas e devoluções</li>
                        <li>Custo médio ou FIFO</li>
                        <li>Rastreabilidade dos produtos</li>
                      </ul>
                      <p className="mt-2 text-sm text-muted-foreground">Base legal: RIR/2018, SPED Fiscal</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>📑 1.4 Cadastro correto de produtos</AccordionTrigger>
                    <AccordionContent>
                      <p className="font-semibold">Todo produto deve possuir:</p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        <li>NCM correto</li>
                        <li>CFOP correto</li>
                        <li>CST ICMS, PIS e COFINS</li>
                        <li>CEST quando houver</li>
                        <li>Unidade de medida</li>
                        <li>Alíquota de ICMS</li>
                        <li>Situação tributária</li>
                      </ul>
                      <p className="mt-2 font-semibold text-red-500">Erro de cadastro pode gerar: multa, imposto pago errado, autuação fiscal.</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-5">
                    <AccordionTrigger>📊 1.5 Controle financeiro</AccordionTrigger>
                    <AccordionContent>
                      <p className="font-semibold">A empresa deve manter controle de:</p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        <li>Contas a pagar e a receber</li>
                        <li>Fluxo de caixa</li>
                        <li>Extrato bancário, movimentação de cartão, PIX, boletos</li>
                        <li>Financiamentos</li>
                      </ul>
                      <p className="mt-2 font-semibold">Importante:</p>
                      <p className="text-red-500">⚠️ Receita financeira precisa bater com notas emitidas</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-6">
                    <AccordionTrigger>⚠️ 1.6 Separação pessoa física x pessoa jurídica</AccordionTrigger>
                    <AccordionContent>
                      <p className="font-semibold">A empresa deve:</p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        <li>Não misturar contas bancárias</li>
                        <li>Não pagar despesas pessoais com conta da empresa</li>
                        <li>Não receber vendas no CPF</li>
                        <li>Não comprar mercadorias no CPF</li>
                      </ul>
                      <p className="mt-2 text-sm text-muted-foreground">Base legal: Princípio da entidade – NBC TG Estrutura Conceitual</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-7">
                    <AccordionTrigger>👥 1.7 Obrigações trabalhistas internas</AccordionTrigger>
                    <AccordionContent>
                      <p className="font-semibold">A empresa deve:</p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        <li>Registrar funcionários na CTPS e no eSocial</li>
                        <li>Controlar jornada de trabalho, horas extras e banco de horas</li>
                        <li>Controlar férias, atestados e afastamentos</li>
                      </ul>
                       <p className="mt-2 text-sm text-muted-foreground">Base legal: CLT</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-8">
                    <AccordionTrigger>📅 1.8 Controle de prazos de impostos</AccordionTrigger>
                    <AccordionContent>
                      <p className="font-semibold">A empresa deve acompanhar:</p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        <li>Vencimento de DAS, ICMS, ISS, INSS, FGTS</li>
                      </ul>
                      <p className="mt-2 font-semibold">Evita: multas, juros, bloqueio de CND.</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-9">
                    <AccordionTrigger>📦 1.9 Controle de fornecedores</AccordionTrigger>
                    <AccordionContent>
                       <p className="font-semibold">A empresa deve verificar:</p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        <li>CNPJ ativo</li>
                        <li>Inscrição estadual</li>
                        <li>Regime tributário</li>
                        <li>Se o fornecedor emite nota fiscal</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-10">
                    <AccordionTrigger>🚫 1.10 Proibições importantes</AccordionTrigger>
                    <AccordionContent>
                      <p className="font-semibold">A empresa não deve:</p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        <li>Vender sem nota</li>
                        <li>Comprar sem nota</li>
                        <li>Ter funcionário sem registro</li>
                        <li>Emitir nota com valor inferior</li>
                        <li>Emitir nota para CPF para ocultar receita</li>
                        <li>Manipular estoque</li>
                      </ul>
                      <p className="mt-2 font-semibold">Isso configura: sonegação, crime tributário (Lei 8137/90).</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Checklist de Conformidade</CardTitle>
                <CardDescription>Marque os itens que sua empresa já cumpre.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2"><Checkbox id="check-1" /><label htmlFor="check-1">Guarda e organização de documentos fiscais</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="check-2" /><label htmlFor="check-2">Controle correto das operações fiscais</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="check-3" /><label htmlFor="check-3">Controle de estoque</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="check-4" /><label htmlFor="check-4">Cadastro correto de produtos</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="check-5" /><label htmlFor="check-5">Controle financeiro</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="check-6" /><label htmlFor="check-6">Separação pessoa física x pessoa jurídica</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="check-7" /><label htmlFor="check-7">Obrigações trabalhistas internas</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="check-8" /><label htmlFor="check-8">Controle de prazos de impostos</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="check-9" /><label htmlFor="check-9">Controle de fornecedores</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="check-10" /><label htmlFor="check-10">Conformidade com proibições (não sonegar)</label></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="contador">
          <div className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">2️⃣ Obrigações da Empresa com o Contador</CardTitle>
                <CardDescription>A contabilidade depende 100% das informações da empresa. Sem isso, o contador não consegue cumprir obrigações fiscais.</CardDescription>
              <Button asChild variant="outline">
                        <a href="https://www.nfe.fazenda.gov.br/portal/manifestacaoDestinatario.aspx?tipoConteudo=o9MkXc+hmKs=" target="_blank" rel="noopener noreferrer">
                          Portal da Manifestação
                        </a>
                      </Button>
              
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>📊 SETOR FISCAL</AccordionTrigger>
                    <AccordionContent>
                      <h4 className="font-semibold text-md mb-2">📅 Informações mensais obrigatórias (enviar até dia 5 do mês seguinte):</h4>
                      <ul className="list-disc list-inside space-y-1 mb-4">
                        <li>XML de notas de venda e compra</li>
                        <li>XML de serviços tomados e prestados</li>
                        <li>Notas de devolução, canceladas e de remessa</li>
                      </ul>

                      <h4 className="font-semibold text-md mb-2">📄 Informações adicionais:</h4>
                      <ul className="list-disc list-inside space-y-1 mb-4">
                        <li>Extrato bancário e de cartão</li>
                        <li>Relatório de vendas por PIX</li>
                        <li>Controle de estoque e contratos de serviços</li>
                      </ul>

                      <h4 className="font-semibold text-md mb-2">📢 Comunicação de operações especiais (avisar antes):</h4>
                      <ul className="list-disc list-inside space-y-1 mb-4">
                        <li>Importar ou exportar mercadoria</li>
                        <li>Abrir ou fechar filial</li>
                        <li>Comprar veículo ou vender ativo</li>
                        <li>Contratar serviço de outra cidade</li>
                      </ul>

                      <h4 className="font-semibold text-md mb-2">📌 Manifestação de notas fiscais:</h4>
                     <p className="text-sm text-muted-foreground mb-2">Realizar confirmação, ciência, desconhecimento ou se a operação não foi realizada para evitar fraudes. Acesse o portal:</p>
                      
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger>📊 SETOR CONTÁBIL</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2 text-sm text-muted-foreground">Quando a empresa contrata contabilidade completa, deve enviar:</p>
                      <h4 className="font-semibold text-md mb-2">Mensalmente:</h4>
                      <ul className="list-disc list-inside space-y-1 mb-4">
                        <li>Extrato bancário e fluxo de caixa</li>
                        <li>Contas a pagar e a receber</li>
                        <li>Movimentação de cartão e empréstimos</li>
                      </ul>
                      <h4 className="font-semibold text-md mb-2">Anualmente:</h4>
                       <ul className="list-disc list-inside space-y-1">
                        <li>Inventário de estoque</li>
                        <li>Lista de bens (veículos, máquinas, imóveis, etc.)</li>
                        <li>Investimentos</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger>👥 SETOR DE FOLHA</AccordionTrigger>
                    <AccordionContent>
                      <h4 className="font-semibold text-md mb-2">Admissão (enviar):</h4>
                      <ul className="list-disc list-inside space-y-1 mb-4">
                        <li>Documentos pessoais (RG, CPF, etc.)</li>
                        <li>Dados bancários</li>
                      </ul>
                      <h4 className="font-semibold text-md mb-2">Mensalmente (enviar até dia 20):</h4>
                       <ul className="list-disc list-inside space-y-1">
                        <li>Informar faltas, atrasos, horas extras</li>
                        <li>Informar férias, afastamentos e rescisões</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger>📄 OUTRAS INFORMAÇÕES IMPORTANTES</AccordionTrigger>
                    <AccordionContent>
                      <p className="font-semibold">Comunicar imediatamente ao contador sobre:</p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        <li>Alteração contratual</li>
                        <li>Mudança de endereço ou atividade</li>
                        <li>Abertura ou fechamento de filial</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Checklist de Comunicação com o Contador</CardTitle>
                <CardDescription>Marque os itens que sua empresa já enviou ou comunicou.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2"><Checkbox id="check-contador-1" /><label htmlFor="check-contador-1">Envio de documentos fiscais mensais (XMLs)</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="check-contador-2" /><label htmlFor="check-contador-2">Envio de documentos financeiros (extratos, etc)</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="check-contador-3" /><label htmlFor="check-contador-3">Envio de informações da folha (admissões, eventos)</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="check-contador-4" /><label htmlFor="check-contador-4">Comunicação de operações especiais (importação, etc)</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="check-contador-5" /><label htmlFor="check-contador-5">Realização da manifestação de notas fiscais</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="check-contador-6" /><label htmlFor="check-contador-6">Comunicação de alterações (endereço, atividade, etc)</label></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="fisco">
          <div className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">3️⃣ Obrigações da Empresa com o Fisco</CardTitle>
                <CardDescription>São as chamadas obrigações acessórias, que variam conforme o regime tributário.</CardDescription>
               <Button asChild variant="outline">
                        <a href="https://solucoes.receita.fazenda.gov.br/Servicos/cnpjreva/Cnpjreva_Solicitacao.asp" target="_blank" rel="noopener noreferrer">
                          Consultra CNPJ
                        </a>
                      </Button>
                       <Button asChild variant="outline">
                        <a href="https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=resumo&tipoConteudo=7PhJ+gAVw2g=" target="_blank" rel="noopener noreferrer">
                          Consultra NF-e
                        </a>
                            </Button>
                             <Button asChild variant="outline">
                        <a href="https://app.sefa.pa.gov.br/consulta-estabelecimento/index.action" target="_blank" rel="noopener noreferrer">
                          Consultar Estabelecimento  
                        </a>
                            </Button>

                             <Button asChild variant="outline">
                        <a href="https://app.sefa.pa.gov.br/consulta-fic/" target="_blank" rel="noopener noreferrer">
                          Consultar Inscrição Estadual
                        </a>
                            </Button>

                                   <Button asChild variant="outline">
                        <a href="https://www.gov.br/pt-br/servicos/apurar-carne-leao" target="_blank" rel="noopener noreferrer">
                         Carnê Leão
                        </a>
                           </Button>
                           
                                      <Button asChild variant="outline">
                        <a href="https://cav.receita.fazenda.gov.br/eCAC/publico/login.aspx" target="_blank" rel="noopener noreferrer">
                        ECAC
                        </a>
                          </Button>
                          
                        <Button asChild variant="outline">
                        <a href="http://siat.belem.pa.gov.br:8081/cadastro/pages/mobiliario/externo/cadastroConsultaExterna.jsf" target="_blank" rel="noopener noreferrer">
                        Incrição Municipal
                        </a>
                            </Button>                            
              
                  </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>📊 SIMPLES NACIONAL</AccordionTrigger>
                    <AccordionContent>
                      <h4 className="font-semibold text-md mb-2">Principais obrigações:</h4>
                      <Table>
                        <TableHeader><TableRow><TableHead>Obrigação</TableHead><TableHead>Prazo</TableHead></TableRow></TableHeader>
                        <TableBody>
                          <TableRow><TableCell>DAS</TableCell><TableCell>Dia 20</TableCell></TableRow>
                          <TableRow><TableCell>PGDAS-D</TableCell><TableCell>Mensal</TableCell></TableRow>
                          <TableRow><TableCell>DEFIS</TableCell><TableCell>Até 31 de Março</TableCell></TableRow>
                          <TableRow><TableCell>eSocial</TableCell><TableCell>Mensal</TableCell></TableRow>
                          <TableRow><TableCell>FGTS</TableCell><TableCell>Dia 7</TableCell></TableRow>
                          <TableRow><TableCell>DCTFWeb</TableCell><TableCell>Mensal</TableCell></TableRow>
                        </TableBody>
                      </Table>
                      <h4 className="font-semibold text-md mt-4 mb-2">Multas:</h4>
                      <p>PGDAS atrasado → R$ 50 a R$ 500</p>
                      <p>DEFIS → R$ 200 a R$ 500</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>📊 SIMPLES HÍBRIDO</AccordionTrigger>
                    <AccordionContent>
                      <p>Empresas com comércio + serviço, retenção de INSS, ou substituição tributária podem ter obrigações adicionais como:</p>
                      <ul className="list-disc list-inside mt-2">
                        <li>SPED Fiscal</li>
                        <li>EFD Contribuições</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>📊 LUCRO PRESUMIDO</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader><TableRow><TableHead>Obrigação</TableHead><TableHead>Prazo</TableHead></TableRow></TableHeader>
                        <TableBody>
                          <TableRow><TableCell>DCTF</TableCell><TableCell>Mensal</TableCell></TableRow>
                          <TableRow><TableCell>EFD Contribuições</TableCell><TableCell>Mensal</TableCell></TableRow>
                          <TableRow><TableCell>SPED Fiscal</TableCell><TableCell>Mensal</TableCell></TableRow>
                          <TableRow><TableCell>SPED Contábil</TableCell><TableCell>Anual</TableCell></TableRow>
                          <TableRow><TableCell>ECF</TableCell><TableCell>Anual</TableCell></TableRow>
                          <TableRow><TableCell>DIRF / EFD-Reinf</TableCell><TableCell>Mensal</TableCell></TableRow>
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>📊 LUCRO REAL</AccordionTrigger>
                    <AccordionContent>
                       <Table>
                        <TableHeader><TableRow><TableHead>Obrigação</TableHead><TableHead>Prazo</TableHead></TableRow></TableHeader>
                        <TableBody>
                          <TableRow><TableCell>ECD</TableCell><TableCell>Anual</TableCell></TableRow>
                          <TableRow><TableCell>ECF</TableCell><TableCell>Anual</TableCell></TableRow>
                          <TableRow><TableCell>SPED Fiscal</TableCell><TableCell>Mensal</TableCell></TableRow>
                          <TableRow><TableCell>EFD Contribuições</TableCell><TableCell>Mensal</TableCell></TableRow>
                          <TableRow><TableCell>DCTF</TableCell><TableCell>Mensal</TableCell></TableRow>
                          <TableRow><TableCell>eSocial</TableCell><TableCell>Mensal</TableCell></TableRow>
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-5">
                    <AccordionTrigger>📊 OBRIGAÇÕES TRABALHISTAS</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader><TableRow><TableHead>Obrigação</TableHead><TableHead>Prazo</TableHead></TableRow></TableHeader>
                        <TableBody>
                          <TableRow><TableCell>FGTS</TableCell><TableCell>Dia 7</TableCell></TableRow>
                          <TableRow><TableCell>INSS</TableCell><TableCell>Dia 20</TableCell></TableRow>
                          <TableRow><TableCell>eSocial</TableCell><TableCell>Mensal</TableCell></TableRow>
                          <TableRow><TableCell>DIRF</TableCell><TableCell>Anual</TableCell></TableRow>
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                   <AccordionItem value="item-6">
                    <AccordionTrigger>⚠️ MULTAS MAIS COMUNS</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader><TableRow><TableHead>Obrigação</TableHead><TableHead>Multa</TableHead></TableRow></TableHeader>
                        <TableBody>
                          <TableRow><TableCell>SPED Fiscal</TableCell><TableCell>R$ 500 a R$ 1500</TableCell></TableRow>
                          <TableRow><TableCell>EFD Contribuições</TableCell><TableCell>R$ 500 a R$ 1500</TableCell></TableRow>
                          <TableRow><TableCell>ECD</TableCell><TableCell>R$ 500 a R$ 5000</TableCell></TableRow>
                           <TableRow><TableCell>ECF</TableCell><TableCell>Até 3% do lucro</TableCell></TableRow>
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-7">
                    <AccordionTrigger>📌 CONCLUSÃO</AccordionTrigger>
                    <AccordionContent>
                      <p className="font-semibold">A empresa precisa cuidar de 3 pilares:</p>
                      <ul className="list-decimal list-inside space-y-1 mt-2">
                        <li>Organização interna</li>
                        <li>Envio correto de informações ao contador</li>
                        <li>Cumprimento das obrigações fiscais</li>
                      </ul>
                      <p className="mt-2">Se um desses falhar → surgem:</p>
                      <ul className="list-disc list-inside text-red-500 space-y-1 mt-2">
                        <li>Multas</li>
                        <li>Autuações</li>
                        <li>Impostos errados</li>
                        <li>Problemas fiscais</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Checklist de Conformidade Fiscal</CardTitle>
                <CardDescription>Marque as obrigações que sua empresa já entregou.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2"><Checkbox id="check-fisco-1" /><label htmlFor="check-fisco-1">PGDAS-D (Simples Nacional)</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="check-fisco-2" /><label htmlFor="check-fisco-2">DEFIS (Simples Nacional)</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="check-fisco-3" /><label htmlFor="check-fisco-3">DCTF (Lucro Presumido/Real)</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="check-fisco-4" /><label htmlFor="check-fisco-4">EFD Contribuições (Presumido/Real)</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="check-fisco-5" /><label htmlFor="check-fisco-5">SPED Fiscal (Presumido/Real)</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="check-fisco-6" /><label htmlFor="check-fisco-6">ECF / ECD (Presumido/Real)</label></div>
                <div className="flex items-center space-x-2"><Checkbox id="check-fisco-7" /><label htmlFor="check-fisco-7">eSocial / DCTFWeb (Todos)</label></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
