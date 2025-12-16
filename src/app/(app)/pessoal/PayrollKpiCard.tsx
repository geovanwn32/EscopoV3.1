
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PayrollKpiCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    formatAsCurrency?: boolean;
}

export default function PayrollKpiCard({ title, value, icon, formatAsCurrency = false }: PayrollKpiCardProps) {
    const formattedValue = formatAsCurrency 
        ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : value.toString();

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formattedValue}</div>
            </CardContent>
        </Card>
    );
}
