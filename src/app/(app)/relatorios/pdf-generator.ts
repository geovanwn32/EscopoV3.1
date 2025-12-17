
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Company } from '@/hooks/use-company';
import { NotaFiscal, ProductItem, ServiceItem } from '@/types/fiscal';
import { SavedCalculation, Funcionario } from '@/types/pessoal';
import { Account } from '@/types/contabil';
import { Conta } from '@/types/financeiro';


type Module = 'fiscal' | 'pessoal' | 'contabil' | 'financeiro';

export interface GeneratePdfParams {
    module: Module;
    reportType: string;
    data: any[];
    dateRange?: { from?: Date; to?: Date };
    company: Company;
}

const formatCurrency = (value: number) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const addHeader = (doc: jsPDF, company: Company, title: string, subtitle?: string) => {
    const pageMargin = 15;
    if (company.data?.logo) {
        try { doc.addImage(company.data.logo, 'PNG', pageMargin, 10, 20, 20); } 
        catch (e) { console.error("Error adding logo to PDF:", e); }
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, doc.internal.pageSize.width / 2, 18, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (subtitle) {
        doc.text(subtitle, doc.internal.pageSize.width / 2, 24, { align: 'center' });
    }
};

const addFooter = (doc: jsPDF, companyName: string) => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        const text = `${companyName} | Página ${i} de ${pageCount}`;
        const textWidth = doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor;
        doc.text(text, doc.internal.pageSize.width - textWidth - 15, doc.internal.pageSize.height - 10);
    }
};

const filterByDate = (data: any[], dateKeyFn: (item: any) => string, dateRange?: { from?: Date; to?: Date }) => {
    return data.filter(item => {
        const itemDateStr = dateKeyFn(item);
        if (!itemDateStr) return true; // Include items without a date if no range is specified
        try {
            const itemDate = new Date(itemDateStr);
            if (dateRange?.from && itemDate < dateRange.from) return false;
            if (dateRange?.to && itemDate > dateRange.to) return false;
            return true;
        } catch (e) { return true; }
    });
};

const generateFiscalReport = (doc: jsPDF, reportType: string, data: NotaFiscal[], dateRange?: { from?: Date; to?: Date }) => {
    const reportTitles: Record<string, string> = {
        notas_saida: 'Relatório de Notas de Saída',
        notas_servico: 'Relatório de Notas de Serviço',
        notas_entrada: 'Relatório de Notas de Entrada',
    };
    const reportTitle = reportTitles[reportType] || 'Relatório Fiscal';
    
    const filteredData = filterByDate(data, item => item.dados.geral?.dataEmissao || item.dados.identificacao?.dataEmissao, dateRange);

    const head = reportType === 'notas_servico' 
        ? [['Nº', 'Emissão', 'Prestador', 'Tomador', 'Valor']]
        : [['Nº', 'Emissão', 'Emitente', 'Destinatário', 'Valor']];

    const body = filteredData.map(item => {
        const itemDateStr = item.dados.geral?.dataEmissao || item.dados.identificacao?.dataEmissao;
        const total = (item.items as any[]).reduce((acc, curr) => acc + (curr.total || curr.value || 0), 0);
        return [
            item.dados.geral?.numero || item.dados.identificacao?.numero,
            itemDateStr ? format(parseISO(itemDateStr), 'dd/MM/yyyy') : 'N/A',
            item.dados.emitente?.razaoSocial || item.dados.prestador?.razaoSocial || 'N/A',
            item.dados.destinatario?.razaoSocial || item.dados.tomador?.razaoSocial || 'N/A',
            formatCurrency(total),
        ];
    });

    autoTable(doc, { head, body, startY: 35, theme: 'grid' });

    const totalGeral = filteredData.reduce((acc, item) => {
        return acc + (item.items as any[]).reduce((iAcc, i) => iAcc + (i.total || i.value || 0), 0);
    }, 0);

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Geral:', 15, finalY);
    doc.text(formatCurrency(totalGeral), doc.internal.pageSize.width - 15, finalY, { align: 'right' });

    return reportTitle;
};

