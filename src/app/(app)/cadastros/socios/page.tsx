'use client';
import { useState, useMemo, useEffect } from 'react';
import { MoreHorizontal, Plus, Search, Trash2, Pencil, ArrowLeft, Loader2, Percent } from 'lucide-react';
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
import { Socio } from '@/types/socios';
import { MoneyInput } from '@/components/ui/money-input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SociosPage() {
    const { toast } = useToast();
    const { useScopedData } = useCompany();
    const [socios, setSocios] = useScopedData<Socio[]>('cadastros-socios', []);
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Socio | null>(null);
    const [editingItem, setEditingItem] = useState<Socio | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSave = (itemData: Omit<Socio, 'id'>) => {
        if (editingItem) {
            setSocios(prev => prev.map(i => i.id === editingItem.id ? { ...editingItem, ...itemData } : i));
            toast({ title: "Sócio Atualizado!", description: "Os dados do sócio foram atualizados." });
        } else {
            const newItem: Socio = { ...itemData, id: Date.now() };
            setSocios(prev => [...prev, newItem]);
            toast({ title: "Sócio Adicionado!", description: "O novo sócio foi cadastrado." });
        }
        setIsDialogOpen(false);
        setEditingItem(null);
    };

    const handleDeleteClick = (item: Socio) => setItemToDelete(item);

    const handleConfirmDelete = () => {
        if (itemToDelete) {
            setSocios(prev => prev.filter(i => i.id !== itemToDelete.id));
            toast({ variant: "destructive", title: "Sócio Excluído!", description: `O sócio foi removido.` });
            setItemToDelete(null);
        }
    };
    
    const handleEditClick = (item: Socio) => {
        setEditingItem(item);
        setIsDialogOpen(true);
    };

    const filteredItems = useMemo(() => {
        return socios.filter(item =>
            item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.cpf.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => a.nome.localeCompare(b.nome));
    }, [socios, searchTerm]);

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
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Cadastro de Sócios</h1>
                    <p className="text-muted-foreground">Gerencie os dados dos sócios e suas participações na empresa.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Sócios Cadastrados</CardTitle>
                            <CardDescription>{socios.length} sócios encontrados.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="relative flex-grow">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Buscar por nome ou CPF..." className="pl-9 w-full sm:w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingItem(null); }}>
                                <DialogTrigger asChild>
                                    <Button><Plus className="mr-2 h-4 w-4" /> Novo Sócio</Button>
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
                                    <TableHead>CPF</TableHead>
                                    <TableHead>Data de Entrada</TableHead>
                                    <TableHead className="text-right">Pró-labore (R$)</TableHead>
                                    <TableHead className="text-right">Participação (%)</TableHead>
                                    <TableHead className="w-[64px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.length > 0 ? filteredItems.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.nome}</TableCell>
                                        <TableCell>{item.cpf}</TableCell>
                                        <TableCell>{format(new Date(item.dataEntrada), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell className="text-right font-mono">{item.proLabore.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                        <TableCell className="text-right font-mono">{item.participacao}%</TableCell>
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
                                        <TableCell colSpan={6} className="h-24 text-center">Nenhum sócio encontrado.</TableCell>
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
                        <AlertDialogDescription>Essa ação não pode ser desfeita e excluirá permanentemente o cadastro do sócio.</AlertDialogDescription>
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
    onSave: (item: Omit<Socio, 'id'>) => void;
    onOpenChange: (open: boolean) => void;
    item: Socio | null;
}

function ItemForm({ onSave, onOpenChange, item }: ItemFormProps) {
    const { toast } = useToast();
    const [isQueryingCep, setIsQueryingCep] = useState(false);
    const [formData, setFormData] = useState<Omit<Socio, 'id'>>({
        nome: '',
        cpf: '',
        dataEntrada: '',
        proLabore: 0,
        participacao: 0,
        dataNascimento: '',
        genero: 'Outro',
        endereco: { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' },
        contato: { telefone: '', email: '' },
        dadosBancarios: { banco: '', agencia: '', conta: '' },
    });

    useEffect(() => {
        if (item) {
            setFormData({
                nome: item.nome || '',
                cpf: item.cpf || '',
                dataEntrada: item.dataEntrada || '',
                proLabore: item.proLabore || 0,
                participacao: item.participacao || 0,
                dataNascimento: item.dataNascimento || '',
                genero: item.genero || 'Outro',
                endereco: item.endereco || { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' },
                contato: item.contato || { telefone: '', email: '' },
                dadosBancarios: item.dadosBancarios || { banco: '', agencia: '', conta: '' },
            });
        } else {
            setFormData({
                nome: '', cpf: '', dataEntrada: '', proLabore: 0, participacao: 0, dataNascimento: '', genero: 'Outro',
                endereco: { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' },
                contato: { telefone: '', email: '' }, dadosBancarios: { banco: '', agencia: '', conta: '' },
            });
        }
    }, [item]);
    

    const handleInputChange = (field: keyof Omit<Socio, 'id'>, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNestedChange = (section: 'endereco' | 'contato' | 'dadosBancarios', field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
            }
        }))
    }

    const handleCepQuery = async () => {
        const cep = formData.endereco?.cep.replace(/\D/g, '');
        if (!cep || cep.length !== 8) {
            toast({ variant: 'destructive', title: 'CEP inválido', description: 'Por favor, insira um CEP válido com 8 dígitos.' });
            return;
        }

        setIsQueryingCep(true);
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
            if (!response.ok) throw new Error('CEP não encontrado');
            const data = await response.json();
            handleNestedChange('endereco', 'logradouro', data.street || '');
            handleNestedChange('endereco', 'bairro', data.neighborhood || '');
            handleNestedChange('endereco', 'cidade', data.city || '');
            handleNestedChange('endereco', 'uf', data.state || '');
            toast({ title: 'CEP Consultado!', description: 'O endereço foi preenchido.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao consultar CEP', description: 'Não foi possível encontrar o endereço.' });
        } finally {
            setIsQueryingCep(false);
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nome || !formData.cpf || !formData.dataEntrada) {
            toast({
                variant: 'destructive',
                title: 'Campos Obrigatórios',
                description: 'Nome, CPF e Data de Entrada são obrigatórios.'
            });
            return;
        }
        onSave(formData);
    };
    
    return (
        <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle>{item ? 'Editar' : 'Novo'} Sócio</DialogTitle>
                <DialogDescription>Preencha os dados cadastrais do sócio.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
                 <Tabs defaultValue="principal" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-4">
                        <TabsTrigger value="principal">Principal</TabsTrigger>
                        <TabsTrigger value="pessoal">Dados Pessoais</TabsTrigger>
                        <TabsTrigger value="endereco">Endereço/Contato</TabsTrigger>
                        <TabsTrigger value="bancario">Dados Bancários</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="principal" className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nome">Nome Completo *</Label>
                            <Input id="nome" value={formData.nome} onChange={(e) => handleInputChange('nome', e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cpf">CPF *</Label>
                                <Input id="cpf" value={formData.cpf} onChange={(e) => handleInputChange('cpf', e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dataEntrada">Data de Entrada *</Label>
                                <Input id="dataEntrada" type="date" value={formData.dataEntrada?.split('T')[0]} onChange={(e) => handleInputChange('dataEntrada', e.target.value)} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="proLabore">Pró-labore (R$)</Label>
                                <MoneyInput id="proLabore" value={formData.proLabore} onValueChange={(v) => handleInputChange('proLabore', v)} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="participacao">Participação (%)</Label>
                                <div className="relative">
                                    <Input id="participacao" type="number" value={formData.participacao} onChange={(e) => handleInputChange('participacao', Number(e.target.value))} />
                                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="pessoal" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                                <Input id="dataNascimento" type="date" value={formData.dataNascimento?.split('T')[0]} onChange={(e) => handleInputChange('dataNascimento', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="genero">Gênero</Label>
                                <Select value={formData.genero} onValueChange={(v) => handleInputChange('genero', v)}>
                                    <SelectTrigger id="genero"><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Masculino">Masculino</SelectItem>
                                        <SelectItem value="Feminino">Feminino</SelectItem>
                                        <SelectItem value="Outro">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </TabsContent>
                    
                     <TabsContent value="endereco" className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cep">CEP</Label>
                            <div className="flex gap-2">
                                <Input id="cep" value={formData.endereco?.cep} onChange={(e) => handleNestedChange('endereco', 'cep', e.target.value)} />
                                <Button type="button" variant="outline" onClick={handleCepQuery} disabled={isQueryingCep}>
                                    {isQueryingCep ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2 col-span-2"><Label htmlFor="logradouro">Logradouro</Label><Input id="logradouro" value={formData.endereco?.logradouro} onChange={(e) => handleNestedChange('endereco', 'logradouro', e.target.value)} /></div>
                            <div className="space-y-2"><Label htmlFor="numero">Número</Label><Input id="numero" value={formData.endereco?.numero} onChange={(e) => handleNestedChange('endereco', 'numero', e.target.value)} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2"><Label htmlFor="bairro">Bairro</Label><Input id="bairro" value={formData.endereco?.bairro} onChange={(e) => handleNestedChange('endereco', 'bairro', e.target.value)} /></div>
                             <div className="space-y-2"><Label htmlFor="complemento">Complemento</Label><Input id="complemento" value={formData.endereco?.complemento} onChange={(e) => handleNestedChange('endereco', 'complemento', e.target.value)} /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                             <div className="space-y-2 col-span-2"><Label htmlFor="cidade">Cidade</Label><Input id="cidade" value={formData.endereco?.cidade} onChange={(e) => handleNestedChange('endereco', 'cidade', e.target.value)} /></div>
                            <div className="space-y-2"><Label htmlFor="uf">UF</Label><Input id="uf" value={formData.endereco?.uf} onChange={(e) => handleNestedChange('endereco', 'uf', e.target.value)} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="space-y-2"><Label htmlFor="telefone">Telefone</Label><Input id="telefone" value={formData.contato?.telefone} onChange={(e) => handleNestedChange('contato', 'telefone', e.target.value)} /></div>
                            <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={formData.contato?.email} onChange={(e) => handleNestedChange('contato', 'email', e.target.value)} /></div>
                        </div>
                    </TabsContent>

                    <TabsContent value="bancario" className="space-y-4">
                         <div className="grid grid-cols-3 gap-4">
                             <div className="space-y-2"><Label htmlFor="banco">Banco</Label><Input id="banco" value={formData.dadosBancarios?.banco} onChange={(e) => handleNestedChange('dadosBancarios', 'banco', e.target.value)} /></div>
                            <div className="space-y-2"><Label htmlFor="agencia">Agência</Label><Input id="agencia" value={formData.dadosBancarios?.agencia} onChange={(e) => handleNestedChange('dadosBancarios', 'agencia', e.target.value)} /></div>
                            <div className="space-y-2"><Label htmlFor="conta">Conta</Label><Input id="conta" value={formData.dadosBancarios?.conta} onChange={(e) => handleNestedChange('dadosBancarios', 'conta', e.target.value)} /></div>
                         </div>
                    </TabsContent>
                </Tabs>
                <DialogFooter className='pt-6'>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit">Salvar</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
