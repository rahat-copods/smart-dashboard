"use client";

import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartVisual as AreaChartConfig } from "@/lib/api/types";
import { formatCellValue } from "@/lib/utils";

interface AreaChartProps {
  chartData: any[];
  config: AreaChartConfig;
}
export function AreaChartComponent({ config, chartData }: AreaChartProps) {
  const chartConfig = { ...config.dataSeries } as ChartConfig;
  const formattedChartData = chartData.map((item) => {
    const formattedItem = { ...item };
    config.components.forEach((line) => {
      formattedItem[line.dataKey] = formatCellValue(item[line.dataKey]);
    });
    return formattedItem;
  });

  const upperDomain = Math.ceil(
    Math.max(...chartData.map((d) => Number(d[config.yAxis.dataKey]) || 0))
  );
  return (
    <ChartContainer config={chartConfig}>
      <AreaChart accessibilityLayer data={formattedChartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={config.xAxis.dataKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          dataKey={config.yAxis.dataKey}
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          domain={[0, upperDomain + upperDomain * 0.1]}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        {config.components.map((area, index) => (
          <Area
            key={index}
            dataKey={area.dataKey}
            type="natural"
            fill={area.fill}
            fillOpacity={0.4}
            stroke={area.fill}
            stackId={index}
            dot={{ fill: area.fill }}
          />
        ))}
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}
