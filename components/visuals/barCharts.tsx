"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChartConfig } from "@/types/visuals";



interface BarChartProps{
    chartData: any[];
    config: BarChartConfig
}
export function BarChartComponent({config, chartData}: BarChartProps) {
    const chartConfig = config.dataSeries satisfies ChartConfig;
    console.log(config, chartData)
    return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={config.xAxis.dataKey}
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis  tickLine={false} axisLine={false} tickMargin={10}/>
        <ChartTooltip content={<ChartTooltipContent className="w-[160px]"/>} />
        <ChartLegend content={<ChartLegendContent />} />
        {config.bars.map((bar, index) => (
          <Bar
            key={index}
            dataKey={bar.dataKey}
            fill={bar.fill}
            radius={4}
            type="step"
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
