"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { FilterSelect } from "./filterSelect";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartVisual as LineChartConfig } from "@/lib/api/types";
import { useChartLogic } from "@/hooks/useChartLogic";

interface LineChartProps {
  chartData: any[];
  config: LineChartConfig;
}

export function LineChartComponent({ config, chartData }: LineChartProps) {
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
        <LineChart accessibilityLayer data={formattedChartData}>
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
          <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
          <ChartLegend content={<ChartLegendContent className="mt-2" />} />
          {config.components.map((line, index) => (
            <Line
              key={index}
              dataKey={line.dataKey}
              dot={{
                fill: line.fill,
              }}
              stroke={line.fill}
              strokeWidth={2}
              type="natural"
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}
