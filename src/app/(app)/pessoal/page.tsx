
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, CalendarOff, HandCoins, UserMinus, Percent, Briefcase, History, MoreVertical, FileDown, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useCompany } from '@/hooks/use-company';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { SavedCalculation } from '@/types/pessoal';
import { useRouter } from 'next/navigation';

const calculators = [
    {
        href: '/pessoal/folha-de-pagamento',
        icon: <Calculator className="h-8 w-8" />,
        label: 'Folha de Pagamento',
        description: 'Calcule a folha de pagamento mensal de seus funcionários.',
        color: "text-sky-600 bg-sky-100/80 group-hover:bg-sky-600 dark:bg-sky-900/40 dark:text-sky-400 dark:group-hover:bg-sky-500",
    },
    {
        href: '/pessoal/ferias',
        icon: <CalendarOff className="h-8 w-8" />,
        label: 'Férias',
        description: 'Calcule férias, abono e adiantamento de 13º salário.',
        color: "text-emerald-600 bg-emerald-100/80 group-hover:bg-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 dark:group-hover:bg-emerald-500",
    },
    {
        href: '/pessoal/13-salario',
        icon: <HandCoins className="h-8 w-8" />,
        label: '13º Salário',
        description: 'Calcule a 1ª, 2ª ou parcela única do 13º salário.',
        color: "text-amber-600 bg-amber-100/80 group-hover:bg-amber-600 dark:bg-amber-900/40 dark:text-amber-400 dark:group-hover:bg-amber-500",
    },
    {
        href: '/pessoal/rescisao',
        icon: <UserMinus className="h-8 w-8" />,
        label: 'Rescisão',
        description: 'Calcule a rescisão de contrato de trabalho (TRCT).',
        color: "text-red-600 bg-red-100/80 group-hover:bg-red-600 dark:bg-red-900/40 dark:text-red-400 dark:group-hover:bg-red-500",
    },
    {
        href: '/pessoal/rci',
        icon: <Percent className="h-8 w-8" />,
        label: 'RCI (Pró-labore)',
        description: 'Calcule o Recibo de Pagamento de Autônomo ou pró-labore.',
        color: "text-indigo-600 bg-indigo-100/80 group-hover:bg-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 dark:group-hover:bg-indigo-500",
    },
    {
        href: '/funcionarios',
        icon: <Briefcase className="h-8 w-8" />,
        label: 'Funcionários',
        description: 'Gerencie os dados dos seus colaboradores.',
        color: "text-slate-600 bg-slate-100/80 group-hover:bg-slate-600 dark:bg-slate-700/40 dark:text-slate-400 dark:group-hover:bg-slate-500",
    },
]

function RecentCalculations() {
    const router = useRouter();
    const { useScopedData } = useCompany();
    const [savedCalculations, setSavedCalculations] = useScopedData<SavedCalculation[]>('pessoal-calculos-salvos', []);
    
    const handleEdit = (calc: SavedCalculation) => {
        sessionStorage.setItem('edit-calculation', JSON.stringify(calc));
        if (calc.type === 'RCI') {
            router.push('/pessoal/rci');
        } else if (calc.type === 'Folha') {
            router.push('/pessoal/folha-de-pagamento');
        }
    };

    return (
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
                                                    <DropdownMenuItem>
                                                        <FileDown className="mr-2 h-4 w-4" /> Baixar PDF
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        Nenhum cálculo salvo ainda.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}


export default function PessoalPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Departamento Pessoal</h1>
                <p className="text-muted-foreground">
                    Visão geral e acesso rápido aos cálculos e cadastros do departamento pessoal.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Central de Cálculos e Cadastros</CardTitle>
                    <CardDescription>Selecione uma das opções abaixo para começar.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {calculators.map((util) => (
                        <Link key={util.href} href={util.href}>
                            <div className="group flex h-full cursor-pointer flex-col gap-2 rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                                <div className={`rounded-full p-3 transition-colors group-hover:text-primary-foreground self-start ${util.color}`}>
                                    {util.icon}
                                </div>
                                <h3 className="text-lg font-semibold">{util.label}</h3>
                                <p className="text-sm text-muted-foreground">{util.description}</p>
                            </div>
                        </Link>
                    ))}
                </CardContent>
            </Card>

            <RecentCalculations />
        </div>
    );
}
