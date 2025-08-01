import { ChartConfig as DataSeries } from "@/components/ui/chart";

// Interface for a single <Bar> component configuration
interface ChartComponents {
  dataKey: string; 
  fill: "var(--chart-1)"| "var(--chart-2)"| "var(--chart-3)"| "var(--chart-4)"| "var(--chart-5)";
}

// Interface for x-axis configuration
interface XAxisConfig {
  dataKey: string;
}
interface YAxisConfig {
  dataKey: string;
}

// Interface for shadcn bar chart configuration
export interface ChartConfig {
  dataSeries: DataSeries;
  components: ChartComponents[];
  xAxis: XAxisConfig;
  yAxis: YAxisConfig;
}
