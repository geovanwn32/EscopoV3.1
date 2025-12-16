
'use client';

import { useState, useEffect, ChangeEvent, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PackagePlus, Wrench, Upload, FileMinus, Receipt, MoreHorizontal, Search, Filter, Plus, FileUp, Trash2, X, Eye, Pencil, ChevronsUpDown, Check, Calculator } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Partner } from "@/types/partner";
import { useCompany } from "@/hooks/use-company";
import { NotaFiscal, ProductItem, ServiceItem, Product, Service } from "@/types/fiscal";
import { AuditLog, logAudit } from "@/lib/audit-log";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";


const actions = [
    {
        id: "importar-xml",
        icon: <Upload className="h-8 w-8" />,
        label: "Importar XML",
        href: "#",
        color: "text-sky-600 bg-sky-100/80 group-hover:bg-sky-600 dark:bg-sky-900/40 dark:text-sky-400 dark:group-hover:bg-sky-500",
    },
    {
        id: "nota-produto",
        icon: <PackagePlus className="h-8 w-8" />,
        label: "Nota Produto",
        href: "#",
        color: "text-emerald-600 bg-emerald-100/80 group-hover:bg-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 dark:group-hover:bg-emerald-500",
    },
    {
        id: "nota-saida",
        icon: <FileMinus className="h-8 w-8" />,
        label: "Nota Saída",
        href: "#",
        color: "text-amber-600 bg-amber-100/80 group-hover:bg-amber-600 dark:bg-amber-900/40 dark:text-amber-400 dark:group-hover:bg-amber-500",
    },
    {
        id: "nota-servico",
        icon: <Wrench className="h-8 w-8" />,
        label: "Nota Serviço",
        href: "#",
        color: "text-indigo-600 bg-indigo-100/80 group-hover:bg-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 dark:group-hover:bg-indigo-500",
    },
     {
        id: "apurar-impostos",
        icon: <Calculator className="h-8 w-8" />,
        label: "Apurar Impostos",
        href: "/fiscal/apuracao",
        color: "text-purple-600 bg-purple-100/80 group-hover:bg-purple-600 dark:bg-purple-900/40 dark:text-purple-400 dark:group-hover:bg-purple-500",
    },
]

interface XmlFile {
    id: number;
    fileName: string;
    fileContent: string;
    date: string;
    status: 'Importado' | 'Lançado' | 'Erro';
}

function RejectedFilesDialog({ title, files, open, onOpenChange }: { title: string, files: string[], open: boolean, onOpenChange: (open: boolean) => void }) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>A lista abaixo contém os arquivos que não puderam ser importados.</AlertDialogDescription>
                </AlertDialogHeader>
                <ScrollArea className="max-h-60 rounded-md border p-4">
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        {files.map((file, index) => (
                            <li key={index} className="truncate">{file}</li>
                        ))}
                    </ul>
                </ScrollArea>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => onOpenChange(false)}>Fechar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}


