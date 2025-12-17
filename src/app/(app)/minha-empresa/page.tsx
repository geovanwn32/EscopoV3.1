
'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Upload, Building2, CalendarIcon } from 'lucide-react';
import { useCompany } from '@/hooks/use-company';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuditLog, logAudit } from '@/lib/audit-log';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const companySchema = z.object({
    razaoSocial: z.string().min(1, "A Razão Social é obrigatória."),
    nomeFantasia: z.string().optional(),
    cnpj: z.string().min(18, "O CNPJ é obrigatório e deve ser válido.").max(18, "CNPJ inválido."),
    inscricaoEstadual: z.string().optional(),
    inscricaoMunicipal: z.string().optional(),
    inscricaoSuframa: z.string().optional(),
    telefone: z.string().optional(),
    email: z.string().email("E-mail inválido.").optional().or(z.literal('')),
    cep: z.string().optional(),
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    uf: z.string().optional(),
    regimeTributario: z.string().min(1, "O Regime Tributário é obrigatório."),
    classificacaoTributaria: z.string().optional(),
    cnaePrincipal: z.string().optional(),
    logo: z.string().optional(),
    contadorNome: z.string().optional(),
    contadorCpf: z.string().optional(),
    contadorCrc: z.string().optional(),
    planoId: z.string().optional(),
    statusLicenca: z.string().optional(),
    dataVencimentoLicenca: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function MinhaEmpresaPage() {
  const { currentCompany, companies, updateCompany, switchCompany, useScopedData } = useCompany();
  const { toast } = useToast();
  const router = useRouter();
  const [, setAuditLogs] = useScopedData<AuditLog[]>('audit-trail-logs', []);
  
  const [isQueryingCnpj, setIsQueryingCnpj] = useState(false);
  const [isQueryingCep, setIsQueryingCep] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
        razaoSocial: '',
        nomeFantasia: '',
        cnpj: '',
        email: '',
        regimeTributario: '',
    },
  });

  useEffect(() => {
    if (currentCompany) {
      const activeCompany = companies.find(c => c.id === currentCompany);
      if (activeCompany) {
        form.reset({
          razaoSocial: activeCompany.data?.razaoSocial || activeCompany.name || '',
          nomeFantasia: activeCompany.data?.nomeFantasia || '',
          cnpj: activeCompany.data?.cnpj || '',
          inscricaoEstadual: activeCompany.data?.inscricaoEstadual || '',
          inscricaoMunicipal: activeCompany.data?.inscricaoMunicipal || '',
          inscricaoSuframa: activeCompany.data?.inscricaoSuframa || '',
          telefone: activeCompany.data?.telefone || '',
          email: activeCompany.data?.email || '',
          cep: activeCompany.data?.cep || '',
          logradouro: activeCompany.data?.logradouro || '',
          numero: activeCompany.data?.numero || '',
          complemento: activeCompany.data?.complemento || '',
          bairro: activeCompany.data?.bairro || '',
          cidade: activeCompany.data?.cidade || '',
          uf: activeCompany.data?.uf || '',
          regimeTributario: activeCompany.data?.regimeTributario || '',
          classificacaoTributaria: activeCompany.data?.classificacaoTributaria || '',
          cnaePrincipal: activeCompany.data?.cnaePrincipal || '',
          logo: activeCompany.data?.logo || '',
          contadorNome: activeCompany.data?.contadorNome || '',
          contadorCpf: activeCompany.data?.contadorCpf || '',
          contadorCrc: activeCompany.data?.contadorCrc || '',
          planoId: activeCompany.data?.planoId || 'Gratuito',
          statusLicenca: activeCompany.data?.statusLicenca || 'Ativa',
          dataVencimentoLicenca: activeCompany.data?.dataVencimentoLicenca || '',
        });
      }
    } else if (companies.length > 0) {
      switchCompany(companies[0].id);
    }
  }, [currentCompany, companies, switchCompany, form]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                form.setValue('logo', base64String);
                toast({
                    title: "Logo Atualizada",
                    description: "A nova imagem de logo foi carregada. Lembre-se de salvar as alterações.",
                })
            };
            reader.readAsDataURL(file);
        }
    }

  const handleSave = (data: CompanyFormData) => {
    setIsSaving(true);
    if (!currentCompany) {
      toast({
        variant: 'destructive',
        title: 'Nenhuma empresa selecionada',
        description: 'Selecione uma empresa antes de salvar.',
      });
      setIsSaving(false);
      return;
    }

    const updatedCompany = {
      id: currentCompany,
      name: data.razaoSocial,
      data: data,
    };
    
    updateCompany(currentCompany, updatedCompany);
    logAudit(setAuditLogs, 'UPDATE', 'Minha Empresa', 'Atualizou os dados cadastrais da empresa.');

    setTimeout(() => {
        toast({
            title: 'Dados Salvos!',
            description: 'As informações da empresa foram atualizadas com sucesso.',
        });
        setIsSaving(false);
    }, 500);
  };

  const handleCnpjQuery = async () => {
    const cnpj = form.getValues('cnpj').replace(/\D/g, '');
    if (!cnpj || cnpj.length !== 14) {
        toast({ variant: 'destructive', title: 'CNPJ inválido', description: 'Por favor, insira um CNPJ válido com 14 dígitos.' });
        return;
    }

    setIsQueryingCnpj(true);
    try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'CNPJ não encontrado ou API indisponível.' }));
            throw new Error(errorData.message || `Erro: ${response.statusText}`);
        }
        const data = await response.json();
        
        form.reset({
            ...form.getValues(),
            razaoSocial: data.razao_social || '',
            nomeFantasia: data.nome_fantasia || '',
            cnaePrincipal: data.cnae_fiscal || '',
            cep: data.cep || '',
            logradouro: data.logradouro || '',
            numero: data.numero || '',
            complemento: data.complemento || '',
            bairro: data.bairro || '',
            cidade: data.municipio || '',
            uf: data.uf || '',
            telefone: data.ddd_telefone_1 || '',
            email: data.email || '',
        });

        toast({ title: 'CNPJ Consultado!', description: 'Os dados da empresa foram preenchidos com sucesso.' });

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Erro na Consulta de CNPJ',
            description: error.message || 'Não foi possível buscar os dados do CNPJ.'
        });
    } finally {
        setIsQueryingCnpj(false);
    }
  }

    const handleCepQuery = async () => {
        const cep = form.getValues('cep')?.replace(/\D/g, '');
        if (!cep || cep.length !== 8) {
            toast({ variant: 'destructive', title: 'CEP inválido', description: 'Por favor, insira um CEP válido com 8 dígitos.' });
            return;
        }

        setIsQueryingCep(true);
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'CEP não encontrado ou API indisponível.' }));
                throw new Error(errorData.message || `Erro: ${response.statusText}`);
            }
            const data = await response.json();

            form.setValue('logradouro', data.street || '');
            form.setValue('bairro', data.neighborhood || '');
            form.setValue('cidade', data.city || '');
            form.setValue('uf', data.state || '');

            toast({ title: 'CEP Consultado!', description: 'O endereço foi preenchido com sucesso.' });

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro na Consulta de CEP',
                description: error.message || 'Não foi possível buscar os dados do CEP.'
            });
        } finally {
            setIsQueryingCep(false);
        }
    }
  
  if (companies.length === 0 && !currentCompany) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Minha Empresa</h1>
          <p className="text-muted-foreground">
            Cadastre sua primeira empresa para começar.
          </p>
        </div>
        <Card>
            <CardHeader>
              <CardTitle>Nenhuma Empresa Encontrada</CardTitle>
              <CardDescription>Parece que você ainda não cadastrou nenhuma empresa. Clique abaixo para adicionar a primeira.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={() => router.push('/selecionar-empresa')}>Cadastrar Empresa</Button>
            </CardContent>
          </Card>
      </div>
    )
  }


  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Minha Empresa</h1>
            <p className="text-muted-foreground">
            Edite os dados cadastrais da sua empresa. O número de controle é o ID: <span className='font-bold'>{currentCompany || 'N/D'}</span>
            </p>
        </div>

        <Tabs defaultValue="geral">
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="endereco">Endereço</TabsTrigger>
                <TabsTrigger value="fiscal">Fiscal e Plano</TabsTrigger>
                <TabsTrigger value="contador">Contador</TabsTrigger>
                <TabsTrigger value="logo">Logo</TabsTrigger>
            </TabsList>

            <TabsContent value="geral">
                <Card>
                    <CardHeader>
                        <CardTitle>Dados Gerais</CardTitle>
                        <CardDescription>Informações principais de identificação da sua empresa.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="cnpj"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CNPJ</FormLabel>
                                    <div className="flex gap-2">
                                        <FormControl>
                                            <Input placeholder="00.000.000/0001-00" {...field} />
                                        </FormControl>
                                        <Button type="button" variant="outline" onClick={handleCnpjQuery} disabled={isQueryingCnpj}>
                                            {isQueryingCnpj ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
                                            <span className="ml-2 hidden sm:inline">Consultar</span>
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="razaoSocial"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Razão Social</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Razão Social Completa" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nomeFantasia"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome Fantasia</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nome Fantasia" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="telefone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telefone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="(00) 00000-0000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>E-mail</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="contato@suaempresa.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="endereco">
                <Card>
                    <CardHeader>
                        <CardTitle>Endereço</CardTitle>
                        <CardDescription>Endereço da sede principal da empresa.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                             <FormField
                                control={form.control}
                                name="cep"
                                render={({ field }) => (
                                    <FormItem className='sm:col-span-1'>
                                        <FormLabel>CEP</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input placeholder="00000-000" {...field} />
                                            </FormControl>
                                            <Button type="button" variant="outline" onClick={handleCepQuery} disabled={isQueryingCep}>
                                                {isQueryingCep ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
                                                <span className="ml-2 hidden sm:inline">Buscar</span>
                                            </Button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                             <FormField
                                control={form.control}
                                name="logradouro"
                                render={({ field }) => (
                                    <FormItem className='sm:col-span-2'>
                                        <FormLabel>Logradouro</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Avenida, Rua, etc." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="numero"
                                render={({ field }) => (
                                    <FormItem className='sm:col-span-1'>
                                        <FormLabel>Número</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                             <FormField
                                control={form.control}
                                name="complemento"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Complemento</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Sala, Bloco, etc." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="bairro"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bairro</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                             <FormField
                                control={form.control}
                                name="cidade"
                                render={({ field }) => (
                                    <FormItem className='sm:col-span-2'>
                                        <FormLabel>Cidade</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="uf"
                                render={({ field }) => (
                                    <FormItem className='sm:col-span-1'>
                                        <FormLabel>UF</FormLabel>
                                        <FormControl>
                                            <Input maxLength={2} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

             <TabsContent value="fiscal">
                <Card>
                    <CardHeader>
                        <CardTitle>Dados Fiscais e de Plano</CardTitle>
                        <CardDescription>Configurações tributárias e fiscais da empresa.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField
                                control={form.control}
                                name="regimeTributario"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Regime Tributário (Apuração)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="simples">Simples Nacional</SelectItem>
                                                <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                                                <SelectItem value="lucro_real">Lucro Real</SelectItem>
                                                <SelectItem value="mei">Microempreendedor Individual (MEI)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="cnaePrincipal"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CNAE Principal</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Código CNAE" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="inscricaoEstadual"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Inscrição Estadual</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nº da Inscrição Estadual" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="inscricaoMunicipal"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Inscrição Municipal</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nº da Inscrição Municipal" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="inscricaoSuframa"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Inscrição SUFRAMA</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nº da Inscrição SUFRAMA" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="classificacaoTributaria"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Classificação Tributária (eSocial/Reinf)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Selecione a classificação para eSocial/Reinf..." /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="01">01 - Empresa enquadrada no regime de tributação Simples Nacional com tributação previdenciária substituída</SelectItem>
                                            <SelectItem value="02">02 - Empresa enquadrada no regime de tributação Simples Nacional com tributação previdenciária não substituída</SelectItem>
                                            <SelectItem value="03">03 - Empresa enquadrada no regime de tributação Simples Nacional com tributação previdenciária substituída e não substituída</SelectItem>
                                            <SelectItem value="04">04 - MEI - Microempreendedor Individual</SelectItem>
                                            <SelectItem value="21">21 - Pessoa Física, exceto segurado especial</SelectItem>
                                            <SelectItem value="22">22 - Segurado Especial</SelectItem>
                                            <SelectItem value="60">60 - Missão Diplomática e Repartição Consular de carreira estrangeira</SelectItem>
                                            <SelectItem value="70">70 - Empresa de que trata o Decreto nº 5.436/2005</SelectItem>
                                            <SelectItem value="80">80 - Entidade Imune ou Isenta</SelectItem>
                                            <SelectItem value="85">85 - Ente Federativo, Órgãos e Entidades da Administração Pública Direta, Autárquica e Fundacional (Administração Pública Federal, Estadual, Municipal e do DF)</SelectItem>
                                            <SelectItem value="99">99 - Pessoas Jurídicas e Físicas em geral não classificadas nos demais códigos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            </TabsContent>

             <TabsContent value="contador">
                <Card>
                    <CardHeader>
                        <CardTitle>Dados do Contador</CardTitle>
                        <CardDescription>Informações do profissional contábil responsável pela empresa.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField
                                control={form.control}
                                name="contadorNome"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome do Contador</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nome completo do contador" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="contadorCpf"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CPF do Contador</FormLabel>
                                        <FormControl>
                                            <Input placeholder="000.000.000-00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="contadorCrc"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>CRC do Contador</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: MG-999999/O-1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="logo">
                <Card>
                    <CardHeader>
                        <CardTitle>Logo da Empresa</CardTitle>
                        <CardDescription>Faça o upload do logotipo que representará a empresa no sistema.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-6">
                        <Avatar className="h-32 w-32 rounded-lg border-2">
                            <AvatarImage src={form.getValues('logo') || undefined} alt="Logo da Empresa" />
                            <AvatarFallback className="rounded-lg">
                                <Building2 className="h-16 w-16 text-muted-foreground" />
                            </AvatarFallback>
                        </Avatar>
                        <Button asChild variant="outline">
                            <label htmlFor="logo-upload" className='cursor-pointer'>
                                <Upload className="mr-2 h-4 w-4" /> Enviar Logo
                                <input id="logo-upload" type="file" className="sr-only" accept="image/*" onChange={handleLogoChange}/>
                            </label>
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
        <div className='pt-6 flex justify-end'>
            <Button type="submit" size="lg" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
            </Button>
        </div>
    </form>
    </Form>
  );
}
