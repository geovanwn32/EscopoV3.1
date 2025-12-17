
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RelatoriosContabeisPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the new unified reports page
        router.replace('/relatorios?modulo=contabil');
    }, [router]);

    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Relatórios Contábeis</h1>
          <p className="text-muted-foreground">
            Você está sendo redirecionado para a nova Central de Relatórios...
          </p>
        </div>
      </div>
    );
  }
