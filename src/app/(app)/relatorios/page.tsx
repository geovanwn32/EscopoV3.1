
'use client';

import { useState, useMemo } from 'react';
import { useCompany } from '@/hooks/use-company';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { CalendarIcon, FileDown, Loader2, FileText, Users, Book } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import { generatePdf } from './pdf-generator';
import { NotaFiscal } from '@/types/fiscal';
import { SavedCalculation } from '@/types/pessoal';
import { Account } from '@/types/contabil';

type Module = 'fiscal' | 'pessoal' | 'contabil';

const reportOptions: Record<Module, { value: string; label: string }[]> = {
    fiscal: [
        { value: 'notas_saida', label: 'Relatório de Notas de Saída' },
        { value: 'notas_servico', label: 'Relatório de Notas de Serviço' },
    ],
    pessoal: [
        { value: 'resumo_folha', label: 'Resumo da Folha de Pagamento' },
    ],
    contabil: [
        { value: 'plano_contas', label: 'Plano de Contas' },
    ],
};


export default function RelatoriosPage() {
    const { toast } = useToast();
    const { useScopedData, companies, currentCompany } = useCompany();

    const [notasSaida] = useScopedData<NotaFiscal[]>('fiscal-notasSaida', []);
    const [notasServico] = useScopedData<NotaFiscal[]>('fiscal-notasServico', []);
    const [savedCalculations] = useScopedData<SavedCalculation[]>('pessoal-calculos-salvos', []);
    const [planoDeContas] = useScopedData<Account[]>('contabil-plano-de-contas', []);
    const activeCompany = useMemo(() => companies.find(c => c.id === currentCompany), [companies, currentCompany]);

    const [selectedModule, setSelectedModule] = useState<Module | undefined>(undefined);
    const [selectedReport, setSelectedReport] = useState<string | undefined>(undefined);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleModuleChange = (value: string) => {
        setSelectedModule(value as Module);
        setSelectedReport(undefined);
    }
    
    const handleGenerateReport = () => {
        if (!selectedModule || !selectedReport || !activeCompany) {
            toast({ variant: 'destructive', title: 'Seleção Incompleta', description: 'Por favor, selecione o módulo e o tipo de relatório.' });
            return;
        }

        setIsLoading(true);

        const dataSources = {
            notas_saida: notasSaida,
            notas_servico: notasServico,
            resumo_folha: savedCalculations,
            plano_contas: planoDeContas,
        };
        
        // Timeout to simulate async generation and show loader
        setTimeout(() => {
            try {
                generatePdf({
                    module: selectedModule,
                    reportType: selectedReport,
                    data: (dataSources as any)[selectedReport] || [],
                    dateRange,
                    company: activeCompany,
                });
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
                    <CardDescription>Selecione os parâmetros para gerar seu relatório em PDF.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>1. Módulo</Label>
                             <Select value={selectedModule} onValueChange={handleModuleChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o módulo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fiscal">Fiscal</SelectItem>
                                    <SelectItem value="pessoal">Pessoal</SelectItem>
                                    <SelectItem value="contabil">Contábil</SelectItem>
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
                <CardFooter>
                     <Button className="w-full" size="lg" onClick={handleGenerateReport} disabled={isLoading || !selectedReport}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <FileDown className="mr-2 h-4 w-4" />
                        )}
                        {isLoading ? 'Gerando...' : 'Gerar Relatório'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
