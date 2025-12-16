


export interface Dependente {
    id: number;
    nome: string;
    cpf: string;
    dataNascimento: string; // ISO string
}

export interface AnotacaoCarteira {
    id: number;
    data: string; // ISO string
    descricao: string;
}

export interface Funcionario {
    id: number;
    nome: string;
    cpf: string;
    dataAdmissao: string; // ISO string
    cargo: string;
    departamento: string;
    salario: number;
    // Dados Pessoais
    dataNascimento: string; // ISO string
    genero: 'Masculino' | 'Feminino' | 'Outro';
    estadoCivil: 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)' | 'União Estável';
    nacionalidade: string;
    rg: string;
    pis: string;
    // Endereço
    endereco: {
        cep: string;
        logradouro: string;
        numero: string;
        complemento: string;
        bairro: string;
        cidade: string;
        uf: string;
    };
    // Contato
    contato: {
        telefone: string;
        email: string;
    };
    // Contrato
    contrato: {
        horarioTrabalho: string;
        tipoContrato: 'CLT' | 'Estágio' | 'PJ' | 'Temporário';
    };
    // Dados Bancários
    dadosBancarios: {
        banco: string;
        agencia: string;
        conta: string;
    };
    // Dependentes
    dependentes?: Dependente[];
    // Anotações na Carteira de Trabalho
    anotacoesCarteira?: AnotacaoCarteira[];
}


export type RubricaType = 'Provento' | 'Desconto' | 'Base' | 'Informativa';

export interface Incidencia {
    inss: boolean;
    irrf: boolean;
    fgts: boolean;
    contribuicaoSindical: boolean;
}

export interface Rubrica {
    id: number;
    codigo: string;
    descricao: string;
    tipo: RubricaType;
    incidencias: Incidencia;
    label?: string; // for manual entries in calculator
    value?: number; // for manual entries in calculator
}

export interface CalculationResult {
    proventos: Rubrica[];
    descontos: Rubrica[];
    totalProventos: number;
    totalDescontos: number;
    liquido: number;
    baseInss: number;
    baseIrrf: number;
}

export interface SavedCalculation {
    id: number;
    type: 'RCI' | 'Folha';
    date: string;
    netValue: number;
    // RCI specific
    socioId?: string;
    socioName?: string;
    proLaboreValue?: number;
    manualProventos?: Rubrica[];
    manualDescontos?: Rubrica[];
    // Common
    mesCompetencia?: string;
    // Folha specific
    employeeId?: string;
    employeeName?: string;
    faltas?: number;
    horasExtras50?: number;
    horasExtras100?: number;
    calculation?: CalculationResult | null;
}