export default function FiscalPage() {
    const { toast } = useToast();
    const { useScopedData, companies, currentCompany } = useCompany();

    const [xmls, setXmls] = useScopedData<XmlFile[]>('fiscal-xmls', []);
    const [notasProduto, setNotasProduto] = useScopedData<NotaFiscal[]>('fiscal-notasProduto', []);
    const [notasSaida, setNotasSaida] = useScopedData<NotaFiscal[]>('fiscal-notasSaida', []);
    const [notasServico, setNotasServico] = useScopedData<NotaFiscal[]>('fiscal-notasServico', []);
    const [partners, setPartners] = useScopedData<Partner[]>('partners', []);
    const [products] = useScopedData<Product[]>('cadastros-produtos', []);
    const [services] = useScopedData<Service[]>('cadastros-servicos', []);
    const [, setAuditLogs] = useScopedData<AuditLog[]>('audit-trail-logs', []);


    const [isLancamentoDialogOpen, setIsLancamentoDialogOpen] = useState(false);
    const [tipoNota, setTipoNota] = useState<'produto' | 'saida' | 'servico' | null>(null);
    const [lancamentoData, setLancamentoData] = useState<any>(null);
    
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [editingNota, setEditingNota] = useState<NotaFiscal | null>(null);

    const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);
    const [rejectedFilesTitle, setRejectedFilesTitle] = useState('');
    const [isRejectedFilesDialogOpen, setIsRejectedFilesDialogOpen] = useState(false);
    const [sourceXmlId, setSourceXmlId] = useState<number | undefined>(undefined);



    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!currentCompany) {
            toast({ variant: 'destructive', title: 'Nenhuma empresa selecionada' });
            return;
        }

        const activeCompany = companies.find(c => c.id === currentCompany);
        const companyCnpj = activeCompany?.data?.cnpj?.replace(/\D/g, '');

        if (!companyCnpj) {
             toast({ variant: 'destructive', title: 'CNPJ da empresa não encontrado', description: 'Cadastre o CNPJ na tela "Minha Empresa" para validar os arquivos.' });
            return;
        }


        const files = event.target.files;
        if (!files || files.length === 0) return;

        const newFiles: XmlFile[] = [];
        const currentRejectedFiles: string[] = [];
        const currentInvalidCnpjFiles: string[] = [];
        let successCount = 0;

        const allNotaNumeros = [
            ...notasProduto.map(n => n.dados.geral?.numero),
            ...notasSaida.map(n => n.dados.geral?.numero),
            ...notasServico.map(n => n.dados.identificacao?.numero)
        ].filter(Boolean);

        const filePromises = Array.from(files).map(file => {
            return new Promise<void>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target?.result as string;

                    // 1. Check for duplicates (file name and content)
                    const isDuplicate = xmls.some(
                        existingFile => existingFile.fileName === file.name && existingFile.fileContent === content
                    );

                    // 2. Check if already launched (by nota number)
                    const numeroNotaMatch = content.match(/<nNF>(.*?)<\/nNF>/) || content.match(/<Numero>(.*?)<\/Numero>/);
                    const numeroNota = numeroNotaMatch ? numeroNotaMatch[1] : null;
                    const isAlreadyLaunched = numeroNota ? allNotaNumeros.includes(numeroNota) : false;

                    if (isDuplicate || isAlreadyLaunched) {
                        currentRejectedFiles.push(file.name);
                        resolve();
                        return;
                    }
                    
                    // 3. Professional CNPJ Validation
                    const getCnpjsFromXml = (xmlContent: string): string[] => {
                        const cnpjs: Set<string> = new Set();
                        
                        // NFe (emitente/destinatario)
                        const emitCnpj = xmlContent.match(/<emit>[\s\S]*?<CNPJ>(.*?)<\/CNPJ>/)?.[1];
                        const destCnpj = xmlContent.match(/<dest>[\s\S]*?<CNPJ>(.*?)<\/CNPJ>/)?.[1];
                        
                        if (emitCnpj) cnpjs.add(emitCnpj.replace(/\D/g, ''));
                        if (destCnpj) cnpjs.add(destCnpj.replace(/\D/g, ''));

                        // NFSe (prestador/tomador) - various formats
                        const prestadorCnpj = xmlContent.match(/<Prestador(?:Servico)?>[\s\S]*?<Cnpj>(.*?)<\/Cnpj>/)?.[1] || xmlContent.match(/<emit>[\s\S]*?<CNPJ>(.*?)<\/CNPJ>/)?.[1];
                        const tomadorCnpj = xmlContent.match(/<Tomador(?:Servico)?>[\s\S]*?<Cnpj>(.*?)<\/Cnpj>/)?.[1] || xmlContent.match(/<(?:dest|toma)>[\s\S]*?<CNPJ>(.*?)<\/CNPJ>/)?.[1];

                        if (prestadorCnpj) cnpjs.add(prestadorCnpj.replace(/\D/g, ''));
                        if (tomadorCnpj) cnpjs.add(tomadorCnpj.replace(/\D/g, ''));
                        
                        return Array.from(cnpjs);
                    }

                    const xmlCnpjs = getCnpjsFromXml(content);
                    const isCnpjValid = xmlCnpjs.includes(companyCnpj);

                    if (!isCnpjValid) {
                        currentInvalidCnpjFiles.push(file.name);
                        resolve();
                        return;
                    }

                    // If all checks pass
                    newFiles.push({
                        id: Date.now() + Math.random(),
                        fileName: file.name,
                        fileContent: content,
                        date: new Date().toLocaleDateString('pt-BR'),
                        status: 'Importado',
                    });
                    successCount++;
                    resolve();
                };
                reader.readAsText(file);
            });
        });

        Promise.all(filePromises).then(() => {
            if (newFiles.length > 0) {
                setXmls(prevXmls => [...prevXmls, ...newFiles]);
                toast({
                    title: "Importação Concluída",
                    description: `${successCount} arquivo(s) importado(s) com sucesso.`,
                });
                 logAudit(setAuditLogs, 'IMPORT', 'Fiscal', `Importou ${successCount} arquivo(s) XML.`);
            }

            if (currentRejectedFiles.length > 0) {
                setRejectedFiles(currentRejectedFiles);
                setRejectedFilesTitle('Arquivos Duplicados ou Já Lançados');
                toast({
                    variant: 'destructive',
                    title: 'Arquivos Rejeitados',
                    description: `${currentRejectedFiles.length} arquivo(s) já existem ou foram lançados.`,
                    action: <Button variant="secondary" size="sm" onClick={() => setIsRejectedFilesDialogOpen(true)}>Ver Detalhes</Button>,
                });
            }

            if (currentInvalidCnpjFiles.length > 0) {
                 setRejectedFiles(currentInvalidCnpjFiles);
                 setRejectedFilesTitle('Arquivos com CNPJ Inválido');
                toast({
                    variant: 'destructive',
                    title: 'Arquivos com CNPJ Inválido',
                    description: `${currentInvalidCnpjFiles.length} arquivo(s) não pertencem à empresa ativa.`,
                    action: <Button variant="secondary" size="sm" onClick={() => setIsRejectedFilesDialogOpen(true)}>Ver Detalhes</Button>,
                });
            }

            // Reset the input field
            event.target.value = '';
        });
    };
    
    const handleLancarXml = (id: number) => {
        const xmlFile = xmls.find(x => x.id === id);
        if (!xmlFile) return;
    
        const content = xmlFile.fileContent;
        let detectedModel: 'produto' | 'servico' | null = null;
        let parsedData = {};

        // Helper to save partner
        const savePartner = (partnerData: Omit<Partner, 'id' | 'type'> & { type: Partner['type'] | null }) => {
            const doc = partnerData.document.replace(/\D/g, '');
            if (!doc || !partnerData.name) return; // Don't save if essential info is missing
            const existingPartner = partners.find(p => p.document.replace(/\D/g, '') === doc);
            
            if (!existingPartner) {
                const newPartner: Partner = {
                    id: Date.now() + Math.random(),
                    document: partnerData.document,
                    name: partnerData.name,
                    personType: doc.length > 11 ? 'JURIDICA' : 'FISICA',
                    type: partnerData.type || (doc.length > 11 ? 'Fornecedor' : 'Cliente'), // Default type logic
                };
                setPartners(prev => [...prev, newPartner]);
                toast({
                    title: "Parceiro Cadastrado Automaticamente",
                    description: `O parceiro ${newPartner.name} foi salvo no seu cadastro.`
                });
            }
        };

        const formatISODateToInput = (isoDate: string | undefined) => {
            if (!isoDate) return '';
            try {
                const date = new Date(isoDate);
                // Formats to "YYYY-MM-DDTHH:mm" which is required by datetime-local input
                return date.toISOString().slice(0, 16);
            } catch (e) {
                return '';
            }
        }


        // Simulating XML parsing
        if (content.includes('<infNFe') && content.includes('<NFe')) {
            detectedModel = 'produto';
            const products = Array.from(content.matchAll(/<det nItem="(\d+)">([\s\S]*?)<\/det>/g)).map(match => {
                const itemContent = match[2];
                const find = (tag: string) => itemContent.match(new RegExp(`<${tag}>(.*?)</${tag}>`))?.[1] || '';
                return {
                    id: Date.now() + Math.random(),
                    name: find('xProd'),
                    quantity: parseFloat(find('qCom') || '0'),
                    price: parseFloat(find('vUnCom') || '0'),
                    total: parseFloat(find('vProd') || '0'),
                };
            });
             parsedData = {
                geral: {
                    numero: content.match(/<nNF>(.*?)<\/nNF>/)?.[1] || '',
                    serie: content.match(/<serie>(.*?)<\/serie>/)?.[1] || '',
                    dataEmissao: formatISODateToInput(content.match(/<dhEmi>(.*?)<\/dhEmi>/)?.[1]),
                },
                emitente: {
                    cnpj: content.match(/<emit>[\s\S]*?<CNPJ>(.*?)<\/CNPJ>/)?.[1] || '',
                    razaoSocial: content.match(/<emit>[\s\S]*?<xNome>(.*?)<\/xNome>/)?.[1] || '',
                },
                destinatario: {
                    cnpj: content.match(/<dest>[\s\S]*?<CNPJ>(.*?)<\/CNPJ>/)?.[1] || content.match(/<dest>[\s\S]*?<CPF>(.*?)<\/CPF>/)?.[1] || '',
                    razaoSocial: content.match(/<dest>[\s\S]*?<xNome>(.*?)<\/xNome>/)?.[1] || '',
                },
                items: products,
            };

            const emitenteData = (parsedData as any).emitente;
            const destData = (parsedData as any).destinatario;
            savePartner({ document: emitenteData.cnpj, name: emitenteData.razaoSocial, type: 'Fornecedor' });
            savePartner({ document: destData.cnpj, name: destData.razaoSocial, type: 'Cliente' });


        } else if (content.includes('<infNFSe') || content.includes('<CompNfse')) {
            detectedModel = 'servico';
             parsedData = {
                identificacao: {
                    numero: content.match(/<Numero>(.*?)<\/Numero>/)?.[1] || '',
                    serie: content.match(/<Serie>(.*?)<\/Serie>/)?.[1] || 'U', // Default to 'U' if not found
                    dataEmissao: formatISODateToInput(content.match(/<DataEmissao>(.*?)<\/DataEmissao>/)?.[1] || content.match(/<dhEmi>(.*?)<\/dhEmi>/)?.[1]),
                },
                prestador: {
                    cnpj: content.match(/<Prestador>[\s\S]*?<Cnpj>(.*?)<\/Cnpj>/)?.[1] || content.match(/<PrestadorServico>[\s\S]*?<Cnpj>(.*?)<\/Cnpj>/)?.[1] || content.match(/<emit>[\s\S]*?<CNPJ>(.*?)<\/CNPJ>/)?.[1] || '',
                    razaoSocial: content.match(/<PrestadorServico>[\s\S]*?<RazaoSocial>(.*?)<\/RazaoSocial>/)?.[1] || content.match(/<emit>[\s\S]*?<xNome>(.*?)<\/xNome>/)?.[1] || '',
                },
                tomador: {
                    cnpj: content.match(/<TomadorServico>[\s\S]*?<Cnpj>(.*?)<\/Cnpj>/)?.[1] || content.match(/<toma>[\s\S]*?<CNPJ>(.*?)<\/CNPJ>/)?.[1] || '',
                    razaoSocial: content.match(/<TomadorServico>[\s\S]*?<RazaoSocial>(.*?)<\/RazaoSocial>/)?.[1] || content.match(/<toma>[\s\S]*?<xNome>(.*?)<\/xNome>/)?.[1] || '',
                },
                items: [{
                    id: Date.now(),
                    name: content.match(/<Discriminacao>([\s\S]*?)<\/Discriminacao>/)?.[1] || content.match(/<xDescServ>(.*?)<\/xDescServ>/)?.[1] || '',
                    value: parseFloat(content.match(/<ValorServicos>(.*?)<\/ValorServicos>/)?.[1] || content.match(/<vServ>(.*?)<\/vServ>/)?.[1] || '0'),
                }],
             };

            const prestadorData = (parsedData as any).prestador;
            const tomadorData = (parsedData as any).tomador;
            savePartner({ document: prestadorData.cnpj, name: prestadorData.razaoSocial, type: 'Fornecedor' });
            savePartner({ document: tomadorData.cnpj, name: tomadorData.razaoSocial, type: 'Cliente' });
        }

        if (detectedModel) {
            setSourceXmlId(xmlFile.id); // Store the source XML ID
            openLancamentoDialog(detectedModel, parsedData);
            setXmls(prevXmls => prevXmls.map(x => x.id === id ? { ...x, status: 'Lançado' } : x));
        } else {
            toast({
                variant: 'destructive',
                title: 'Modelo de XML não suportado',
                description: 'Não foi possível identificar o tipo de nota fiscal para este arquivo.'
            });
             setXmls(prevXmls => prevXmls.map(x => x.id === id ? { ...x, status: 'Erro' } : x));
        }
    };

    const handleDeleteXml = (id: number) => {
        const xmlFile = xmls.find(x => x.id === id);
        if (xmlFile?.status === 'Lançado') {
            toast({
                variant: "destructive",
                title: "Ação não permitida",
                description: "Não é possível excluir um XML que já foi lançado. Exclua a nota fiscal primeiro."
            });
            return;
        }

        setXmls(prevXmls => prevXmls.filter(xml => xml.id !== id));
        toast({
            variant: "destructive",
            title: 'Arquivo Excluído!',
            description: `O documento foi removido da lista.`
        });
    }

    const openLancamentoDialog = (tipo: 'produto' | 'saida' | 'servico', data: any = null, readOnly = false) => {
        if (!currentCompany) {
            toast({ variant: 'destructive', title: 'Nenhuma empresa selecionada' });
            return;
        }
        setTipoNota(tipo);
        setLancamentoData(data);
        setIsReadOnly(readOnly);
        setIsLancamentoDialogOpen(true);
    };

    const handleSaveNota = (savedNota: any) => {
        if (editingNota) {
            // Update existing note
            const updateList = (list: NotaFiscal[]) => list.map(n => n.id === editingNota.id ? { ...savedNota, id: editingNota.id } : n);
            if (editingNota.tipo === 'entrada' || editingNota.tipo === 'produto') setNotasProduto(updateList);
            if (editingNota.tipo === 'saida') setNotasSaida(updateList);
            if (editingNota.tipo === 'servico') setNotasServico(updateList);

            toast({
                title: "Nota Fiscal Atualizada",
                description: `A nota fiscal foi atualizada com sucesso.`,
            });
            setEditingNota(null);

        } else {
            // Add new note
            const notaComId: NotaFiscal = {
                ...savedNota,
                id: Date.now(),
                sourceXmlId: sourceXmlId, // Attach the source XML ID
            };
            if (notaComId.tipo === 'entrada') {
                setNotasProduto(prev => [...prev, notaComId]);
            } else if (notaComId.tipo === 'saida') {
                setNotasSaida(prev => [...prev, notaComId]);
            } else if (notaComId.tipo === 'servico') {
                setNotasServico(prev => [...prev, notaComId]);
            }
             toast({
              title: "Nota Fiscal Lançada",
              description: `A nota fiscal foi salva com sucesso.`,
            });
        }
        setIsLancamentoDialogOpen(false); 
        setSourceXmlId(undefined); // Clean up source ID
    };

    const handleDeleteNota = (nota: NotaFiscal) => {
        const removeNota = (list: NotaFiscal[]) => list.filter(n => n.id !== nota.id);
        if (nota.tipo === 'entrada' || nota.tipo === 'produto') setNotasProduto(removeNota);
        if (nota.tipo === 'saida') setNotasSaida(removeNota);
        if (nota.tipo === 'servico') setNotasServico(removeNota);

        // Revert XML status if it came from an XML
        if (nota.sourceXmlId) {
            setXmls(prevXmls => prevXmls.map(xml => 
                xml.id === nota.sourceXmlId ? { ...xml, status: 'Importado' } : xml
            ));
        }

        toast({
            variant: "destructive",
            title: "Nota Excluída!",
            description: `A nota fiscal foi removida.`
        });
    };

    const handleViewNota = (nota: NotaFiscal) => {
        const tipo = nota.tipo === 'entrada' ? 'produto' : nota.tipo;
        setEditingNota(nota); // Set editingNota to pass full object
        openLancamentoDialog(tipo as any, nota.dados, true);
    };

    const handleEditNota = (nota: NotaFiscal) => {
        const tipo = nota.tipo === 'entrada' ? 'produto' : nota.tipo;
        setEditingNota(nota);
        openLancamentoDialog(tipo as any, nota.dados, false);
    };
    
    return (
        <>
            <div className="space-y-6">
                <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Lançamentos Fiscais</h1>
                <p className="text-muted-foreground">
                    Importe XMLs ou lance manualmente suas notas e recibos.
                </p>
                </div>

                <Card>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-6">
                        {actions.map((action) => (
                            <ActionTile 
                                key={action.label} 
                                {...action} 
                                onFileChange={action.id === 'importar-xml' ? handleFileChange : undefined}
                                onActionClick={
                                    action.id === 'nota-produto' ? () => openLancamentoDialog('produto') :
                                    action.id === 'nota-saida' ? () => openLancamentoDialog('saida') :
                                    action.id === 'nota-servico' ? () => openLancamentoDialog('servico') :
                                    action.id === 'apurar-impostos' ? () => {} :
                                    undefined
                                }
                            />
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Documentos Fiscais</CardTitle>
                        <CardDescription>Gerencie todos os seus documentos importados e lançados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="xmls">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-none sm:flex">
                                    <TabsTrigger value="xmls">XMLs Importados</TabsTrigger>
                                    <TabsTrigger value="produtos">Notas de Produto</TabsTrigger>
                                    <TabsTrigger value="saidas">Notas de Saída</TabsTrigger>
                                    <TabsTrigger value="servicos">Notas de Serviço</TabsTrigger>
                                    <TabsTrigger value="recibos">Recibos/Cupons</TabsTrigger>
                                </TabsList>
                                <div className="flex w-full sm:w-auto items-center gap-2">
                                    <div className="relative flex-grow">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Buscar..." className="pl-9 w-full" />
                                    </div>
                                    <Button variant="outline"><Filter className="mr-2 h-4 w-4"/>Filtrar</Button>
                                </div>
                            </div>
                            <div className="mt-4">
                                <TabsContent value="xmls">
                                    <RecentDocumentsTable
                                        headers={['Arquivo', 'Data Importação', 'Status']}
                                        data={xmls}
                                        renderRow={(item: XmlFile) => (
                                            <>
                                                <TableCell className="font-medium">{item.fileName}</TableCell>
                                                <TableCell>{item.date}</TableCell>
                                                <TableCell>
                                                    <Badge variant={
                                                        item.status === 'Lançado' ? 'default' :
                                                        item.status === 'Importado' ? 'secondary' : 'destructive'
                                                    }>
                                                        {item.status}
                                                    </Badge>
                                                </TableCell>
                                            </>
                                        )}
                                        onLancar={handleLancarXml}
                                        onDelete={handleDeleteXml}
                                    />
                                </TabsContent>
                                <TabsContent value="produtos">
                                    <NotasFiscaisTable data={notasProduto} tipo="produto" onDelete={handleDeleteNota} onView={handleViewNota} onEdit={handleEditNota} />
                                </TabsContent>
                                <TabsContent value="saidas">
                                    <NotasFiscaisTable data={notasSaida} tipo="saida" onDelete={handleDeleteNota} onView={handleViewNota} onEdit={handleEditNota} />
                                </TabsContent>
                                <TabsContent value="servicos">
                                    <NotasFiscaisTable data={notasServico} tipo="servico" onDelete={handleDeleteNota} onView={handleViewNota} onEdit={handleEditNota} />
                                </TabsContent>
                                <TabsContent value="recibos">
                                    <div className="text-center py-10">
                                        <p className="text-muted-foreground">Nenhum recibo encontrado.</p>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
            <Dialog open={isLancamentoDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setEditingNota(null);
                    setIsReadOnly(false);
                    setSourceXmlId(undefined);
                }
                setIsLancamentoDialogOpen(open);
            }}>
                <LancamentoDialog 
                    onOpenChange={setIsLancamentoDialogOpen} 
                    tipoNota={tipoNota} 
                    initialData={lancamentoData} 
                    onSave={handleSaveNota}
                    isReadOnly={isReadOnly}
                    editingNota={editingNota}
                    partners={partners}
                    products={products}
                    services={services}
                />
            </Dialog>
            <RejectedFilesDialog 
                title={rejectedFilesTitle}
                files={rejectedFiles}
                open={isRejectedFilesDialogOpen}
                onOpenChange={setIsRejectedFilesDialogOpen}
            />

        </>
    );
}

