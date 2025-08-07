import { useState, useMemo } from "react";
import { ChartConfig } from "@/components/ui/chart";
import { ChartVisual } from "@/lib/api/types";
import { formatCellValue } from "@/lib/utils";

export function useChartLogic(chartData: any[], config: ChartVisual) {
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

  // Chart configuration
  const chartConfig = useMemo(() => 
    Object.fromEntries(
      config.dataSeries.map(({ key, label, color }) => [key, { label, color }])
    ) satisfies ChartConfig, [config.dataSeries]
  );

  // Format chart data
  const formattedChartData = useMemo(() => 
    filteredData.map((item) => {
      const formattedItem = { ...item };
      config.components.forEach((component) => {
        formattedItem[component.dataKey] = formatCellValue(item[component.dataKey]);
      });
      return formattedItem;
    }), [filteredData, config.components]
  );

  // Calculate upper domain
  const upperDomain = useMemo(() => {
    const keys: string[] = config.dataSeries.map((series) => series.key);

    const upperDomains = keys.map((key) => {
      return (
        Math.ceil(
          Math.max(...filteredData.map((d) => Number(d[key]) || 0)) / 10
        ) * 10
      );
    });

    return Math.max(...upperDomains);
  }, [filteredData, config.dataSeries]);

  return {
    selectedFilter,
    setSelectedFilter,
    filterOptions,
    filteredData,
    chartConfig,
    formattedChartData,
    upperDomain,
  };
}