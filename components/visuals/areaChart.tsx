"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartVisual as AreaChartConfig } from "@/lib/api/types";
import { useChartLogic } from "@/hooks/useChartLogic";
import { FilterSelect } from "./filterSelect";

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
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        filterOptions={filterOptions}
      />

      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <AreaChart accessibilityLayer data={formattedChartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey={config.xAxis.dataKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
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
    </div>
  );
}