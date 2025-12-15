import PayrollCalculator from "./PayrollCalculator";

export default function FolhaDePagamentoPage() {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Folha de Pagamento</h1>
          <p className="text-muted-foreground">
            Calcule a folha de pagamento mensal, férias e rescisões de seus funcionários.
          </p>
        </div>
        <PayrollCalculator />
      </div>
    );
  }
