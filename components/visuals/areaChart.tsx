"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { FilterSelect } from "./filterSelect";
import { ChartModalWrapper } from "./chartModalWrapper";

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
  data: any[];
  config: AreaChartConfig;
}

export function AreaChartComponent({ config, data }: AreaChartProps) {
  const {
    selectedFilterValue,
    setSelectedFilterValue,
    uniqueFilterValues,
    chartConfig,
    formattedChartData,
    dataKeysToRender,
    upperDomain,
  } = useChartLogic(data, config);

  return (
    <div className="w-full space-y-4">
      <FilterSelect
        config={config}
        filterOptions={uniqueFilterValues}
        selectedFilter={selectedFilterValue}
        onFilterChange={setSelectedFilterValue}
      />
      <ChartModalWrapper
        config={config}
        filterOptions={uniqueFilterValues}
        selectedFilter={selectedFilterValue}
        onFilterChange={setSelectedFilterValue}
      >
        <ChartContainer className="min-h-[200px] w-full" config={chartConfig}>
          <AreaChart accessibilityLayer data={formattedChartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey={config.xAxisKey as string}
              label={{
                value: config.xAxisLabel ?? "",
                angle: 0,
                position: "bottom",
              }}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis
              axisLine={false}
              dataKey={config.yAxisKey}
              domain={[0, upperDomain]}
              label={{
                value: config.yAxisLabel ?? "",
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
            {dataKeysToRender.map((key, index) => {
              return (
                <Area
                  key={index}
                  dataKey={key}
                  dot={{ fill: `var(--color-${key as string})` }}
                  fill={`var(--color-${key as string})`}
                  fillOpacity={0.1}
                  stackId={index}
                  stroke={`var(--color-${key as string})`}
                  type="natural"
                />
              );
            })}
            <ChartLegend content={<ChartLegendContent className="mt-4" />} />
          </AreaChart>
        </ChartContainer>
      </ChartModalWrapper>
    </div>
  );
}
