"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartVisual as LineChartConfig } from "@/lib/api/types";
import { formatCellValue } from "@/lib/utils";

interface LineChartProps {
  chartData: any[];
  config: LineChartConfig;
}
export function LineChartComponent({ config, chartData }: LineChartProps) {
  const chartConfig = Object.fromEntries(
  config.dataSeries.map(({ key, label, color }) => [
    key,
    { label, color },
  ])
) satisfies ChartConfig;
  const formattedChartData = chartData.map((item) => {
    const formattedItem = { ...item };
    config.components.forEach((line) => {
      formattedItem[line.dataKey] = formatCellValue(item[line.dataKey]);
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
      <LineChart accessibilityLayer data={formattedChartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={config.xAxis.dataKey}
          tickLine={false}
          tickMargin={8}
          axisLine={false}
        />
        <YAxis
          dataKey={config.yAxis.dataKey}
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          domain={[0, upperDomain + upperDomain * 0.1]}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {config.components.map((line, index) => (
          <Line
            key={index}
            dataKey={line.dataKey}
            type="natural"
            stroke={line.fill}
            strokeWidth={2}
            dot={{
              fill: line.fill,
            }}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
