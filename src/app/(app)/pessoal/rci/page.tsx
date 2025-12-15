import RciCalculator from "./RciCalculator";

export default function RciPage() {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight font-headline">RCI (Pró-labore)</h1>
          <p className="text-muted-foreground">
            Calcule o Recibo de Pagamento de Contribuinte Individual para pró-labore dos sócios.
          </p>
        </div>
        <RciCalculator />
      </div>
    );
  }
