"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { FilterSelect } from "./filterSelect";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartVisual as AreaChartConfig } from "@/lib/api/types";
import { useChartLogic } from "@/hooks/useChartLogic";

interface AreaChartProps {
  chartData: any[];
  config: AreaChartConfig;
}

export function AreaChartComponent({ config, chartData }: AreaChartProps) {
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
        <AreaChart accessibilityLayer data={formattedChartData}>
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
            tickMargin={8}
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
            content={<ChartTooltipContent indicator="line" />}
            cursor={false}
          />
          {config.components.map((area, index) => (
            <Area
              key={index}
              dataKey={area.dataKey}
              dot={{ fill: area.fill }}
              fill={area.fill}
              fillOpacity={0.1}
              stackId={index}
              stroke={area.fill}
              type="natural"
            />
          ))}
          <ChartLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
