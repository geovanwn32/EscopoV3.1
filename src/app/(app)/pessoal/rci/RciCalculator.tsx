

'use client';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Loader2, ArrowDownCircle, ArrowUpCircle, ArrowRight, Plus, Trash2, Save, FileDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableRow, TableFooter, TableHead, TableHeader } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { MoneyInput } from '@/components/ui/money-input';
import { Badge } from '@/components/ui/badge';
import { useCompany } from '@/hooks/use-company';
import { Socio } from '@/types/socios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { Rubrica, CalculationResult, SavedCalculation } from '@/types/pessoal';


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


export default function RciCalculator() {
    const { toast } = useToast();
    const { useScopedData, companies, currentCompany } = useCompany();
    const [socios] = useScopedData<Socio[]>('cadastros-socios', []);
    const [savedCalculations, setSavedCalculations] = useScopedData<SavedCalculation[]>('pessoal-calculos-salvos', []);
    
    const [selectedSocioId, setSelectedSocioId] = useState<string>('');
    const [proLaboreValue, setProLaboreValue] = useState<number>(0);
    const [mesCompetencia, setMesCompetencia] = useState<string>(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
    
    const [manualProventos, setManualProventos] = useState<Rubrica[]>([]);
    const [manualDescontos, setManualDescontos] = useState<Rubrica[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [calculation, setCalculation] = useState<CalculationResult | null>(null);

    const activeCompany = useMemo(() => companies.find(c => c.id === currentCompany), [companies, currentCompany]);

    const selectedSocio = useMemo(() => {
        return socios.find(s => s.id.toString() === selectedSocioId);
    }, [selectedSocioId, socios]);

    useEffect(() => {
        const editDataString = sessionStorage.getItem('edit-calculation');
        if (editDataString) {
            const editData: SavedCalculation = JSON.parse(editDataString);
            if (editData.type === 'RCI') {
                setSelectedSocioId(editData.socioId || '');
                setProLaboreValue(editData.proLaboreValue || 0);
                setMesCompetencia(editData.mesCompetencia || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
                setManualProventos(editData.manualProventos || []);
                setManualDescontos(editData.manualDescontos || []);
                handleCalculate(
                    editData.proLaboreValue || 0,
                    editData.manualProventos || [],
                    editData.manualDescontos || []
                );
            }
            sessionStorage.removeItem('edit-calculation');
        }
    }, []);

    useEffect(() => {
        if (selectedSocio) {
            setProLaboreValue(selectedSocio.proLabore || 0);
        } else {
            setProLaboreValue(0);
        }
        setCalculation(null);
        setManualProventos([]);
        setManualDescontos([]);
    }, [selectedSocio]);

    const handleAddRubrica = (type: 'provento' | 'desconto') => {
        const newRubrica: Rubrica = { id: Date.now(), label: '', value: 0 };
        if (type === 'provento') {
            setManualProventos(prev => [...prev, newRubrica]);
        } else {
            setManualDescontos(prev => [...prev, newRubrica]);
        }
    };

    const handleUpdateRubrica = (type: 'provento' | 'desconto', id: number, field: 'label' | 'value', fieldValue: string | number) => {
        const updater = (prev: Rubrica[]) => prev.map(r => 
            r.id === id ? { ...r, [field]: fieldValue } : r
        );
        if (type === 'provento') {
            setManualProventos(updater);
        } else {
            setManualDescontos(updater);
        }
    };

    const handleRemoveRubrica = (type: 'provento' | 'desconto', id: number) => {
        const remover = (prev: Rubrica[]) => prev.filter(r => r.id !== id);
        if (type === 'provento') {
            setManualProventos(remover);
        } else {
            setManualDescontos(remover);
        }
    };


    const handleCalculate = (
        currentProLabore = proLaboreValue, 
        currentProventos = manualProventos, 
        currentDescontos = manualDescontos
    ) => {
        if (currentProLabore <= 0) {
            toast({ variant: 'destructive', title: 'Valor inválido', description: 'O valor do pró-labore deve ser maior que zero.' });
            return;
        }

        setIsLoading(true);
        setCalculation(null);

        // Simulate calculation delay
        setTimeout(() => {
            const totalManualProventos = currentProventos.reduce((acc, p) => acc + p.value, 0);
            const totalManualDescontos = currentDescontos.reduce((acc, p) => acc + p.value, 0);

            const baseInss = currentProLabore + totalManualProventos;

            // INSS Calculation
            let inss = baseInss > inssTeto ? inssValorTeto : baseInss * inssRate;
            inss = parseFloat(inss.toFixed(2));

            // IRRF Calculation
            const baseIrrf = baseInss - inss;
            
            let irrfFromStandardDeduction = 0;
            for (const bracket of irrfBrackets) {
                if (baseIrrf <= bracket.limit) {
                    irrfFromStandardDeduction = (baseIrrf * bracket.rate) - bracket.deduction;
                    break;
                }
            }

            const baseIrrfSimplified = baseInss - irrfSimplifiedDeduction;
            let irrfFromSimplifiedDeduction = 0;
            for (const bracket of irrfBrackets) {
                if (baseIrrfSimplified <= bracket.limit) {
                    irrfFromSimplifiedDeduction = (baseIrrfSimplified * bracket.rate) - bracket.deduction;
                    break;
                }
            }
            
            const irrf = Math.max(0, Math.min(irrfFromStandardDeduction, irrfFromSimplifiedDeduction));

            const totalProventos = baseInss;
            const descontosCalculados = [
                { id: 1, label: "INSS (11%)", value: inss },
                { id: 2, label: "IRRF", value: irrf },
            ];
            
            const totalDescontos = descontosCalculados.reduce((acc, d) => acc + d.value, 0) + totalManualDescontos;
            const liquido = totalProventos - totalDescontos;
            
            const proventos = [
                { id: 0, label: "Pró-labore", value: currentProLabore },
                ...currentProventos.filter(p => p.label && p.value > 0),
            ];
            
            const descontos = [
                ...descontosCalculados,
                ...currentDescontos.filter(d => d.label && d.value > 0),
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
        }, 500);
    }

    const handleSaveCalculation = () => {
        if (!calculation || !selectedSocio) {
            toast({ variant: 'destructive', title: 'Cálculo incompleto', description: 'Realize um cálculo antes de salvar.' });
            return;
        }

        const newSavedCalc: SavedCalculation = {
            id: Date.now(),
            type: 'RCI',
            date: new Date().toISOString(),
            netValue: calculation.liquido,
            socioId: selectedSocioId,
            socioName: selectedSocio.nome,
            proLaboreValue: proLaboreValue,
            mesCompetencia: mesCompetencia,
            manualProventos: manualProventos,
            manualDescontos: manualDescontos,
            calculation: calculation,
        };

        setSavedCalculations(prev => [newSavedCalc, ...prev]);
        toast({ title: 'Cálculo Salvo!', description: 'O resultado foi salvo na Central de Cálculos.' });
    };
    
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const handleSavePdf = () => {
        if (!calculation || !selectedSocio || !activeCompany) return;

        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        const margin = 14;
        
        const competenciaDate = new Date(mesCompetencia + '-02');
        const competenciaFormatted = competenciaDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        const drawReceipt = (startY: number, title: string) => {
            // Header
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text("Recibo de Pagamento - Pró-labore", pageWidth / 2, startY, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Competência: ${competenciaFormatted}`, pageWidth - margin, startY + 8, { align: 'right' });
            
            // Company and Partner Info
            autoTable(doc, {
                startY: startY + 12,
                body: [
                    [{ content: 'Empresa Pagadora', styles: { fontStyle: 'bold' } }, `${activeCompany.data?.razaoSocial || activeCompany.name}`],
                    [{ content: 'CNPJ', styles: { fontStyle: 'bold' } }, `${activeCompany.data?.cnpj || ''}`],
                    [{ content: 'Sócio / Beneficiário', styles: { fontStyle: 'bold' } }, `${selectedSocio.nome}`],
                    [{ content: 'CPF', styles: { fontStyle: 'bold' } }, `${selectedSocio.cpf}`],
                ],
                theme: 'striped',
                styles: { fontSize: 9, cellPadding: 1.5 },
                columnStyles: { 0: { cellWidth: 40 } },
            });

            let finalY = (doc as any).lastAutoTable.finalY + 5;

            // Earnings and Deductions Table
            autoTable(doc, {
                startY: finalY,
                head: [['Código', 'Descrição', 'Proventos', 'Descontos']],
                body: [
                    ...calculation.proventos.map((p, i) => [`10${i+1}`, p.label, formatCurrency(p.value), '']),
                    ...calculation.descontos.map((d, i) => [`20${i+1}`, d.label, '', formatCurrency(d.value)]),
                ],
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 2 },
                headStyles: { fillColor: [240, 240, 240], textColor: 40 },
                columnStyles: { 
                    0: { halign: 'center', cellWidth: 20 },
                    2: { halign: 'right' }, 
                    3: { halign: 'right' } 
                },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 2 && data.cell.raw) {
                         data.cell.styles.textColor = [22, 163, 74]; // Emerald
                    }
                    if (data.section === 'body' && data.column.index === 3 && data.cell.raw) {
                         data.cell.styles.textColor = [220, 38, 38]; // Red
                    }
                }
            });

            finalY = (doc as any).lastAutoTable.finalY;

            // Totals
            const totalsBody = [
                [
                    { content: 'Totais', colSpan: 1, styles: { fontStyle: 'bold' } },
                    { content: formatCurrency(calculation.totalProventos), styles: { halign: 'right', fontStyle: 'bold', textColor: [22, 163, 74] } },
                    { content: formatCurrency(calculation.totalDescontos), styles: { halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] } }
                ]
            ];
             autoTable(doc, {
                startY: finalY,
                body: totalsBody,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 2 },
                columnStyles: { 0: {cellWidth: 106.8} }
             });

            finalY = (doc as any).lastAutoTable.finalY;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Valor Líquido a Receber:', margin, finalY + 8);
            doc.text(formatCurrency(calculation.liquido), pageWidth - margin, finalY + 8, { align: 'right' });

            // Calculation Bases
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`Base INSS: ${formatCurrency(calculation.baseInss)} | Base IRRF: ${formatCurrency(calculation.baseIrrf)}`, margin, finalY + 15);
            
            // Signature
            const signatureY = finalY + 30;
            doc.line(pageWidth / 2 - 40, signatureY, pageWidth / 2 + 40, signatureY);
            doc.text('Assinatura do Sócio', pageWidth / 2, signatureY + 4, { align: 'center' });
            
            // Receipt Copy Label
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text(title, pageWidth - margin, finalY + 35, { align: 'right'});
        };

        // Draw First Copy (Company's copy)
        drawReceipt(20, 'Via da Empresa');
        
        // Draw Separator
        const separatorY = pageHeight / 2;
        doc.setLineDashPattern([2, 2], 0);
        doc.line(margin, separatorY, pageWidth - margin, separatorY);
        doc.setFontSize(8);
        doc.text('Destacar aqui', pageWidth / 2, separatorY - 1, { align: 'center' });
        doc.setLineDashPattern([], 0);


        // Draw Second Copy (Contributor's copy)
        drawReceipt(separatorY + 10, 'Via do Contribuinte');


        doc.save(`RCI_${selectedSocio.nome.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,7)}.pdf`);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Dados do Cálculo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="socioName">Sócio/Contribuinte</Label>
                            <Select value={selectedSocioId} onValueChange={setSelectedSocioId}>
                                <SelectTrigger id="socioName">
                                    <SelectValue placeholder="Selecione um sócio..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {socios.length > 0 ? (
                                        socios.map(socio => (
                                            <SelectItem key={socio.id} value={socio.id.toString()}>{socio.nome}</SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-4 text-sm text-muted-foreground">Nenhum sócio cadastrado.</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="proLaboreValue">Pró-labore (R$)</Label>
                                <MoneyInput id="proLaboreValue" value={proLaboreValue} onValueChange={setProLaboreValue} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="month">Competência</Label>
                                <Input id="month" type="month" value={mesCompetencia} onChange={e => setMesCompetencia(e.target.value)} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ArrowUpCircle className="h-5 w-5 text-emerald-500" /> 2. Proventos Manuais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {manualProventos.map(p => (
                            <div key={p.id} className="flex gap-2 items-center">
                                <Input placeholder="Descrição" value={p.label} onChange={(e) => handleUpdateRubrica('provento', p.id, 'label', e.target.value)} />
                                <MoneyInput id={`provento-${p.id}`} value={p.value} onValueChange={(val) => handleUpdateRubrica('provento', p.id, 'value', val)} />
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveRubrica('provento', p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full" onClick={() => handleAddRubrica('provento')}><Plus className="mr-2 h-4 w-4" />Adicionar Provento</Button>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ArrowDownCircle className="h-5 w-5 text-red-500" /> 3. Descontos Manuais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {manualDescontos.map(d => (
                            <div key={d.id} className="flex gap-2 items-center">
                                <Input placeholder="Descrição" value={d.label} onChange={(e) => handleUpdateRubrica('desconto', d.id, 'label', e.target.value)} />
                                <MoneyInput id={`desconto-${d.id}`} value={d.value} onValueChange={(val) => handleUpdateRubrica('desconto', d.id, 'value', val)} />
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveRubrica('desconto', d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full" onClick={() => handleAddRubrica('desconto')}><Plus className="mr-2 h-4 w-4" />Adicionar Desconto</Button>
                    </CardContent>
                </Card>

            </div>
            <div className="lg:col-span-2">
                <Card className="min-h-[420px]">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>4. Demonstrativo de Pagamento</CardTitle>
                                <CardDescription>Resultado do cálculo do pró-labore.</CardDescription>
                            </div>
                             <div className="flex gap-2">
                                <Button onClick={() => handleCalculate()} disabled={proLaboreValue <= 0 || isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Calculator className="mr-2 h-4 w-4" />}
                                    {isLoading ? "Recalculando..." : "Calcular"}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {calculation ? (
                            <div>
                                <div className='flex justify-between items-center mb-4 p-4 bg-muted/50 rounded-lg'>
                                    <div>
                                        <p className='font-bold text-lg'>{selectedSocio?.nome || 'Contribuinte'}</p>
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
                                            <TableRow key={`p-${item.id}`}>
                                                <TableCell className="font-medium">{item.label}</TableCell>
                                                <TableCell className="text-right font-mono text-emerald-600">{item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        ))}
                                        {calculation.descontos.map(item => (
                                            <TableRow key={`d-${item.id}`}>
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
                                <p className="font-medium">Preencha os dados e clique em "Calcular"</p>
                                <p className="text-sm">O resultado do cálculo aparecerá aqui.</p>
                            </div>
                        )}
                    </CardContent>
                    {calculation && (
                        <CardFooter className="justify-end gap-2 border-t pt-6 mt-4">
                             <Button variant="outline" onClick={handleSaveCalculation} disabled={!calculation}>
                                <Save className="mr-2 h-4 w-4" /> Salvar Cálculo
                             </Button>
                             <Button variant="outline" onClick={handleSavePdf} disabled={!calculation}>
                                <FileDown className="mr-2 h-4 w-4" /> Salvar PDF
                             </Button>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    );
}

