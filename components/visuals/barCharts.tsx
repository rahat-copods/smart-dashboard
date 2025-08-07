"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartVisual as BarChartConfig } from "@/lib/api/types";
import { useChartLogic } from "@/hooks/useChartLogic";
import { FilterSelect } from "./filterSelect";

interface BarChartProps {
  chartData: any[];
  config: BarChartConfig;
}

export function BarChartComponent({ config, chartData }: BarChartProps) {
  const {
    selectedFilter,
    setSelectedFilter,
    filterOptions,
    chartConfig,
    formattedChartData,
    upperDomain,
  } = useChartLogic(chartData, config);

  return (
    <div className="w-full space-y-4">
      <FilterSelect
        config={config}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        filterOptions={filterOptions}
      />

      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={formattedChartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey={config.xAxis.dataKey}
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            label={{
              value: config.xAxis.label ?? "",
              angle: 0,
              position: "bottom",
            }}
          />
          <YAxis
            dataKey={config.yAxis.dataKey}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            domain={[0, upperDomain]}
            label={{
              value: config.yAxis.label ?? "",
              angle: -90,
              position: "insideBottomLeft",
            }}
          />
          <ChartTooltip
            content={<ChartTooltipContent className="w-[160px]" />}
          />
          <ChartLegend content={<ChartLegendContent className="mt-2" />} />
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
    </div>
  );
}