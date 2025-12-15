
'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Loader2, ArrowDownCircle, ArrowUpCircle, ArrowRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableRow, TableFooter, TableHead, TableHeader } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { MoneyInput } from '@/components/ui/money-input';
import { Badge } from '@/components/ui/badge';

// Simplified tax brackets for demonstration
const inssRate = 0.11;
const inssTeto = 7786.02; // Teto de contribuição do INSS
const inssValorTeto = inssTeto * inssRate;

const irrfBrackets = [
    { limit: 2259.20, rate: 0, deduction: 0 },
    { limit: 2826.65, rate: 0.075, deduction: 169.44 },
    { limit: 3751.05, rate: 0.15, deduction: 381.44 },
    { limit: 4664.68, rate: 0.225, deduction: 662.77 },
    { limit: Infinity, rate: 0.275, deduction: 896.00 },
];
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

export default function RciCalculator() {
    const [socioName, setSocioName] = useState<string>('');
    const [proLaboreValue, setProLaboreValue] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [calculation, setCalculation] = useState<CalculationResult | null>(null);

    const handleCalculate = () => {
        if (proLaboreValue <= 0) {
            return;
        }

        setIsLoading(true);
        setCalculation(null);

        // Simulate calculation delay
        setTimeout(() => {
            const baseInss = proLaboreValue;

            // INSS Calculation
            let inss = baseInss > inssTeto ? inssValorTeto : baseInss * inssRate;
            inss = parseFloat(inss.toFixed(2));

            // IRRF Calculation
            const baseIrrf = baseInss - inss;
            
            // Standard deduction calculation
            let irrfFromStandardDeduction = 0;
            for (const bracket of irrfBrackets) {
                if (baseIrrf <= bracket.limit) {
                    irrfFromStandardDeduction = (baseIrrf * bracket.rate) - bracket.deduction;
                    break;
                }
            }

            // Simplified deduction calculation
            const baseIrrfSimplified = baseInss - irrfSimplifiedDeduction;
             let irrfFromSimplifiedDeduction = 0;
             for (const bracket of irrfBrackets) {
                if (baseIrrfSimplified <= bracket.limit) {
                    irrfFromSimplifiedDeduction = (baseIrrfSimplified * bracket.rate) - bracket.deduction;
                    break;
                }
            }
            
            // IRRF is the lesser of the two calculation methods
            const irrf = Math.max(0, Math.min(irrfFromStandardDeduction, irrfFromSimplifiedDeduction));

            const totalProventos = proLaboreValue;
            const totalDescontos = inss + irrf;
            const liquido = totalProventos - totalDescontos;
            
            const proventos = [
                { label: "Pró-labore", value: proLaboreValue },
            ];
            
            const descontos = [
                { label: "INSS (11%)", value: inss },
                { label: "IRRF", value: irrf },
            ];

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
                        <CardTitle>Dados para Cálculo do RCI</CardTitle>
                        <CardDescription>Preencha os dados do sócio e o valor do pró-labore.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="socioName">Nome do Sócio/Contribuinte</Label>
                            <Input id="socioName" value={socioName} onChange={e => setSocioName(e.target.value)} placeholder="Nome completo" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="proLaboreValue">Valor do Pró-labore (R$)</Label>
                            <MoneyInput id="proLaboreValue" value={proLaboreValue} onValueChange={setProLaboreValue} />
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={handleCalculate} disabled={proLaboreValue <= 0 || isLoading} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Calculator className="mr-2 h-4 w-4" />}
                            {isLoading ? "Calculando..." : "Calcular RCI"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card className="min-h-[420px]">
                    <CardHeader>
                        <CardTitle>Demonstrativo de Pagamento</CardTitle>
                        <CardDescription>Resultado do cálculo do pró-labore.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {calculation ? (
                            <div>
                                <div className='flex justify-between items-center mb-4 p-4 bg-muted/50 rounded-lg'>
                                    <div>
                                        <p className='font-bold text-lg'>{socioName || 'Contribuinte'}</p>
                                        <p className='text-sm text-muted-foreground'>Recibo de Pagamento de Contribuinte Individual</p>
                                    </div>
                                    <div className='text-right'>
                                         <Badge variant="outline">Pró-labore</Badge>
                                    </div>
                                </div>
                               
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead className="text-right">Proventos</TableHead>
                                            <TableHead className="text-right">Descontos</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {calculation.proventos.map(item => (
                                            <TableRow key={item.label}>
                                                <TableCell className="font-medium">{item.label}</TableCell>
                                                <TableCell className="text-right font-mono text-emerald-600">{item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        ))}
                                        {calculation.descontos.map(item => (
                                            <TableRow key={item.label}>
                                                <TableCell className="font-medium">{item.label}</TableCell>
                                                <TableCell></TableCell>
                                                <TableCell className="text-right font-mono text-red-600">{item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter>
                                         <TableRow className="font-bold">
                                            <TableCell>Totais</TableCell>
                                            <TableCell className="text-right font-mono text-emerald-600">{calculation.totalProventos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="text-right font-mono text-red-600">{calculation.totalDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>

                                 <div className='mt-6 flex justify-between items-center font-bold text-lg p-4 bg-muted rounded-lg'>
                                    <span>Valor Líquido a Receber</span>
                                    <span className="font-mono text-xl">{calculation.liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                 </div>

                                  <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                                    <p>Base de Cálculo INSS: <span className='font-mono'>{calculation.baseInss.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                                    <p>Base de Cálculo IRRF: <span className='font-mono'>{calculation.baseIrrf.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                                  </div>

                            </div>
                        ) : (
                             <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground min-h-[250px]">
                                <Calculator className="h-12 w-12 mb-4" />
                                <p className="font-medium">Preencha os dados e clique em "Calcular RCI"</p>
                                <p className="text-sm">O resultado do cálculo aparecerá aqui.</p>
                            </div>
                        )}
                    </CardContent>
                    {calculation && (
                        <CardFooter className="justify-end gap-2 border-t pt-6 mt-4">
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
