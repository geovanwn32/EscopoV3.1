
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCompany } from '@/hooks/use-company';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { CalendarIcon, FileDown, Loader2, FileText, Users, Book, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import { generatePdf, generateCsv } from './pdf-generator';
import { NotaFiscal } from '@/types/fiscal';
import { SavedCalculation } from '@/types/pessoal';
import { Account } from '@/types/contabil';
import { Conta } from '@/types/financeiro';

type Module = 'fiscal' | 'pessoal' | 'contabil' | 'financeiro';

const reportOptions: Record<Module, { value: string; label: string }[]> = {
    fiscal: [
        { value: 'notas_saida', label: 'Relatório de Notas de Saída' },
        { value: 'notas_servico', label: 'Relatório de Notas de Serviço' },
        { value: 'notas_entrada', label: 'Relatório de Notas de Entrada' },
    ],
    pessoal: [
        { value: 'resumo_folha', label: 'Resumo da Folha de Pagamento' },
        { value: 'relacao_funcionarios', label: 'Relação de Funcionários' },
    ],
    contabil: [
        { value: 'plano_contas', label: 'Plano de Contas' },
        { value: 'balancete', label: 'Balancete de Verificação' },
    ],
    financeiro: [
        { value: 'contas_a_receber', label: 'Contas a Receber' },
        { value: 'contas_a_pagar', label: 'Contas a Pagar' },
        { value: 'fluxo_caixa', label: 'Fluxo de Caixa' },
    ]
};


export default function RelatoriosPage() {
    const { toast } = useToast();
    const { useScopedData, companies, currentCompany } = useCompany();
    const searchParams = useSearchParams();

    const [notasProduto] = useScopedData<NotaFiscal[]>('fiscal-notasProduto', []);
    const [notasSaida] = useScopedData<NotaFiscal[]>('fiscal-notasSaida', []);
    const [notasServico] = useScopedData<NotaFiscal[]>('fiscal-notasServico', []);
    const [savedCalculations] = useScopedData<SavedCalculation[]>('pessoal-calculos-salvos', []);
    const [planoDeContas] = useScopedData<Account[]>('contabil-plano-de-contas', []);
    const [funcionarios] = useScopedData<any[]>('cadastros-funcionarios', []);
    const [contasPagar] = useScopedData<Conta[]>('financeiro-contas-a-pagar', []);
    const [contasReceber] = useScopedData<Conta[]>('financeiro-contas-a-receber', []);
    const activeCompany = useMemo(() => companies.find(c => c.id === currentCompany), [companies, currentCompany]);

    const [selectedModule, setSelectedModule] = useState<Module | undefined>(undefined);
    const [selectedReport, setSelectedReport] = useState<string | undefined>(undefined);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        const moduleParam = searchParams.get('modulo') as Module;
        if (moduleParam && ['fiscal', 'pessoal', 'contabil'].includes(moduleParam)) {
            setSelectedModule(moduleParam);
        }
    }, [searchParams]);

    const handleModuleChange = (value: string) => {
        setSelectedModule(value as Module);
        setSelectedReport(undefined);
    }
    
    const handleGenerateReport = (format: 'pdf' | 'csv') => {
        if (!selectedModule || !selectedReport || !activeCompany) {
            toast({ variant: 'destructive', title: 'Seleção Incompleta', description: 'Por favor, selecione o módulo e o tipo de relatório.' });
            return;
        }

        setIsLoading(true);

        const dataSources: Record<string, any[]> = {
            notas_saida: notasSaida,
            notas_servico: notasServico,
            notas_entrada: notasProduto,
            resumo_folha: savedCalculations,
            relacao_funcionarios: funcionarios,
            plano_contas: planoDeContas,
            balancete: savedCalculations, // Placeholder, will require real data
            contas_a_pagar: contasPagar,
            contas_a_receber: contasReceber,
            fluxo_caixa: [...contasPagar, ...contasReceber],
        };
        
        // Timeout to simulate async generation and show loader
        setTimeout(() => {
            try {
                const generatorParams = {
                    module: selectedModule,
                    reportType: selectedReport,
                    data: (dataSources as any)[selectedReport] || [],
                    dateRange,
                    company: activeCompany,
                };

                if (format === 'pdf') {
                    generatePdf(generatorParams);
                } else {
                    generateCsv(generatorParams);
                }

                toast({ title: 'Relatório Gerado!', description: 'Seu download começará em breve.' });
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Erro ao Gerar Relatório', description: error.message });
            } finally {
                setIsLoading(false);
            }
        }, 1000);
    }

    const getModuleIcon = (module?: Module) => {
        switch (module) {
            case 'fiscal': return <FileText className="h-5 w-5" />;
            case 'pessoal': return <Users className="h-5 w-5" />;
            case 'contabil': return <Book className="h-5 w-5" />;
            case 'financeiro': return <Banknote className="h-5 w-5" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Central de Relatórios</h1>
                <p className="text-muted-foreground">
                    Gere relatórios consolidados de diversas áreas do sistema.
                </p>
            </div>

            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle>Gerador de Relatórios</CardTitle>
                    <CardDescription>Selecione os parâmetros para gerar seu relatório em PDF ou CSV.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>1. Módulo</Label>
                             <Select value={selectedModule} onValueChange={handleModuleChange}>
                                <SelectTrigger>
                                    <div className='flex items-center gap-2'>
                                      {getModuleIcon(selectedModule)}
                                      <SelectValue placeholder="Selecione o módulo..." />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fiscal"><div className='flex items-center gap-2'><FileText className="h-4 w-4"/> Fiscal</div></SelectItem>
                                    <SelectItem value="pessoal"><div className='flex items-center gap-2'><Users className="h-4 w-4"/> Pessoal</div></SelectItem>
                                    <SelectItem value="contabil"><div className='flex items-center gap-2'><Book className="h-4 w-4"/> Contábil</div></SelectItem>
                                    <SelectItem value="financeiro"><div className='flex items-center gap-2'><Banknote className="h-4 w-4"/> Financeiro</div></SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>2. Tipo de Relatório</Label>
                            <Select value={selectedReport} onValueChange={setSelectedReport} disabled={!selectedModule}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o relatório..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedModule && reportOptions[selectedModule].map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>3. Período</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "dd/MM/y", { locale: ptBR })} -{' '}
                                                {format(dateRange.to, "dd/MM/y", { locale: ptBR })}
                                            </>
                                        ) : (
                                            format(dateRange.from, "dd/MM/y", { locale: ptBR })
                                        )
                                    ) : (
                                        <span>Selecione o período</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                    locale={ptBR}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2">
                     <Button className="w-full" size="lg" onClick={() => handleGenerateReport('pdf')} disabled={isLoading || !selectedReport}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <FileDown className="mr-2 h-4 w-4" />
                        )}
                        {isLoading ? 'Gerando PDF...' : 'Gerar Relatório (PDF)'}
                    </Button>
                     <Button className="w-full" size="lg" variant="outline" onClick={() => handleGenerateReport('csv')} disabled={isLoading || !selectedReport}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <FileDown className="mr-2 h-4 w-4" />
                        )}
                        {isLoading ? 'Gerando CSV...' : 'Exportar para CSV'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
