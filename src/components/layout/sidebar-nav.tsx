
'use client';

import {
  LayoutDashboard,
  FileText,
  Users,
  Book,
  Banknote,
  Archive,
  Plug,
  Settings,
  Building,
  LifeBuoy,
  Building2,
  Wrench,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { useSidebar } from '../ui/sidebar';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useCompany } from '@/hooks/use-company';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useEffect, useState, useMemo } from 'react';

interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: React.ElementType;
}

const allNavItems: NavItem[] = [
  { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'fiscal', href: '/fiscal', label: 'Fiscal', icon: FileText },
  { id: 'pessoal', href: '/pessoal', label: 'Pessoal', icon: Users },
  { id: 'contabil', href: '/contabil', label: 'Contábil', icon: Book },
  { id: 'financeiro', href: '/financeiro', label: 'Financeiro', icon: Banknote },
  { id: 'cadastros', href: '/cadastros', label: 'Cadastros', icon: Archive },
  { id: 'conectividade', href: '/conectividade', label: 'Conectividade', icon: Plug },
  { id: 'utilitarios', href: '/utilitarios', label: 'Utilitários', icon: Wrench },
];

const adminNavItem: NavItem = {
    id: 'admin',
    href: '/admin',
    label: 'Controle de Licença',
    icon: ShieldCheck,
};

const planPermissions = {
    'Gratuito': ['dashboard', 'cadastros'],
    'Basico': ['dashboard', 'fiscal', 'financeiro', 'cadastros', 'conectividade'],
    'Profissional': ['dashboard', 'fiscal', 'pessoal', 'contabil', 'financeiro', 'cadastros', 'conectividade', 'utilitarios'],
    'Empresarial': ['dashboard', 'fiscal', 'pessoal', 'contabil', 'financeiro', 'cadastros', 'conectividade', 'utilitarios', 'admin']
};


export function SidebarNav() {
  const pathname = usePathname();
  const { open } = useSidebar();
  const { companies, currentCompany } = useCompany();
  
  const [activeProfile, setActiveProfile] = useState<{isAdmin: boolean, planoId?: keyof typeof planPermissions} | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const profileString = sessionStorage.getItem('user-profile');
        if (profileString) {
            try {
                setActiveProfile(JSON.parse(profileString));
            } catch (e) {
                console.error("Failed to parse user profile from session storage", e);
            }
        }
    }
  }, []);

  const activeCompany = companies.find(c => c.id === currentCompany);
  
  const visibleNavItems = useMemo(() => {
    if (activeProfile?.isAdmin) {
      if (activeCompany?.data?.cnpj === '62.667.939/0001-61') {
          const newItems = [...allNavItems];
          const dashboardIndex = newItems.findIndex(item => item.id === 'dashboard');
          if (dashboardIndex !== -1) {
              newItems.splice(dashboardIndex + 1, 0, adminNavItem);
          }
          return newItems;
      }
      return allNavItems;
    }

    const userPlan = activeProfile?.planoId || 'Gratuito';
    const permissions = planPermissions[userPlan] || [];

    return allNavItems.filter(item => permissions.includes(item.id));
    
  }, [activeProfile, activeCompany]);


  const isNavItemActive = (href: string) => {
    if (href === '/dashboard') {
        return pathname === href;
    }
    if (href === '/cadastros') {
        const cadastroPaths = ['/cadastros', '/parceiros', '/produtos', '/servicos', '/funcionarios', '/socios', '/aliquotas', '/rubricas', '/cadastros/cfop', '/cadastros/natureza-operacao', '/cadastros/tipo-negociacao'];
        return cadastroPaths.some(p => pathname.startsWith(p));
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 py-6">
      <Link href="/selecionar-empresa">
        <div className={cn(
            'flex items-center gap-3 mb-8 px-2 transition-all',
            !open && "justify-center"
        )}>
          <Avatar className='h-10 w-10'>
              <AvatarImage src={activeCompany?.data?.logo || ''}/>
              <AvatarFallback className='bg-primary/10 text-primary'>
                <Building2 className="h-5 w-5" />
              </AvatarFallback>
          </Avatar>
          
          <div className={cn("flex flex-col transition-all duration-300", !open && "w-0 opacity-0")}>
            <span className="font-bold text-md tracking-tight text-foreground truncate">{activeCompany?.data?.nomeFantasia || activeCompany?.name}</span>
            <span className="text-xs text-muted-foreground truncate">{activeCompany?.data?.cnpj}</span>
          </div>

        </div>
      </Link>

      <nav className="flex-1 space-y-2">
        <TooltipProvider delayDuration={0}>
            {visibleNavItems.map((item) => (
            <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                    <Link href={item.href}>
                        <Button
                        variant={isNavItemActive(item.href) ? 'secondary' : 'ghost'}
                        className={cn("w-full h-12 justify-start", !open && "justify-center")}
                        >
                        <item.icon className="h-5 w-5" />
                        <span className={cn("ml-3 transition-all", !open && "hidden")}>{item.label}</span>
                        </Button>
                    </Link>
                </TooltipTrigger>
                {!open && <TooltipContent side="right">{item.label}</TooltipContent>}
            </Tooltip>
            ))}
        </TooltipProvider>
      </nav>

      <div className="mt-auto space-y-2">
        <Separator className="my-2" />
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/suporte">
                <Button variant={isNavItemActive('/suporte') ? 'secondary' : 'ghost'} className={cn("w-full h-12 justify-start", !open && "justify-center")}>
                    <LifeBuoy className="h-5 w-5" />
                    <span className={cn("ml-3 transition-all", !open && "hidden")}>Suporte</span>
                </Button>
              </Link>
            </TooltipTrigger>
            {!open && <TooltipContent side="right">Suporte</TooltipContent>}
          </Tooltip>
           <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/configuracoes">
                  <Button variant={isNavItemActive('/configuracoes') ? 'secondary' : 'ghost'} className={cn("w-full h-12 justify-start", !open && "justify-center")}>
                      <Settings className="h-5 w-5" />
                      <span className={cn("ml-3 transition-all", !open && "hidden")}>Configurações</span>
                  </Button>
              </Link>
            </TooltipTrigger>
            {!open && <TooltipContent side="right">Configurações</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

