'use client';
import { useState } from 'react';
import { Loader2, Sparkles, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { suggestBankAccountAssociations } from '@/ai/flows/suggest-bank-account-associations';
import { Badge } from '@/components/ui/badge';
import { useCompany } from '@/hooks/use-company';

type TransactionStatus = 'pending' | 'loading' | 'suggested' | 'error';
interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  status: TransactionStatus;
  suggestion?: string;
  confidence?: number;
}

// Mock data for AI suggestions - can be replaced with real data fetching
const mockPreviousAssociations: { description: string, account: string }[] = [];
const mockLedgerBalances: Record<string, number> = {};

export default function StatementImporter() {
  const { useScopedData } = useCompany();
  const [transactions, setTransactions] = useScopedData<Transaction[]>('statement-importer-transactions', []);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast({
        title: "Arquivo Selecionado",
        description: `O arquivo ${file.name} está pronto para ser processado.`
      })
      // Here you would typically parse the file and set the transactions
      // For now, we'll keep it simple and not process the file content.
      const mockTransactions: Transaction[] = []; // Start with no mock transactions
      setTransactions(mockTransactions);
    }
    // Reset input to allow same file selection again
    e.target.value = ''; 
  }

  const handleSuggestion = async () => {
    if (transactions.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhuma transação",
        description: "Importe e processe um extrato antes de solicitar sugestões.",
      });
      return;
    }

    setIsProcessing(true);
    
    // Create a temporary array to hold the new state
    let updatedTransactions = transactions.map(t => ({ ...t, status: 'loading' as TransactionStatus }));
    setTransactions(updatedTransactions);


    const processTransaction = async (transaction: Transaction) => {
      try {
        const result = await suggestBankAccountAssociations({
          transactionDescription: transaction.description,
          transactionAmount: transaction.amount,
          previousAssociations: mockPreviousAssociations,
          currentLedgerBalances: mockLedgerBalances,
        });
        return { ...transaction, status: 'suggested' as TransactionStatus, suggestion: result.suggestedAccount, confidence: result.confidenceScore };
      } catch (error) {
        console.error(`Error suggesting for transaction ${transaction.id}:`, error);
        return { ...transaction, status: 'error' as TransactionStatus };
      }
    };
    
    const finalTransactions: Transaction[] = [];
    for (const t of transactions) {
        const result = await processTransaction(t);
        finalTransactions.push(result);
        
        // Update the state with the processed transaction and the rest as loading
        const currentState = transactions.map(originalT => {
            const processed = finalTransactions.find(ft => ft.id === originalT.id);
            if (processed) return processed;
            // Mark as loading if not yet processed
            return { ...originalT, status: 'loading' as TransactionStatus };
        });
        setTransactions(currentState);

        await new Promise(res => setTimeout(res, 300)); // UI delay
    }

    setIsProcessing(false);
    toast({
        title: 'Sugestões Geradas!',
        description: 'A IA analisou as transações e sugeriu as contas contábeis.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contabilização de Extrato</CardTitle>
        <CardDescription>
          {transactions.length === 0
            ? 'Importe um extrato para começar a contabilização assistida por IA.'
            : 'As transações do extrato estão prontas para análise.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <Upload className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Importar Extrato Bancário</h3>
            <p className="mt-1 text-sm text-muted-foreground">Clique no botão abaixo para selecionar um arquivo.</p>
            <Button asChild className="mt-4">
              <label htmlFor="statement-upload" className='cursor-pointer'>
                <Upload className="mr-2 h-4 w-4" /> Importar Arquivo
                <input id="statement-upload" type="file" className="sr-only" onChange={handleFileSelect} accept=".csv,.ofx,.txt" />
              </label>
            </Button>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor (R$)</TableHead>
                  <TableHead className="text-center">Conta Sugerida (IA)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.date}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell className={`text-right font-mono ${t.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell className="text-center">
                      {t.status === 'loading' && <Loader2 className="h-4 w-4 animate-spin mx-auto" />}
                      {t.status === 'suggested' && t.suggestion && (
                        <Badge variant={t.confidence && t.confidence > 0.8 ? 'default' : 'secondary'}>{t.suggestion}</Badge>
                      )}
                      {t.status === 'error' && <Badge variant="destructive">Erro</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {transactions.length > 0 && (
        <CardFooter className="flex justify-between">
            <p className='text-sm text-muted-foreground font-code'>Powered by Genkit AI</p>
            <Button onClick={handleSuggestion} disabled={isProcessing}>
                {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                <Sparkles className="mr-2 h-4 w-4" />
                )}
                {isProcessing ? 'Analisando...' : 'Sugerir Contas'}
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
