'use client';
import { useState, useMemo, useEffect } from 'react';
import { MoreHorizontal, Plus, Search, Trash2, Pencil, ArrowLeft } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

interface NaturezaOperacao {
    id: number;
    name: string;
    cfop: string;
    type: 'Entrada' | 'Saída';
    movimentaEstoque: 'Sim' | 'Não';
    geraFinanceiro: 'Sim' | 'Não';
}

export default function NaturezaOperacaoPage() {
    const { toast } = useToast();
    const { useScopedData } = useCompany();
    const [items, setItems] = useScopedData<NaturezaOperacao[]>('cadastros-natureza-operacao', []);
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<NaturezaOperacao | null>(null);
    const [editingItem, setEditingItem] = useState<NaturezaOperacao | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSave = (itemData: Omit<NaturezaOperacao, 'id'>) => {
        if (editingItem) {
            setItems(prev => prev.map(i => i.id === editingItem.id ? { ...editingItem, ...itemData } : i));
            toast({ title: "Natureza da Operação Atualizada!" });
        } else {
            const newItem: NaturezaOperacao = { ...itemData, id: Date.now() };
            setItems(prev => [...prev, newItem]);
            toast({ title: "Natureza da Operação Adicionada!" });
        }
        setIsDialogOpen(false);
        setEditingItem(null);
    };

    const handleDeleteClick = (item: NaturezaOperacao) => setItemToDelete(item);

    const handleConfirmDelete = () => {
        if (itemToDelete) {
            setItems(prev => prev.filter(i => i.id !== itemToDelete.id));
            toast({ variant: "destructive", title: "Item Excluído!" });
            setItemToDelete(null);
        }
    };
    
    const handleEditClick = (item: NaturezaOperacao) => {
        setEditingItem(item);
        setIsDialogOpen(true);
    };

    const filteredItems = useMemo(() => {
        return items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.cfop.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => a.name.localeCompare(b.name));
    }, [items, searchTerm]);

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
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Natureza da Operação</h1>
                    <p className="text-muted-foreground">Gerencie as naturezas de operação utilizadas nas notas fiscais.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Naturezas de Operação</CardTitle>
                            <CardDescription>{items.length} itens encontrados.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="relative flex-grow">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Buscar por nome ou CFOP..." className="pl-9 w-full sm:w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingItem(null); }}>
                                <DialogTrigger asChild>
                                    <Button><Plus className="mr-2 h-4 w-4" /> Nova Natureza</Button>
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
                                    <TableHead>Nome</TableHead>
                                    <TableHead>CFOP Padrão</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Mov. Estoque</TableHead>
                                    <TableHead>Gera Financeiro</TableHead>
                                    <TableHead className="w-[64px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.length > 0 ? filteredItems.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="font-mono">{item.cfop}</TableCell>
                                        <TableCell><Badge variant={item.type === 'Entrada' ? 'secondary' : 'default'}>{item.type}</Badge></TableCell>
                                        <TableCell>{item.movimentaEstoque}</TableCell>
                                        <TableCell>{item.geraFinanceiro}</TableCell>
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
                                        <TableCell colSpan={6} className="h-24 text-center">Nenhum item encontrado.</TableCell>
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
                        <AlertDialogDescription>Essa ação não pode ser desfeita e excluirá permanentemente o item.</AlertDialogDescription>
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
    onSave: (item: Omit<NaturezaOperacao, 'id'>) => void;
    onOpenChange: (open: boolean) => void;
    item: NaturezaOperacao | null;
}

function ItemForm({ onSave, onOpenChange, item }: ItemFormProps) {
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [cfop, setCfop] = useState('');
    const [type, setType] = useState<'Entrada' | 'Saída' | undefined>(undefined);
    const [movimentaEstoque, setMovimentaEstoque] = useState<'Sim' | 'Não' | undefined>(undefined);
    const [geraFinanceiro, setGeraFinanceiro] = useState<'Sim' | 'Não' | undefined>(undefined);

    useEffect(() => {
        if (item) {
            setName(item.name);
            setCfop(item.cfop);
            setType(item.type);
            setMovimentaEstoque(item.movimentaEstoque);
            setGeraFinanceiro(item.geraFinanceiro);
        } else {
            setName('');
            setCfop('');
            setType(undefined);
            setMovimentaEstoque(undefined);
            setGeraFinanceiro(undefined);
        }
    }, [item]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !cfop || !type || !movimentaEstoque || !geraFinanceiro) {
            toast({
                variant: 'destructive',
                title: 'Campos Obrigatórios',
                description: 'Por favor, preencha todos os campos.'
            });
            return;
        }
        onSave({ name, cfop, type, movimentaEstoque, geraFinanceiro });
    };
    
    return (
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>{item ? 'Editar' : 'Nova'} Natureza da Operação</DialogTitle>
                <DialogDescription>Preencha os dados e o comportamento da natureza da operação.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cfop">CFOP Padrão</Label>
                        <Input id="cfop" value={cfop} onChange={(e) => setCfop(e.target.value)} required />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select value={type} onValueChange={(v) => setType(v as any)} required>
                            <SelectTrigger id="type"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Entrada">Entrada</SelectItem>
                                <SelectItem value="Saída">Saída</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="movimentaEstoque">Movimenta Estoque</Label>
                        <Select value={movimentaEstoque} onValueChange={(v) => setMovimentaEstoque(v as any)} required>
                            <SelectTrigger id="movimentaEstoque"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sim">Sim</SelectItem>
                                <SelectItem value="Não">Não</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="geraFinanceiro">Gera Financeiro</Label>
                         <Select value={geraFinanceiro} onValuecha_ve={(v) => setGeraFinanceiro(v as any)} required>
                            <SelectTrigger id="geraFinanceiro"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sim">Sim</SelectItem>
                                <SelectItem value="Não">Não</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit">Salvar</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}