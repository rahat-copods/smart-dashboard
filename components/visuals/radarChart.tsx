"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartVisual as RadarChartConfig } from "@/lib/api/types";
import { formatCellValue } from "@/lib/utils";

interface RadarChartProps {
  chartData: any[];
  config: RadarChartConfig;
}
export function RadarChartComponent({ config, chartData }: RadarChartProps) {
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

  return (
    <ChartContainer
      config={chartConfig}
      className="min-h-[200px] w-full"
    >
      <RadarChart data={formattedChartData}>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <PolarAngleAxis dataKey={config.xAxis.dataKey} />
        <PolarGrid radialLines={false} />
        {config.components.map((line, index) => (
          <Radar
          key={index}
          dataKey={line.dataKey}
          fill={line.fill}
          fillOpacity={0.1}
          stroke={line.fill}
          strokeWidth={2}
          />
        ))}
        <ChartLegend content={<ChartLegendContent />} />
      </RadarChart>
    </ChartContainer>
  );
}
