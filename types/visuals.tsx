import { ChartConfig } from "@/components/ui/chart";

// Interface for a single <Bar> component configuration
interface BarConfig {
  dataKey: string; 
  fill: string;
}

// Interface for x-axis configuration
interface XAxisConfig {
  dataKey: string;
}

// Interface for shadcn bar chart configuration
export interface BarChartConfig {
  dataSeries: ChartConfig;
  bars: BarConfig[]; 
  xAxis: XAxisConfig; 
}