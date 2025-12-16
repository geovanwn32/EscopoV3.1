
'use client';

import { useState, useMemo } from 'react';
import { useCompany } from '@/hooks/use-company';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, Plus, Search, Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Evento {
  id: number;
  titulo: string;
  descricao: string;
  dataInicio: string; // ISO String
  dataFim: string; // ISO String
}

export default function EventosPage() {
  const { useScopedData } = useCompany();
  const [eventos, setEventos] = useScopedData<Evento[]>('utilitarios-eventos', []);
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Evento | null>(null);
  const [editingItem, setEditingItem] = useState<Evento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSave = (itemData: Omit<Evento, 'id'>) => {
    if (editingItem) {
      setEventos(prev => prev.map(e => e.id === editingItem.id ? { ...editingItem, ...itemData } : e));
      toast({ title: "Evento Atualizado!", description: "O evento foi modificado com sucesso." });
    } else {
      const newItem: Evento = { ...itemData, id: Date.now() };
      setEventos(prev => [newItem, ...prev]);
      toast({ title: "Evento Adicionado!", description: "O novo evento foi salvo na agenda." });
    }
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const handleDeleteClick = (item: Evento) => setItemToDelete(item);

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      setEventos(prev => prev.filter(e => e.id !== itemToDelete.id));
      toast({ variant: "destructive", title: "Evento Excluído!", description: "O evento foi removido da agenda." });
      setItemToDelete(null);
    }
  };

  const handleEditClick = (item: Evento) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const filteredItems = useMemo(() => {
    return eventos
      .filter(item =>
        item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());
  }, [eventos, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Agenda de Eventos</h1>
        <p className="text-muted-foreground">
          Gerencie os eventos e lembretes que aparecerão no calendário do dashboard.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Próximos Eventos</CardTitle>
              <CardDescription>{eventos.length} eventos cadastrados.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por título..." className="pl-9 w-full sm:w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingItem(null); }}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" /> Novo Evento</Button>
                </DialogTrigger>
                <ItemForm onSave={handleSave} onOpenChange={setIsDialogOpen} item={editingItem} />
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data e Hora de Início</TableHead>
                  <TableHead>Data e Hora de Fim</TableHead>
                  <TableHead className="w-[64px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? filteredItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.titulo}</TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-xs">{item.descricao}</TableCell>
                    <TableCell>{format(new Date(item.dataInicio), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                    <TableCell>{format(new Date(item.dataFim), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(item)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteClick(item)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">Nenhum evento encontrado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita e excluirá permanentemente o evento da agenda.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ItemFormProps {
  onSave: (item: Omit<Evento, 'id'>) => void;
  onOpenChange: (open: boolean) => void;
  item: Evento | null;
}

function ItemForm({ onSave, onOpenChange, item }: ItemFormProps) {
  const { toast } = useToast();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useState(() => {
    if (item) {
      setTitulo(item.titulo);
      setDescricao(item.descricao);
      setDataInicio(item.dataInicio.slice(0, 16));
      setDataFim(item.dataFim.slice(0, 16));
    } else {
      setTitulo('');
      setDescricao('');
      setDataInicio('');
      setDataFim('');
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !dataInicio || !dataFim) {
      toast({
        variant: 'destructive',
        title: 'Campos Obrigatórios',
        description: 'Título, data de início e data de fim são obrigatórios.'
      });
      return;
    }
    if (new Date(dataInicio) >= new Date(dataFim)) {
      toast({
        variant: 'destructive',
        title: 'Data inválida',
        description: 'A data de fim deve ser posterior à data de início.'
      });
      return;
    }
    onSave({ titulo, descricao, dataInicio: new Date(dataInicio).toISOString(), dataFim: new Date(dataFim).toISOString() });
  };
  
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{item ? 'Editar' : 'Novo'} Evento</DialogTitle>
        <DialogDescription>Preencha os detalhes do evento para adicioná-lo à agenda.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="titulo">Título do Evento *</Label>
          <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Adicione mais detalhes sobre o evento..." />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dataInicio">Início *</Label>
            <Input id="dataInicio" type="datetime-local" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dataFim">Fim *</Label>
            <Input id="dataFim" type="datetime-local" value={dataFim} onChange={(e) => setDataFim(e.target.value)} required />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit">Salvar Evento</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
