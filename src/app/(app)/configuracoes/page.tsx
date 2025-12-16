
"use client"

import { useState, useEffect } from "react"
import { Moon, Sun, Monitor, Bell, Trash2, Loader2 } from "lucide-react"
import { useTheme } from "next-themes"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  
  // States for notification switches - default to true
  const [pagarNotif, setPagarNotif] = useState(true)
  const [receberNotif, setReceberNotif] = useState(true)
  const [sefazNotif, setSefazNotif] = useState(true)


  useEffect(() => {
    setMounted(true)
  }, [])
  
  const handleClearCache = () => {
    setIsClearing(true);
    setTimeout(() => {
        // In a real scenario, you might have more complex logic
        // For this demo, we clear the entire localStorage.
        // Be cautious with this in a real app with important stored data.
        localStorage.clear();
        sessionStorage.clear();
        
        toast({
            title: "Cache Limpo!",
            description: "O cache local foi limpo com sucesso. A página será recarregada.",
        });

        // Reload the page to apply changes
        setTimeout(() => window.location.reload(), 1500);

    }, 1000);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Configurações</h1>
        <p className="text-muted-foreground">
          Altere o tema da aplicação e outras preferências de usuário.
        </p>
      </div>
        
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <Card>
              <CardHeader>
              <CardTitle>Tema da Aplicação</CardTitle>
              <CardDescription>Escolha como o EscopoV3 deve se parecer. A opção "Sistema" usará a preferência do seu dispositivo.</CardDescription>
              </CardHeader>
              <CardContent>
              {mounted ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <ThemePreview 
                    themeName="light"
                    title="Claro"
                    icon={<Sun className="h-5 w-5" />}
                    isActive={theme === "light"}
                    onClick={() => setTheme("light")}
                  />
                  <ThemePreview 
                    themeName="dark"
                    title="Escuro"
                    icon={<Moon className="h-5 w-5" />}
                    isActive={theme === "dark"}
                    onClick={() => setTheme("dark")}
                  />
                  <ThemePreview 
                    themeName="system"
                    title="Sistema"
                    icon={<Monitor className="h-5 w-5" />}
                    isActive={theme === "system"}
                    onClick={() => setTheme("system")}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="h-[120px] bg-muted rounded-lg animate-pulse" />
                    <div className="h-[120px] bg-muted rounded-lg animate-pulse" />
                    <div className="h-[120px] bg-muted rounded-lg animate-pulse" />
                </div>
              )}
              </CardContent>
          </Card>
           <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5"/> Gerenciamento de Dados</CardTitle>
                <CardDescription>Ações relacionadas aos dados armazenados no seu navegador.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                        <Label htmlFor="clear-cache" className="font-semibold">Limpar Cache Local</Label>
                        <p className="text-sm text-muted-foreground">Isso removerá todos os dados do EscopoV3 salvos no seu navegador. Use se estiver com problemas de exibição.</p>
                    </div>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" id="clear-cache">Limpar</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso limpará permanentemente todos os dados de empresas, lançamentos e configurações do seu navegador. 
                            <strong className="block mt-2">Você será desconectado após a conclusão.</strong>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isClearing}>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleClearCache} disabled={isClearing}>
                             {isClearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar e Limpar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
              </CardContent>
            </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5"/> Preferências de Notificação</CardTitle>
            <CardDescription>Controle quais alertas e notificações você deseja receber.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
             <div className="flex items-center justify-between p-4">
                <Label htmlFor="notif-receber" className="flex flex-col gap-1">
                    <span className="font-semibold">Contas a Receber Atrasadas</span>
                    <span className="font-normal text-muted-foreground">Alertas sobre recebimentos que passaram da data de vencimento.</span>
                </Label>
                <Switch id="notif-receber" checked={receberNotif} onCheckedChange={setReceberNotif} />
            </div>
            <Separator />
            <div className="flex items-center justify-between p-4">
                <Label htmlFor="notif-pagar" className="flex flex-col gap-1">
                    <span className="font-semibold">Contas a Pagar Próximas</span>
                     <span className="font-normal text-muted-foreground">Avisos sobre contas que vencerão nos próximos 7 dias.</span>
                </Label>
                <Switch id="notif-pagar" checked={pagarNotif} onCheckedChange={setPagarNotif} />
            </div>
             <Separator />
             <div className="flex items-center justify-between p-4">
                <Label htmlFor="notif-sefaz" className="flex flex-col gap-1">
                    <span className="font-semibold">Instabilidade em Serviços (Sefaz)</span>
                     <span className="font-normal text-muted-foreground">Notificações quando um serviço da Sefaz ficar instável ou offline.</span>
                </Label>
                <Switch id="notif-sefaz" checked={sefazNotif} onCheckedChange={setSefazNotif} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface ThemePreviewProps {
  themeName: "light" | "dark" | "system";
  title: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

function ThemePreview({ themeName, title, icon, isActive, onClick }: ThemePreviewProps) {
  return (
    <div className="space-y-2">
      <button
        onClick={onClick}
        className={cn(
          "rounded-lg border-2 p-1.5 transition-all w-full",
          isActive
            ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
            : "border-border hover:border-primary/50"
        )}
      >
        <div 
          className={cn(
            "h-24 w-full rounded-md", 
            themeName === "light" && "bg-[#F5F5F5]",
            themeName === "dark" && "bg-[#0A0A0A]",
            themeName === "system" && "bg-muted"
          )}
        >
          <div
            className={cn(
              "flex h-full w-full gap-2 rounded-md p-2",
              themeName === "light" && "dark",
              themeName === "light" && "[--background:240_10%_97%] [--card:0_0%_100%] [--primary:228_100%_64%]"
            )}
            style={themeName === 'dark' ? {
                "--background": "235 15% 15%",
                "--card": "235 15% 18%",
                "--primary": "228 100% 64%",
            } as React.CSSProperties : {}}
          >
              <div className="w-1/4 rounded-sm bg-card" />
              <div className="flex w-3/4 flex-col gap-1">
                <div className="h-3 w-4/5 rounded-sm bg-primary" />
                <div className="h-2 w-full rounded-sm bg-card" />
                <div className="h-2 w-full rounded-sm bg-card" />
              </div>
          </div>
        </div>
      </button>
      <div className="flex items-center justify-center gap-2">
        {icon}
        <span className="font-medium text-sm text-muted-foreground">{title}</span>
      </div>
    </div>
  )
}
