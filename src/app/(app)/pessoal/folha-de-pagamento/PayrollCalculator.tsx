
'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompany } from '@/hooks/use-company';
import { Funcionario } from '@/types/pessoal';
import { Info, Calendar as CalendarIcon, MoreHorizontal, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, Search, Check, ChevronsUpDown, Calculator, Save, FileDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead, TableFooter } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';


interface PayrollEvent {
    id: number;
    type: 'provento' | 'desconto';
    code: number;
    description: string;
    reference: number;
    calculationBasis: {
        cp: boolean; // Contribuição Previdenciária
        fg: boolean; // FGTS
        ir: boolean; // Imposto de Renda
    };
    provento: number;
    desconto: number;
}

export default function PayrollCalculator() {
    const { useScopedData } = useCompany();
    const [funcionarios] = useScopedData<Funcionario[]>('cadastros-funcionarios', []);
    
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [calculationType, setCalculationType] = useState('mensal');
    const [competenceDate, setCompetenceDate] = useState<Date | undefined>(new Date());
    const [openEmployeeSelector, setOpenEmployeeSelector] = useState(false);
    
    const initialEvents: PayrollEvent[] = [
        { id: 1, type: 'provento', code: 1, description: 'SALÁRIO BASE', reference: 17.00, calculationBasis: { cp: true, fg: true, ir: true }, provento: 1133.33, desconto: 0 },
        { id: 2, type: 'desconto', code: 201, description: 'INSS SOBRE SALÁRIOS', reference: 7.50, calculationBasis: { cp: false, fg: false, ir: false }, provento: 0, desconto: 85.00 },
        { id: 3, type: 'provento', code: 263, description: 'ARREDONDAMENTO ATUAL', reference: 1.00, calculationBasis: { cp: false, fg: false, ir: false }, provento: 0.67, desconto: 0 },
    ];
    
    const [events, setEvents] = useState<PayrollEvent[]>(initialEvents);
    
    const totals = useMemo(() => {
        const totalProventos = events.reduce((acc, event) => acc + event.provento, 0);
        const totalDescontos = events.reduce((acc, event) => acc + event.desconto, 0);
        const liquido = totalProventos - totalDescontos;
        return { totalProventos, totalDescontos, liquido };
    }, [events]);

    const BasisBadge = ({ active, label }: { active: boolean, label: string }) => (
        <Badge variant={active ? 'default' : 'outline'} className={`w-6 h-6 p-0 flex items-center justify-center font-bold ${active ? 'bg-emerald-600 hover:bg-emerald-700' : 'text-muted-foreground'}`}>{label}</Badge>
    );

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-xl flex items-center gap-2">
                        Folha de Pagamento
                        <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                    </CardTitle>
                     <div className="flex flex-wrap items-center gap-2">
                        <Button variant="default"><Calculator className="mr-2 h-4 w-4" />Calcular</Button>
                        <Button variant="outline"><Save className="mr-2 h-4 w-4" />Salvar</Button>
                        <Button variant="outline"><FileDown className="mr-2 h-4 w-4" />PDF</Button>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-6">
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 space-y-2">
                        <Label htmlFor="employee">Empregado</Label>
                        <Popover open={openEmployeeSelector} onOpenChange={setOpenEmployeeSelector}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openEmployeeSelector}
                                className="w-full justify-between"
                                >
                                {selectedEmployeeId
                                    ? funcionarios.find((f) => f.id.toString() === selectedEmployeeId)?.nome
                                    : "Selecione um funcionário..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                <CommandInput placeholder="Pesquisar funcionário..." />
                                <CommandList>
                                    <CommandEmpty>Nenhum funcionário encontrado.</CommandEmpty>
                                    <CommandGroup>
                                        {funcionarios.map((f) => (
                                            <CommandItem
                                            key={f.id}
                                            value={f.nome}
                                            onSelect={() => {
                                                setSelectedEmployeeId(f.id.toString() === selectedEmployeeId ? "" : f.id.toString());
                                                setOpenEmployeeSelector(false);
                                            }}
                                            >
                                            <Check
                                                className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedEmployeeId === f.id.toString() ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {f.nome}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="col-span-1 md:col-span-2 lg:col-span-2 space-y-2">
                        <Label>Período</Label>
                         <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn("w-full justify-start text-left font-normal", !competenceDate && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {competenceDate ? format(competenceDate, "MM/yyyy", { locale: ptBR }) : <span>Selecione o mês</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={competenceDate}
                                        onSelect={setCompetenceDate}
                                        initialFocus
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                     <div className="col-span-2 md:col-span-2 lg:col-span-1 flex items-end justify-end">
                         
                    </div>
                     <div className="col-span-1 lg:col-span-1 space-y-2">
                        <Label htmlFor="origin">Origem</Label>
                         <Select defaultValue="todas">
                            <SelectTrigger id="origin">
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todas">Todas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-24"></TableHead>
                                <TableHead className="w-24">Data</TableHead>
                                <TableHead className="w-20">Evento</TableHead>
                                <TableHead>Histórico</TableHead>
                                <TableHead className="w-28 text-center">Incidências</TableHead>
                                <TableHead className="w-24 text-right">Referência</TableHead>
                                <TableHead className="w-32 text-right">Rendimento</TableHead>
                                <TableHead className="w-32 text-right">Desconto</TableHead>
                            </TableRow>
                             <TableRow>
                                <TableCell className="p-1">
                                    <Button variant="ghost" size="icon"><Filter className="h-4 w-4"/></Button>
                                </TableCell>
                                <TableCell className="p-1" colSpan={3}>
                                     <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Pesquisar por histórico..." className="pl-9" />
                                    </div>
                                </TableCell>
                                <TableCell className="p-1" colSpan={4}></TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell className="flex items-center gap-1">
                                        <Checkbox checked={event.type === 'provento'} className="data-[state=checked]:bg-emerald-600 border-emerald-600" />
                                        <Checkbox checked={event.type === 'desconto'} className="data-[state=checked]:bg-red-600 border-red-600"/>
                                        <Button variant="ghost" size="icon" className="h-6 w-6"><Info className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                    </TableCell>
                                    <TableCell>{new Date(2023, 5, 14).toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell>{event.code}</TableCell>
                                    <TableCell className="font-medium">{event.description}</TableCell>
                                    <TableCell>
                                        <div className="flex justify-center items-center gap-2">
                                            <BasisBadge active={event.calculationBasis.cp} label="C" />
                                            <BasisBadge active={event.calculationBasis.fg} label="F" />
                                            <BasisBadge active={event.calculationBasis.ir} label="I" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">{event.reference.toFixed(2).replace('.', ',')}</TableCell>
                                    <TableCell className={`text-right font-mono ${event.provento > 0 ? 'text-emerald-600' : ''}`}>{event.provento.toFixed(2).replace('.', ',')}</TableCell>
                                    <TableCell className={`text-right font-mono ${event.desconto > 0 ? 'text-red-600' : ''}`}>{event.desconto.toFixed(2).replace('.', ',')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                         <TableFooter>
                            <TableRow>
                                <TableCell colSpan={6}></TableCell>
                                <TableCell className="text-right font-bold font-mono">{totals.totalProventos.toFixed(2).replace('.', ',')}</TableCell>
                                <TableCell className="text-right font-bold font-mono">{totals.totalDescontos.toFixed(2).replace('.', ',')}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell colSpan={6} className="text-right font-bold text-lg">Líquido à Receber:</TableCell>
                                <TableCell colSpan={2} className="text-right font-bold font-mono text-lg">{totals.liquido.toFixed(2).replace('.', ',')}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Select defaultValue="30">
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10 / Página</SelectItem>
                            <SelectItem value="30">30 / Página</SelectItem>
                            <SelectItem value="50">50 / Página</SelectItem>
                        </SelectContent>
                    </Select>
                     <p className="text-sm text-muted-foreground">
                        3 Registros
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" disabled><ChevronsLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" disabled><ChevronLeft className="h-4 w-4" /></Button>
                    <Input className="w-16 text-center" defaultValue="1" />
                     <span className="text-muted-foreground">/ 1</span>
                    <Button variant="outline" size="icon" disabled><ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" disabled><ChevronsRight className="h-4 w-4" /></Button>
                </div>
            </CardFooter>
        </Card>
    );
}
