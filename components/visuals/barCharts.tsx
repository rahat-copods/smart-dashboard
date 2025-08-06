"use client";

import { useState, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartVisual as BarChartConfig } from "@/lib/api/types";
import { formatCellValue } from "@/lib/utils";

interface BarChartProps {
  chartData: any[];
  config: BarChartConfig;
}

export function BarChartComponent({ config, chartData }: BarChartProps) {
  const [selectedFilter, setSelectedFilter] = useState(() => {
    if (!config.filterSelect) return "";
    const uniqueValues = Array.from(
      new Set(chartData.map((item) => item[config.filterSelect!.dataKey]))
    ).filter(Boolean);
    return uniqueValues[0] || "";
  });

  // Extract unique filter options
  const filterOptions = useMemo(() => {
    if (!config.filterSelect) return [];
    
    const uniqueValues = Array.from(
      new Set(chartData.map((item) => item[config.filterSelect!.dataKey]))
    ).filter(Boolean);
    
    return uniqueValues;
  }, [chartData, config.filterSelect]);

  // Filter data based on selected filter
  const filteredData = useMemo(() => {
    if (!config.filterSelect || !selectedFilter) {
      return chartData;
    }
    
    return chartData.filter(
      (item) => item[config.filterSelect!.dataKey] === selectedFilter
    );
  }, [chartData, config.filterSelect, selectedFilter]);

  const chartConfig = Object.fromEntries(
    config.dataSeries.map(({ key, label, color }) => [
      key,
      { label, color },
    ])
  ) satisfies ChartConfig;

  const formattedChartData = filteredData.map((item) => {
    const formattedItem = { ...item };
    config.components.forEach((bar) => {
      formattedItem[bar.dataKey] = formatCellValue(item[bar.dataKey]);
    });
    return formattedItem;
  });

  const calculateUpperDomain = () => {
    const keys: string[] = config.dataSeries.map((series) => {
      return series.key;
    });

    const upperDomains = keys.map((key) => {
      return (
        Math.ceil(Math.max(...filteredData.map((d) => Number(d[key]) || 0)) / 10) *
        10
      );
    });

    return Math.max(...upperDomains);
  };
  
  const upperDomain = calculateUpperDomain();

  return (
    <div className="w-full space-y-4">
      {/* Filter Select - Only show if filterSelect config exists */}
      {config.filterSelect && (
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">{config.title}</h3>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={`Select ${config.filterSelect.label}`} />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={formattedChartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey={config.xAxis.dataKey}
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <YAxis
            dataKey={config.yAxis.dataKey}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            domain={[0, upperDomain]}
          />
          <ChartTooltip content={<ChartTooltipContent className="w-[160px]" />} />
          <ChartLegend content={<ChartLegendContent />} />
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