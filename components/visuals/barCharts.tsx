"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartVisual as BarChartConfig } from "@/lib/api/types";
import { formatCellValue } from "@/lib/utils";

interface BarChartProps {
  chartData: any[];
  config: BarChartConfig;
}
export function BarChartComponent({ config, chartData }: BarChartProps) {
  const chartConfig = Object.fromEntries(
  config.dataSeries.map(({ key, label, color }) => [
    key,
    { label, color },
  ])
) satisfies ChartConfig;
  const formattedChartData = chartData.map((item) => {
    const formattedItem = { ...item };
    config.components.forEach((bar) => {
      formattedItem[bar.dataKey] = formatCellValue(item[bar.dataKey]);
    });
    return formattedItem;
  });

  const upperDomain =
    Math.ceil(
      Math.max(...chartData.map((d) => Number(d[config.yAxis.dataKey]) || 0)) /
        10
    ) * 10;

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={formattedChartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={config.xAxis.dataKey}
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis
          dataKey={config.yAxis.dataKey}
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          domain={[0, upperDomain]}
        />
        <ChartTooltip content={<ChartTooltipContent className="w-[160px]" />} />
        <ChartLegend content={<ChartLegendContent />} />
        {config.components.map((bar, index) => (
          <Bar
            key={index}
            dataKey={bar.dataKey}
            fill={bar.fill}
            radius={4}
            maxBarSize={40}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
