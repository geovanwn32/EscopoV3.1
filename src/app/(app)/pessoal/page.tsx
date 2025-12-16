
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, CalendarOff, HandCoins, UserMinus, Percent, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import RecentCalculations from './recent-calculations';
import ReportGeneratorDialog from './report-generator';


const calculators = [
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


export default function PessoalPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Departamento Pessoal</h1>
                <p className="text-muted-foreground">
                    Visão geral e acesso rápido aos cálculos e cadastros do departamento pessoal.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Folha de Pagamento</CardTitle>
                        <CardDescription>Calcule a folha de pagamento mensal de seus funcionários de forma detalhada.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild size="lg">
                            <Link href="/pessoal/folha-de-pagamento">
                                <Calculator className="mr-2 h-5 w-5" /> Abrir Calculadora da Folha
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Relatório Mensal de Cálculos</CardTitle>
                        <CardDescription>Gere um PDF consolidado com todos os cálculos de um determinado mês.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ReportGeneratorDialog />
                    </CardContent>
                </Card>
            </div>


            <Card>
                <CardHeader>
                    <CardTitle>Outros Cálculos e Cadastros</CardTitle>
                    <CardDescription>Acesse outras ferramentas e cadastros essenciais do departamento pessoal.</CardDescription>
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
