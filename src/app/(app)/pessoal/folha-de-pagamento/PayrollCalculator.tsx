
'use client';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompany } from '@/hooks/use-company';
import { Funcionario, Rubrica, CalculationResult, SavedCalculation } from '@/types/pessoal';
import { Loader2, Calculator, Save, FileDown, Plus, Trash2, Check, ChevronsUpDown, Calendar as CalendarIcon, Info } from 'lucide-react';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead, TableFooter } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MoneyInput } from '@/components/ui/money-input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const inssBrackets = [
    { limit: 1412.00, rate: 0.075, deduction: 0 },
    { limit: 2666.68, rate: 0.09, deduction: 21.18 },
    { limit: 4000.03, rate: 0.12, deduction: 101.18 },
    { limit: 7786.02, rate: 0.14, deduction: 181.18 },
];
const inssTeto = 908.85; // Valor máximo de contribuição

const irrfBrackets = [
    { limit: 2259.20, rate: 0, deduction: 0 },
    { limit: 2826.65, rate: 0.075, deduction: 169.44 },
    { limit: 3751.05, rate: 0.15, deduction: 381.44 },
    { limit: 4664.68, rate: 0.225, deduction: 662.77 },
    { limit: Infinity, rate: 0.275, deduction: 896.00 },
];
const irrfSimplifiedDeduction = 564.80; // R$ 528.00 em 2023, atualizado para R$ 564,80 em 2024
const irrfDependenteDeduction = 189.59;


