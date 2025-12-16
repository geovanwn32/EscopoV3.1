'use client';
import { useState, useMemo, useEffect } from 'react';
import { MoreHorizontal, Plus, Search, Trash2, Pencil, ArrowLeft, CalendarIcon, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useCompany } from '@/hooks/use-company';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Indice {
    id: number;
    name: string;
    date: string; // "MM/yyyy"
    value: number;
}

const availableIndices = ['SELIC', 'IPCA', 'INPC', 'IGP-M', 'CDI'];

export default function IndicesPage() {
    const { toast } = useToast();
    const { useScopedData } = useCompany();
    const [items, setItems] = useScopedData<Indice[]>('cadastros-indices', []);
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Indice | null>(null);
    const [editingItem, setEditingItem] = useState<Indice | null>(null);
    const [filter, setFilter] = useState('todos');

    const handleSave = (itemData: Omit<Indice, 'id'>) => {
        if (editingItem) {
            setItems(prev => prev.map(i => i.id === editingItem.id ? { ...editingItem, ...itemData } : i));
            toast({ title: "Índice Atualizado!" });
        } else {
            const newItem: Indice = { ...itemData, id: Date.now() };
            setItems(prev => [...prev, newItem]);
            toast({ title: "Índice Adicionado!" });
        }
        setIsDialogOpen(false);
        setEditingItem(null);
    };

    const handleDeleteClick = (item: Indice) => setItemToDelete(item);

    const handleConfirmDelete = () => {
        if (itemToDelete) {
            setItems(prev => prev.filter(i => i.id !== itemToDelete.id));
            toast({ variant: "destructive", title: "Índice Excluído!" });
            setItemToDelete(null);
        }
    };
    
    const handleEditClick = (item: Indice) => {
        setEditingItem(item);
        setIsDialogOpen(true);
    };

    const filteredItems = useMemo(() => {
        return items
            .filter(item => filter === 'todos' || item.name === filter)
            .sort((a, b) => {
                const dateA = parse(a.date, 'MM/yyyy', new Date());
                const dateB = parse(b.date, 'MM/yyyy', new Date());
                if (dateA.getTime() !== dateB.getTime()) {
                    return dateB.getTime() - dateA.getTime();
                }
                return a.name.localeCompare(b.name);
            });
    }, [items, filter]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                 <Link href="/cadastros">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Voltar</span>
                    </Button>
                </Link>
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Índices Econômicos</h1>
                    <p className="text-muted-foreground">Consulte e gerencie os valores de índices como INPC, IPCA, SELIC, etc.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Histórico de Índices</CardTitle>
                            <CardDescription>{items.length} registros encontrados.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <Select value={filter} onValueChange={setFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder="Filtrar por índice..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos os Índices</SelectItem>
                                    {availableIndices.map(index => <SelectItem key={index} value={index}>{index}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingItem(null); }}>
                                <DialogTrigger asChild>
                                    <Button><Plus className="mr-2 h-4 w-4" /> Novo Registro</Button>
                                </DialogTrigger>
                                <ItemForm 
                                    onSave={handleSave} 
                                    onOpenChange={setIsDialogOpen}
                                    item={editingItem}
                                />
                            </Dialog>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Índice</TableHead>
                                    <TableHead className="w-[150px]">Competência</TableHead>
                                    <TableHead>Valor (%)</TableHead>
                                    <TableHead className="w-[64px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.length > 0 ? filteredItems.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.date}</TableCell>
                                        <TableCell className="font-mono">{item.value.toFixed(4).replace('.', ',')}%</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEditClick(item)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteClick(item)} className="text-destructive focus:text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">Nenhum índice encontrado.</TableCell>
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
                        <AlertDialogDescription>Essa ação não pode ser desfeita e excluirá permanentemente o registro do índice.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

interface ItemFormProps {
    onSave: (item: Omit<Indice, 'id'>) => void;
    onOpenChange: (open: boolean) => void;
    item: Indice | null;
}

function ItemForm({ onSave, onOpenChange, item }: ItemFormProps) {
    const { toast } = useToast();
    const [name, setName] = useState<string | undefined>(undefined);
    const [date, setDate] = useState<string>('');
    const [value, setValue] = useState<number | string>('');

    useEffect(() => {
        if (item) {
            setName(item.name);
            setDate(item.date);
            setValue(item.value);
        } else {
            setName(undefined);
            setDate('');
            setValue('');
        }
    }, [item]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !date || value === '') {
            toast({
                variant: 'destructive',
                title: 'Campos Obrigatórios',
                description: 'Por favor, preencha todos os campos.'
            });
            return;
        }
        onSave({ name, date, value: Number(value) });
    };
    
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{item ? 'Editar' : 'Novo'} Registro de Índice</DialogTitle>
                <DialogDescription>Preencha os dados do índice econômico para a competência desejada.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Índice *</Label>
                        <Select value={name} onValueChange={setName} required>
                            <SelectTrigger id="name">
                                <SelectValue placeholder="Selecione o índice" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableIndices.map(index => <SelectItem key={index} value={index}>{index}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="date">Competência (Mês/Ano) *</Label>
                        <Input 
                            id="date" 
                            value={date} 
                            onChange={(e) => {
                                let v = e.target.value.replace(/\D/g, '');
                                if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                                setDate(v.slice(0, 7));
                            }} 
                            required 
                            placeholder="MM/AAAA"
                        />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="value">Valor (%) *</Label>
                    <Input id="value" type="number" step="0.0001" value={value} onChange={(e) => setValue(e.target.value)} required placeholder="Ex: 0.5312" />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit">Salvar</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
