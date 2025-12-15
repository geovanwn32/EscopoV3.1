export interface Socio {
    id: number;
    nome: string;
    cpf: string;
    dataEntrada: string; // ISO string
    proLabore: number;
    participacao: number; // Percentage
    dataNascimento?: string; // ISO string
    genero?: 'Masculino' | 'Feminino' | 'Outro';
    endereco?: {
        cep: string;
        logradouro: string;
        numero: string;
        complemento: string;
        bairro: string;
        cidade: string;
        uf: string;
    };
    contato?: {
        telefone: string;
        email: string;
    };
    dadosBancarios?: {
        banco: string;
        agencia: string;
        conta: string;
    };
}