export default function PayrollCalculator() {
    const { toast } = useToast();
    const { useScopedData, companies, currentCompany } = useCompany();
    const [funcionarios] = useScopedData<Funcionario[]>('cadastros-funcionarios', []);
    const [rubricas] = useScopedData<Rubrica[]>('cadastros-rubricas', []);
    const [savedCalculations, setSavedCalculations] = useScopedData<SavedCalculation[]>('pessoal-calculos-salvos', []);

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [competenceDate, setCompetenceDate] = useState<Date | undefined>(new Date());
    const [openEmployeeSelector, setOpenEmployeeSelector] = useState(false);
    
    const [faltas, setFaltas] = useState(0);
    const [horasExtras50, setHorasExtras50] = useState(0);
    const [horasExtras100, setHorasExtras100] = useState(0);
    const [domingosFeriados, setDomingosFeriados] = useState(4);

    const [manualProventos, setManualProventos] = useState<Rubrica[]>([]);
    const [manualDescontos, setManualDescontos] = useState<Rubrica[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [calculation, setCalculation] = useState<CalculationResult | null>(null);

    const activeCompany = useMemo(() => companies.find(c => c.id === currentCompany), [companies, currentCompany]);
    const selectedEmployee = useMemo(() => funcionarios.find(f => f.id.toString() === selectedEmployeeId), [funcionarios, selectedEmployeeId]);

    const handleAddRubrica = (type: 'provento' | 'desconto') => {
        const newRubrica: Rubrica = { id: Date.now(), codigo: 'MANUAL', descricao: '', tipo: type === 'provento' ? 'Provento' : 'Desconto', incidencias: {inss: false, irrf: false, fgts: false, contribuicaoSindical: false}, value: 0 };
        if (type === 'provento') {
            setManualProventos(prev => [...prev, newRubrica]);
        } else {
            setManualDescontos(prev => [...prev, newRubrica]);
        }
    };
    const handleUpdateRubricaValue = (id: number, type: 'provento' | 'desconto', value: number) => {
        const updater = (prev: Rubrica[]) => prev.map(r => r.id === id ? { ...r, value } : r);
        if (type === 'provento') setManualProventos(updater);
        else setManualDescontos(updater);
    };

    const handleSelectRubrica = (id: number, type: 'provento' | 'desconto', rubricaId: string) => {
        const selectedRubrica = rubricas.find(r => r.id.toString() === rubricaId);
        if (!selectedRubrica) return;
        const updater = (prev: Rubrica[]) => prev.map(r => r.id === id ? { ...r, ...selectedRubrica, id: r.id } : r);
        if (type === 'provento') setManualProventos(updater);
        else setManualDescontos(updater);
    }
    
    const handleRemoveRubrica = (id: number, type: 'provento' | 'desconto') => {
        const remover = (prev: Rubrica[]) => prev.filter(r => r.id !== id);
        if (type === 'provento') setManualProventos(remover);
        else setManualDescontos(remover);
    };
    
    const clearForm = () => {
        setFaltas(0);
        setHorasExtras50(0);
        setHorasExtras100(0);
        setDomingosFeriados(4);
        setManualProventos([]);
        setManualDescontos([]);
        setCalculation(null);
    }

    const handleCalculate = () => {
        if (!selectedEmployee) {
            toast({ variant: 'destructive', title: 'Funcionário não selecionado', description: 'Selecione um funcionário para calcular a folha.' });
            return;
        }
        setIsLoading(true);
        setCalculation(null);

        setTimeout(() => {
            const salarioBase = selectedEmployee.salario;
            const diasUteis = 26; // Simplificação para dias úteis no mês
            const diasMes = diasUteis + domingosFeriados; // Total de dias considerados
            
            // Cálculo de Faltas e Horas Extras
            const valorDia = salarioBase / diasMes;
            const descontoFaltas = valorDia * faltas;

            const valorHora = salarioBase / 220; // Carga horária padrão
            const valorHE50 = valorHora * 1.5 * horasExtras50;
            const valorHE100 = valorHora * 2 * horasExtras100;
            const valorTotalHE = valorHE50 + valorHE100;

            // Cálculo DSR sobre Horas Extras
            const dsr = (valorTotalHE / diasUteis) * domingosFeriados;
            
            // Base de Cálculo INSS
            const totalProventosSemManuais = salarioBase - descontoFaltas + valorTotalHE + dsr;
            const totalManualProventos = manualProventos.reduce((acc, p) => acc + (p.value || 0), 0);
            const baseInss = totalProventosSemManuais + totalManualProventos;

            // Cálculo INSS
            let inss = 0;
            for (const bracket of inssBrackets) {
                if (baseInss <= bracket.limit) {
                    inss = (baseInss * bracket.rate) - bracket.deduction;
                    break;
                }
            }
            inss = Math.min(parseFloat(inss.toFixed(2)), inssTeto);

            // Base de Cálculo IRRF
            const numDependentes = selectedEmployee.dependentes?.length || 0;
            const deducaoDependentes = numDependentes * irrfDependenteDeduction;
            const baseIrrf = baseInss - inss - deducaoDependentes;

            // Cálculo IRRF (considerando dedução padrão vs simplificada)
            let irrf = 0;
            let irrfPadrao = 0;
            for (const bracket of irrfBrackets) {
                if (baseIrrf <= bracket.limit) {
                    irrfPadrao = (baseIrrf * bracket.rate) - bracket.deduction;
                    break;
                }
            }
            
            const baseIrrfSimplificada = baseInss - irrfSimplifiedDeduction;
            let irrfSimplificado = 0;
            for (const bracket of irrfBrackets) {
                if (baseIrrfSimplificada <= bracket.limit) {
                    irrfSimplificado = (baseIrrfSimplificada * bracket.rate) - bracket.deduction;
                    break;
                }
            }
            irrf = Math.max(0, parseFloat(Math.min(irrfPadrao, irrfSimplificado).toFixed(2)));
            
            // Montagem do resultado
            const proventos: Rubrica[] = [
                { id: 1, codigo: '101', descricao: 'Salário Base', tipo: 'Provento', value: salarioBase, incidencias: { inss: true, irrf: true, fgts: true, contribuicaoSindical: false } },
            ];
            if (valorHE50 > 0) proventos.push({ id: 2, codigo: '102', descricao: `Horas Extras 50% (${horasExtras50}h)`, tipo: 'Provento', value: valorHE50, incidencias: { inss: true, irrf: true, fgts: true, contribuicaoSindical: false } });
            if (valorHE100 > 0) proventos.push({ id: 3, codigo: '103', descricao: `Horas Extras 100% (${horasExtras100}h)`, tipo: 'Provento', value: valorHE100, incidencias: { inss: true, irrf: true, fgts: true, contribuicaoSindical: false } });
            if (dsr > 0) proventos.push({ id: 4, codigo: '104', descricao: 'D.S.R. sobre Horas Extras', tipo: 'Provento', value: dsr, incidencias: { inss: true, irrf: true, fgts: true, contribuicaoSindical: false } });
            proventos.push(...manualProventos.filter(p => p.value || 0 > 0));

            const descontos: Rubrica[] = [];
            if (descontoFaltas > 0) descontos.push({ id: 101, codigo: '201', descricao: `Faltas (${faltas} dias)`, tipo: 'Desconto', value: descontoFaltas, incidencias: { inss: true, irrf: true, fgts: true, contribuicaoSindical: false } });
            if (inss > 0) descontos.push({ id: 102, codigo: '202', descricao: 'INSS', tipo: 'Desconto', value: inss, incidencias: { inss: false, irrf: false, fgts: false, contribuicaoSindical: false } });
            if (irrf > 0) descontos.push({ id: 103, codigo: '203', descricao: 'IRRF', tipo: 'Desconto', value: irrf, incidencias: { inss: false, irrf: false, fgts: false, contribuicaoSindical: false } });
            descontos.push(...manualDescontos.filter(d => d.value || 0 > 0));

            const totalProventos = proventos.reduce((acc, p) => acc + (p.value || 0), 0);
            const totalDescontos = descontos.reduce((acc, d) => acc + (d.value || 0), 0);
            const liquido = totalProventos - totalDescontos;
            
            setCalculation({
                proventos,
                descontos,
                totalProventos,
                totalDescontos,
                liquido,
                baseInss,
                baseIrrf,
            });

            setIsLoading(false);
        }, 500);
    };

    const handleSaveCalculation = () => {
        if (!calculation || !selectedEmployee || !competenceDate) {
            toast({ variant: 'destructive', title: 'Cálculo incompleto', description: 'Realize um cálculo e selecione um funcionário/competência antes de salvar.' });
            return;
        }

        const newSavedCalc: SavedCalculation = {
            id: Date.now(),
            type: 'Folha',
            date: new Date().toISOString(),
            mesCompetencia: format(competenceDate, 'MM/yyyy'),
            employeeId: selectedEmployeeId,
            employeeName: selectedEmployee.nome,
            netValue: calculation.liquido,
            faltas,
            horasExtras50,
            horasExtras100,
            manualProventos,
            manualDescontos,
            calculation,
        };

        setSavedCalculations(prev => [newSavedCalc, ...prev]);
        toast({ title: 'Cálculo Salvo!', description: 'O resultado foi salvo no histórico de cálculos.' });
        clearForm();
    };

    const handleGeneratePdf = () => {
        if (!calculation || !selectedEmployee || !activeCompany || !competenceDate) {
           toast({ variant: 'destructive', title: 'Dados insuficientes', description: 'Realize um cálculo e selecione um funcionário para gerar o PDF.' });
           return;
       }
       const doc = new jsPDF();
       const pageMargin = 15;
       let finalY = 20;

       if (activeCompany.data?.logo) {
           try { doc.addImage(activeCompany.data.logo, 'PNG', pageMargin, finalY - 10, 20, 20); } 
           catch (e) { console.error("Error adding logo to PDF:", e); }
       }
       
       doc.setFontSize(16);
       doc.setFont('helvetica', 'bold');
       doc.text('Recibo de Pagamento de Salário', doc.internal.pageSize.width - pageMargin, finalY, { align: 'right' });
       doc.setFontSize(11);
       doc.setFont('helvetica', 'normal');
       doc.text(`Competência: ${format(competenceDate, 'MM/yyyy', { locale: ptBR })}`, doc.internal.pageSize.width - pageMargin, finalY + 8, { align: 'right' });

       finalY += 30;

       autoTable(doc, {
           startY: finalY,
           theme: 'plain',
           styles: { fontSize: 9, cellPadding: 1, overflow: 'linebreak' },
           body: [
               [{ content: 'Empresa Pagadora', styles: { fontStyle: 'bold' } }, { content: 'Funcionário', styles: { fontStyle: 'bold' } }],
               [`${activeCompany.data?.razaoSocial || activeCompany.name}`, `Nome: ${selectedEmployee.nome}`],
               [`CNPJ: ${activeCompany.data?.cnpj || ''}`, `Cargo: ${selectedEmployee.cargo || 'N/A'}`],
               [`Endereço: ${activeCompany.data?.logradouro || ''}, ${activeCompany.data?.numero || ''}`, `Data de Admissão: ${format(new Date(selectedEmployee.dataAdmissao), 'dd/MM/yyyy')}`],
           ],
       });
       finalY = (doc as any).lastAutoTable.finalY + 8;
       
       const mainTableBody = calculation.proventos.map(p => [
           p.codigo,
           p.descricao,
           '', // referência
           formatCurrencyNoSymbol(p.value || 0),
           ''
       ]);
       calculation.descontos.forEach(d => mainTableBody.push([
           d.codigo,
           d.descricao,
           '', // referência
           '',
           formatCurrencyNoSymbol(d.value || 0)
       ]));

       autoTable(doc, {
           startY: finalY,
           head: [['Cód.', 'Descrição', 'Referência', 'Proventos', 'Descontos']],
           body: mainTableBody,
           theme: 'striped',
           headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 9 },
           bodyStyles: { fontSize: 8 },
           columnStyles: {
               0: { cellWidth: 15 },
               1: { cellWidth: 'auto' },
               2: { halign: 'right', cellWidth: 20 },
               3: { halign: 'right', cellWidth: 30, textColor: [22, 163, 74] },
               4: { halign: 'right', cellWidth: 30, textColor: [220, 38, 38] }
           }
       });
       finalY = (doc as any).lastAutoTable.finalY;
       
       autoTable(doc, {
           startY: finalY,
           theme: 'grid',
           body: [
               [
                   { content: 'Totais:', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
                   { content: formatCurrencyNoSymbol(calculation.totalProventos), styles: { halign: 'right', fontStyle: 'bold', textColor: [22, 163, 74] } },
                   { content: formatCurrencyNoSymbol(calculation.totalDescontos), styles: { halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] } },
               ],
               [
                   { content: 'Líquido a Receber:', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', fillColor: [236, 240, 241], cellPadding: 2 } },
                   { content: formatCurrency(calculation.liquido), styles: { halign: 'right', fontStyle: 'bold', fontSize: 11, fillColor: [236, 240, 241], cellPadding: 2 } },
               ]
           ],
           bodyStyles: { fontSize: 9 },
       });
       finalY = (doc as any).lastAutoTable.finalY + 8;
       
       autoTable(doc, {
           startY: finalY,
           theme: 'plain',
           styles: { fontSize: 7, cellPadding: 0.5 },
           body: [
               [`Salário Base: ${formatCurrency(selectedEmployee.salario)}`, `Base INSS: ${formatCurrency(calculation.baseInss)}`, `Base FGTS: ${formatCurrency(calculation.baseInss)}`, `Base IRRF: ${formatCurrency(calculation.baseIrrf)}`],
           ],
       });
       finalY = (doc as any).lastAutoTable.finalY + 15;

       doc.setFontSize(8);
       doc.text('__________________________________________________', doc.internal.pageSize.width / 2, finalY, { align: 'center' });
       doc.text(selectedEmployee.nome, doc.internal.pageSize.width / 2, finalY + 5, { align: 'center' });

       doc.save(`Holerite_${selectedEmployee.nome.replace(/\s/g, '_')}_${format(competenceDate, 'MM_yyyy')}.pdf`);
       toast({ title: 'PDF Gerado!', description: 'O holerite foi salvo com sucesso.' });
   }
    
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatCurrencyNoSymbol = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });


    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Parâmetros de Cálculo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="employee">Empregado</Label>
                                <Popover open={openEmployeeSelector} onOpenChange={setOpenEmployeeSelector}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" aria-expanded={openEmployeeSelector} className="w-full justify-between">
                                            {selectedEmployeeId ? funcionarios.find((f) => f.id.toString() === selectedEmployeeId)?.nome : "Selecione..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command><CommandInput placeholder="Pesquisar..." /><CommandList><CommandEmpty>Nenhum funcionário.</CommandEmpty><CommandGroup>
                                            {funcionarios.map((f) => (
                                                <CommandItem key={f.id} value={f.nome} onSelect={() => { setSelectedEmployeeId(f.id.toString()); setOpenEmployeeSelector(false); clearForm(); }}>
                                                    <Check className={cn("mr-2 h-4 w-4", selectedEmployeeId === f.id.toString() ? "opacity-100" : "opacity-0")} />
                                                    {f.nome}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup></CommandList></Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label>Competência</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !competenceDate && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {competenceDate ? format(competenceDate, "MM/yyyy", { locale: ptBR }) : <span>Selecione</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={competenceDate} onSelect={setCompetenceDate} initialFocus locale={ptBR} /></PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="faltas">Faltas (dias)</Label>
                                <Input id="faltas" type="number" value={faltas} onChange={e => setFaltas(Math.max(0, Number(e.target.value)))} min={0} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="he50">HE 50%</Label>
                                <Input id="he50" type="number" value={horasExtras50} onChange={e => setHorasExtras50(Math.max(0, Number(e.target.value)))} min={0} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="he100">HE 100%</Label>
                                <Input id="he100" type="number" value={horasExtras100} onChange={e => setHorasExtras100(Math.max(0, Number(e.target.value)))} min={0} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dsr">DSRs (dias)</Label>
                                <Input id="dsr" type="number" value={domingosFeriados} onChange={e => setDomingosFeriados(Math.max(0, Number(e.target.value)))} min={0} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader><CardTitle>2. Lançamentos Manuais</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className='text-emerald-600'>Proventos</Label>
                            <div className="space-y-2 mt-2">
                                {manualProventos.map(p => (
                                    <div key={p.id} className="flex gap-2 items-center">
                                        <Select onValueChange={(rubricaId) => handleSelectRubrica(p.id, 'provento', rubricaId)}>
                                            <SelectTrigger><SelectValue placeholder="Selecione a rubrica..." /></SelectTrigger>
                                            <SelectContent>
                                                {rubricas.filter(r => r.tipo === 'Provento').map(rub => <SelectItem key={rub.id} value={rub.id.toString()}>{rub.descricao}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <MoneyInput id={`provento-${p.id}`} value={p.value || 0} onValueChange={(val) => handleUpdateRubricaValue(p.id, 'provento', val)} />
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveRubrica(p.id, 'provento')}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" className="w-full" onClick={() => handleAddRubrica('provento')}><Plus className="mr-2 h-4 w-4" />Adicionar Provento</Button>
                            </div>
                        </div>
                         <div>
                            <Label className='text-red-600'>Descontos</Label>
                             <div className="space-y-2 mt-2">
                                {manualDescontos.map(d => (
                                    <div key={d.id} className="flex gap-2 items-center">
                                        <Select onValueChange={(rubricaId) => handleSelectRubrica(d.id, 'desconto', rubricaId)}>
                                            <SelectTrigger><SelectValue placeholder="Selecione a rubrica..." /></SelectTrigger>
                                            <SelectContent>
                                                {rubricas.filter(r => r.tipo === 'Desconto').map(rub => <SelectItem key={rub.id} value={rub.id.toString()}>{rub.descricao}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <MoneyInput id={`desconto-${d.id}`} value={d.value || 0} onValueChange={(val) => handleUpdateRubricaValue(d.id, 'desconto', val)} />
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveRubrica(d.id, 'desconto')}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" className="w-full" onClick={() => handleAddRubrica('desconto')}><Plus className="mr-2 h-4 w-4" />Adicionar Desconto</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                 <Button onClick={handleCalculate} disabled={!selectedEmployeeId || isLoading} className="w-full" size="lg">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Calculator className="mr-2 h-4 w-4" />}
                    {isLoading ? "Calculando..." : "Calcular Folha"}
                </Button>
            </div>
            <div className="lg:col-span-1">
                 <Card className="min-h-full sticky top-24">
                    <CardHeader>
                        <CardTitle>3. Holerite</CardTitle>
                        <CardDescription>Resultado do cálculo da folha de pagamento.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                             <div className="space-y-4">
                                <div className='flex justify-between items-center mb-4 p-4 bg-muted/50 rounded-lg'>
                                    <div>
                                        <Skeleton className="h-6 w-40 mb-2" />
                                        <Skeleton className="h-4 w-48" />
                                    </div>
                                    <Skeleton className="h-6 w-20" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between"><Skeleton className="h-5 w-1/3" /><Skeleton className="h-5 w-1/4" /></div>
                                    <div className="flex justify-between"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-5 w-1/4" /></div>
                                    <div className="flex justify-between"><Skeleton className="h-5 w-2/5" /><Skeleton className="h-5 w-1/4" /></div>
                                    <div className="flex justify-between"><Skeleton className="h-5 w-1/3" /><Skeleton className="h-5 w-1/4" /></div>
                                </div>
                                <div className='mt-6 flex justify-between items-center p-4 bg-muted rounded-lg'>
                                    <Skeleton className="h-6 w-24" /><Skeleton className="h-7 w-32" />
                                </div>
                            </div>
                        ) : calculation ? (
                            <div>
                                <div className='flex justify-between items-center mb-4 p-4 bg-muted/50 rounded-lg'>
                                    <div>
                                        <p className='font-bold text-lg'>{selectedEmployee?.nome || 'Funcionário'}</p>
                                        <p className='text-sm text-muted-foreground'>Recibo de Pagamento de Salário</p>
                                    </div>
                                    <div className='text-right'>
                                        <Badge variant="outline">{competenceDate ? format(competenceDate, 'MM/yyyy') : ''}</Badge>
                                    </div>
                                </div>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead className="text-right">Proventos</TableHead><TableHead className="text-right">Descontos</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {calculation.proventos.map(item => (<TableRow key={`p-${item.id}`}><TableCell className="font-medium">{item.descricao}</TableCell><TableCell className="text-right font-mono text-emerald-600">{formatCurrencyNoSymbol(item.value || 0)}</TableCell><TableCell></TableCell></TableRow>))}
                                        {calculation.descontos.map(item => (<TableRow key={`d-${item.id}`}><TableCell className="font-medium">{item.descricao}</TableCell><TableCell></TableCell><TableCell className="text-right font-mono text-red-600">{formatCurrencyNoSymbol(item.value || 0)}</TableCell></TableRow>))}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="font-bold"><TableCell>Totais</TableCell><TableCell className="text-right font-mono text-emerald-600">{formatCurrencyNoSymbol(calculation.totalProventos)}</TableCell><TableCell className="text-right font-mono text-red-600">{formatCurrencyNoSymbol(calculation.totalDescontos)}</TableCell></TableRow>
                                    </TableFooter>
                                </Table>
                                <div className='mt-6 flex justify-between items-center font-bold text-lg p-4 bg-muted rounded-lg'>
                                    <span>Valor Líquido</span><span className="font-mono text-xl">{formatCurrency(calculation.liquido)}</span>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                                    <p>Base INSS: <span className='font-mono'>{formatCurrency(calculation.baseInss)}</span></p><p>Base IRRF: <span className='font-mono'>{formatCurrency(calculation.baseIrrf)}</span></p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground min-h-[400px]">
                                <Calculator className="h-12 w-12 mb-4" />
                                <p className="font-medium">Preencha os dados e clique em "Calcular Folha"</p>
                                <p className="text-sm">O resultado do cálculo aparecerá aqui.</p>
                            </div>
                        )}
                    </CardContent>
                    {calculation && (
                        <CardFooter className="justify-end gap-2 border-t pt-6 mt-4">
                            <Button variant="outline" onClick={handleSaveCalculation}><Save className="mr-2 h-4 w-4" /> Salvar</Button>
                            <Button onClick={handleGeneratePdf}><FileDown className="mr-2 h-4 w-4" /> Gerar PDF</Button>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    );
}

