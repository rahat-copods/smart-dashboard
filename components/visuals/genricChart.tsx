"use client";

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChartLogic } from "@/hooks/useChartLogic";
import { ChartVisual } from "@/lib/api/types";

// Import the new hook

// Define the GenericChartProps interface as requested
interface GenericChartProps<T extends Record<string, any>> {
  data: T[];
  config: ChartVisual;
}

export function GenericBarChart<T extends Record<string, any>>({
  data,
  config,
}: GenericChartProps<T>) {
  const {
    selectedFilterValue,
    setSelectedFilterValue,
    uniqueFilterValues,
    chartConfig,
    formattedChartData,
    dataKeysToRender,
  } = useChartLogic(data, config);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{config.title}</CardTitle>
          <CardDescription>{config.description}</CardDescription>
        </div>
        {/* Render filter dropdown if filterKey is provided and there are unique filter values */}
        {config.filterKey && uniqueFilterValues.length > 0 && (
          <Select
            value={selectedFilterValue}
            onValueChange={setSelectedFilterValue}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={`Select ${String(config.filterKey)}`} />
            </SelectTrigger>
            <SelectContent>
              {uniqueFilterValues.map((filterVal) => (
                <SelectItem key={filterVal} value={filterVal}>
                  {filterVal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={formattedChartData} // Use formattedChartData from the hook
              margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey={config.xAxis.key as string}
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                label={{
                  value: config.xAxis.label,
                  position: "insideBottom",
                  offset: 0,
                }}
              />
              <YAxis
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                label={{
                  value: config.yAxis.label,
                  angle: -90,
                  position: "outsideLeft",
                  offset: -40,
                  textAnchor: "end",
                }}
              />
              <ChartTooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                content={<ChartTooltipContent />}
              />
              {/* Render Legend only if there are multiple series (stacked bars) */}
              {dataKeysToRender.length > 1 && (
                <Legend content={<ChartLegendContent />} />
              )}
              {/* Render Bar components for each data key */}
              {dataKeysToRender.map((key) => (
                <Bar
                  key={key as string}
                  dataKey={key as string}
                  stackId={
                    config.seriesKey || dataKeysToRender.length > 1
                      ? "a"
                      : undefined
                  } // Apply stackId only if seriesKey is provided
                  fill={`var(--color-${key as string})`}
                  radius={8}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
