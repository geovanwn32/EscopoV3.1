
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
import { Rubrica, RubricaType, Incidencia } from '@/types/pessoal';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

export default function RubricasPage() {
    const { toast } = useToast();
    const { useScopedData } = useCompany();
    const [rubricas, setRubricas] = useScopedData<Rubrica[]>('cadastros-rubricas', []);
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Rubrica | null>(null);
    const [editingItem, setEditingItem] = useState<Rubrica | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSave = (itemData: Omit<Rubrica, 'id'>) => {
        if (editingItem) {
            setRubricas(prev => prev.map(i => i.id === editingItem.id ? { ...editingItem, ...itemData } : i));
            toast({ title: "Rubrica Atualizada!", description: "A rubrica foi atualizada com sucesso." });
        } else {
            const newItem: Rubrica = { ...itemData, id: Date.now() };
            setRubricas(prev => [...prev, newItem]);
            toast({ title: "Rubrica Adicionada!", description: "A nova rubrica foi salva." });
        }
        setIsDialogOpen(false);
        setEditingItem(null);
    };

    const handleDeleteClick = (item: Rubrica) => setItemToDelete(item);

    const handleConfirmDelete = () => {
        if (itemToDelete) {
            setRubricas(prev => prev.filter(i => i.id !== itemToDelete.id));
            toast({ variant: "destructive", title: "Rubrica Excluída!", description: `A rubrica foi removida.` });
            setItemToDelete(null);
        }
    };
    
    const handleEditClick = (item: Rubrica) => {
        setEditingItem(item);
        setIsDialogOpen(true);
    };

    const filteredItems = useMemo(() => {
        return rubricas.filter(item =>
            item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.descricao.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => a.codigo.localeCompare(b.codigo));
    }, [rubricas, searchTerm]);

    const IncidenceBadge = ({ label, active }: { label: string; active: boolean }) => (
        <Badge variant={active ? 'default' : 'outline'} className={active ? 'bg-primary' : 'text-muted-foreground'}>
            {label}
        </Badge>
    );

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
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Cadastro de Rubricas</h1>
                    <p className="text-muted-foreground">Gerencie as rubricas utilizadas no eSocial e nos cálculos de folha de pagamento.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Rubricas Cadastradas</CardTitle>
                            <CardDescription>{rubricas.length} rubricas encontradas.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="relative flex-grow">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Buscar por código ou descrição..." className="pl-9 w-full sm:w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingItem(null); }}>
                                <DialogTrigger asChild>
                                    <Button><Plus className="mr-2 h-4 w-4" /> Nova Rubrica</Button>
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
                                    <TableHead className="w-[120px]">Código</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Incidências</TableHead>
                                    <TableHead className="w-[64px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.length > 0 ? filteredItems.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium font-mono">{item.codigo}</TableCell>
                                        <TableCell>{item.descricao}</TableCell>
                                        <TableCell>
                                            <Badge variant={item.tipo === 'Provento' ? 'secondary' : 'destructive'}>{item.tipo}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <IncidenceBadge label="INSS" active={item.incidencias.inss} />
                                                <IncidenceBadge label="IRRF" active={item.incidencias.irrf} />
                                                <IncidenceBadge label="FGTS" active={item.incidencias.fgts} />
                                            </div>
                                        </TableCell>
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
                                        <TableCell colSpan={5} className="h-24 text-center">Nenhuma rubrica encontrada.</TableCell>
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
                        <AlertDialogDescription>Essa ação não pode ser desfeita e excluirá permanentemente a rubrica.</AlertDialogDescription>
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
    onSave: (item: Omit<Rubrica, 'id'>) => void;
    onOpenChange: (open: boolean) => void;
    item: Rubrica | null;
}

const initialIncidencias: Incidencia = {
    inss: false,
    irrf: false,
    fgts: false,
    contribuicaoSindical: false
};

function ItemForm({ onSave, onOpenChange, item }: ItemFormProps) {
    const { toast } = useToast();
    const [codigo, setCodigo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [tipo, setTipo] = useState<RubricaType>('Provento');
    const [incidencias, setIncidencias] = useState<Incidencia>(initialIncidencias);

    useEffect(() => {
        if (item) {
            setCodigo(item.codigo);
            setDescricao(item.descricao);
            setTipo(item.tipo);
            setIncidencias(item.incidencias || initialIncidencias);
        } else {
            setCodigo('');
            setDescricao('');
            setTipo('Provento');
            setIncidencias(initialIncidencias);
        }
    }, [item]);
    
    const handleIncidenciaChange = (field: keyof Incidencia, checked: boolean) => {
        setIncidencias(prev => ({...prev, [field]: checked}));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!codigo || !descricao) {
            toast({
                variant: 'destructive',
                title: 'Campos Obrigatórios',
                description: 'Código e Descrição são obrigatórios.'
            });
            return;
        }
        onSave({ codigo, descricao, tipo, incidencias });
    };
    
    return (
        <DialogContent className='sm:max-w-xl'>
            <DialogHeader>
                <DialogTitle>{item ? 'Editar' : 'Nova'} Rubrica</DialogTitle>
                <DialogDescription>Preencha os dados da rubrica para eSocial e folha de pagamento.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">Código da Rubrica *</Label>
                        <Input id="code" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="type">Tipo *</Label>
                        <Select value={tipo} onValueChange={(v) => setTipo(v as RubricaType)} required>
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Provento">Provento</SelectItem>
                                <SelectItem value="Desconto">Desconto</SelectItem>
                                <SelectItem value="Base">Base de Cálculo</SelectItem>
                                <SelectItem value="Informativa">Informativa</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Descrição da Rubrica *</Label>
                    <Input id="description" value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
                </div>
                 <div className="space-y-3 pt-2">
                    <Label>Incidências Tributárias</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-lg border p-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="inss" checked={incidencias.inss} onCheckedChange={(c) => handleIncidenciaChange('inss', !!c)} />
                            <Label htmlFor="inss">INSS</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="irrf" checked={incidencias.irrf} onCheckedChange={(c) => handleIncidenciaChange('irrf', !!c)} />
                            <Label htmlFor="irrf">IRRF</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="fgts" checked={incidencias.fgts} onCheckedChange={(c) => handleIncidenciaChange('fgts', !!c)} />
                            <Label htmlFor="fgts">FGTS</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="contribuicaoSindical" checked={incidencias.contribuicaoSindical} onCheckedChange={(c) => handleIncidenciaChange('contribuicaoSindical', !!c)} />
                            <Label htmlFor="contribuicaoSindical">Sindical</Label>
                        </div>
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