const generatePessoalReport = (doc: jsPDF, reportType: string, data: any[], dateRange?: { from?: Date; to?: Date }) => {
    let reportTitle = "Relatório de Pessoal";

    if (reportType === 'resumo_folha') {
        reportTitle = 'Resumo da Folha de Pagamento';
        const filteredData = filterByDate(data as SavedCalculation[], item => item.date, dateRange);
        
        const head = [['Competência', 'Nome', 'Tipo', 'Líquido']];
        const body = filteredData.map(item => [
            item.mesCompetencia || 'N/A',
            item.socioName || item.employeeName || 'N/A',
            item.type,
            formatCurrency(item.netValue),
        ]);

        autoTable(doc, { head, body, startY: 35, theme: 'grid' });
        
        const totalGeral = filteredData.reduce((acc, item) => acc + item.netValue, 0);

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Total Líquido do Período:', 15, finalY);
        doc.text(formatCurrency(totalGeral), doc.internal.pageSize.width - 15, finalY, { align: 'right' });
    } else if (reportType === 'relacao_funcionarios') {
        reportTitle = 'Relação de Funcionários Ativos';
        const head = [['Nome', 'CPF', 'Cargo', 'Data de Admissão', 'Salário']];
        const body = (data as Funcionario[]).map(f => [
            f.nome,
            f.cpf,
            f.cargo,
            format(new Date(f.dataAdmissao), 'dd/MM/yyyy'),
            formatCurrency(f.salario),
        ]);
        autoTable(doc, { head, body, startY: 35, theme: 'grid' });
    }
    
    return reportTitle;
};

const generateContabilReport = (doc: jsPDF, reportType: string, data: Account[]) => {
    let reportTitle = "Relatório Contábil";

    if (reportType === 'plano_contas') {
        reportTitle = 'Plano de Contas';
        const head = [['Código', 'Nome da Conta', 'Tipo', 'Natureza']];
        const processedAccounts: any[] = [];
        const processAccount = (account: Account, level: number) => {
            processedAccounts.push([
                account.code,
                `${' '.repeat(level * 4)}${account.name}`,
                account.type,
                account.nature,
            ]);
            const children = data.filter(child => child.parentId === account.id).sort((a, b) => a.code.localeCompare(b.code));
            children.forEach(child => processAccount(child, level + 1));
        };
        const rootAccounts = data.filter(acc => acc.parentId === null).sort((a, b) => a.code.localeCompare(b.code));
        rootAccounts.forEach(acc => processAccount(acc, 0));
        autoTable(doc, { head, body: processedAccounts, startY: 35, theme: 'grid' });
    } else if (reportType === 'balancete') {
        reportTitle = 'Balancete de Verificação';
        doc.text("Funcionalidade de Balancete em desenvolvimento.", 15, 40);
    }
    
    return reportTitle;
};

const generateFinanceiroReport = (doc: jsPDF, reportType: string, data: Conta[], dateRange?: { from?: Date; to?: Date }) => {
    const reportTitles: Record<string, string> = {
        contas_a_pagar: 'Relatório de Contas a Pagar',
        contas_a_receber: 'Relatório de Contas a Receber',
        fluxo_caixa: 'Relatório de Fluxo de Caixa',
    };
    const reportTitle = reportTitles[reportType] || 'Relatório Financeiro';

    const filteredData = filterByDate(data, item => item.dueDate, dateRange);
    
    const head = [['Vencimento', 'Parceiro', 'Descrição', 'Status', 'Valor']];
    const body = filteredData.map(item => [
        format(new Date(item.dueDate), 'dd/MM/yyyy'),
        item.partnerName,
        item.description,
        item.status,
        formatCurrency(item.amount),
    ]);

    autoTable(doc, { head, body, startY: 35, theme: 'grid' });

    const totalGeral = filteredData.reduce((acc, item) => acc + item.amount, 0);

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total do Período:', 15, finalY);
    doc.text(formatCurrency(totalGeral), doc.internal.pageSize.width - 15, finalY, { align: 'right' });
    
    return reportTitle;
};


