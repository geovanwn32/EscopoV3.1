
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead, TableFooter } from '@/components/ui/table';
import { SavedCalculation } from '@/types/pessoal';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ViewCalculationDialogProps {
  calculation: SavedCalculation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ViewCalculationDialog({ calculation, open, onOpenChange }: ViewCalculationDialogProps) {
    if (!calculation) return null;
    
    const {
        type,
        mesCompetencia,
        socioName,
        employeeName,
        calculation: { proventos, descontos, totalProventos, totalDescontos, liquido, baseInss, baseIrrf }
    } = calculation;

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatCurrencyNoSymbol = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Visualizar Cálculo</DialogTitle>
                    <DialogDescription>
                        Resumo do cálculo de {type} para {socioName || employeeName} na competência de {mesCompetencia}.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                     <div className='flex justify-between items-center mb-4 p-4 bg-muted/50 rounded-lg'>
                        <div>
                            <p className='font-bold text-lg'>{socioName || employeeName}</p>
                            <p className='text-sm text-muted-foreground'>Recibo de Pagamento</p>
                        </div>
                        <div className='text-right'>
                            <Badge variant="outline">{mesCompetencia}</Badge>
                        </div>
                    </div>
                    <ScrollArea className="h-72">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead className="text-right">Proventos</TableHead>
                                    <TableHead className="text-right">Descontos</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {proventos.map(item => (
                                    <TableRow key={`p-${item.id}`}>
                                        <TableCell className="font-medium">{item.descricao}</TableCell>
                                        <TableCell className="text-right font-mono text-emerald-600">{formatCurrencyNoSymbol(item.value || 0)}</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                ))}
                                {descontos.map(item => (
                                    <TableRow key={`d-${item.id}`}>
                                        <TableCell className="font-medium">{item.descricao}</TableCell>
                                        <TableCell></TableCell>
                                        <TableCell className="text-right font-mono text-red-600">{formatCurrencyNoSymbol(item.value || 0)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="font-bold">
                                    <TableCell>Totais</TableCell>
                                    <TableCell className="text-right font-mono text-emerald-600">{formatCurrencyNoSymbol(totalProventos)}</TableCell>
                                    <TableCell className="text-right font-mono text-red-600">{formatCurrencyNoSymbol(totalDescontos)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </ScrollArea>
                    <div className='mt-6 flex justify-between items-center font-bold text-lg p-4 bg-muted rounded-lg'>
                        <span>Valor Líquido</span>
                        <span className="font-mono text-xl">{formatCurrency(liquido)}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                        <p>Base INSS: <span className='font-mono'>{formatCurrency(baseInss)}</span></p>
                        <p>Base IRRF: <span className='font-mono'>{formatCurrency(baseIrrf)}</span></p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

