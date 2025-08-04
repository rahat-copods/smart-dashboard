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
  const chartConfig = Object.fromEntries(
    config.dataSeries.map(({ key, label, color }) => [key, { label, color }])
  ) satisfies ChartConfig;
  const formattedChartData = chartData.map((item) => {
    const formattedItem = { ...item };
    config.components.forEach((line) => {
      formattedItem[line.dataKey] = formatCellValue(item[line.dataKey]);
    });
    return formattedItem;
  });

  const calculateUpperDomain = () => {
    const keys: string[] = config.dataSeries.map((series) => {
      return series.key;
    });

    const upperDomains = keys.map((key) => {
      return (
        Math.ceil(Math.max(...chartData.map((d) => Number(d[key]) || 0)) / 10) *
        10
      );
    });

    return Math.max(...upperDomains);
  };
  const upperDomain =calculateUpperDomain()
   
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
          domain={[0, upperDomain]}
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
            fillOpacity={0.1}
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
