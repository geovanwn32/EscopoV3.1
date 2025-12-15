import RciCalculator from "./RciCalculator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RciPage() {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Link href="/pessoal">
                <Button variant="outline" size="icon" className="h-8 w-8">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Voltar</span>
                </Button>
            </Link>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight font-headline">RCI (Pró-labore)</h1>
              <p className="text-muted-foreground">
                Calcule o Recibo de Pagamento de Contribuinte Individual para pró-labore dos sócios.
              </p>
            </div>
        </div>
        <RciCalculator />
      </div>
    );
  }
