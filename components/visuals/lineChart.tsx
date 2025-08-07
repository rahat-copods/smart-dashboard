"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartVisual as LineChartConfig } from "@/lib/api/types";
import { useChartLogic } from "@/hooks/useChartLogic";
import { FilterSelect } from "./filterSelect";


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
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        filterOptions={filterOptions}
      />

      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <LineChart accessibilityLayer data={formattedChartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey={config.xAxis.dataKey}
            tickLine={false}
            tickMargin={8}
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
    </div>
  );
}