function ActionTile({ 
    id,
    icon, 
    label, 
    href = "#", 
    color,
    onFileChange,
    onActionClick
}: { 
    id: string,
    icon: React.ReactNode, 
    label: string, 
    href?: string, 
    color: string,
    onFileChange?: (event: React.ChangeEvent<HTMLInputElement>) => void,
    onActionClick?: () => void
}) {
    const router = useRouter();

    const handleClick = () => {
        if (onActionClick) {
            onActionClick();
        } else if (href && href !== '#') {
            router.push(href);
        }
    };


    const tileContent = (
        <div className="group flex h-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
            <div className={cn(
                "rounded-full p-3 transition-colors group-hover:text-primary-foreground",
                color
            )}>
                {icon}
            </div>
            <span className="text-center text-sm font-semibold">{label}</span>
        </div>
    );

    if (id === 'importar-xml' && onFileChange) {
        const inputId = "xml-upload";
        return (
            <div>
                <label htmlFor={inputId} className="cursor-pointer">
                    {tileContent}
                </label>
                <Input 
                    id={inputId} 
                    type="file" 
                    className="sr-only" 
                    accept=".xml" 
                    multiple 
                    onChange={onFileChange}
                />
            </div>
        );
    }

    return (
        <button onClick={handleClick} className="w-full h-full text-left">
            {tileContent}
        </button>
    )
}

