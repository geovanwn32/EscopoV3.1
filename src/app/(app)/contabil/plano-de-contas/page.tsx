
'use client';

import React, { useState, useMemo } from 'react';
import { MoreHorizontal, Plus, ChevronRight, ChevronDown, Trash2, Pencil, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useCompany } from '@/hooks/use-company';
import { Account, AccountType, AccountNature } from '@/types/contabil';
import { cn } from '@/lib/utils';
import Link from 'next/link';


const defaultAccounts: Account[] = [];

export default function PlanoDeContasPage() {
    const { toast } = useToast();
    const { useScopedData } = useCompany();
    const [accounts, setAccounts] = useScopedData<Account[]>('contabil-plano-de-contas', defaultAccounts);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Account | null>(null);
    const [editingItem, setEditingItem] = useState<Account | null>(null);

    const handleSave = (accountData: Omit<Account, 'id'>) => {
        if (editingItem) {
            setAccounts(prev => prev.map(a => a.id === editingItem.id ? { ...editingItem, ...accountData } : a));
            toast({ title: "Conta Atualizada!", description: "A conta foi atualizada com sucesso." });
        } else {
            const newAccount: Account = { ...accountData, id: Date.now() };
            setAccounts(prev => [...prev, newAccount]);
            toast({ title: "Conta Adicionada!", description: "A nova conta foi criada com sucesso." });
        }
        setIsDialogOpen(false);
        setEditingItem(null);
    };
    
    const handleDeleteClick = (account: Account) => {
        const children = accounts.filter(a => a.parentId === account.id);
        if (children.length > 0) {
            toast({ variant: "destructive", title: "Ação não permitida!", description: "Não é possível excluir uma conta que possui subcontas." });
            return;
        }
        setItemToDelete(account);
    };

    const handleConfirmDelete = () => {
        if (itemToDelete) {
            setAccounts(prev => prev.filter(a => a.id !== itemToDelete.id));
            toast({ variant: "destructive", title: "Conta Excluída!", description: `A conta ${itemToDelete.name} foi removida.` });
            setItemToDelete(null);
        }
    };
    
    const handleEditClick = (account: Account) => {
        setEditingItem(account);
        setIsDialogOpen(true);
    };
    
    const rootAccounts = useMemo(() => accounts.filter(a => a.parentId === null), [accounts]);

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
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Plano de Contas</h1>
                    <p className="text-muted-foreground">Gerencie a estrutura de contas da sua empresa.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Estrutura de Contas</CardTitle>
                        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingItem(null); }}>
                            <DialogTrigger asChild>
                                <Button><Plus className="mr-2 h-4 w-4" /> Nova Conta</Button>
                            </DialogTrigger>
                            <AccountForm
                                onSave={handleSave}
                                onOpenChange={setIsDialogOpen}
                                accounts={accounts}
                                account={editingItem}
                            />
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[400px]">Nome da Conta</TableHead>
                                    <TableHead>Código</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Natureza</TableHead>
                                    <TableHead className="w-[64px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rootAccounts.length > 0 ? (
                                    rootAccounts.map(account => (
                                        <AccountRow 
                                            key={account.id}
                                            account={account}
                                            allAccounts={accounts}
                                            level={0}
                                            onEdit={handleEditClick}
                                            onDelete={handleDeleteClick}
                                        />
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">Nenhuma conta cadastrada.</TableCell>
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
                        <AlertDialogDescription>Essa ação não pode ser desfeita e excluirá permanentemente a conta <span className='font-bold'>"{itemToDelete?.name}"</span>.</AlertDialogDescription>
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

interface AccountRowProps {
    account: Account;
    allAccounts: Account[];
    level: number;
    onEdit: (account: Account) => void;
    onDelete: (account: Account) => void;
}

function AccountRow({ account, allAccounts, level, onEdit, onDelete }: AccountRowProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const children = useMemo(() => allAccounts.filter(a => a.parentId === account.id), [allAccounts, account.id]);
    const hasChildren = children.length > 0;

    return (
        <>
            <TableRow>
                <TableCell style={{ paddingLeft: `${level * 24 + 16}px` }}>
                    <div className="flex items-center gap-2">
                        {hasChildren ? (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsExpanded(!isExpanded)}>
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                        ) : <div className="w-6"></div>}
                        <span className={cn(account.type === 'Sintética' && 'font-semibold')}>{account.name}</span>
                    </div>
                </TableCell>
                <TableCell>{account.code}</TableCell>
                <TableCell>{account.type}</TableCell>
                <TableCell>{account.nature}</TableCell>
                <TableCell>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(account)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(account)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
            {isExpanded && hasChildren && children.map(child => (
                <AccountRow
                    key={child.id}
                    account={child}
                    allAccounts={allAccounts}
                    level={level + 1}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </>
    );
}

interface AccountFormProps {
    onSave: (account: Omit<Account, 'id'>) => void;
    onOpenChange: (open: boolean) => void;
    accounts: Account[];
    account: Account | null;
}

function AccountForm({ onSave, onOpenChange, accounts, account }: AccountFormProps) {
    const { toast } = useToast();
    const [parentId, setParentId] = useState<string | undefined>(undefined);
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [type, setType] = useState<AccountType>('Analítica');
    const [nature, setNature] = useState<AccountNature>('Devedora');
    
    const syntheticAccounts = useMemo(() => accounts.filter(a => a.type === 'Sintética'), [accounts]);

     React.useEffect(() => {
        if (account) {
            setParentId(account.parentId?.toString());
            setCode(account.code);
            setName(account.name);
            setType(account.type);
            setNature(account.nature);
        } else {
            // Reset form
            setParentId(undefined);
            setCode('');
            setName('');
            setType('Analítica');
            setNature('Devedora');
        }
    }, [account]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || !name || !type || !nature) {
            toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Por favor, preencha todos os campos.' });
            return;
        }
        
        onSave({ 
            parentId: parentId ? Number(parentId) : null,
            code,
            name,
            type,
            nature,
            status: 'Ativa'
        });
    };
    
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{account ? 'Editar' : 'Nova'} Conta</DialogTitle>
                <DialogDescription>Preencha os dados da conta contábil.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="parentId">Conta Pai</Label>
                    <Select value={parentId} onValueChange={setParentId}>
                        <SelectTrigger id="parentId"><SelectValue placeholder="Nenhuma (Conta Raiz)" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="null">Nenhuma (Conta Raiz)</SelectItem>
                            {syntheticAccounts.map(p => (
                                <SelectItem key={p.id} value={p.id.toString()}>{p.code} - {p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">Código</Label>
                        <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select value={type} onValueChange={(v) => setType(v as AccountType)} required>
                            <SelectTrigger id="type"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Analítica">Analítica</SelectItem>
                                <SelectItem value="Sintética">Sintética</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="name">Nome da Conta</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="nature">Natureza</Label>
                    <Select value={nature} onValueChange={(v) => setNature(v as AccountNature)} required>
                        <SelectTrigger id="nature"><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Devedora">Devedora</SelectItem>
                            <SelectItem value="Credora">Credora</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit">Salvar</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}

    