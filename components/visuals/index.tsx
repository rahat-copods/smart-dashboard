import { BarChartConfig, ChartConfig, LineChartConfig } from "@/types/visuals";
import React from "react";
import { BarChartComponent } from "./barCharts";
import { LineChartComponent } from "./lineChart";

interface ChartsComponentProps {
  chartData: any[];
  config: BarChartConfig | LineChartConfig;
}
export default function ChartsComponent({ chartData, config }: ChartsComponentProps) {
  switch (config.type) {
    case "bar":
      return <BarChartComponent config={config} chartData={chartData} />;
    case "line":
      return <LineChartComponent config={config} chartData={chartData} />;
    default:
      return null;
  }
}
