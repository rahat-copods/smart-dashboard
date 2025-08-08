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
  data: any[];
  config: LineChartConfig;
}

export function LineChartComponent({ config, data }: LineChartProps) {
  const {
    selectedFilterValue,
    setSelectedFilterValue,
    uniqueFilterValues,
    chartConfig,
    formattedChartData,
    dataKeysToRender,
    upperDomain,
  } = useChartLogic(data, config);

  const shouldStack = config.seriesKey || dataKeysToRender.length > 1;
  const RADIUS_BOTTOM: [number, number, number, number] = [0, 0, 8, 8];
  const RADIUS_TOP: [number, number, number, number] = [8, 8, 0, 0];
  const RADIUS_NONE: [number, number, number, number] = [0, 0, 0, 0];

  return (
    <div className="w-full space-y-4">
      <FilterSelect
        config={config}
        filterOptions={uniqueFilterValues}
        selectedFilter={selectedFilterValue}
        onFilterChange={setSelectedFilterValue}
      />

      <ChartContainer className="min-h-[200px] w-full" config={chartConfig}>
        <LineChart accessibilityLayer data={formattedChartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            axisLine={false}
            dataKey={config.xAxis.key as string}
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
            dataKey={config.yAxis.key}
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

          {dataKeysToRender.map((key, index) => {
            const isFirstBar = index === 0;
            const isLastBar = index === dataKeysToRender.length - 1;

            // Determine radius based on stacking and position
            const radius = shouldStack
              ? dataKeysToRender.length === 1
                ? 8
                : isFirstBar
                  ? RADIUS_BOTTOM
                  : isLastBar
                    ? RADIUS_TOP
                    : RADIUS_NONE
              : 8;

            return (
              <Line
                key={index}
                dataKey={key}
                dot={{
                  fill: `var(--color-${key as string})`,
                }}
                stroke={`var(--color-${key as string})`}
                strokeWidth={2}
                type="natural"
              />
            );
          })}
        </LineChart>
      </ChartContainer>
    </div>
  );
}
