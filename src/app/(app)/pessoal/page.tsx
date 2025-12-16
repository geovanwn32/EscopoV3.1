
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, CalendarOff, HandCoins, UserMinus, Briefcase, Users, FileText, PiggyBank, FolderKanban, AlertTriangle, ArrowRightCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import RecentCalculations from './recent-calculations';
import ReportGeneratorDialog from './report-generator';
import { useCompany } from '@/hooks/use-company';
import { useMemo, useState } from 'react';
import { Funcionario, SavedCalculation } from '@/types/pessoal';
import PayrollKpiCard from './PayrollKpiCard';
import PayrollEvolutionChart from './PayrollEvolutionChart';
import { addDays, differenceInDays, isBefore } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';


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
        icon: <Briefcase className="h-8 w-8" />,
        label: 'RCI (Pró-labore)',
        description: 'Calcule o Recibo de Pagamento de Autônomo ou pró-labore.',
        color: "text-indigo-600 bg-indigo-100/80 group-hover:bg-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 dark:group-hover:bg-indigo-500",
    },
];


export default function PessoalPage() {
    const { useScopedData } = useCompany();
    const [savedCalculations] = useScopedData<SavedCalculation[]>('pessoal-calculos-salvos', []);
    const [funcionarios] = useScopedData<Funcionario[]>('cadastros-funcionarios', []);
    const [period, setPeriod] = useState<"6" | "8" | "12">("8");


    const kpiData = useMemo(() => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthString = `${String(lastMonth.getMonth() + 1).padStart(2, '0')}/${lastMonth.getFullYear()}`;

        const lastMonthCalculations = savedCalculations.filter(c => c.mesCompetencia === lastMonthString);

        const custoFolha = lastMonthCalculations.reduce((acc, c) => acc + c.netValue, 0);
        const totalProventos = lastMonthCalculations.reduce((acc, c) => acc + (c.calculation?.totalProventos || 0), 0);
        const totalDescontos = lastMonthCalculations.reduce((acc, c) => acc + (c.calculation?.totalDescontos || 0), 0);
        
        return {
            custoFolha,
            totalProventos,
            totalDescontos,
            funcionariosAtivos: funcionarios.length
        };
    }, [savedCalculations, funcionarios]);

    const chartData = useMemo(() => {
        const numMonths = parseInt(period);
        const months = Array.from({ length: numMonths }, (_, i) => {
            const d = new Date();
            d.setDate(1);
            d.setMonth(d.getMonth() - i);
            return { 
                month: d.toLocaleString('default', { month: 'short' }), 
                year: d.getFullYear(), 
                proventos: 0,
                descontos: 0,
            };
        }).reverse();
    
        savedCalculations.forEach(c => {
            if (c.mesCompetencia) {
                const [calcMonth, calcYear] = c.mesCompetencia.split('/');
                const monthDate = new Date(parseInt(calcYear), parseInt(calcMonth) - 1, 1);
                const monthStr = monthDate.toLocaleString('default', { month: 'short' });
                const monthData = months.find(m => m.month === monthStr && m.year === parseInt(calcYear));
                
                if (monthData && c.calculation) {
                    monthData.proventos += c.calculation.totalProventos;
                    monthData.descontos += c.calculation.totalDescontos;
                }
            }
        });
    
        return months.map(({ month, proventos, descontos }) => ({ month, proventos, descontos }));
    }, [savedCalculations, period]);
    
    const notifications = useMemo(() => {
        const today = new Date();
        const upcomingVacations = funcionarios.map(f => {
            const admissionDate = new Date(f.dataAdmissao);
            const oneYearAgo = new Date(today);
            oneYearAgo.setFullYear(today.getFullYear() - 1);
            
            if (isBefore(admissionDate, oneYearAgo)) {
                 const daysSinceAdmission = differenceInDays(today, admissionDate);
                 const vacationPeriods = Math.floor(daysSinceAdmission / 365);
                 const nextDueDate = addDays(admissionDate, (vacationPeriods + 1) * 365 - 30);
                
                if(isBefore(nextDueDate, today)) {
                    return {
                        id: `vac-${f.id}`,
                        type: 'vacation-due' as const,
                        title: `Férias Vencidas`,
                        description: `As férias de ${f.nome} estão vencidas.`,
                        priority: 'urgent' as const,
                        link: `/funcionarios`,
                    }
                } else if(differenceInDays(nextDueDate, today) <= 30) {
                     return {
                        id: `vac-${f.id}`,
                        type: 'vacation-upcoming' as const,
                        title: `Férias a Vencer`,
                        description: `As férias de ${f.nome} vencem em ${differenceInDays(nextDueDate, today)} dias.`,
                        priority: 'warning' as const,
                        link: `/funcionarios`,
                    }
                }
            }
            return null;
        }).filter(Boolean);

        return upcomingVacations;
    }, [funcionarios]);

     const getNotificationIcon = (priority: 'urgent' | 'warning') => {
        return <AlertTriangle className={cn("h-6 w-6", priority === 'urgent' ? 'text-destructive' : 'text-amber-500')} />;
    };


    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Departamento Pessoal</h1>
                <p className="text-muted-foreground">
                    Painel com indicadores, calculadoras e relatórios do seu departamento pessoal.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <PayrollKpiCard title="Custo da Folha (Mês Anterior)" value={kpiData.custoFolha} icon={<PiggyBank />} formatAsCurrency />
                <PayrollKpiCard title="Total Proventos (Mês Anterior)" value={kpiData.totalProventos} icon={<FileText />} formatAsCurrency />
                <PayrollKpiCard title="Total Descontos (Mês Anterior)" value={kpiData.totalDescontos} icon={<FileText />} formatAsCurrency />
                <PayrollKpiCard title="Funcionários Ativos" value={kpiData.funcionariosAtivos} icon={<Users />} />
            </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Evolução da Folha de Pagamento</CardTitle>
                        <CardDescription>Proventos e Descontos dos últimos meses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PayrollEvolutionChart data={chartData} period={period} onPeriodChange={setPeriod} />
                    </CardContent>
                </Card>
                 <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Avisos & Lembretes</span>
                                 {notifications.length > 0 && (
                                    <span className="flex items-center text-sm font-medium text-muted-foreground">
                                        <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                                        {notifications.length} Pendência(s)
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[150px]">
                            {notifications.length > 0 ? (
                                <ScrollArea className="h-full">
                                    <div className="space-y-3">
                                    {notifications.map(notification => (
                                        <div key={notification!.id} className="flex items-center gap-4 rounded-lg border p-3">
                                            {getNotificationIcon(notification!.priority)}
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm">{notification!.title}</p>
                                                <p className="text-xs text-muted-foreground">{notification!.description}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={notification!.link}>
                                                    <ArrowRightCircle className="h-5 w-5 text-muted-foreground" />
                                                </Link>
                                            </Button>
                                        </div>
                                    ))}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                                    <p>Nenhum aviso no momento.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Acesso Rápido</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-2">
                            <Button asChild size="lg">
                                <Link href="/pessoal/folha-de-pagamento"><Calculator className="mr-2 h-5 w-5" /> Nova Folha de Pagamento</Link>
                            </Button>
                            <Button asChild size="lg" variant="outline">
                                 <Link href="/funcionarios"><Users className="mr-2 h-5 w-5" /> Gerenciar Funcionários</Link>
                            </Button>
                             <ReportGeneratorDialog />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Outras Calculadoras</CardTitle>
                    <CardDescription>Ferramentas para cálculos específicos do departamento pessoal.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
