'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Library, Bot, FileInput, BarChartHorizontal } from 'lucide-react';
import Link from 'next/link';

const contabilItens = [
    {
        href: '/contabil/plano-de-contas',
        icon: <Library className="h-8 w-8" />,
        label: 'Plano de Contas',
        description: 'Gerencie a estrutura de contas contábeis da sua empresa.',
        color: "text-gray-600 bg-gray-100/80 group-hover:bg-gray-600 dark:bg-gray-700/40 dark:text-gray-400 dark:group-hover:bg-gray-500",
    },
    {
        href: '/contabil/lancamentos',
        icon: <Bot className="h-8 w-8" />,
        label: 'Lançamentos Contábeis (IA)',
        description: 'Use o assistente de IA para sugerir descrições para seus lançamentos.',
        color: "text-violet-600 bg-violet-100/80 group-hover:bg-violet-600 dark:bg-violet-900/40 dark:text-violet-400 dark:group-hover:bg-violet-500",
    },
    {
        href: '/contabil/importacao-extrato',
        icon: <FileInput className="h-8 w-8" />,
        label: 'Importação de Extrato (IA)',
        description: 'Importe seu extrato e deixe a IA sugerir as contas contábeis.',
        color: "text-sky-600 bg-sky-100/80 group-hover:bg-sky-600 dark:bg-sky-900/40 dark:text-sky-400 dark:group-hover:bg-sky-500",
    },
    {
        href: '/contabil/relatorios-contabeis',
        icon: <BarChartHorizontal className="h-8 w-8" />,
        label: 'Relatórios Contábeis',
        description: 'Gere Balancete, DRE, Balanço Patrimonial e outros.',
        color: "text-rose-600 bg-rose-100/80 group-hover:bg-rose-600 dark:bg-rose-900/40 dark:text-rose-400 dark:group-hover:bg-rose-500",
    },
];

export default function ContabilPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Módulo Contábil</h1>
                <p className="text-muted-foreground">
                    Gerencie seu plano de contas, realize lançamentos assistidos por IA e emita relatórios essenciais.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Central Contábil</CardTitle>
                    <CardDescription>Selecione uma das opções abaixo para gerenciar.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contabilItens.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <div className="group flex h-full cursor-pointer flex-col gap-2 rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                                <div className={`rounded-full p-3 transition-colors group-hover:text-primary-foreground self-start ${item.color}`}>
                                    {item.icon}
                                </div>
                                <h3 className="text-lg font-semibold">{item.label}</h3>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                        </Link>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
