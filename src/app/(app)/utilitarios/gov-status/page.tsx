'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Server, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type ServiceStatus = 'ONLINE' | 'OFFLINE' | 'INSTAVEL';

interface GovService {
  name: string;
  description: string;
  status: ServiceStatus;
  lastChecked: Date;
}

const initialServices: GovService[] = [
  { name: 'eSocial', description: 'Sistema de Escrituração Digital das Obrigações Fiscais, Previdenciárias e Trabalhistas', status: 'ONLINE', lastChecked: new Date() },
  { name: 'EFD-Reinf', description: 'Escrituração Fiscal Digital de Retenções e Outras Informações Fiscais', status: 'ONLINE', lastChecked: new Date() },
  { name: 'DCTFWeb', description: 'Declaração de Débitos e Créditos Tributários Federais Previdenciários e de Outras Entidades e Fundos', status: 'ONLINE', lastChecked: new Date() },
  { name: 'ReceitaNet', description: 'Serviço de transmissão de declarações da Receita Federal', status: 'INSTAVEL', lastChecked: new Date() },
  { name: 'Conectividade Social', description: 'Canal eletrônico de relacionamento com a Caixa Econômica Federal', status: 'OFFLINE', lastChecked: new Date() },
];


export default function GovStatusPage() {
    const [services, setServices] = useState<GovService[]>(initialServices);
    const [isLoading, setIsLoading] = useState(false);

    const refreshStatuses = () => {
        setIsLoading(true);
        // Simulate an API call
        setTimeout(() => {
            setServices(prev => prev.map(s => ({
                ...s,
                // Randomize status for demonstration
                status: ['ONLINE', 'INSTAVEL', 'OFFLINE'][Math.floor(Math.random() * 3)] as ServiceStatus,
                lastChecked: new Date(),
            })));
            setIsLoading(false);
        }, 1000);
    };

    const getStatusBadge = (status: ServiceStatus) => {
        switch (status) {
          case 'ONLINE':
            return (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Wifi className="mr-2 h-3 w-3" />
                Online
              </Badge>
            );
          case 'OFFLINE':
            return (
              <Badge variant="destructive">
                <WifiOff className="mr-2 h-3 w-3" />
                Offline
              </Badge>
            );
          case 'INSTAVEL':
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
            Verifique a disponibilidade de serviços como eSocial e EFD-Reinf.
          </p>
        </div>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Disponibilidade dos Serviços</CardTitle>
                    <CardDescription>
                        Última verificação: {services[0]?.lastChecked.toLocaleTimeString('pt-BR') || 'N/A'}
                    </CardDescription>
                </div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" onClick={refreshStatuses} disabled={isLoading} size="icon">
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
                                <TableHead className="text-right">Última Verificação</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.map(service => (
                                <TableRow key={service.name}>
                                    <TableCell className="font-medium">
                                        <div>{service.name}</div>
                                        <div className="text-xs text-muted-foreground">{service.description}</div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(service.status)}</TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                         <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <span className='cursor-default'>{service.lastChecked.toLocaleTimeString('pt-BR')}</span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {service.lastChecked.toLocaleString('pt-BR')}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
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
