'use client';

import { useState, useMemo } from 'react';
import { useCompany } from '@/hooks/use-company';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Calculator, Save, FileDown, TrendingUp, FileText, Percent, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NotaFiscal, ProductItem, ServiceItem } from '@/types/fiscal';
import { ApuracaoImpostos } from '@/types/apuracao';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ApuracaoResult {
  receitaBrutaTotal: number;
  impostoDevido: number;
  baseCalculo: number;
  aliquotaEfetiva: number;
}

// Augment jsPDF interface
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

export default function ApuracaoPage() {
  const { useScopedData, companies, currentCompany } = useCompany();
  const [notasSaida] = useScopedData<NotaFiscal[]>('fiscal-notasSaida', []);
  const [notasServico] = useScopedData<NotaFiscal[]>('fiscal-notasServico', []);
  const [apuracoesSalvas, setApuracoesSalvas] = useScopedData<ApuracaoImpostos[]>('fiscal-apuracoes-salvas', []);

  const [mesCompetencia, setMesCompetencia] = useState<string>(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const [isLoading, setIsLoading] = useState(false);
  const [calculation, setCalculation] = useState<ApuracaoResult | null>(null);

  const { toast } = useToast();
  const activeCompany = useMemo(() => companies.find(c => c.id === currentCompany), [companies, currentCompany]);

  const handleCalculate = () => {
    setIsLoading(true);
    setCalculation(null);

    setTimeout(() => {
      try {
        const [year, month] = mesCompetencia.split('-').map(Number);
        
        const allSales = [...notasSaida, ...notasServico];
        const salesInPeriod = allSales.filter(nota => {
            const notaDate = nota.dados.geral?.dataEmissao || nota.dados.identificacao?.dataEmissao;
            if (!notaDate) return false;
            const date = new Date(notaDate);
            return date.getFullYear() === year && date.getMonth() + 1 === month;
        });

        if (salesInPeriod.length === 0) {
            toast({
                variant: "destructive",
                title: "Nenhuma nota encontrada",
                description: `Não há notas de venda ou serviço emitidas para ${String(month).padStart(2,'0')}/${year}.`
            });
            setIsLoading(false);
            return;
        }

        const receitaBrutaTotal = salesInPeriod.reduce((acc, nota) => {
            const items = nota.items as (ProductItem[] | ServiceItem[]);
            const totalItems = items.reduce((itemAcc, item) => {
                if ('total' in item) return itemAcc + item.total;
                if ('value' in item) return itemAcc + item.value;
                return itemAcc;
            }, 0);
            return acc + totalItems;
        }, 0);
        
        let aliquotaEfetiva = 0;
        if (receitaBrutaTotal <= 180000) {
            aliquotaEfetiva = 0.06;
        } else if (receitaBrutaTotal <= 360000) {
            aliquotaEfetiva = 0.112;
        } else {
            aliquotaEfetiva = 0.135;
        }
        
        const impostoDevido = receitaBrutaTotal * aliquotaEfetiva;

        setCalculation({
          receitaBrutaTotal,
          impostoDevido,
          baseCalculo: receitaBrutaTotal,
          aliquotaEfetiva: aliquotaEfetiva * 100,
        });

      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Erro no cálculo', description: e.message });
      } finally {
        setIsLoading(false);
      }
    }, 500);
  };
  
    const handleSaveCalculation = () => {
        if (!calculation) {
            toast({ variant: 'destructive', title: 'Nenhum cálculo a salvar' });
            return;
        }
        const newApuracao: ApuracaoImpostos = {
            id: Date.now().toString(),
            mesCompetencia: format(new Date(mesCompetencia + '-02'), 'MM/yyyy'),
            dataGeracao: new Date().toISOString(),
            receitaBrutaTotal: calculation.receitaBrutaTotal,
            impostoDevido: calculation.impostoDevido,
            calculos: {
                baseCalculo: calculation.baseCalculo,
                aliquotaEfetiva: calculation.aliquotaEfetiva
            }
        };
        setApuracoesSalvas(prev => [newApuracao, ...prev]);
        toast({ title: 'Apuração Salva!', description: 'O resultado foi salvo no histórico de apurações.' });
    };

    const handleGeneratePdf = () => {
        if (!calculation || !activeCompany) {
            toast({ variant: 'destructive', title: 'Dados insuficientes' });
            return;
        }

        const doc = new jsPDF();
        const pageMargin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('DAS - Documento de Arrecadação do Simples Nacional', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text('(SIMULAÇÃO)', pageWidth / 2, 25, { align: 'center' });

        doc.autoTable({
            startY: 35,
            theme: 'grid',
            head: [['Contribuinte']],
            body: [
                [`Período de Apuração (PA): ${format(new Date(mesCompetencia + '-02'), 'MM/yyyy')}`],
                [`CNPJ: ${activeCompany.data?.cnpj || 'Não informado'}`],
                [`Nome Empresarial: ${activeCompany.name}`],
            ],
            headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold' }
        });

        let finalY = (doc as any).lastAutoTable.finalY + 10;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Valor a Pagar', pageMargin, finalY);
        finalY += 5;
        
        doc.autoTable({
            startY: finalY,
            theme: 'grid',
            head: [['Descrição do Débito', 'Valor Principal']],
            body: [
                ['Principal SN - Cód 1228', formatCurrency(calculation.impostoDevido)]
            ],
            headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold' },
            columnStyles: { 1: { halign: 'right' } }
        });

        finalY = (doc as any).lastAutoTable.finalY;

        doc.autoTable({
            startY: finalY,
            theme: 'grid',
            body: [
                 [{ content: 'Total Consolidado do Período:', styles: { fontStyle: 'bold' } }, { content: formatCurrency(calculation.impostoDevido), styles: { halign: 'right', fontStyle: 'bold' } }]
            ]
        });

        finalY = (doc as any).lastAutoTable.finalY + 15;
        
        doc.setFontSize(10);
        doc.text('Data de Vencimento:', pageMargin, finalY);
        doc.setFont('helvetica', 'normal');
        doc.text('20/' + format(new Date(mesCompetencia + '-02').setMonth(new Date(mesCompetencia + '-02').getMonth() + 1), 'MM/yyyy'), pageMargin + 40, finalY);

        doc.save(`DAS_Simulacao_${mesCompetencia.replace('-', '_')}.pdf`);
        toast({ title: 'PDF Gerado!', description: 'A simulação da guia DAS foi baixada.' });
    };

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Apuração de Impostos</h1>
        <p className="text-muted-foreground">
          Consolide impostos e realize o fechamento fiscal do período.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Período de Apuração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="competencia">Mês de Competência</Label>
                <Input
                  id="competencia"
                  type="month"
                  value={mesCompetencia}
                  onChange={(e) => setMesCompetencia(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleCalculate} disabled={isLoading} className="w-full" size="lg">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Calculator className="mr-2 h-4 w-4" />}
                    {isLoading ? "Apurando..." : "Apurar Impostos"}
                </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="min-h-full">
            <CardHeader>
              <CardTitle>2. Resultado da Apuração</CardTitle>
              <CardDescription>Resumo dos impostos calculados para o período selecionado.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : calculation ? (
                 <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="bg-muted/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-4 w-4"/> Receita Bruta Total</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{formatCurrency(calculation.receitaBrutaTotal)}</p>
                            </CardContent>
                        </Card>
                         <Card className="bg-muted/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground"><Percent className="h-4 w-4"/> Alíquota Efetiva
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                                        <TooltipContent><p>Cálculo simplificado (Anexo III)</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{calculation.aliquotaEfetiva.toFixed(2)}%</p>
                            </CardContent>
                        </Card>
                    </div>
                     <div className='mt-6 flex justify-between items-center font-bold text-xl p-4 bg-primary/10 rounded-lg text-primary'>
                        <span>Simples Nacional a Recolher</span>
                        <span className="font-mono">{formatCurrency(calculation.impostoDevido)}</span>
                    </div>
                     <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <p>Base de Cálculo: <span className='font-mono'>{formatCurrency(calculation.baseCalculo)}</span></p>
                    </div>
                 </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground h-64">
                  <Calculator className="h-12 w-12 mb-4" />
                  <p className="font-medium">Selecione o período e clique em "Apurar"</p>
                  <p className="text-sm">O resultado da apuração aparecerá aqui.</p>
                </div>
              )}
            </CardContent>
             {calculation && (
                <CardFooter className="justify-end gap-2 border-t pt-6 mt-4">
                    <Button variant="outline" onClick={handleSaveCalculation}><Save className="mr-2 h-4 w-4" /> Salvar Apuração</Button>
                    <Button onClick={handleGeneratePdf}><FileDown className="mr-2 h-4 w-4" /> Gerar Guia DAS (Simulação)</Button>
                </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
