
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, CalendarOff, HandCoins, UserMinus, Percent, Briefcase, History, MoreVertical, FileDown, Pencil, Trash2, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useCompany } from '@/hooks/use-company';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { SavedCalculation } from '@/types/pessoal';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const calculators = [
    {
        href: '/pessoal/ferias',
        icon: <CalendarOff className="h-8 w-8" />,
        label: 'Férias',
        description: 'Calcule férias, abono e adiantamento de 13º salário.',
        color: "text-emerald-600 bg-emerald-100/80 group-hover:bg-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 dark:group-hover:bg-emerald-500",
    },
    {
        href: '/pessoal/13-salario',
        icon: <HandCoins className="h-8 w-8" />,
        label: '13º Salário',
        description: 'Calcule a 1ª, 2ª ou parcela única do 13º salário.',
        color: "text-amber-600 bg-amber-100/80 group-hover:bg-amber-600 dark:bg-amber-900/40 dark:text-amber-400 dark:group-hover:bg-amber-500",
    },
    {
        href: '/pessoal/rescisao',
        icon: <UserMinus className="h-8 w-8" />,
        label: 'Rescisão',
        description: 'Calcule a rescisão de contrato de trabalho (TRCT).',
        color: "text-red-600 bg-red-100/80 group-hover:bg-red-600 dark:bg-red-900/40 dark:text-red-400 dark:group-hover:bg-red-500",
    },
    {
        href: '/pessoal/rci',
        icon: <Percent className="h-8 w-8" />,
        label: 'RCI (Pró-labore)',
        description: 'Calcule o Recibo de Pagamento de Autônomo ou pró-labore.',
        color: "text-indigo-600 bg-indigo-100/80 group-hover:bg-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 dark:group-hover:bg-indigo-500",
    },
    {
        href: '/funcionarios',
        icon: <Briefcase className="h-8 w-8" />,
        label: 'Funcionários',
        description: 'Gerencie os dados dos seus colaboradores.',
        color: "text-slate-600 bg-slate-100/80 group-hover:bg-slate-600 dark:bg-slate-700/40 dark:text-slate-400 dark:group-hover:bg-slate-500",
    },
]

