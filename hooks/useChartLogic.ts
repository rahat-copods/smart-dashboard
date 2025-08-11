import { useState, useMemo } from "react";

import { ChartConfig } from "@/components/ui/chart";
import { formatCellValue } from "@/lib/utils";
import { ChartVisual } from "@/lib/api/types";

export function useChartLogic<T extends Record<string, any>>(
  rawData: T[],
  config: ChartVisual
) {
  // Identify unique values for the filter dropdown if filterKey is provided
  const uniqueFilterValues = useMemo(() => {
    if (!config.filterKey) return [];

    return Array.from(
      new Set(rawData.map((item) => item[config.filterKey!] as string))
    ).sort();
  }, [rawData, config.filterKey]);

  // State to manage the currently selected filter value
  const [selectedFilterValue, setSelectedFilterValue] = useState<
    string | undefined
  >(uniqueFilterValues.length > 0 ? uniqueFilterValues[0] : undefined);

  // Determine if we're working with pivoted data
  const isPivoted = config.isPivoted || config.valueKey.length > 1;

  // Get the series keys based on whether data is pivoted or not
  const seriesKeys = useMemo(() => {
    if (isPivoted) {
      return config.valueKey; // Use the valueKey array directly for pivoted data
    } else if (!isPivoted && config.seriesKey) {
      // For non-pivoted data, extract unique series values
      return Array.from(
        new Set(rawData.map((item) => item[config.seriesKey!] as string))
      ).sort();
    } else {
      return ["value"]; // Default single series
    }
  }, [isPivoted, config.valueKey, config.seriesKey, rawData]);

  // Memoized data transformation logic
  const transformedData = useMemo(() => {
    let processedData = rawData;
    // Apply filter if filterKey and a selectedFilterValue are present
    if (config.filterKey && selectedFilterValue) {
      processedData = processedData.filter(
        (item) => item[config.filterKey!] === selectedFilterValue
      );
    }

    if (isPivoted) {
      // For pivoted data, just filter and format - no transformation needed
      let result = processedData.map((item) => {
        const formattedItem: Record<string, any> = { ...item };

        // Ensure all valueKey columns have numeric values
        config.valueKey.forEach((key) => {
          formattedItem[key] = formatCellValue(item[key] as string) || 0;
        });

        return formattedItem;
      });

      // Sort by sortKey if provided, otherwise maintain original order
      if (config.sortKey) {
        result.sort((a, b) => {
          const aVal = a[config.sortKey!];
          const bVal = b[config.sortKey!];

          if (typeof aVal === "string" && typeof bVal === "string") {
            return aVal.localeCompare(bVal);
          }

          return (aVal as number) - (bVal as number);
        });
      }

      return result;
    } else {
      // For non-pivoted data, use the existing transformation logic
      const transformedMap = new Map<string, Record<string, any>>();

      processedData.forEach((item) => {
        const currentXAxisValue = item[config.xAxis.key] as string;

        if (!transformedMap.has(currentXAxisValue)) {
          transformedMap.set(currentXAxisValue, {
            [config.xAxis.key]: currentXAxisValue,
            ...(item.month_num !== undefined && { month_num: item.month_num }),
          });
        }
        const currentXAxisEntry = transformedMap.get(currentXAxisValue)!;

        // For non-pivoted data, use the first valueKey element
        const valueKeyToUse = config.valueKey[0];
        const value = formatCellValue(item[valueKeyToUse] as string);
        if (config.seriesKey) {
          // If seriesKey is provided, pivot the data
          const currentSeriesValue = item[config.seriesKey] as string;

          currentXAxisEntry[currentSeriesValue] =
            (currentXAxisEntry[currentSeriesValue] || 0) + value;
        } else {
          // If no seriesKey, sum all values for this xAxisKey under a generic 'value' key
          currentXAxisEntry["value"] =
            (currentXAxisEntry["value"] || 0) + value;
        }
      });

      // Ensure all series keys are initialized to 0 for all x-axis entries
      if (config.seriesKey) {
        transformedMap.forEach((entry) => {
          seriesKeys.forEach((seriesVal) => {
            if (entry[seriesVal] === undefined) {
              entry[seriesVal] = 0;
            }
          });
        });
      }

      // Sort by month_num if it was added during transformation
      const sortedData = Array.from(transformedMap.values()).sort((a, b) => {
        if (a.month_num !== undefined && b.month_num !== undefined) {
          return (a.month_num as number) - (b.month_num as number);
        }

        // Fallback to string comparison if month_num is not available
        return String(a[config.xAxis.key]).localeCompare(
          String(b[config.xAxis.key])
        );
      });

      return sortedData;
    }
  }, [
    rawData,
    config.xAxis.key,
    config.valueKey,
    config.seriesKey,
    config.filterKey,
    config.sortKey,
    selectedFilterValue,
    isPivoted,
    seriesKeys,
  ]);

  // Dynamically create chartConfig based on identified series keys
  const chartConfig = useMemo(() => {
    const chartConf: ChartConfig = {};

    seriesKeys.forEach((seriesVal, index) => {
      chartConf[seriesVal] = {
        label:
          seriesVal === "value" ? config.yAxis.label || "Value" : seriesVal,
        color: `var(--chart-${(index % 5) + 1})`,
      };
    });

    return chartConf;
  }, [seriesKeys, config.yAxis.label]);

  // Determine which data keys to render as bars
  const dataKeysToRender = seriesKeys;

  // Formatted chart data for display
  const formattedChartData = useMemo(
    () =>
      transformedData.map((item) => {
        const formattedItem: Record<string, any> = { ...item };
        // Format x-axis data key for display
        formattedItem[config.xAxis.key as string] = formatCellValue(
          item[config.xAxis.key]
        );

        // Format the value keys for display
        dataKeysToRender.forEach((key) => {
          if (
            typeof item[key] === "number" ||
            (typeof item[key] === "string" &&
              !isNaN(parseFloat(formatCellValue(item[key]))))
          ) {
            formattedItem[key] = formatCellValue(item[key as string]);
          } else {
            formattedItem[key] = item[key];
          }
        });

        return formattedItem;
      }),
    [transformedData, config.xAxis.key, dataKeysToRender]
  );

  // Calculate upper domain
  const upperDomain = useMemo(() => {
    const keys: string[] = dataKeysToRender.map((key) => String(key));
    const upperDomains = keys.map((key) => {
      return (
        Math.ceil(
          Math.max(...transformedData.map((d) => Number(d[key]) || 0)) / 10
        ) * 10
      );
    });

    return Math.max(...upperDomains);
  }, [transformedData, dataKeysToRender]);

  return {
    selectedFilterValue,
    setSelectedFilterValue,
    uniqueFilterValues,
    chartConfig,
    formattedChartData,
    dataKeysToRender,
    upperDomain,
  };
}
