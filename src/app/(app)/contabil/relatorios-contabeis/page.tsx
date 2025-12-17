
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function RelatoriosContabeisPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the new unified reports page with the correct module pre-selected
        router.replace('/relatorios?modulo=contabil');
    }, [router]);

    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight">Redirecionando...</h1>
            <p className="text-muted-foreground">
                Você está sendo levado para a nova Central de Relatórios.
            </p>
          </div>
      </div>
    );
  }