function RecentCalculations() {
    const router = useRouter();
    const { useScopedData } = useCompany();
    const [savedCalculations, setSavedCalculations] = useScopedData<SavedCalculation[]>('pessoal-calculos-salvos', []);
    const { toast } = useToast();
    
    const [itemToDelete, setItemToDelete] = useState<SavedCalculation | null>(null);

    const handleEdit = (calc: SavedCalculation) => {
        sessionStorage.setItem('edit-calculation', JSON.stringify(calc));
        if (calc.type === 'RCI') {
            router.push('/pessoal/rci');
        } else if (calc.type === 'Folha') {
            router.push('/pessoal/folha-de-pagamento');
        }
    };
    
    const handleDeleteClick = (calc: SavedCalculation) => {
        setItemToDelete(calc);
    };

    const handleConfirmDelete = () => {
        if (!itemToDelete) return;
        setSavedCalculations(prev => prev.filter(c => c.id !== itemToDelete.id));
        toast({
            variant: "destructive",
            title: "Cálculo Excluído!",
            description: `O cálculo de ${itemToDelete.type} para ${itemToDelete.socioName || itemToDelete.employeeName} foi removido.`,
        });
        setItemToDelete(null);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-6 w-6" />
                        Cálculos Salvos Recentemente
                    </CardTitle>
                    <CardDescription>
                        Aqui estão os últimos cálculos de pró-labore e folhas de pagamento que você salvou. Clique duas vezes em uma linha para editar.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Sócio / Funcionário</TableHead>
                                    <TableHead className="text-right">Valor Líquido</TableHead>
                                    <TableHead className="w-[64px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {savedCalculations.length > 0 ? (
                                    savedCalculations.slice(0, 5).map(calc => (
                                        <TableRow key={calc.id} onDoubleClick={() => handleEdit(calc)} className="cursor-pointer">
                                            <TableCell>{format(new Date(calc.date), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>{calc.type}</TableCell>
                                            <TableCell className="font-medium">{calc.socioName || calc.employeeName}</TableCell>
                                            <TableCell className="text-right font-mono">{calc.netValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                         <DropdownMenuItem onClick={() => handleEdit(calc)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <FileDown className="mr-2 h-4 w-4" /> Baixar PDF
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDeleteClick(calc)} className="text-destructive focus:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            Nenhum cálculo salvo ainda.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O cálculo será excluído permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete}>Confirmar Exclusão</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}


export default function PessoalPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Departamento Pessoal</h1>
                <p className="text-muted-foreground">
                    Visão geral e acesso rápido aos cálculos e cadastros do departamento pessoal.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Folha de Pagamento</CardTitle>
                        <CardDescription>Calcule a folha de pagamento mensal de seus funcionários de forma detalhada.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild size="lg">
                            <Link href="/pessoal/folha-de-pagamento">
                                <Calculator className="mr-2 h-5 w-5" /> Abrir Calculadora da Folha
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Relatório Mensal de Cálculos</CardTitle>
                        <CardDescription>Gere um PDF consolidado com todos os cálculos de um determinado mês.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ReportGeneratorDialog />
                    </CardContent>
                </Card>
            </div>


            <Card>
                <CardHeader>
                    <CardTitle>Outros Cálculos e Cadastros</CardTitle>
                    <CardDescription>Acesse outras ferramentas e cadastros essenciais do departamento pessoal.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {calculators.map((util) => (
                        <Link key={util.href} href={util.href}>
                            <div className="group flex h-full cursor-pointer flex-col gap-2 rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                                <div className={`rounded-full p-3 transition-colors group-hover:text-primary-foreground self-start ${util.color}`}>
                                    {util.icon}
                                </div>
                                <h3 className="text-lg font-semibold">{util.label}</h3>
                                <p className="text-sm text-muted-foreground">{util.description}</p>
                            </div>
                        </Link>
                    ))}
                </CardContent>
            </Card>

            <RecentCalculations />
        </div>
    );
}

function ReportGeneratorDialog() {
    const { useScopedData, companies, currentCompany } = useCompany();
    const [savedCalculations] = useScopedData<SavedCalculation[]>('pessoal-calculos-salvos', []);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [mesCompetencia, setMesCompetencia] = useState<string>(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
    const activeCompany = companies.find(c => c.id === currentCompany);

    const handleGenerateReport = () => {
        setIsLoading(true);
        
        const [year, month] = mesCompetencia.split('-').map(Number);
        
        const filteredCalculations = savedCalculations.filter(calc => {
            const calcDate = new Date(calc.date);
            return calcDate.getFullYear() === year && calcDate.getMonth() === month - 1;
        });

        if (filteredCalculations.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Nenhum cálculo encontrado',
                description: `Não há cálculos salvos para a competência ${month}/${year}.`,
            });
            setIsLoading(false);
            return;
        }

        setTimeout(() => {
            const doc = new jsPDF();
            const pageMargin = 15;
            let finalY = 20;

            // Header
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Relatório Mensal de Cálculos', doc.internal.pageSize.width / 2, finalY, { align: 'center' });
            finalY += 8;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Competência: ${String(month).padStart(2, '0')}/${year}`, doc.internal.pageSize.width / 2, finalY, { align: 'center' });
            finalY += 8;
            doc.text(`Empresa: ${activeCompany?.name || 'N/A'}`, doc.internal.pageSize.width / 2, finalY, { align: 'center' });
            finalY += 15;

            const tableData = filteredCalculations.map(calc => ([
                format(new Date(calc.date), 'dd/MM/yyyy'),
                calc.type,
                calc.socioName || calc.employeeName || 'N/A',
                calc.netValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            ]));

            autoTable(doc, {
                startY: finalY,
                head: [['Data', 'Tipo', 'Nome', 'Valor Líquido']],
                body: tableData,
                theme: 'grid',
            });
            
            finalY = (doc as any).lastAutoTable.finalY + 10;
            
            const totalFolha = filteredCalculations.filter(c => c.type === 'Folha').reduce((sum, c) => sum + c.netValue, 0);
            const totalRci = filteredCalculations.filter(c => c.type === 'RCI').reduce((sum, c) => sum + c.netValue, 0);
            const totalGeral = totalFolha + totalRci;

            autoTable(doc, {
                startY: finalY,
                theme: 'plain',
                body: [
                    ['Total Folha de Pagamento:', totalFolha.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
                    ['Total Pró-labore (RCI):', totalRci.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
                    [{ content: 'Total Geral do Mês:', styles: {fontStyle: 'bold'} }, { content: totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), styles: {fontStyle: 'bold'} }],
                ]
            });


            doc.save(`Relatorio_Calculos_${month}_${year}.pdf`);

            setIsLoading(false);
            toast({ title: 'Relatório Gerado!', description: 'O PDF foi baixado com sucesso.' });
        }, 1000);
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="lg">
                    <FileText className="mr-2 h-5 w-5" /> Gerar Relatório de Cálculos
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gerar Relatório Mensal</DialogTitle>
                    <DialogDescription>
                        Selecione o mês e o ano para gerar um relatório em PDF com todos os cálculos salvos no período.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="report-month">Mês de Competência</Label>
                    <Input 
                        id="report-month" 
                        type="month" 
                        value={mesCompetencia} 
                        onChange={(e) => setMesCompetencia(e.target.value)} 
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleGenerateReport} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Gerar e Baixar PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
