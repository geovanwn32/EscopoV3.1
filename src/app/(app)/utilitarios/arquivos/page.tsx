
'use client';
import { useState, useMemo, useCallback } from 'react';
import { useCompany } from '@/hooks/use-company';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Search, File as FileIcon, MoreHorizontal, Download, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface StoredFile {
  id: number;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  url: string; // For simplicity, we'll use a data URL
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export default function ArquivosPage() {
  const { useScopedData } = useCompany();
  const [files, setFiles] = useScopedData<StoredFile[]>('utilitarios-arquivos', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<StoredFile | null>(null);
  const { toast } = useToast();

  const handleFileDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    const droppedFiles = Array.from(event.dataTransfer.files);
    handleFileUpload(droppedFiles);
  }, [setFiles]);
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    handleFileUpload(selectedFiles);
    event.target.value = ''; // Reset input
  };
  
  const handleFileUpload = (uploadedFiles: File[]) => {
    const newFiles: StoredFile[] = [];
    const readPromises = uploadedFiles.map(file => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newFiles.push({
            id: Date.now() + Math.random(),
            name: file.name,
            type: file.type || 'Desconhecido',
            size: file.size,
            uploadDate: new Date().toISOString(),
            url: e.target?.result as string,
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });
  
    Promise.all(readPromises).then(() => {
      setFiles(prev => [...newFiles, ...prev]);
      toast({
        title: `${newFiles.length} arquivo(s) carregado(s)!`,
        description: "Os arquivos foram adicionados ao repositório.",
      });
    });
  };

  const handleDeleteClick = (file: StoredFile) => {
    setItemToDelete(file);
  };
  
  const handleConfirmDelete = () => {
    if (itemToDelete) {
      setFiles(prev => prev.filter(f => f.id !== itemToDelete.id));
      toast({
        variant: "destructive",
        title: "Arquivo Excluído!",
        description: `O arquivo ${itemToDelete.name} foi removido.`,
      });
      setItemToDelete(null);
    }
  };

  const filteredFiles = useMemo(() => {
    return files.filter(file => 
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }, [files, searchTerm]);

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Arquivos</h1>
          <p className="text-muted-foreground">
            Repositório para upload e download de arquivos diversos.
          </p>
        </div>

        <Card 
          className={cn('border-2 border-dashed transition-all', isDragOver && 'border-primary bg-primary/10')}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
          onDrop={handleFileDrop}
        >
          <CardContent className="p-6 text-center">
             <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                  <Upload className="h-10 w-10" />
                  <p className="font-semibold text-foreground">Arraste e solte arquivos aqui</p>
                  <p className="text-sm">ou</p>
                   <Button asChild size="sm">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        Selecione os Arquivos
                        <input id="file-upload" type="file" multiple className="sr-only" onChange={handleFileSelect}/>
                      </label>
                  </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Arquivos Carregados</CardTitle>
                        <CardDescription>{files.length} arquivos no repositório.</CardDescription>
                    </div>
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar por nome do arquivo..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"><span className="sr-only">Tipo</span></TableHead>
                                <TableHead>Nome do Arquivo</TableHead>
                                <TableHead className="w-[150px]">Tamanho</TableHead>
                                <TableHead className="w-[200px]">Data de Upload</TableHead>
                                <TableHead className="w-[64px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredFiles.length > 0 ? filteredFiles.map(file => (
                            <TableRow key={file.id}>
                              <TableCell><FileIcon className="h-5 w-5 text-muted-foreground" /></TableCell>
                              <TableCell className="font-medium">{file.name}</TableCell>
                              <TableCell className="text-muted-foreground">{formatBytes(file.size)}</TableCell>
                              <TableCell className="text-muted-foreground">{new Date(file.uploadDate).toLocaleString('pt-BR')}</TableCell>
                              <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild><a href={file.url} download={file.name}><Download className="mr-2 h-4 w-4"/>Baixar</a></DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteClick(file)}><Trash2 className="mr-2 h-4 w-4"/>Excluir</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={5} className="h-24 text-center">
                                Nenhum arquivo encontrado. Comece fazendo um upload.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>

       <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita e excluirá permanentemente o arquivo <span className="font-bold">"{itemToDelete?.name}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
