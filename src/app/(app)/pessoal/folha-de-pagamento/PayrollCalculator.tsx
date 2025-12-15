'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompany } from '@/hooks/use-company';
import { Funcionario } from '@/types/pessoal';
import { Calculator, ArrowRight, Receipt, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead, TableFooter } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

// Simplified tax brackets for demonstration
const inssBrackets = [
    { limit: 1412.00, rate: 0.075, deduction: 0 },
    { limit: 2666.68, rate: 0.09, deduction: 21.18 },
    { limit: 4000.03, rate: 0.12, deduction: 101.18 },
    { limit: 7786.02, rate: 0.14, deduction: 181.18 },
];
const inssTeto = 908.85;

const irrfBrackets = [
    { limit: 2259.20, rate: 0, deduction: 0 },
    { limit: 2826.65, rate: 0.075, deduction: 169.44 },
    { limit: 3751.05, rate: 0.15, deduction: 381.44 },
    { limit: 4664.68, rate: 0.225, deduction: 662.77 },
    { limit: Infinity, rate: 0.275, deduction: 896.00 },
];
const irrfDeductionPerDependent = 189.59;
const irrfSimplifiedDeduction = 564.80;


interface CalculationResult {
    proventos: { label: string; value: number }[];
    descontos: { label: string; value: number }[];
    totalProventos: number;
    totalDescontos: number;
    liquido: number;
    baseInss: number;
    baseIrrf: number;
}

