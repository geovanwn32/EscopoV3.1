
'use client';
import { useState, useMemo, useEffect } from 'react';
import { Search, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Municipio {
    nome: string;
    codigo_ibge: string;
}

const ufs = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 
    'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function TabelaIbgePage() {
    const { toast } = useToast();
    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [selectedUf, setSelectedUf] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!selectedUf) {
            setMunicipios([]);
            return;
        }

        const fetchMunicipios = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`https://brasilapi.com.br/api/ibge/municipios/v1/${selectedUf}`);
                if (!response.ok) {
                    throw new Error('Não foi possível buscar os municípios.');
                }
                const data: Municipio[] = await response.json();
                setMunicipios(data);
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Erro de Conexão',
                    description: error.message || 'Falha ao buscar dados da API.',
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchMunicipios();

    }, [selectedUf, toast]);


    const filteredItems = useMemo(() => {
        return municipios.filter(item =>
            item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.codigo_ibge.includes(searchTerm)
        );
    }, [municipios, searchTerm]);

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
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Tabela IBGE de Municípios</h1>
                    <p className="text-muted-foreground">Consulte os códigos de municípios brasileiros.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Consulta de Municípios</CardTitle>
                            <CardDescription>Selecione um estado para listar os municípios e seus códigos.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <Select value={selectedUf} onValueChange={setSelectedUf}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Selecione um Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ufs.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                                </SelectContent>
                            </Select>
                             <div className="relative flex-grow">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Buscar por nome ou código..." 
                                    className="pl-9 w-full sm:w-64" 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)}
                                    disabled={!selectedUf}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[60vh] rounded-md border">
                        <Table>
                            <TableHeader className="sticky top-0 bg-card z-10">
                                <TableRow>
                                    <TableHead>Município</TableHead>
                                    <TableHead className="w-[200px]">Código IBGE</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                                            <p className="mt-2 text-muted-foreground">Buscando municípios...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredItems.length > 0 ? (
                                    filteredItems.map(item => (
                                        <TableRow key={item.codigo_ibge}>
                                            <TableCell className="font-medium">{item.nome}</TableCell>
                                            <TableCell className="font-mono">{item.codigo_ibge}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">
                                            {selectedUf ? `Nenhum município encontrado para "${searchTerm}".` : "Selecione um estado para começar."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

