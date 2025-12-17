
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
import { Service } from '@/types/fiscal';
import { Separator } from '@/components/ui/separator';
import { MoneyInput } from '@/components/ui/money-input';


export default function ServicosPage() {
    const { toast } = useToast();
    const { useScopedData } = useCompany();
    const [services, setServices] = useScopedData<Service[]>('cadastros-servicos', []);
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Service | null>(null);
    const [editingItem, setEditingItem] = useState<Service | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSave = (itemData: Omit<Service, 'id' | 'codigo'>) => {
        if (editingItem) {
            setServices(prev => prev.map(i => i.id === editingItem.id ? { ...editingItem, ...itemData } : i));
            toast({ title: "Serviço Atualizado!", description: "O serviço foi atualizado com sucesso." });
        } else {
            const newCode = (services.length + 1).toString();
            const newItem: Service = { ...itemData, id: Date.now(), codigo: newCode };
            setServices(prev => [...prev, newItem]);
            toast({ title: "Serviço Adicionado!", description: "O novo serviço foi salvo no seu catálogo." });
        }
        setIsDialogOpen(false);
        setEditingItem(null);
    };

    const handleDeleteClick = (item: Service) => setItemToDelete(item);

    const handleConfirmDelete = () => {
        if (itemToDelete) {
            setServices(prev => prev.filter(i => i.id !== itemToDelete.id));
            toast({ variant: "destructive", title: "Serviço Excluído!", description: `O serviço foi removido.` });
            setItemToDelete(null);
        }
    };
    
    const handleEditClick = (item: Service) => {
        setEditingItem(item);
        setIsDialogOpen(true);
    };

    const filteredItems = useMemo(() => {
        return services.filter(item =>
            item.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.descricao.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => a.descricao.localeCompare(b.descricao));
    }, [services, searchTerm]);

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
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Cadastro de Serviços</h1>
                    <p className="text-muted-foreground">Gerencie seu catálogo de serviços.</p>
                </div>
            </div>


            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Serviços Cadastrados</CardTitle>
                            <CardDescription>{services.length} serviços encontrados.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="relative flex-grow">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Buscar por código ou descrição..." className="pl-9 w-full sm:w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingItem(null); }}>
                                <DialogTrigger asChild>
                                    <Button><Plus className="mr-2 h-4 w-4" /> Novo Serviço</Button>
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
                                    <TableHead className="w-[150px]">Código</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Cód. Serviço (LC 116)</TableHead>
                                    <TableHead>CFOP</TableHead>
                                    <TableHead className="w-[150px] text-right">Valor (R$)</TableHead>
                                    <TableHead className="w-[64px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.length > 0 ? filteredItems.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium font-mono">{item.codigo}</TableCell>
                                        <TableCell>{item.descricao}</TableCell>
                                        <TableCell className="font-mono">{item.codigoServicoLC116}</TableCell>
                                        <TableCell className="font-mono">{item.cfop}</TableCell>
                                        <TableCell className="text-right font-mono">{item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
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
                                        <TableCell colSpan={6} className="h-24 text-center">Nenhum serviço encontrado.</TableCell>
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
                        <AlertDialogDescription>Essa ação não pode ser desfeita e excluirá permanentemente o serviço.</AlertDialogDescription>
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
    onSave: (item: Omit<Service, 'id' | 'codigo'>) => void;
    onOpenChange: (open: boolean) => void;
    item: Service | null;
}

const initialFormState: Omit<Service, 'id' | 'tipo' | 'codigo'> = {
    descricao: '',
    valor: 0,
    cfop: '',
    codigoServicoLC116: '',
    pis: { cst: '', aliquota: 0 },
    cofins: { cst: '', aliquota: 0 },
};

function ItemForm({ onSave, onOpenChange, item }: ItemFormProps) {
    const { toast } = useToast();
    const [formData, setFormData] = useState<Omit<Service, 'id' | 'tipo' | 'codigo'>>(initialFormState);
    
    useEffect(() => {
        if (item) {
            setFormData({
                descricao: item.descricao ?? '',
                valor: item.valor ?? 0,
                cfop: item.cfop ?? '',
                codigoServicoLC116: item.codigoServicoLC116 ?? '',
                pis: item.pis ?? { cst: '', aliquota: 0 },
                cofins: item.cofins ?? { cst: '', aliquota: 0 },
            });
        } else {
            setFormData(initialFormState);
        }
    }, [item]);

    const handleInputChange = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleTaxChange = (tax: 'pis' | 'cofins', field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [tax]: {
                ...prev[tax],
                [field]: value
            }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.descricao || formData.valor <= 0) {
            toast({
                variant: 'destructive',
                title: 'Campos Obrigatórios',
                description: 'Descrição e Valor (maior que zero) são obrigatórios.'
            });
            return;
        }
        onSave({ ...formData, tipo: 'Serviço' });
    };
    
    return (
        <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle>{item ? 'Editar' : 'Novo'} Serviço</DialogTitle>
                <DialogDescription>Preencha os dados fiscais e tributários do serviço.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
                <div className="space-y-6 py-4">
                    {/* Dados Gerais */}
                    <Card>
                        <CardHeader><CardTitle>Dados Gerais</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="descricao">Descrição do Serviço</Label>
                                    <Input id="descricao" value={formData.descricao} onChange={(e) => handleInputChange('descricao', e.target.value)} required />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="codigo">Código do Serviço</Label>
                                    <Input id="codigo" value={item?.codigo || "Automático"} disabled />
                                </div>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 <div className="space-y-2">
                                    <Label htmlFor="valor">Valor Padrão</Label>
                                    <MoneyInput
                                        id="valor"
                                        value={formData.valor}
                                        onValueChange={(value) => handleInputChange('valor', value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                     {/* Dados Fiscais */}
                    <Card>
                        <CardHeader><CardTitle>Dados Fiscais</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="space-y-2">
                                    <Label htmlFor="codigoServicoLC116">Código de Serviço (LC 116)</Label>
                                    <Input id="codigoServicoLC116" value={formData.codigoServicoLC116} onChange={(e) => handleInputChange('codigoServicoLC116', e.target.value)} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="cfop">CFOP Padrão (Saída)</Label>
                                    <Input id="cfop" value={formData.cfop} onChange={(e) => handleInputChange('cfop', e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tributos */}
                    <Card>
                        <CardHeader><CardTitle>Tributos Federais</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4'>
                                <div>
                                    <h4 className="font-semibold text-primary">PIS</h4>
                                    <div className="grid grid-cols-2 gap-4 items-end mt-2">
                                        <div className="space-y-2"><Label>CST</Label><Input value={formData.pis.cst} onChange={(e) => handleTaxChange('pis', 'cst', e.target.value)} /></div>
                                        <div className="space-y-2"><Label>Alíquota (%)</Label><Input type="number" value={formData.pis.aliquota} onChange={(e) => handleTaxChange('pis', 'aliquota', parseFloat(e.target.value) || 0)} /></div>
                                    </div>
                                </div>
                                 <div>
                                    <h4 className="font-semibold text-primary">COFINS</h4>
                                    <div className="grid grid-cols-2 gap-4 items-end mt-2">
                                        <div className="space-y-2"><Label>CST</Label><Input value={formData.cofins.cst} onChange={(e) => handleTaxChange('cofins', 'cst', e.target.value)} /></div>
                                        <div className="space-y-2"><Label>Alíquota (%)</Label><Input type="number" value={formData.cofins.aliquota} onChange={(e) => handleTaxChange('cofins', 'aliquota', parseFloat(e.target.value) || 0)} /></div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit">Salvar</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
