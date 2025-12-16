
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface ChartData {
    month: string;
    totalCost: number;
}

interface PayrollEvolutionChartProps {
    data: ChartData[];
}

const chartConfig = {
    totalCost: {
        label: "Custo Total da Folha",
        color: "hsl(var(--chart-1))",
    },
};

export default function PayrollEvolutionChart({ data }: PayrollEvolutionChartProps) {
    return (
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
             {data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${Number(value) / 1000}k`} />
                        <Tooltip
                            content={<ChartTooltipContent 
                                formatter={(value) => (value as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
                                cursorClassName="fill-muted"
                            />} 
                        />
                        <Bar dataKey="totalCost" fill="var(--color-totalCost)" radius={[4, 4, 0, 0]} />
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
