
'use client';

import { useCompany } from '@/hooks/use-company';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { SavedCalculation } from '@/types/pessoal';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { History, MoreVertical, FileDown, Pencil, Trash2 } from 'lucide-react';

export default function RecentCalculations() {
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
                                    <TableHead>Competência</TableHead>
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
                                            <TableCell>{calc.mesCompetencia}</TableCell>
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