function RecentDocumentsTable({ 
    headers, 
    data, 
    renderRow,
    onLancar,
    onDelete,
}: { 
    headers: string[], 
    data: any[], 
    renderRow: (item: any) => React.ReactNode,
    onLancar?: (id: number) => void,
    onDelete?: (id: number) => void,
}) {
    const { toast } = useToast();
    const [itemToDelete, setItemToDelete] = useState<any | null>(null);

    const handleDeleteClick = (item: any) => {
        setItemToDelete(item);
    };

    const handleConfirmDelete = () => {
        if (itemToDelete && onDelete) {
            onDelete(itemToDelete.id);
        }
        setItemToDelete(null);
    };

    return (
        <>
            <div className="overflow-x-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {headers.map(header => <TableHead key={header}>{header}</TableHead>)}
                            <TableHead className="w-[64px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length > 0 ? data.map((item) => (
                            <TableRow key={item.id}>
                               {renderRow(item)}
                               <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Ações</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {onLancar && (item as XmlFile).status === 'Importado' && (
                                            <DropdownMenuItem onClick={() => onLancar(item.id)}>
                                                <FileUp className="mr-2 h-4 w-4" />
                                                Lançar
                                            </DropdownMenuItem>
                                        )}
                                        {onDelete && (
                                            <DropdownMenuItem onClick={() => handleDeleteClick(item)} className="text-destructive focus:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Excluir
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                               </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={headers.length + 1} className="h-24 text-center">
                                    Nenhum documento encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
             <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso excluirá permanentemente o documento
                             <span className="font-bold"> "{itemToDelete?.fileName}"</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

function NotasFiscaisTable({ 
    data, 
    tipo,
    onDelete,
    onView,
    onEdit
}: { 
    data: NotaFiscal[], 
    tipo: 'produto' | 'saida' | 'servico',
    onDelete: (nota: NotaFiscal) => void,
    onView: (nota: NotaFiscal) => void,
    onEdit: (nota: NotaFiscal) => void,
}) {
    const [itemToDelete, setItemToDelete] = useState<NotaFiscal | null>(null);

    const handleDeleteClick = (item: NotaFiscal) => {
        setItemToDelete(item);
    };

    const handleConfirmDelete = () => {
        if (itemToDelete) {
            onDelete(itemToDelete);
        }
        setItemToDelete(null);
    };


    if (!data || data.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">Nenhuma nota de {tipo} encontrada.</p>
            </div>
        );
    }
    
    const headers = tipo === 'servico' 
        ? ['Número', 'Prestador', 'Tomador', 'Valor Total']
        : ['Número', 'Emitente', 'Destinatário', 'Valor Total'];


    const renderRow = (item: NotaFiscal) => {
        const total = tipo === 'servico' 
            ? (item.items as ServiceItem[]).reduce((acc: number, service) => acc + (Number(service.value) || 0), 0)
            : (item.items as ProductItem[]).reduce((acc: number, product) => acc + product.total, 0);

        return (
            <>
                <TableCell className="font-medium">{item.dados.geral?.numero || item.dados.identificacao?.numero}</TableCell>
                <TableCell>{item.dados.emitente?.razaoSocial || item.dados.prestador?.razaoSocial}</TableCell>
                <TableCell>{item.dados.destinatario?.razaoSocial || item.dados.tomador?.razaoSocial}</TableCell>
                <TableCell className="text-right font-mono">
                    {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
            </>
        );
    }

    return (
        <>
        <div className="overflow-x-auto rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {headers.map(header => <TableHead key={header}>{header}</TableHead>)}
                        <TableHead className="w-[64px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item) => (
                        <TableRow key={item.id}>
                            {renderRow(item)}
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Ações</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onView(item)}><Eye className="mr-2 h-4 w-4" />Visualizar</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onEdit(item)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDeleteClick(item)} className="text-destructive focus:text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
        <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Essa ação não pode ser desfeita. Isso excluirá permanentemente a nota fiscal
                         <span className="font-bold"> Nº {itemToDelete?.dados.geral?.numero || itemToDelete?.dados.identificacao?.numero}</span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete}>Confirmar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    )
}

interface LancamentoDialogProps {
    onOpenChange: (open: boolean) => void;
    tipoNota: 'produto' | 'saida' | 'servico' | null;
    initialData?: any;
    onSave: (data: any) => void;
    isReadOnly: boolean;
    editingNota: NotaFiscal | null;
    partners: Partner[];
    products: Product[];
    services: Service[];
}


function LancamentoDialog({ onOpenChange, tipoNota, initialData, onSave, isReadOnly, editingNota, partners, products, services }: LancamentoDialogProps) {
    const { toast } = useToast();
    const [productItems, setProductItems] = useState<ProductItem[]>([]);
    const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
    const [activeSection, setActiveSection] = useState('geral');
    const [tipoNotaValue, setTipoNotaValue] = useState('');
    const [formData, setFormData] = useState<any>({});
    const [openPartnerPopover, setOpenPartnerPopover] = useState<string | null>(null);

    useEffect(() => {
        const data = editingNota ? editingNota.dados : initialData;
        const items = editingNota ? editingNota.items : initialData?.items;
        let effectiveTipo = editingNota ? (editingNota.tipo === 'entrada' ? 'produto' : editingNota.tipo) : tipoNota;

        // If 'produto' is coming from the action tile, it means 'entrada'.
        if (effectiveTipo === 'produto' && !editingNota) {
            effectiveTipo = 'entrada';
        } else if (effectiveTipo === 'produto' && editingNota) {
             effectiveTipo = editingNota.tipo;
        }

        if (effectiveTipo) {
            setTipoNotaValue(effectiveTipo);
            setActiveSection(effectiveTipo === 'servico' ? 'identificacao' : 'geral');
        }

        setFormData(data || {});

        if (items) {
            if (effectiveTipo === 'entrada' || effectiveTipo === 'saida') {
                setProductItems(items as ProductItem[] || []);
            } else if (effectiveTipo === 'servico') {
                setServiceItems(items as ServiceItem[] || []);
            }
        } else {
             setProductItems([]);
             setServiceItems([]);
        }

    }, [tipoNota, initialData, editingNota]);

    const notaLabel = 
        tipoNotaValue === 'servico' ? 'de Serviço' : 
        (tipoNotaValue === 'entrada' ? 'de Produto (Entrada)' : 'de Saída');

    const handleInputChange = (section: string, field: string, value: any) => {
        if (isReadOnly) return;
        setFormData((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
            }
        }));
    };
    
    const handlePartnerSelect = (section: 'emitente' | 'destinatario' | 'prestador' | 'tomador', partnerId: string) => {
        const partner = partners.find(p => p.id.toString() === partnerId);
        if (partner && !isReadOnly) {
            setFormData((prev: any) => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    cnpj: partner.document,
                    razaoSocial: partner.name,
                }
            }));
            setOpenPartnerPopover(null);
        }
    };


    const productSections = [
        { id: 'geral', label: 'Dados Gerais' },
        { id: 'emitente', label: 'Emitente / Dest.' },
        { id: 'produtos', label: 'Itens da Nota' },
        { id: 'tributos', label: 'Tributos' },
        { id: 'transporte', label: 'Transporte' },
        { id: 'faturas', label: 'Faturas' },
        { id: 'info', label: 'Informações Adicionais' },
    ];
    
    const serviceSections = [
        { id: 'identificacao', label: 'Identificação' },
        { id: 'prestador', label: 'Prestador' },
        { id: 'tomador', label: 'Tomador' },
        { id: 'servico', label: 'Dados do Serviço' },
        { id: 'tributos', label: 'Tributos' },
        { id: 'pagamento', label: 'Pagamento' },
        { id: 'info', label: 'Info Adicionais' },
    ];

    const sections = tipoNotaValue === 'servico' ? serviceSections : productSections;

    // Product Handlers
    const handleAddProduct = () => {
        if (isReadOnly) return;
        const newItem: ProductItem = { id: Date.now(), name: '', quantity: 1, price: 0.0, total: 0.0 };
        setProductItems(prev => [...prev, newItem]);
    };

    const handleRemoveProduct = (id: number) => {
        if (isReadOnly) return;
        setProductItems(prev => prev.filter(item => item.id !== id));
    };
    
    const handleProductChange = (id: number, field: keyof Omit<ProductItem, 'id' | 'total'>, value: string | number) => {
        if (isReadOnly) return;
        setProductItems(prev => prev.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                const quantity = Number(updatedItem.quantity) || 0;
                const price = Number(updatedItem.price) || 0;
    
                if (!isNaN(quantity) && !isNaN(price)) {
                    updatedItem.total = quantity * price;
                }
                return updatedItem;
            }
            return item;
        }));
    };
    
    const handleProductSelect = (itemId: number, productId: string) => {
        if(isReadOnly) return;
        const product = products.find(p => p.id.toString() === productId);
        if (product) {
            setProductItems(prev => prev.map(item => {
                if (item.id === itemId) {
                    const updatedItem = { ...item, name: product.descricao, price: product.valor };
                    updatedItem.total = updatedItem.quantity * updatedItem.price;
                    return updatedItem;
                }
                return item;
            }));
        }
    };


    // Service Handlers
    const handleAddService = () => {
        if (isReadOnly) return;
        const newItem: ServiceItem = { id: Date.now(), name: '', value: 0.0 };
        setServiceItems(prev => [...prev, newItem]);
    };

    const handleRemoveService = (id: number) => {
        if (isReadOnly) return;
        setServiceItems(prev => prev.filter(item => item.id !== id));
    };

    const handleServiceChange = (id: number, field: keyof Omit<ServiceItem, 'id'>, value: string | number) => {
        if (isReadOnly) return;
        setServiceItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value === '' ? '' : value } : item
        ));
    };
    
    const handleServiceSelect = (itemId: number, serviceId: string) => {
        if(isReadOnly) return;
        const service = services.find(s => s.id.toString() === serviceId);
        if (service) {
            setServiceItems(prev => prev.map(item => 
                item.id === itemId ? { ...item, name: service.descricao, value: service.valor } : item
            ));
        }
    }
    
    const handleSave = () => {
        if (tipoNotaValue === 'servico') {
            if (!formData.identificacao?.numero) {
                toast({ variant: 'destructive', title: 'Campo Obrigatório', description: 'O número da nota de serviço é obrigatório.' });
                setActiveSection('identificacao');
                return;
            }
            if (!serviceItems.length || !serviceItems[0].name) {
                toast({ variant: 'destructive', title: 'Campo Obrigatório', description: 'Adicione uma descrição para o serviço prestado.' });
                setActiveSection('servico');
                return;
            }
        }

        if (tipoNotaValue === 'entrada' || tipoNotaValue === 'saida') {
            if (!formData.geral?.numero) {
                toast({ variant: 'destructive', title: 'Campo Obrigatório', description: 'O número da nota de produto é obrigatório.' });
                setActiveSection('geral');
                return;
            }
        }

        const dataToSave = { 
            tipo: tipoNotaValue,
            dados: formData,
            items: tipoNotaValue === 'servico' ? serviceItems : productItems,
        };
        onSave(dataToSave);
    };

    const totalProdutos = productItems.reduce((acc, item) => acc + item.total, 0);
    const totalServicos = serviceItems.reduce((acc, item) => acc + (Number(item.value) || 0), 0);
    
    const totalDescontos = 0; // Placeholder
    const totalImpostos = 0; // Placeholder
    const totalNota = tipoNotaValue === 'servico' ? totalServicos : totalProdutos;
    const totalLiquido = totalNota - totalDescontos - totalImpostos;

    const renderServiceForm = () => {
        switch (activeSection) {
            case 'identificacao':
                return (
                    <Card>
                        <CardHeader><CardTitle>1. Identificação da Nota de Serviço</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2"><Label>Tipo da Nota</Label><Select><SelectTrigger disabled={isReadOnly}><SelectValue placeholder="Prestado" /></SelectTrigger><SelectContent><SelectItem value="prestado">Prestado</SelectItem><SelectItem value="tomado">Tomado</SelectItem></SelectContent></Select></div>
                                <div className="space-y-2"><Label>Número</Label><Input value={formData.identificacao?.numero || ''} onChange={(e) => handleInputChange('identificacao', 'numero', e.target.value)} readOnly={isReadOnly}/></div>
                                <div className="space-y-2"><Label>Série</Label><Input value={formData.identificacao?.serie || ''} onChange={(e) => handleInputChange('identificacao', 'serie', e.target.value)} readOnly={isReadOnly}/></div>
                                <div className="space-y-2"><Label>Data de Emissão</Label><Input type="datetime-local" value={formData.identificacao?.dataEmissao || ''} onChange={(e) => handleInputChange('identificacao', 'dataEmissao', e.target.value)} readOnly={isReadOnly}/></div>
                                <div className="space-y-2"><Label>Competência</Label><Input type="month" readOnly={isReadOnly}/></div>
                                <div className="space-y-2 col-span-2"><Label>Natureza da Operação</Label><Input readOnly={isReadOnly}/></div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="space-y-2"><Label>Município da Prestação</Label><Input readOnly={isReadOnly}/></div>
                                <div className="space-y-2"><Label>Código IBGE</Label><Input readOnly={isReadOnly}/></div>
                                <div className="space-y-2"><Label>Regime Tributação</Label><Select><SelectTrigger disabled={isReadOnly}><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="nenhum">Nenhum</SelectItem></SelectContent></Select></div>
                            </div>
                            <div className="flex flex-wrap gap-4 pt-2">
                                <div className="flex items-center space-x-2"><Checkbox id="estimativa" disabled={isReadOnly}/><Label htmlFor="estimativa">Estimativa</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="unipro" disabled={isReadOnly}/><Label htmlFor="unipro">Soc. Uniprofissional</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="mei" disabled={isReadOnly}/><Label htmlFor="mei">MEI</Label></div>
                            </div>
                        </CardContent>
                    </Card>
                )
            case 'prestador':
            case 'tomador':
                const sectionKey = activeSection as 'prestador' | 'tomador';
                return (
                     <Card>
                        <CardHeader><CardTitle>{sectionKey === 'prestador' ? '2. Dados do Prestador' : '3. Dados do Tomador'}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Razão Social</Label>
                                    <PartnerSelector
                                        partners={partners}
                                        selectedPartnerName={formData[sectionKey]?.razaoSocial || ''}
                                        onSelect={(partnerId) => handlePartnerSelect(sectionKey, partnerId)}
                                        disabled={isReadOnly}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>CNPJ / CPF</Label>
                                    <Input value={formData[sectionKey]?.cnpj || ''} onChange={(e) => handleInputChange(sectionKey, 'cnpj', e.target.value)} readOnly={isReadOnly} disabled />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            case 'servico':
                return (
                     <Card>
                        <CardHeader><CardTitle>4. Dados do Serviço</CardTitle></CardHeader>
                        <CardContent>
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[60%]">Serviço</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                        {!isReadOnly && <TableHead className="w-12"></TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {serviceItems.length > 0 ? serviceItems.map((item) => (
                                        <TableRow key={item.id} className="has-[:focus-visible]:bg-muted/40">
                                            <TableCell className="font-medium">
                                                <ServiceSelector
                                                    services={services}
                                                    selectedServiceName={item.name}
                                                    onSelect={(serviceId) => handleServiceSelect(item.id, serviceId)}
                                                    disabled={isReadOnly}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Input type="number" value={item.value || ''} onChange={(e) => handleServiceChange(item.id, 'value', e.target.value)} className="h-8 w-32 text-right" readOnly={isReadOnly}/>
                                            </TableCell>
                                            {!isReadOnly && 
                                                <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveService(item.id)}><X className="h-4 w-4" /></Button></TableCell>
                                            }
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={isReadOnly ? 2 : 3} className="h-24 text-center">Nenhum serviço adicionado.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {!isReadOnly && <div className="mt-4 flex justify-end"><Button type="button" variant="outline" onClick={handleAddService}><Plus className="mr-2 h-4 w-4" /> Adicionar Serviço</Button></div>}
                        </CardContent>
                    </Card>
                )
            case 'tributos':
                return (
                    <Card>
                        <CardHeader><CardTitle>5. Tributos da NFS-e</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            {/* ISS */}
                            <div>
                                <h4 className="font-semibold text-primary mb-2">ISS</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                    <div className="space-y-2"><Label>Responsável</Label><Select><SelectTrigger disabled={isReadOnly}><SelectValue placeholder="Prestador" /></SelectTrigger><SelectContent><SelectItem value="prestador">Prestador</SelectItem><SelectItem value="tomador">Tomador (Retenção)</SelectItem></SelectContent></Select></div>
                                    <div className="space-y-2"><Label>Base de Cálculo</Label><Input type="number" readOnly value="0,00"/></div>
                                    <div className="space-y-2"><Label>Alíquota (%)</Label><Input type="number" readOnly={isReadOnly}/></div>
                                    <div className="space-y-2"><Label>Valor ISS</Label><Input type="number" readOnly value="0,00"/></div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <div className="flex items-center space-x-2"><Checkbox id="iss-incidencia" defaultChecked disabled={isReadOnly}/><Label htmlFor="iss-incidencia">Incidência de ISS</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="simples" disabled={isReadOnly}/><Label htmlFor="simples">Optante pelo Simples Nacional</Label></div>
                                </div>
                            </div>
                             <Separator />
                            {/* Retenções Federais */}
                            <div>
                                <h4 className="font-semibold text-primary mb-2">Retenções Federais (RFB)</h4>
                                <div className="space-y-3">
                                    {['IRRF', 'INSS', 'PIS', 'COFINS', 'CSLL'].map(imposto => (
                                        <div key={imposto} className="grid grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-2 items-center">
                                            <Label className="md:col-span-2 font-medium">{imposto}</Label>
                                            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Base</Label><Input type="number" readOnly={isReadOnly}/></div>
                                            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Alíquota (%)</Label><Input type="number" readOnly={isReadOnly}/></div>
                                            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Valor</Label><Input type="number" readOnly value="0,00"/></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            case 'pagamento':
                 return (
                    <Card>
                        <CardHeader><CardTitle>6. Dados de Pagamento</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label>Forma de Pagamento</Label>
                                    <Select><SelectTrigger disabled={isReadOnly}><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>
                                        <SelectItem value="pix">Pix</SelectItem>
                                        <SelectItem value="boleto">Boleto</SelectItem>
                                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                        <SelectItem value="cartao">Cartão</SelectItem>
                                        <SelectItem value="transferencia">Transferência</SelectItem>
                                    </SelectContent></Select>
                                </div>
                                <div className="space-y-2"><Label>Nº de Parcelas</Label><Input type="number" readOnly={isReadOnly}/></div>
                                <div className="space-y-2"><Label>Valor</Label><Input type="number" readOnly={isReadOnly}/></div>
                                <div className="space-y-2"><Label>Vencimento</Label><Input type="date" readOnly={isReadOnly}/></div>
                            </div>
                        </CardContent>
                    </Card>
                )
            case 'info':
                 return (
                    <Card>
                        <CardHeader><CardTitle>7. Informações Adicionais</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label>Observações ao Tomador</Label><Textarea rows={3} readOnly={isReadOnly}/></div>
                            <div className="space-y-2"><Label>Observações ao Fisco</Label><Textarea rows={3} readOnly={isReadOnly}/></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Nº do Processo</Label><Input readOnly={isReadOnly}/></div>
                                <div className="space-y-2"><Label>Código CNAE</Label><Input readOnly={isReadOnly}/></div>
                            </div>
                        </CardContent>
                    </Card>
                );
            default: return null;
        }
    }
  
    const renderProductForm = () => {
        switch (activeSection) {
            case 'geral':
                return (
                    <Card>
                        <CardHeader><CardTitle>Dados Gerais da Nota</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label htmlFor="nf-tipo">Tipo da Nota</Label>
                                    <Select value={tipoNotaValue} onValueChange={setTipoNotaValue} disabled>
                                        <SelectTrigger id="nf-tipo">
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="entrada">Entrada</SelectItem>
                                            <SelectItem value="saida">Saída</SelectItem>
                                            <SelectItem value="servico">Serviço</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nf-finalidade">Finalidade</Label>
                                    <Select><SelectTrigger id="nf-finalidade" disabled={isReadOnly}><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="complementar">Complementar</SelectItem><SelectItem value="ajuste">Ajuste</SelectItem><SelectItem value="devolucao">Devolução</SelectItem></SelectContent></Select>
                                </div>
                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <Label htmlFor="nf-natureza">Natureza da Operação (CFOP)</Label>
                                    <Input id="nf-natureza" readOnly={isReadOnly}/>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                                <div className="space-y-2"><Label htmlFor="nf-modelo">Modelo</Label><Input id="nf-modelo" readOnly={isReadOnly}/></div>
                                <div className="space-y-2"><Label htmlFor="nf-serie">Série</Label><Input id="nf-serie" value={formData.geral?.serie || ''} onChange={(e) => handleInputChange('geral', 'serie', e.target.value)} readOnly={isReadOnly}/></div>
                                <div className="space-y-2"><Label htmlFor="nf-numero">Número</Label><Input id="nf-numero" value={formData.geral?.numero || ''} onChange={(e) => handleInputChange('geral', 'numero', e.target.value)} readOnly={isReadOnly}/></div>
                                <div className="space-y-2"><Label htmlFor="nf-data-emissao">Data de Emissão</Label><Input id="nf-data-emissao" type="datetime-local" value={formData.geral?.dataEmissao || ''} onChange={(e) => handleInputChange('geral', 'dataEmissao', e.target.value)} readOnly={isReadOnly}/></div>
                            </div >
                        </CardContent>
                    </Card>
                )
            case 'emitente':
                const sectionKey = tipoNotaValue === 'entrada' ? 'emitente' : 'destinatario';
                const otherSectionKey = tipoNotaValue === 'entrada' ? 'destinatario' : 'emitente';
                const title = tipoNotaValue === 'entrada' ? 'Emitente / Destinatário' : 'Destinatário / Emitente';

                return (
                    <Card>
                        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-foreground mb-4">{tipoNotaValue === 'entrada' ? 'Emitente' : 'Destinatário'}</h3>
                                <div className="space-y-4">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Razão Social</Label>
                                            <PartnerSelector partners={partners} selectedPartnerName={formData[sectionKey]?.razaoSocial || ''} onSelect={(id) => handlePartnerSelect(sectionKey as any, id)} disabled={isReadOnly}/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>CNPJ / CPF</Label>
                                            <Input value={formData[sectionKey]?.cnpj || ''} disabled />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Separator />
                             <div>
                                <h3 className="text-lg font-medium text-foreground mb-4">{tipoNotaValue === 'entrada' ? 'Destinatário' : 'Emitente'}</h3>
                                <div className="space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Razão Social</Label>
                                            <PartnerSelector partners={partners} selectedPartnerName={formData[otherSectionKey]?.razaoSocial || ''} onSelect={(id) => handlePartnerSelect(otherSectionKey as any, id)} disabled={isReadOnly}/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>CNPJ / CPF</Label>
                                            <Input value={formData[otherSectionKey]?.cnpj || ''} disabled />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            case 'produtos':
                 return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Itens da Nota</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow>
                                    <TableHead className="w-[40%]">Produto</TableHead>
                                    <TableHead>Qtd.</TableHead>
                                    <TableHead>Vl. Unit.</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    {!isReadOnly && <TableHead className="w-12"></TableHead>}
                                </TableRow></TableHeader>
                                <TableBody>
                                    {productItems.length > 0 ? productItems.map((item) => (
                                        <TableRow key={item.id} className="has-[:focus-visible]:bg-muted/40">
                                            <TableCell className="font-medium">
                                                <ProductSelector products={products} selectedProductName={item.name} onSelect={(id) => handleProductSelect(item.id, id)} disabled={isReadOnly} />
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" value={item.quantity} onChange={(e) => handleProductChange(item.id, 'quantity', e.target.value)} className="h-8 w-20" readOnly={isReadOnly}/>
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" value={item.price} onChange={(e) => handleProductChange(item.id, 'price', e.target.value)} className="h-8 w-24" readOnly={isReadOnly}/>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{item.total.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</TableCell>
                                            {!isReadOnly && <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveProduct(item.id)}><X className="h-4 w-4" /></Button></TableCell>}
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={isReadOnly ? 4 : 5} className="h-24 text-center">Nenhum produto adicionado.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {!isReadOnly && <div className="mt-4 flex justify-end"><Button type="button" variant="outline" onClick={handleAddProduct}><Plus className="mr-2 h-4 w-4" /> Adicionar Produto</Button></div>}
                        </CardContent>
                    </Card>
                )
            case 'tributos':
                return (
                    <Card>
                        <CardHeader><CardTitle>Tributos da Nota</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2"><Label htmlFor="trib-bc-icms">Base ICMS</Label><Input id="trib-bc-icms" readOnly value="R$ 0,00" /></div>
                                <div className="space-y-2"><Label htmlFor="trib-valor-icms">Valor ICMS</Label><Input id="trib-valor-icms" readOnly value="R$ 0,00" /></div>
                                <div className="space-y-2"><Label htmlFor="trib-bc-st">Base ICMS ST</Label><Input id="trib-bc-st" readOnly value="R$ 0,00" /></div>
                                <div className="space-y-2"><Label htmlFor="trib-valor-st">Valor ICMS ST</Label><Input id="trib-valor-st" readOnly value="R$ 0,00" /></div>
                                <div className="space-y-2"><Label htmlFor="trib-valor-ipi">Valor IPI</Label><Input id="trib-valor-ipi" readOnly value="R$ 0,00" /></div>
                                <div className="space-y-2"><Label htmlFor="trib-valor-pis">Valor PIS</Label><Input id="trib-valor-pis" readOnly value="R$ 0,00" /></div>
                                <div className="space-y-2"><Label htmlFor="trib-valor-cofins">Valor COFINS</Label><Input id="trib-valor-cofins" readOnly value="R$ 0,00" /></div>
                                <div className="space-y-2"><Label htmlFor="trib-valor-total">Valor Total Tributos</Label><Input id="trib-valor-total" readOnly value="R$ 0,00" /></div>
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'transporte':
                return (
                    <Card>
                        <CardHeader><CardTitle>Dados do Transporte</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="transp-modalidade">Modalidade do Frete</Label>
                                    <Select><SelectTrigger id="transp-modalidade" disabled={isReadOnly}><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>
                                        <SelectItem value="0">Contratação do Frete por conta do Remetente (CIF)</SelectItem>
                                        <SelectItem value="1">Contratação do Frete por conta do Destinatário (FOB)</SelectItem>
                                        <SelectItem value="2">Contratação do Frete por conta de Terceiros</SelectItem>
                                        <SelectItem value="3">Transporte Próprio por conta do Remetente</SelectItem>
                                        <SelectItem value="4">Transporte Próprio por conta do Destinatário</SelectItem>
                                        <SelectItem value="9">Sem Ocorrência de Transporte</SelectItem>
                                    </SelectContent></Select>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="transp-transportadora">Transportadora</Label>
                                    <Input id="transp-transportadora" placeholder="Razão Social da Transportadora" readOnly={isReadOnly}/>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2"><Label htmlFor="transp-cnpj">CNPJ</Label><Input id="transp-cnpj" readOnly={isReadOnly}/></div>
                                <div className="space-y-2"><Label htmlFor="transp-placa">Placa do Veículo</Label><Input id="transp-placa" readOnly={isReadOnly}/></div>
                                <div className="space-y-2"><Label htmlFor="transp-uf-veiculo">UF do Veículo</Label><Input id="transp-uf-veiculo" readOnly={isReadOnly}/></div>
                            </div>
                            <Separator className="my-4" />
                            <h4 className="text-md font-semibold">Volumes</h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="space-y-2"><Label htmlFor="vol-qtd">Quantidade</Label><Input id="vol-qtd" type="number" readOnly={isReadOnly}/></div>
                                <div className="space-y-2"><Label htmlFor="vol-especie">Espécie</Label><Input id="vol-especie" readOnly={isReadOnly}/></div>
                                <div className="space-y-2"><Label htmlFor="vol-marca">Marca</Label><Input id="vol-marca" readOnly={isReadOnly}/></div>
                                <div className="space-y-2"><Label htmlFor="vol-peso-bruto">Peso Bruto</Label><Input id="vol-peso-bruto" type="number" readOnly={isReadOnly}/></div>
                                <div className="space-y-2"><Label htmlFor="vol-peso-liquido">Peso Líquido</Label><Input id="vol-peso-liquido" type="number" readOnly={isReadOnly}/></div>
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'faturas':
                return (
                    <Card>
                        <CardHeader><CardTitle>Faturas e Pagamentos</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label htmlFor="fat-tipo-pag">Tipo de Pagamento</Label>
                                    <Select><SelectTrigger id="fat-tipo-pag" disabled={isReadOnly}><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>
                                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                        <SelectItem value="cartao">Cartão</SelectItem>
                                        <SelectItem value="boleto">Boleto</SelectItem>
                                        <SelectItem value="pix">Pix</SelectItem>
                                        <SelectItem value="outros">Outros</SelectItem>
                                    </SelectContent></Select>
                                </div>
                                <div className="space-y-2"><Label htmlFor="fat-valor">Valor</Label><Input id="fat-valor" type="number" readOnly={isReadOnly}/></div>
                                <div className="space-y-2"><Label htmlFor="fat-numero">Nº da Fatura</Label><Input id="fat-numero" readOnly={isReadOnly}/></div>
                                <div className="space-y-2"><Label htmlFor="fat-vencimento">Vencimento</Label><Input id="fat-vencimento" type="date" readOnly={isReadOnly}/></div>
                            </div>
                            <div className="text-center pt-4">
                                <p className="text-sm text-muted-foreground">Funcionalidade de parcelas em desenvolvimento.</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'info':
                 return (
                    <Card>
                        <CardHeader><CardTitle>Informações Adicionais</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="info-complementares">Informações Complementares de Interesse do Contribuinte</Label>
                                <Textarea id="info-complementares" rows={4} readOnly={isReadOnly}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="info-fisco">Informações Adicionais de Interesse do Fisco</Label>
                                <Textarea id="info-fisco" rows={4} readOnly={isReadOnly}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="info-obs">Observações Internas</Label>
                                <Textarea id="info-obs" rows={2} readOnly={isReadOnly}/>
                            </div>
                        </CardContent>
                    </Card>
                );
            default:
                return null;
        }
    }

    if (!tipoNota) return null;

    const dialogTitle = isReadOnly ? `Visualizar Nota Fiscal ${notaLabel}` :
                        editingNota ? `Editar Nota Fiscal ${notaLabel}` :
                        `Lançamento de Nota Fiscal ${notaLabel}`;

    return (
      <DialogContent className="max-w-6xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {isReadOnly ? "Visualize os dados da nota fiscal." : "Preencha os dados abaixo para realizar o lançamento da nota fiscal."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 grid grid-cols-[240px_1fr] gap-6 overflow-hidden">
            <aside className="border-r pr-4">
                <nav className="flex flex-col gap-1">
                    {sections.map(section => (
                        <Button
                            key={section.id}
                            variant={activeSection === section.id ? 'secondary' : 'ghost'}
                            className="justify-start"
                            onClick={() => setActiveSection(section.id)}
                        >
                            {section.label}
                        </Button>
                    ))}
                </nav>
            </aside>
            <main className="overflow-y-auto">
                <ScrollArea className="h-full pr-6">
                    {tipoNotaValue === 'servico' ? renderServiceForm() : renderProductForm()}
                </ScrollArea>
            </main>
        </div>

        <DialogFooter className="border-t pt-4 mt-auto">
            <div className="flex w-full justify-between items-center">
                <div className="text-sm text-muted-foreground space-y-1">
                   {tipoNotaValue === 'servico' ? (
                        <>
                            <p>Total Serviços: <span className="font-semibold text-foreground">{totalServicos.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></p>
                            <p>Total Descontos: <span className="font-semibold text-foreground">({totalDescontos.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})})</span></p>
                            <p>Total Impostos Retidos: <span className="font-semibold text-red-600">({totalImpostos.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})})</span></p>
                            <p className="text-base">Total Líquido: <span className="font-bold text-foreground text-lg">{totalLiquido.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></p>
                        </>
                   ) : (
                        <>
                            <p>Total Produtos: <span className="font-bold text-foreground">{totalProdutos.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></p>
                            <p>Total Nota: <span className="font-bold text-foreground text-lg">{totalNota.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></p>
                        </>
                   )}
                </div>
                <div className="flex gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    {!isReadOnly && <Button onClick={handleSave}>Salvar Lançamento</Button>}
                </div>
            </div>
        </DialogFooter>
      </DialogContent>
    );
}

const PartnerSelector = ({ partners, selectedPartnerName, onSelect, disabled }: { partners: Partner[], selectedPartnerName: string, onSelect: (id: string) => void, disabled: boolean }) => {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between" disabled={disabled}>
                    {selectedPartnerName || "Selecione o parceiro..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command><CommandInput placeholder="Pesquisar..." /><CommandList><CommandEmpty>Nenhum parceiro.</CommandEmpty><CommandGroup>
                    {partners.map((p) => (
                        <CommandItem key={p.id} value={p.name} onSelect={() => { onSelect(p.id.toString()); setOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", selectedPartnerName === p.name ? "opacity-100" : "opacity-0")} />
                            {p.name}
                        </CommandItem>
                    ))}
                </CommandGroup></CommandList></Command>
            </PopoverContent>
        </Popover>
    );
};

const ProductSelector = ({ products, selectedProductName, onSelect, disabled }: { products: Product[], selectedProductName: string, onSelect: (id: string) => void, disabled: boolean }) => {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-8" disabled={disabled}>
                    <span className='truncate'>{selectedProductName || "Selecione..."}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command><CommandInput placeholder="Pesquisar..." /><CommandList><CommandEmpty>Nenhum produto.</CommandEmpty><CommandGroup>
                    {products.map((p) => (
                        <CommandItem key={p.id} value={p.descricao} onSelect={() => { onSelect(p.id.toString()); setOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", selectedProductName === p.descricao ? "opacity-100" : "opacity-0")} />
                            {p.descricao}
                        </CommandItem>
                    ))}
                </CommandGroup></CommandList></Command>
            </PopoverContent>
        </Popover>
    );
};

const ServiceSelector = ({ services, selectedServiceName, onSelect, disabled }: { services: Service[], selectedServiceName: string, onSelect: (id: string) => void, disabled: boolean }) => {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-8" disabled={disabled}>
                     <span className='truncate'>{selectedServiceName || "Selecione..."}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command><CommandInput placeholder="Pesquisar..." /><CommandList><CommandEmpty>Nenhum serviço.</CommandEmpty><CommandGroup>
                    {services.map((s) => (
                        <CommandItem key={s.id} value={s.descricao} onSelect={() => { onSelect(s.id.toString()); setOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", selectedServiceName === s.descricao ? "opacity-100" : "opacity-0")} />
                            {s.descricao}
                        </CommandItem>
                    ))}
                </CommandGroup></CommandList></Command>
            </PopoverContent>
        </Popover>
    );
};
