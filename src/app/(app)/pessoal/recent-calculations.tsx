
'use client';

import { useCompany } from '@/hooks/use-company';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { SavedCalculation } from '@/types/pessoal';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { History, MoreVertical, FileDown, Pencil, Trash2, Search, Calculator, HandCoins, Eye, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ViewCalculationDialog from './view-calculation-dialog';

export default function RecentCalculations() {
    const router = useRouter();
    const { useScopedData } = useCompany();
    const [savedCalculations, setSavedCalculations] = useScopedData<SavedCalculation[]>('pessoal-calculos-salvos', []);
    const { toast } = useToast();
    
    const [itemToDelete, setItemToDelete] = useState<SavedCalculation | null>(null);
    const [itemToView, setItemToView] = useState<SavedCalculation | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

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

    const filteredCalculations = useMemo(() => {
        return savedCalculations.filter(calc => 
            (calc.socioName || calc.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (calc.type || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [savedCalculations, searchTerm]);

    const paginatedCalculations = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredCalculations.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredCalculations, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredCalculations.length / itemsPerPage);

    const getCalcIcon = (type: SavedCalculation['type']) => {
        switch(type) {
            case 'Folha': return <Calculator className="h-4 w-4 text-primary" />;
            case 'RCI': return <HandCoins className="h-4 w-4 text-amber-600" />;
            default: return <FileText className="h-4 w-4 text-muted-foreground" />;
        }
    }


    return (
        <>
            <Card>
                <CardHeader>
                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className='flex-1'>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-6 w-6" />
                                Cálculos Salvos
                            </CardTitle>
                            <CardDescription>
                                Visualize, edite ou exclua cálculos salvos.
                            </CardDescription>
                        </div>
                         <div className="relative w-full sm:w-auto sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar por nome ou tipo..." 
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Competência</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Sócio / Funcionário</TableHead>
                                    <TableHead className="text-right">Valor Líquido</TableHead>
                                    <TableHead className="w-[64px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedCalculations.length > 0 ? (
                                    paginatedCalculations.map(calc => (
                                        <TableRow key={calc.id} >
                                            <TableCell>{format(new Date(calc.date), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>{calc.mesCompetencia}</TableCell>
                                            <TableCell>
                                                <div className='flex items-center gap-2'>
                                                    {getCalcIcon(calc.type)}
                                                    {calc.type}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{calc.socioName || calc.employeeName}</TableCell>
                                            <TableCell className="text-right font-mono">{calc.netValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                         <DropdownMenuItem onClick={() => setItemToView(calc)}>
                                                            <Eye className="mr-2 h-4 w-4" /> Visualizar
                                                        </DropdownMenuItem>
                                                         <DropdownMenuItem onClick={() => handleEdit(calc)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem disabled>
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
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Nenhum cálculo encontrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                     <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        >
                        Anterior
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Página {currentPage} de {totalPages > 0 ? totalPages : 1}
                        </span>
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        >
                        Próxima
                        </Button>
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
            
            {itemToView && (
                <ViewCalculationDialog
                    calculation={itemToView}
                    open={!!itemToView}
                    onOpenChange={() => setItemToView(null)}
                />
            )}
        </>
    )
}
