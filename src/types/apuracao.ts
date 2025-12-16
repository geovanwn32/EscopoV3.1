
export interface ApuracaoImpostos {
  id: string;
  mesCompetencia: string; // "MM/yyyy"
  dataGeracao: string; // ISO string
  receitaBrutaTotal: number;
  impostoDevido: number;
  calculos: {
    baseCalculo: number;
    aliquotaEfetiva: number;
    [key: string]: any; // To allow for more complex calculation details
  };
}
