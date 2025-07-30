import { ChartConfig as DataSeries } from "@/components/ui/chart";

// Interface for a single <Bar> component configuration
interface BarOrLineConfig {
  dataKey: string; 
  fill: "var(--chart-1)"| "var(--chart-2)"| "var(--chart-3)"| "var(--chart-4)"| "var(--chart-5)";
}

// Interface for x-axis configuration
interface XAxisConfig {
  dataKey: string;
}

// Interface for shadcn bar chart configuration
export interface ChartConfig {
  dataSeries: DataSeries;
  xAxis: XAxisConfig;
}

export interface  BarChartConfig extends ChartConfig {
  bars: BarOrLineConfig[]; 
  type: "bar"
}
export interface LineChartConfig extends ChartConfig {
  lines: BarOrLineConfig[]; 
  type: "line"
}