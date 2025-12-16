
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChartData {
    month: string;
    proventos: number;
    descontos: number;
}
type Period = "6" | "8" | "12";


interface PayrollEvolutionChartProps {
    data: ChartData[];
    period: Period;
    onPeriodChange: (period: Period) => void;
}

const chartConfig = {
    proventos: {
        label: "Proventos",
        color: "hsl(var(--chart-2))",
    },
    descontos: {
        label: "Descontos",
        color: "hsl(var(--chart-1))",
    },
};

export default function PayrollEvolutionChart({ data, period, onPeriodChange }: PayrollEvolutionChartProps) {
    return (
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
             {data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)"/>
                        <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                        <Tooltip
                            cursor={false}
                            content={<ChartTooltipContent 
                                formatter={(value, name) => (
                                    <div className="flex items-center">
                                        <div className="flex-1">{chartConfig[name as keyof typeof chartConfig].label}</div>
                                        <div className="font-bold ml-4">{Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                                    </div>
                                )}
                                indicator="dot"
                            />} 
                        />
                        <Bar dataKey="proventos" fill="var(--color-proventos)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="descontos" fill="var(--color-descontos)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex h-full w-full items-center justify-center">
                    <p className="text-muted-foreground">Nenhum dado de cálculo salvo para exibir o gráfico.</p>
                </div>
            )}
        </ChartContainer>
    );
}
