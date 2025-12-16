

'use client';
import { useState, useMemo, useEffect } from 'react';
import { MoreHorizontal, Plus, Search, Trash2, Pencil, ArrowLeft, ShieldCheck, ShieldAlert, Building, KeyRound, User as UserIcon, Save, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useCompany, type Company } from '@/hooks/use-company';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AuditLog, logAudit } from '@/lib/audit-log';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useCompanyUsers } from '@/hooks/use-company-users';

const modules = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'fiscal', label: 'Fiscal' },
    { id: 'pessoal', label: 'Pessoal' },
    { id: 'contabil', label: 'Contábil' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'cadastros', label: 'Cadastros' },
    { id: 'conectividade', label: 'Conectividade' },
    { id: 'utilitarios', label: 'Utilitários' },
];

interface UserPermissions {
    [key: string]: boolean;
}

interface User {
    id: string;
    uid?: string;
    name: string;
    email: string;
    isAdmin: boolean;
    isMaster?: boolean;
    permissions: UserPermissions;
    allowedCompanyIds: string[];
    password?: string;
    status: 'Ativo' | 'Inativo' | 'Pendente';
    planoId?: 'Gratuito' | 'Basico' | 'Profissional' | 'Empresarial';
    statusLicenca?: 'Ativa' | 'Inadimplente' | 'Cancelada' | 'Expirada';
    photoURL?: string;
}


