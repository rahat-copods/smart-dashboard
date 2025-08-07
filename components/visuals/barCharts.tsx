"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { FilterSelect } from "./filterSelect";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartVisual as BarChartConfig } from "@/lib/api/types";
import { useChartLogic } from "@/hooks/useChartLogic";

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
        filterOptions={filterOptions}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
      />

      <ChartContainer className="min-h-[200px] w-full" config={chartConfig}>
        <BarChart accessibilityLayer data={formattedChartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            axisLine={false}
            dataKey={config.xAxis.dataKey}
            label={{
              value: config.xAxis.label ?? "",
              angle: 0,
              position: "bottom",
            }}
            tickLine={false}
            tickMargin={10}
          />
          <YAxis
            axisLine={false}
            dataKey={config.yAxis.dataKey}
            domain={[0, upperDomain]}
            label={{
              value: config.yAxis.label ?? "",
              angle: -90,
              position: "left",
              offset: 0,
            }}
            tickLine={false}
            tickMargin={10}
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
              maxBarSize={40}
              radius={4}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
}