export default function PayrollCalculator() {
    const { useScopedData } = useCompany();
    const [funcionarios] = useScopedData<Funcionario[]>('cadastros-funcionarios', []);
    
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [mesCompetencia, setMesCompetencia] = useState<string>(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
    const [faltas, setFaltas] = useState<number>(0);
    const [horasExtras50, setHorasExtras50] = useState<number>(0);
    const [horasExtras100, setHorasExtras100] = useState<number>(0);

    const [isLoading, setIsLoading] = useState(false);
    const [calculation, setCalculation] = useState<CalculationResult | null>(null);

    const selectedEmployee = useMemo(() => {
        return funcionarios.find(f => f.id.toString() === selectedEmployeeId);
    }, [selectedEmployeeId, funcionarios]);

    const handleCalculate = () => {
        if (!selectedEmployee) {
            return;
        }

        setIsLoading(true);
        setCalculation(null);

        // Simulate calculation delay
        setTimeout(() => {
            const salarioBase = selectedEmployee.salario;
            const dsrValue = salarioBase / 30; // Simplified DSR

            const valorHoraExtra50 = (salarioBase / 220) * 1.5 * horasExtras50;
            const valorHoraExtra100 = (salarioBase / 220) * 2 * horasExtras100;
            const valorFaltas = (salarioBase / 30) * faltas;

            const totalProventos = salarioBase + valorHoraExtra50 + valorHoraExtra100;
            const baseInss = totalProventos - valorFaltas;

            // INSS Calculation
            let inss = 0;
            if (baseInss > inssBrackets[inssBrackets.length - 1].limit) {
                inss = inssTeto;
            } else {
                 for (const bracket of inssBrackets) {
                    if (baseInss <= bracket.limit) {
                        inss = (baseInss * bracket.rate) - bracket.deduction;
                        break;
                    }
                }
            }
            inss = parseFloat(inss.toFixed(2));

            // IRRF Calculation
            const numDependentes = selectedEmployee.dependentes?.length || 0;
            const deducaoDependentes = numDependentes * irrfDeductionPerDependent;
            const baseIrrf = baseInss - inss - deducaoDependentes;

            // Simplified IRRF choice
            const irrfFromStandardDeduction = irrfBrackets.reduce((acc, bracket) => {
                 if (baseIrrf <= bracket.limit) {
                    return (baseIrrf * bracket.rate) - bracket.deduction;
                }
                return acc;
            }, 0);

            const baseIrrfSimplified = baseInss - irrfSimplifiedDeduction;
            const irrfFromSimplifiedDeduction = irrfBrackets.reduce((acc, bracket) => {
                 if (baseIrrfSimplified <= bracket.limit) {
                    return (baseIrrfSimplified * bracket.rate) - bracket.deduction;
                }
                return acc;
            }, 0);

            const irrf = Math.max(0, Math.min(irrfFromStandardDeduction, irrfFromSimplifiedDeduction));

            const totalDescontos = inss + irrf + valorFaltas;
            const liquido = totalProventos - totalDescontos;
            
            const proventos = [
                { label: "Salário Base", value: salarioBase },
            ];
            if (valorHoraExtra50 > 0) proventos.push({ label: "Horas Extras 50%", value: valorHoraExtra50 });
            if (valorHoraExtra100 > 0) proventos.push({ label: "Horas Extras 100%", value: valorHoraExtra100 });
            
            const descontos = [
                { label: "INSS sobre Salário", value: inss },
                { label: "IRRF sobre Salário", value: irrf },
            ];
            if (valorFaltas > 0) descontos.push({ label: "Faltas", value: valorFaltas });

            setCalculation({
                proventos,
                descontos,
                totalProventos,
                totalDescontos,
                liquido,
                baseInss,
                baseIrrf
            });

            setIsLoading(false);
        }, 1000);
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Dados para Cálculo</CardTitle>
                        <CardDescription>Selecione o funcionário e preencha os dados para processar a folha.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="employee">Funcionário</Label>
                             <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                                <SelectTrigger id="employee">
                                    <SelectValue placeholder="Selecione um funcionário" />
                                </SelectTrigger>
                                <SelectContent>
                                    {funcionarios.map(f => <SelectItem key={f.id} value={f.id.toString()}>{f.nome}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="month">Mês de Competência</Label>
                            <Input id="month" type="month" value={mesCompetencia} onChange={e => setMesCompetencia(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="faltas">Faltas (dias)</Label>
                                <Input id="faltas" type="number" value={faltas} onChange={e => setFaltas(Number(e.target.value))} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="he50">HE 50%</Label>
                                <Input id="he50" type="number" value={horasExtras50} onChange={e => setHorasExtras50(Number(e.target.value))} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="he100">HE 100%</Label>
                                <Input id="he100" type="number" value={horasExtras100} onChange={e => setHorasExtras100(Number(e.target.value))} />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={handleCalculate} disabled={!selectedEmployeeId || isLoading} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Calculator className="mr-2 h-4 w-4" />}
                            {isLoading ? "Calculando..." : "Calcular Folha"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card className="min-h-[420px]">
                    <CardHeader>
                        <CardTitle>Resultado do Cálculo</CardTitle>
                        <CardDescription>Abaixo está o demonstrativo de pagamento para o funcionário selecionado.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {calculation ? (
                            <div>
                                <div className='flex justify-between items-center mb-4'>
                                    <div>
                                        <p className='font-bold text-lg'>{selectedEmployee?.nome}</p>
                                        <p className='text-sm text-muted-foreground'>{selectedEmployee?.cargo}</p>
                                    </div>
                                    <div className='text-right'>
                                        <p className='font-bold text-lg'>Folha de {new Date(mesCompetencia + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                                        <p className='text-sm text-muted-foreground'>CNPJ: {/** Company CNPJ **/}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-2 gap-8 mt-4">
                                    <div>
                                        <h4 className="font-semibold mb-2 text-emerald-600">Proventos</h4>
                                        <Table>
                                             <TableBody>
                                                {calculation.proventos.map(item => (
                                                    <TableRow key={item.label}>
                                                        <TableCell>{item.label}</TableCell>
                                                        <TableCell className="text-right font-mono">{item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                            <TableFooter>
                                                <TableRow className="font-bold">
                                                    <TableCell>Total Proventos</TableCell>
                                                    <TableCell className="text-right font-mono">{calculation.totalProventos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                                </TableRow>
                                            </TableFooter>
                                        </Table>
                                    </div>
                                     <div>
                                        <h4 className="font-semibold mb-2 text-red-600">Descontos</h4>
                                         <Table>
                                             <TableBody>
                                                {calculation.descontos.map(item => (
                                                    <TableRow key={item.label}>
                                                        <TableCell>{item.label}</TableCell>
                                                        <TableCell className="text-right font-mono">{item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                             <TableFooter>
                                                <TableRow className="font-bold">
                                                    <TableCell>Total Descontos</TableCell>
                                                    <TableCell className="text-right font-mono">{calculation.totalDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                                </TableRow>
                                            </TableFooter>
                                        </Table>
                                    </div>
                                </div>
                                 <Separator className='my-4' />
                                 <div className='flex justify-between items-center font-bold text-lg p-4 bg-muted rounded-lg'>
                                    <span>Salário Líquido</span>
                                    <span className="font-mono">{calculation.liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                 </div>
                                  <div className="mt-4 grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                                    <p>Base INSS: <span className='font-mono'>{calculation.baseInss.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                                    <p>Base IRRF: <span className='font-mono'>{calculation.baseIrrf.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                                     <p>FGTS do Mês: <span className='font-mono'>{(calculation.baseInss * 0.08).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                                  </div>

                            </div>
                        ) : (
                             <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground min-h-[250px]">
                                <Calculator className="h-12 w-12 mb-4" />
                                <p className="font-medium">Preencha os dados e clique em "Calcular Folha"</p>
                                <p className="text-sm">O resultado do cálculo aparecerá aqui.</p>
                            </div>
                        )}
                    </CardContent>
                    {calculation && (
                        <CardFooter className="justify-end gap-2">
                             <Button variant="outline">Salvar PDF</Button>
                             <Button>
                                Finalizar e Contabilizar <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    );
}