export default function UsuariosPage() {
    const { toast } = useToast();
    const { companies, currentCompany: currentCompanyId } = useCompany();
    const firestore = useFirestore();
    const { user: firebaseUser } = useUser();

    const { users } = useCompanyUsers(currentCompanyId);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<User | null>(null);
    const [editingItem, setEditingItem] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeProfile, setActiveProfile] = useState<User | null>(null);


    useEffect(() => {
        if (firebaseUser && users) {
           const profile = users.find(u => u.uid === firebaseUser.uid);
           if (profile) {
             setActiveProfile(profile);
           }
        }
    }, [firebaseUser, users]);

    const handleSave = async (itemData: Omit<User, 'id'>) => {
        if (!currentCompanyId) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Nenhuma empresa ativa selecionada.' });
            return;
        }

        const action = editingItem ? 'UPDATE' : 'CREATE';
        let logDetails = '';

        try {
            if (editingItem) {
                 const userDocRef = doc(firestore, "empresas", String(currentCompanyId), "usuarios", editingItem.id);
                
                const updatePayload: Partial<User> = {
                    name: itemData.name,
                    email: itemData.email,
                    isAdmin: itemData.isAdmin,
                    isMaster: itemData.isMaster,
                    permissions: itemData.permissions,
                    allowedCompanyIds: itemData.allowedCompanyIds,
                    status: itemData.status,
                    planoId: itemData.planoId,
                    statusLicenca: itemData.statusLicenca,
                };
                
                await updateDoc(userDocRef, updatePayload);

                toast({ title: "Usuário Atualizado!", description: "Os dados do usuário foram atualizados." });
                logDetails = `Atualizou o usuário "${itemData.name}".`;

            } else {
                const newId = String(Date.now());
                 const newItem: User = { 
                    ...itemData, 
                    id: newId, 
                    uid: firebaseUser?.uid || undefined,
                    status: 'Pendente', // Always starts as pending
                };
                const userDocRef = doc(firestore, "empresas", String(currentCompanyId), "usuarios", newId);
                await setDoc(userDocRef, newItem);
                
                toast({ title: "Convite Enviado!", description: "O usuário foi convidado. Ele precisará se cadastrar com o mesmo e-mail para ativar a conta." });
                logDetails = `Convidou o usuário "${itemData.name}" (${itemData.email}).`;
            }

            // logAudit(setAuditLogs, action, 'Usuários', logDetails);

        } catch(e: any) {
            console.error("Error saving user: ", e);
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: e.message });
        }


        setIsDialogOpen(false);
        setEditingItem(null);
    };


    const handleDeleteClick = (item: User) => {
        if (item.isMaster) {
             toast({
                variant: 'destructive',
                title: 'Ação não permitida',
                description: 'Não é possível excluir o perfil Master.',
            });
            return;
        }
        if (item.isAdmin && users && users.filter(u => u.isAdmin && !u.isMaster).length <= 1 && users.some(u => u.isMaster)) {
             toast({
                variant: 'destructive',
                title: 'Ação não permitida',
                description: 'Não é possível excluir o único perfil de administrador.',
            });
            return;
        }
        setItemToDelete(item);
    };

    const handleConfirmDelete = async () => {
        if (itemToDelete && currentCompanyId) {
            try {
                const userDocRef = doc(firestore, "empresas", String(currentCompanyId), "usuarios", itemToDelete.id);
                await deleteDoc(userDocRef);
                toast({ variant: "destructive", title: "Usuário Removido!", description: `O acesso do usuário foi removido.` });
                // logAudit(setAuditLogs, 'DELETE', 'Usuários', `Removeu o usuário "${itemToDelete.name}".`);
            } catch (e: any) {
                console.error("Error deleting user: ", e);
                toast({ variant: 'destructive', title: 'Erro ao remover', description: e.message });
            }
            setItemToDelete(null);
        }
    };
    
    const handleEditClick = (item: User) => {
        setEditingItem(item);
        setIsDialogOpen(true);
    };

    const handleNewUserClick = () => {
        setEditingItem(null);
        setIsDialogOpen(true);
    }
    
    const handleMyProfileSave = async (newPassword: string) => {
        if (!activeProfile || !currentCompanyId) return;

        const updatedProfile = { password: newPassword };

        try {
            const userDocRef = doc(firestore, "empresas", String(currentCompanyId), "usuarios", activeProfile.id);
            await updateDoc(userDocRef, updatedProfile);
            toast({ title: "Senha Atualizada!", description: "Sua senha de acesso foi alterada com sucesso." });
            // logAudit(setAuditLogs, 'UPDATE', 'Meu Perfil', 'Alterou a própria senha.');
        } catch (e: any) {
            console.error("Error updating password: ", e);
            toast({ variant: 'destructive', title: 'Erro ao atualizar', description: e.message });
        }
    };


    const filteredItems = useMemo(() => {
        if (!users) return [];
        return users.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.email.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => a.name.localeCompare(b.name));
    }, [users, searchTerm]);

    const renderPermissions = (user: User) => {
        if (user.isMaster) {
            return <Badge><Crown className="mr-1 h-3 w-3" /> Master</Badge>;
        }
        if (user.isAdmin) {
            return <Badge>Administrador</Badge>;
        }
        if (user.planoId) {
             return <Badge variant="secondary">{user.planoId}</Badge>
        }
        return <Badge variant="outline">Sem Plano</Badge>
    }

    if (!activeProfile) {
        return (
            <div className="space-y-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Usuários e Perfis</h1>
                </div>
                <Card>
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2 text-muted-foreground">
                            <ShieldAlert className="h-6 w-6" /> Carregando...
                        </CardTitle>
                        <CardDescription>
                            Verificando suas permissões de acesso.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const getStatusBadgeVariant = (status: User['status']) => {
        switch (status) {
            case 'Ativo': return 'default';
            case 'Inativo': return 'destructive';
            case 'Pendente': return 'secondary';
            default: return 'outline';
        }
    };

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
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Usuários e Perfis</h1>
                    <p className="text-muted-foreground">Gerencie os usuários do sistema, seus perfis de acesso e permissões.</p>
                </div>
            </div>

            {activeProfile.isAdmin || activeProfile.isMaster ? (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Usuários</CardTitle>
                                <CardDescription>{users?.length || 0} usuários encontrados.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-grow">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Buscar por nome ou e-mail..." className="pl-9 w-full sm:w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setEditingItem(null); }}>
                                    <DialogTrigger asChild>
                                        <Button onClick={handleNewUserClick}><Plus className="mr-2 h-4 w-4" /> Convidar Usuário</Button>
                                    </DialogTrigger>
                                    <ItemForm 
                                        onSave={handleSave} 
                                        onOpenChange={setIsDialogOpen}
                                        item={editingItem}
                                        users={users || []}
                                        activeProfile={activeProfile}
                                        allCompanies={companies}
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
                                        <TableHead>Email</TableHead>
                                        <TableHead>Plano/Perfil</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-[64px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.length > 0 ? filteredItems.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>{item.email}</TableCell>
                                            <TableCell>
                                            {renderPermissions(item)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(item.status)}>{item.status}</Badge>
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
                                                            <Trash2 className="mr-2 h-4 w-4" />Remover Acesso
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">Nenhum usuário encontrado.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <MyProfileCard profile={activeProfile} onSave={handleMyProfileSave} />
            )}

            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>Essa ação não pode ser desfeita e removerá o acesso do usuário à empresa.</AlertDialogDescription>
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

// FORMULÁRIO DO ADMINISTRADOR
interface ItemFormProps {
    onSave: (item: Omit<User, 'id'>) => void;
    onOpenChange: (open: boolean) => void;
    item: User | null;
    users: User[];
    activeProfile: User;
    allCompanies: Company[];
}

const initialPermissions = modules.reduce((acc, module) => {
    acc[module.id] = false;
    return acc;
}, {} as UserPermissions);

const initialFormState: Omit<User, 'id'> = {
    name: '',
    email: '',
    isAdmin: false,
    isMaster: false,
    permissions: initialPermissions,
    allowedCompanyIds: [],
    status: 'Pendente',
    planoId: 'Gratuito',
    statusLicenca: 'Ativa'
};

function ItemForm({ onSave, onOpenChange, item, users, activeProfile, allCompanies }: ItemFormProps) {
    const { toast } = useToast();
    const [formData, setFormData] = useState(initialFormState);

    const otherAdminExists = useMemo(() => {
        return users.some(user => user.isAdmin && user.id !== item?.id);
    }, [users, item]);

    const otherMasterExists = useMemo(() => {
        return users.some(user => user.isMaster && user.id !== item?.id);
    }, [users, item]);

    useEffect(() => {
        if (item) {
            setFormData({
                uid: item.uid || '',
                name: item.name || '',
                email: item.email || '',
                isAdmin: item.isAdmin || false,
                isMaster: item.isMaster || false,
                permissions: item.permissions || initialPermissions,
                allowedCompanyIds: item.allowedCompanyIds || [],
                status: item.status || 'Ativo',
                planoId: item.planoId || 'Gratuito',
                statusLicenca: item.statusLicenca || 'Ativa'
            });
        } else {
            setFormData(initialFormState);
        }
    }, [item]);
    
    const handleInputChange = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleCompanyAccessChange = (companyId: string, isChecked: boolean) => {
        setFormData(prev => {
            const currentIds = prev.allowedCompanyIds || [];
            if (isChecked) {
                return { ...prev, allowedCompanyIds: [...currentIds, companyId] };
            } else {
                return { ...prev, allowedCompanyIds: currentIds.filter(id => id !== companyId) };
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email) {
            toast({
                variant: 'destructive',
                title: 'Campos Obrigatórios',
                description: 'Por favor, preencha o nome e o e-mail.'
            });
            return;
        }
        onSave(formData);
    };
    
    const isEditingSelf = item?.id === activeProfile.id;

    return (
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>{item ? 'Editar' : 'Convidar'} Usuário</DialogTitle>
                <DialogDescription>
                    {item ? 'Edite os dados e o perfil de acesso do usuário.' : 'Preencha os dados para convidar um novo usuário. Ele precisará se cadastrar com o mesmo e-mail para ativar a conta.'}
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="planoId">Plano Contratado</Label>
                        <Select value={formData.planoId} onValueChange={(value) => handleInputChange('planoId', value)}>
                            <SelectTrigger id="planoId"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Gratuito">Gratuito</SelectItem>
                                <SelectItem value="Basico">Básico</SelectItem>
                                <SelectItem value="Profissional">Profissional</SelectItem>
                                <SelectItem value="Empresarial">Empresarial</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="statusLicenca">Status da Licença</Label>
                            <Select value={formData.statusLicenca} onValueChange={(value) => handleInputChange('statusLicenca', value)}>
                            <SelectTrigger id="statusLicenca"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Ativa">Ativa</SelectItem>
                                <SelectItem value="Inadimplente">Inadimplente</SelectItem>
                                <SelectItem value="Cancelada">Cancelada</SelectItem>
                                <SelectItem value="Expirada">Expirada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Separator />

                {!formData.isAdmin && !formData.isMaster && (
                    <div className="space-y-3">
                        <Label className="flex items-center"><Building className="mr-2 h-4 w-4" /> Acesso às Empresas</Label>
                        <div className="max-h-32 overflow-y-auto space-y-2 rounded-md border p-2">
                            {allCompanies.map(company => (
                                <div key={company.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`company-${company.id}`}
                                        checked={formData.allowedCompanyIds?.includes(String(company.id))}
                                        onCheckedChange={(checked) => handleCompanyAccessChange(String(company.id), !!checked)}
                                    />
                                    <label htmlFor={`company-${company.id}`} className="text-sm font-medium leading-none">
                                        {company.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {activeProfile.isAdmin && isEditingSelf && (
                     <div className="space-y-2 flex items-center justify-between rounded-lg border p-3 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900">
                        <div className='space-y-0.5'>
                            <Label htmlFor="isMasterSwitch" className='flex items-center text-amber-900 dark:text-amber-300'><Crown className='mr-2 h-4 w-4' />Perfil Master</Label>
                            <p className='text-xs text-amber-700 dark:text-amber-500'>
                                Concede acesso irrestrito e impede a própria exclusão.
                            </p>
                        </div>
                        <Switch
                            id="isMasterSwitch"
                            checked={!!formData.isMaster}
                            onCheckedChange={(checked) => handleInputChange('isMaster', checked)}
                            disabled={otherMasterExists}
                        />
                    </div>
                )}
                 {activeProfile.isMaster && (
                     <div className="space-y-2 flex items-center justify-between rounded-lg border p-3">
                        <div className='space-y-0.5'>
                            <Label htmlFor="isAdmin" className='flex items-center'><ShieldCheck className='mr-2 h-4 w-4 text-primary' />Perfil de Administrador</Label>
                            <p className='text-xs text-muted-foreground'>
                                Concede acesso total a todos os módulos e empresas.
                            </p>
                        </div>
                        <Switch
                            id="isAdmin"
                            checked={formData.isAdmin}
                            onCheckedChange={(checked) => handleInputChange('isAdmin', checked)}
                            disabled={item?.isMaster || (item?.isAdmin && !otherAdminExists)}
                        />
                    </div>
                 )}
                <div className="space-y-2 flex items-center justify-between rounded-lg border p-3">
                    <div className='space-y-0.5'>
                        <Label htmlFor="status" className='flex items-center'>Status do Usuário</Label>
                        <p className='text-xs text-muted-foreground'>
                           Usuários inativos não podem acessar o sistema.
                        </p>
                    </div>
                    <Switch
                        id="status"
                        checked={formData.status === 'Ativo'}
                        onCheckedChange={(checked) => handleInputChange('status', checked ? 'Ativo' : 'Inativo')}
                        disabled={isEditingSelf && (formData.isAdmin || !!formData.isMaster)}
                    />
                </div>
                
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit">{item ? 'Salvar' : 'Convidar'}</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}

// CARD DO USUÁRIO SECUNDÁRIO
interface MyProfileCardProps {
    profile: User;
    onSave: (newPassword: string) => void;
}

function MyProfileCard({ profile, onSave }: MyProfileCardProps) {
    const { toast } = useToast();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword) {
            toast({ variant: 'destructive', title: 'Campos vazios', description: 'Por favor, preencha a nova senha e a confirmação.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ variant: 'destructive', title: 'Senhas não coincidem', description: 'A nova senha e a confirmação devem ser iguais.' });
            return;
        }
        if (newPassword.length < 6) {
            toast({ variant: 'destructive', title: 'Senha muito curta', description: 'A senha deve ter pelo menos 6 caracteres.' });
            return;
        }
        onSave(newPassword);
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'><UserIcon className='h-6 w-6' /> Meu Perfil</CardTitle>
                <CardDescription>Visualize seus dados e altere sua senha de acesso.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input value={profile.name} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={profile.email} disabled />
                        </div>
                    </div>
                    <Separator />
                    <h3 className="font-medium text-primary pt-2">Alterar Senha</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">Nova Senha</Label>
                            <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder='••••••'/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                            <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder='••••••'/>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Nova Senha
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

    

    

