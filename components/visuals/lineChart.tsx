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
import { LineChartConfig } from "@/types/visuals";
import { formatCellValue } from "@/lib/utils";

interface LineChartProps {
  chartData: any[];
  config: LineChartConfig;
}
export function LineChartComponent({ config, chartData }: LineChartProps) {
  const chartConfig = config.dataSeries satisfies ChartConfig;
  const formattedChartData = chartData.map((item) => {
    const formattedItem = { ...item };
    config.lines.forEach((line) => {
      formattedItem[line.dataKey] = formatCellValue(item[line.dataKey]);
    });
    return formattedItem;
  });

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
        <YAxis tickLine={false} axisLine={false} tickMargin={10} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {config.lines.map((line, index) => (
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
