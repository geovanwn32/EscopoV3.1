
'use client';

import { useState, useMemo } from 'react';
import { useCompany } from '@/hooks/use-company';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { SavedCalculation } from '@/types/pessoal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Loader2 } from 'lucide-react';

export default function ReportGeneratorDialog() {
    const { useScopedData, companies, currentCompany } = useCompany();
    const [savedCalculations] = useScopedData<SavedCalculation[]>('pessoal-calculos-salvos', []);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [mesCompetencia, setMesCompetencia] = useState<string>(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
    
    const activeCompany = useMemo(() => companies.find(c => c.id === currentCompany), [companies, currentCompany]);

    const filteredCalculations = useMemo(() => {
        if (!mesCompetencia) return [];
        const [year, month] = mesCompetencia.split('-').map(Number);
        return savedCalculations.filter(calc => {
            if (!calc.mesCompetencia) return false;
            const [calcMonth, calcYear] = calc.mesCompetencia.split('/').map(Number);
            return calcYear === year && calcMonth === month;
        });
    }, [mesCompetencia, savedCalculations]);


    const handleGenerateReport = () => {
        if (filteredCalculations.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Nenhum cálculo encontrado',
                description: `Não há cálculos salvos para a competência selecionada.`,
            });
            return;
        }

        setIsLoading(true);

        setTimeout(() => {
            try {
                const doc = new jsPDF();
                const pageMargin = 15;
                let finalY = 20;

                // Header
                if (activeCompany?.data?.logo) {
                    try { doc.addImage(activeCompany.data.logo, 'PNG', pageMargin, finalY - 10, 20, 20); } 
                    catch (e) { console.error("Error adding logo to PDF:", e); }
                }

                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Relatório Mensal de Cálculos', doc.internal.pageSize.width / 2, finalY, { align: 'center' });
                finalY += 8;
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(`Competência: ${format(new Date(mesCompetencia + '-02'), 'MM/yyyy')}`, doc.internal.pageSize.width / 2, finalY, { align: 'center' });
                finalY += 6;
                doc.text(`Empresa: ${activeCompany?.name || 'N/A'}`, doc.internal.pageSize.width / 2, finalY, { align: 'center' });
                doc.text(`CNPJ: ${activeCompany?.data?.cnpj || 'N/A'}`, doc.internal.pageSize.width / 2, finalY + 5, { align: 'center' });
                finalY += 15;

                const tableData = filteredCalculations.map(calc => ([
                    format(new Date(calc.date), 'dd/MM/yyyy'),
                    calc.type,
                    calc.socioName || calc.employeeName || 'N/A',
                    (calc.calculation?.totalProventos || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    (calc.calculation?.totalDescontos || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    calc.netValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                ]));

                autoTable(doc, {
                    startY: finalY,
                    head: [['Data', 'Tipo', 'Nome', 'T. Proventos', 'T. Descontos', 'Vlr. Líquido']],
                    body: tableData,
                    theme: 'grid',
                    headStyles: { fillColor: [240, 240, 240], textColor: 40, fontStyle: 'bold' },
                    columnStyles: {
                        3: { halign: 'right' },
                        4: { halign: 'right' },
                        5: { halign: 'right' },
                    }
                });
                
                finalY = (doc as any).lastAutoTable.finalY + 10;
                
                const totals = filteredCalculations.reduce((acc, c) => {
                    const calc = c.calculation;
                    if (calc) {
                        acc.proventos += calc.totalProventos;
                        acc.descontos += calc.totalDescontos;
                        acc.liquido += calc.liquido;
                        
                        const inss = calc.descontos.find(d => d.descricao?.includes('INSS'))?.value || 0;
                        const irrf = calc.descontos.find(d => d.descricao?.includes('IRRF'))?.value || 0;
                        
                        acc.inss += inss;
                        acc.irrf += irrf;
                        acc.fgts += c.type === 'Folha' ? (calc.baseInss * 0.08) : 0;
                    }
                    return acc;
                }, { proventos: 0, descontos: 0, liquido: 0, inss: 0, irrf: 0, fgts: 0 });


                autoTable(doc, {
                    startY: finalY,
                    theme: 'plain',
                    styles: { fontSize: 10 },
                    body: [
                        ['Total Proventos:', totals.proventos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
                        ['Total Descontos:', totals.descontos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
                        [{ content: 'Total Líquido:', styles: {fontStyle: 'bold'} }, { content: totals.liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), styles: {fontStyle: 'bold'} }],
                    ]
                });
                finalY = (doc as any).lastAutoTable.finalY + 5;
                
                autoTable(doc, {
                    startY: finalY,
                    theme: 'plain',
                    styles: { fontSize: 8, cellPadding: 0.5 },
                    body: [
                       [{content: "Resumo de Impostos (Guias)", styles: {fontStyle: 'bold'}}],
                       [`INSS: ${totals.inss.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`],
                       [`IRRF: ${totals.irrf.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`],
                       [`FGTS: ${totals.fgts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`],
                    ]
                });
                finalY = (doc as any).lastAutoTable.finalY + 10;
                
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(
                    'Este documento é um resumo gerencial. Os valores dos impostos são estimativas e devem ser validados nas respectivas guias de recolhimento.',
                    pageMargin, finalY, { maxWidth: doc.internal.pageSize.width - pageMargin * 2 }
                );

                doc.save(`Relatorio_Calculos_${mesCompetencia.replace('-', '_')}.pdf`);
                toast({ title: 'Relatório Gerado!', description: 'O PDF foi baixado com sucesso.' });
            } catch(e) {
                console.error("PDF Generation Error: ", e);
                toast({ variant: 'destructive', title: 'Erro ao gerar PDF', description: 'Ocorreu um problema ao criar o arquivo.' });
            } finally {
                setIsLoading(false);
                setIsDialogOpen(false);
            }
        }, 1000);
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button size="lg">
                    <FileText className="mr-2 h-5 w-5" /> Gerar Relatório de Cálculos
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Gerar Relatório Mensal</DialogTitle>
                    <DialogDescription>
                        Selecione o mês e o ano para gerar um relatório em PDF com todos os cálculos salvos no período.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="report-month">Mês de Competência</Label>
                        <Input 
                            id="report-month" 
                            type="month" 
                            value={mesCompetencia} 
                            onChange={(e) => setMesCompetencia(e.target.value)} 
                        />
                    </div>
                     <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                        {filteredCalculations.length > 0
                            ? `Foram encontrados ${filteredCalculations.length} cálculos para este período.`
                            : "Nenhum cálculo encontrado para o período selecionado."
                        }
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleGenerateReport} disabled={isLoading || filteredCalculations.length === 0}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Gerar e Baixar PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