export const generatePdf = ({ module, reportType, data, dateRange, company }: GeneratePdfParams) => {
    const doc = new jsPDF();
    let reportTitle = 'Relatório';

    const subtitle = dateRange?.from && dateRange.to 
        ? `Período de ${format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} a ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`
        : 'Todos os Períodos';

    if (module === 'fiscal') {
        reportTitle = generateFiscalReport(doc, reportType, data as NotaFiscal[], dateRange);
    } else if (module === 'pessoal') {
        reportTitle = generatePessoalReport(doc, reportType, data as (SavedCalculation[] | Funcionario[]), dateRange);
    } else if (module === 'contabil') {
        reportTitle = generateContabilReport(doc, reportType, data as Account[]);
    } else if (module === 'financeiro') {
        reportTitle = generateFinanceiroReport(doc, reportType, data as Conta[], dateRange);
    }
    
    addHeader(doc, company, reportTitle, subtitle);
    addFooter(doc, company.name);

    doc.save(`${reportTitle.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

// CSV Generation
const convertToCsv = (data: any[], headers: string[]): string => {
    const headerRow = headers.join(',');
    const bodyRows = data.map(row => 
        headers.map(header => JSON.stringify(row[header] || '', (key, value) => value === null ? '' : value)).join(',')
    );
    return [headerRow, ...bodyRows].join('\n');
};

const downloadCsv = (csvString: string, filename: string) => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const generateCsv = ({ module, reportType, data, dateRange, company }: GeneratePdfParams) => {
    let csvData: any[] = [];
    let headers: string[] = [];
    let reportTitle = 'Relatorio';

    if (module === 'fiscal') {
        const titles: Record<string, string> = { notas_saida: 'Notas_de_Saida', notas_servico: 'Notas_de_Servico', notas_entrada: 'Notas_de_Entrada' };
        reportTitle = titles[reportType] || 'Relatorio_Fiscal';
        const filteredData = filterByDate(data as NotaFiscal[], item => item.dados.geral?.dataEmissao || item.dados.identificacao?.dataEmissao, dateRange);
        headers = ['Numero', 'DataEmissao', 'Parceiro', 'Valor'];
        csvData = filteredData.map(item => {
            const total = (item.items as any[]).reduce((acc, curr) => acc + (curr.total || curr.value || 0), 0);
            return {
                Numero: item.dados.geral?.numero || item.dados.identificacao?.numero,
                DataEmissao: item.dados.geral?.dataEmissao || item.dados.identificacao?.dataEmissao,
                Parceiro: item.dados.destinatario?.razaoSocial || item.dados.tomador?.razaoSocial || item.dados.emitente?.razaoSocial || 'N/A',
                Valor: total,
            };
        });
    } else if (module === 'financeiro') {
        const titles: Record<string, string> = { contas_a_pagar: 'Contas_a_Pagar', contas_a_receber: 'Contas_a_Receber', fluxo_caixa: 'Fluxo_de_Caixa' };
        reportTitle = titles[reportType] || 'Relatorio_Financeiro';
        const filteredData = filterByDate(data as Conta[], item => item.dueDate, dateRange);
        headers = ['Vencimento', 'Parceiro', 'Descricao', 'Status', 'Valor'];
        csvData = filteredData.map(item => ({
            Vencimento: item.dueDate,
            Parceiro: item.partnerName,
            Descricao: item.description,
            Status: item.status,
            Valor: item.amount,
        }));
    } else {
        throw new Error("Exportação para CSV não suportada para este módulo ou tipo de relatório.");
    }
    
    const csvString = convertToCsv(csvData, headers);
    downloadCsv(csvString, `${reportTitle}_${format(new Date(), 'yyyyMMdd')}.csv`);
};
