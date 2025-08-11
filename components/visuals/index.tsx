"use client";

import { useState } from "react";
import {
  LineChart,
  BarChart,
  AreaChart,
  Table,
  Database,
  RadarIcon,
} from "lucide-react";

import { BarChartComponent } from "./barCharts";
import { LineChartComponent } from "./lineChart";
import DataTableComponent from "./dataTableComponent";
import { AreaChartComponent } from "./areaChart";

import { ChartVisual } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent } from "@/components/ui/tabs";

const chartOptions = [
  { type: "bar", label: "Bar Chart", icon: BarChart },
  { type: "line", label: "Line Chart", icon: LineChart },
  { type: "area", label: "Area Chart", icon: AreaChart },
  // { type: "radar", label: "Radar Chart", icon: RadarIcon },
  { type: "table", label: "Data Table", icon: Table },
];

interface ChartsComponentProps {
  chartData: any[] | null;
  config: ChartVisual;
}

export default function ChartsComponent({
  chartData,
  config,
}: ChartsComponentProps) {
  const [activeChartType, setActiveChartType] = useState<string>(config.type);

  if (!chartData) return null;

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Tabs
        value={activeChartType}
        onValueChange={(value) => setActiveChartType(value)}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold">Results</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Select chart type"
                size="icon"
                variant="outline"
              >
                {activeChartType === "bar" && <BarChart className="h-4 w-4" />}
                {activeChartType === "line" && (
                  <LineChart className="h-4 w-4" />
                )}
                {activeChartType === "area" && (
                  <AreaChart className="h-4 w-4" />
                )}
                {activeChartType === "radar" && (
                  <RadarIcon className="h-4 w-4" />
                )}
                {activeChartType === "table" && <Table className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {chartOptions.map(({ type, label, icon: Icon }) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => setActiveChartType(type)}
                >
                  <Icon className="mr-2 h-4 w-4" /> {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TabsContent className="mt-0" value="bar">
          <BarChartComponent config={config} data={chartData} />
        </TabsContent>
        <TabsContent className="mt-0" value="line">
          <LineChartComponent config={config} data={chartData} />
        </TabsContent>
        <TabsContent className="mt-0" value="area">
          <AreaChartComponent config={config} data={chartData} />
        </TabsContent>
        <TabsContent className="mt-0" value="table">
          <DataTableComponent data={chartData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
