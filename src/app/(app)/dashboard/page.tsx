

'use client';

import { Settings, User, Briefcase, FileText, ArrowRight, MoreHorizontal, AlertTriangle, CheckCircle, ArrowRightCircle, ArrowDownRight, ArrowUpRight, Clock } from 'lucide-react';
import { useCompany } from '@/hooks/use-company';
import KpiCard from '@/components/dashboard/kpi-card';
import ResultsChart from '@/components/dashboard/results-chart';
import { useMemo, useState } from 'react';
import { Conta } from '@/types/financeiro';
import { NotaFiscal } from '@/types/fiscal';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DonutChart } from '@/components/ui/donut-chart';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { addDays, isBefore, isToday } from 'date-fns';

const defaultKpiSettings = [
  { id: 'faturamento', title: 'Faturamento', enabled: true },
  { id: 'despesas', title: 'Compras/Despesas', enabled: true },
  { id: 'notas', title: 'Notas Emitidas', enabled: true },
  { id: 'resultado', title: 'Resultado', enabled: true },
];

export default function DashboardPage() {
  const { useScopedData } = useCompany();
  
  const [contasReceber] = useScopedData<Conta[]>('financeiro-contas-a-receber', []);
  const [contasPagar] = useScopedData<Conta[]>('financeiro-contas-a-pagar', []);
  const [notasSaida] = useScopedData<NotaFiscal[]>('fiscal-notasSaida', []);
  const [notasServico] = useScopedData<NotaFiscal[]>('fiscal-notasServico', []);
  const [period, setPeriod] = useState<"6" | "8" | "12">("8");


  const kpiData = useMemo(() => {
    const faturamento = contasReceber
        .filter(c => c.status === 'Recebido')
        .reduce((acc, c) => acc + c.amount, 0);

    const despesas = contasPagar
        .reduce((acc, c) => acc + c.amount, 0);

    const notasEmitidas = notasSaida.length + notasServico.length;
    const resultado = faturamento - despesas;
    
    return { faturamento, despesas, notasEmitidas, resultado };
  }, [contasReceber, contasPagar, notasSaida, notasServico]);

   const chartData = useMemo(() => {
    const numMonths = parseInt(period);
    const months = Array.from({ length: numMonths }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return { month: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear(), revenue: 0, expenses: 0 };
    }).reverse();

    contasReceber.forEach(c => {
        if (c.status === 'Recebido') {
            const date = new Date(c.dueDate);
            const monthStr = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            const monthData = months.find(m => m.month === monthStr && m.year === year);
            if (monthData) {
                monthData.revenue += c.amount;
            }
        }
    });

    contasPagar.forEach(c => {
        const date = new Date(c.dueDate);
        const monthStr = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        const monthData = months.find(m => m.month === monthStr && m.year === year);
        if (monthData) {
            monthData.expenses += c.amount;
        }
    });

    return months.map(({ month, revenue, expenses }) => ({ month, revenue, expenses }));
}, [contasReceber, contasPagar, period]);
  
  const allKpis = [
      { id: 'faturamento', title: 'Faturamento', value: kpiData.faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'}), icon: <User/>, variant: 'default' },
      { id: 'despesas', title: 'Compras/Despesas', value: kpiData.despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'}), icon: <Briefcase/>, variant: 'default' },
      { id: 'notas', title: 'Notas Emitidas', value: kpiData.notasEmitidas.toString(), icon: <FileText />, variant: 'default' },
      { id: 'resultado', title: 'Resultado', value: kpiData.resultado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'}), icon: <ArrowRight />, variant: 'primary' },
  ] as const;
  
  const allNotifications = useMemo(() => {
    const today = new Date();
    const nextWeek = addDays(today, 7);

    const overdueReceivables = contasReceber
      .filter(c => c.status === 'Atrasado')
      .map(c => ({
        id: `cr-${c.id}`,
        type: 'overdue-receivable' as const,
        title: 'Conta atrasada',
        description: `${c.description} - ${c.partnerName}`,
        amount: c.amount,
        link: '/financeiro/contas-a-receber',
        priority: 'urgent' as const,
      }));

    const upcomingPayments = contasPagar
      .filter(c => {
        const dueDate = new Date(c.dueDate);
        return (isToday(dueDate) || isBefore(dueDate, nextWeek)) && c.status === 'Pendente';
      })
      .map(c => ({
        id: `cp-${c.id}`,
        type: 'upcoming-payment' as const,
        title: 'Pagamento próximo',
        description: `${c.description} - ${c.partnerName}`,
        amount: c.amount,
        link: '/financeiro/contas-a-pagar',
        priority: 'warning' as const,
      }));

    return [...overdueReceivables, ...upcomingPayments];
  }, [contasReceber, contasPagar]);


  const getNotificationIcon = (priority: 'urgent' | 'warning') => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-6 w-6 text-destructive" />;
      case 'warning':
        return <Clock className="h-6 w-6 text-amber-500" />;
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {allKpis.map((kpi) => (
          <KpiCard key={kpi.id} {...kpi} />
          ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
              <Card className="flex flex-col h-full">
                  <CardHeader>
                      <CardTitle>Visão Geral Financeira</CardTitle>
                      <CardDescription>Resumo do período</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-center">
                          <DonutChart
                          data={[
                              { name: 'Receitas', value: kpiData.faturamento, color: 'hsl(var(--chart-2))' },
                              { name: 'Despesas', value: kpiData.despesas, color: 'hsl(var(--chart-1))' },
                          ]}
                          valueFormatter={(v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          className="h-40"
                      />
                  </CardContent>
                  <CardFooter className="flex-col items-start gap-4 text-sm pt-4">
                        <div className="flex w-full flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center text-muted-foreground">
                                    <div className="h-2.5 w-2.5 rounded-full mr-2" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
                                    Receitas
                                </span>
                                <span className="font-medium">{kpiData.faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center text-muted-foreground">
                                    <div className="h-2.5 w-2.5 rounded-full mr-2" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                                    Despesas
                                </span>
                                <span className="font-medium">{kpiData.despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                            <Separator />
                             <div className="flex items-center justify-between font-bold">
                                <span>Resultado do Período</span>
                                <span className={cn(kpiData.resultado >= 0 ? "text-emerald-500" : "text-red-500")}>
                                  {kpiData.resultado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                        </div>
                        <div className="w-full space-y-2 pt-2">
                            <h4 className='text-sm font-semibold'>Acesso Rápido</h4>
                             <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" asChild>
                                  <Link href="/financeiro/contas-a-receber"><ArrowUpRight className="mr-2 h-4 w-4 text-emerald-500"/> Contas a Receber</Link>
                                </Button>
                                <Button variant="outline" asChild>
                                  <Link href="/financeiro/contas-a-pagar"><ArrowDownRight className="mr-2 h-4 w-4 text-red-500"/> Contas a Pagar</Link>
                                </Button>
                            </div>
                        </div>
                    </CardFooter>
              </Card>
          </div>
          <div className="lg:col-span-2">
              <ResultsChart data={chartData} period={period} onPeriodChange={setPeriod} />
          </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
          <div className="lg:col-span-1">
              <Card className='flex flex-col h-full'>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                          <span>Notificações</span>
                          {allNotifications.length > 0 && (
                              <span className="flex items-center text-sm font-medium text-muted-foreground">
                                  <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                                  {allNotifications.length} Pendência(s)
                              </span>
                          )}
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                        {allNotifications.length > 0 ? (
                          <ScrollArea className="h-48">
                              <div className="space-y-3">
                              {allNotifications.map(notification => (
                                  <div key={notification.id} className="flex items-center gap-4 rounded-lg border p-3">
                                      {getNotificationIcon(notification.priority)}
                                      <div className="flex-1">
                                          <p className="font-semibold">{notification.title}</p>
                                          <p className="text-sm text-muted-foreground">{notification.description}</p>
                                          <p className={cn(
                                              "text-sm font-mono",
                                              notification.priority === 'urgent' ? "text-destructive" : "text-amber-600"
                                          )}>
                                            {notification.amount?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                          </p>
                                      </div>
                                      <Button variant="ghost" size="icon" asChild>
                                          <Link href={notification.link}>
                                              <ArrowRightCircle className="h-5 w-5 text-muted-foreground" />
                                          </Link>
                                      </Button>
                                  </div>
                              ))}
                              </div>
                          </ScrollArea>
                      ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                              <CheckCircle className="h-10 w-10 text-emerald-500 mb-2" />
                              <p className="font-medium text-foreground">Tudo em ordem!</p>
                              <p>Nenhuma notificação ou pendência no momento.</p>
                          </div>
                      )}
                  </CardContent>
              </Card>
          </div>
      </div>
    </div>
  );
}

    