
export type PersonType = 'JURIDICA' | 'FISICA';
export type PartnerType = 'Cliente' | 'Fornecedor' | 'Transportadora';

export interface Partner {
    id: number;
    personType: PersonType;
    name: string;
    document: string;
    type: PartnerType;
    email?: string;
    phone?: string;
    address?: {
        street?: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
        zipCode?: string;
    };
    taxRegime?: string;
}
