"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
import { RadarChartComponent } from "./radarChart";

interface ChartsComponentProps {
  chartData: any[] | null;
  config: ChartVisual;
}

export default function ChartsComponent({
  chartData,
  config,
}: ChartsComponentProps) {
  const chartTypes = ["bar", "line", "area", "radar"];
  const [activeChartType, setActiveChartType] = useState<string>(
    chartTypes[Math.floor(Math.random() * chartTypes.length)]
  );

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
                variant="outline"
                size="icon"
                aria-label="Select chart type"
              >
                {activeChartType === "bar" && <BarChart className="h-4 w-4" />}
                {activeChartType === "line" && (
                  <LineChart className="h-4 w-4" />
                )}
                {activeChartType === "area" && (
                  <AreaChart className="h-4 w-4" />
                )}
                {activeChartType === "radar" && <RadarIcon className="h-4 w-4" />}
                {activeChartType === "table" && <Table className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setActiveChartType("bar")}>
                <BarChart className="mr-2 h-4 w-4" /> Bar Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveChartType("line")}>
                <LineChart className="mr-2 h-4 w-4" /> Line Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveChartType("area")}>
                <AreaChart className="mr-2 h-4 w-4" /> Area Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveChartType("radar")}>
                <RadarIcon className="mr-2 h-4 w-4" /> Radar Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveChartType("table")}>
                <Table className="mr-2 h-4 w-4" /> Data Table
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TabsContent value="bar" className="mt-0">
          <BarChartComponent config={config} chartData={chartData} />
        </TabsContent>
        <TabsContent value="line" className="mt-0">
          <LineChartComponent config={config} chartData={chartData} />
        </TabsContent>
        <TabsContent value="area" className="mt-0">
          <AreaChartComponent config={config} chartData={chartData} />
        </TabsContent>
        <TabsContent value="radar" className="mt-0">
          <RadarChartComponent config={config} chartData={chartData} />
        </TabsContent>
        <TabsContent value="table" className="mt-0">
          <DataTableComponent data={chartData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
