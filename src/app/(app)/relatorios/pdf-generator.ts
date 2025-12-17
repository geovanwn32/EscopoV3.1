
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Company } from '@/hooks/use-company';
import { NotaFiscal, ProductItem, ServiceItem } from '@/types/fiscal';
import { SavedCalculation } from '@/types/pessoal';
import { Account } from '@/types/contabil';

type Module = 'fiscal' | 'pessoal' | 'contabil';
interface GeneratePdfParams {
    module: Module;
    reportType: string;
    data: any[];
    dateRange?: { from?: Date; to?: Date };
    company: Company;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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

const generateFiscalReport = (doc: jsPDF, reportType: string, data: NotaFiscal[], dateRange?: { from?: Date; to?: Date }) => {
    const reportTitle = reportType === 'notas_saida' ? 'Relatório de Notas de Saída' : 'Relatório de Notas de Serviço';
    
    const filteredData = data.filter(item => {
        const itemDateStr = item.dados.geral?.dataEmissao || item.dados.identificacao?.dataEmissao;
        if (!itemDateStr) return false;
        const itemDate = new Date(itemDateStr);
        if (dateRange?.from && itemDate < dateRange.from) return false;
        if (dateRange?.to && itemDate > dateRange.to) return false;
        return true;
    });

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

const generatePessoalReport = (doc: jsPDF, reportType: string, data: SavedCalculation[], dateRange?: { from?: Date; to?: Date }) => {
    const reportTitle = 'Resumo da Folha de Pagamento';
    
    const filteredData = data.filter(item => {
        if (!item.date) return false;
        const itemDate = new Date(item.date);
        if (dateRange?.from && itemDate < dateRange.from) return false;
        if (dateRange?.to && itemDate > dateRange.to) return false;
        return true;
    });

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

    return reportTitle;
};

const generateContabilReport = (doc: jsPDF, reportType: string, data: Account[], dateRange?: { from?: Date; to?: Date }) => {
    const reportTitle = 'Plano de Contas';
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
        reportTitle = generatePessoalReport(doc, reportType, data as SavedCalculation[], dateRange);
    } else if (module === 'contabil') {
        reportTitle = generateContabilReport(doc, reportType, data as Account[], dateRange);
    }
    
    addHeader(doc, company, reportTitle, subtitle);
    addFooter(doc, company.name);

    doc.save(`${reportTitle.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

