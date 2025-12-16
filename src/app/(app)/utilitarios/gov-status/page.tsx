'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Server, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

type ServiceStatus = 'online' | 'offline' | 'instavel';

interface GovService {
  nome: string;
  uf?: string;
  status: ServiceStatus;
  // A API da nfe.io não fornece a última verificação por serviço, então vamos gerenciar isso no front-end
  lastChecked: Date;
}


export default function GovStatusPage() {
    const [services, setServices] = useState<GovService[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const { toast } = useToast();

    const fetchStatuses = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`https://api.nfe.io/v1/status`);
        if (!response.ok) {
          throw new Error('Não foi possível buscar os status dos serviços.');
        }
        const data = await response.json();
        
        const now = new Date();
        const formattedServices: GovService[] = Object.entries(data).map(([key, value]: [string, any]) => ({
          nome: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Formats the key to a readable name
          uf: value.uf || undefined,
          status: value.status,
          lastChecked: now
        }));

        setServices(formattedServices);
        setLastUpdated(now);
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
    
    useEffect(() => {
        fetchStatuses();
    }, []);

    const getStatusBadge = (status: ServiceStatus) => {
        switch (status) {
          case 'online':
            return (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Wifi className="mr-2 h-3 w-3" />
                Online
              </Badge>
            );
          case 'offline':
            return (
              <Badge variant="destructive">
                <WifiOff className="mr-2 h-3 w-3" />
                Offline
              </Badge>
            );
          case 'instavel':
            return (
              <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-600 text-white">
                <Server className="mr-2 h-3 w-3" />
                Instável
              </Badge>
            );
          default:
            return <Badge variant="outline">Desconhecido</Badge>;
        }
      };


    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Status de Serviços do Governo</h1>
          <p className="text-muted-foreground">
            Verifique a disponibilidade de serviços como eSocial, Sefaz e EFD-Reinf.
          </p>
        </div>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Disponibilidade dos Serviços</CardTitle>
                    <CardDescription>
                         {isLoading ? 'Buscando informações...' : `Última atualização: ${lastUpdated?.toLocaleString('pt-BR') || 'N/A'}`}
                    </CardDescription>
                </div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" onClick={fetchStatuses} disabled={isLoading} size="icon">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            <span className="sr-only">Atualizar Status</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Atualizar Status</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Serviço</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">UF</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><div className="h-5 bg-muted rounded w-3/4 animate-pulse"></div></TableCell>
                                        <TableCell><div className="h-5 bg-muted rounded w-1/2 animate-pulse"></div></TableCell>
                                        <TableCell className='text-right'><div className="h-5 bg-muted rounded w-1/4 animate-pulse ml-auto"></div></TableCell>
                                    </TableRow>
                                ))
                            ) : services.map(service => (
                                <TableRow key={service.nome}>
                                    <TableCell className="font-medium">
                                        <div>{service.nome}</div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(service.status)}</TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                         {service.uf || 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }
