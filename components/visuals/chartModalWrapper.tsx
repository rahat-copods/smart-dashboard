"use client";

import { useState, ReactNode } from "react";
import { Maximize, X } from "lucide-react";

import { Button } from "../ui/button";

import { FilterSelect } from "./filterSelect";

import { ChartVisual } from "@/lib/api/types";

interface ChartModalWrapperProps {
  config: ChartVisual;
  selectedFilter: string | undefined;
  onFilterChange: (value: string) => void;
  filterOptions: string[];
  children: ReactNode;
  className?: string;
}

export function ChartModalWrapper({
  config,
  selectedFilter,
  onFilterChange,
  filterOptions,
  children,
  className = "",
}: ChartModalWrapperProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      {/* Regular Chart Container with Expand Button */}
      <div className={`relative ${className}`}>
        <Button
          aria-label="Expand chart to full screen"
          className="absolute top-2 right-2 bg-transparent text-primary z-10 hover:bg-primary/5 group"
          size={"icon"}
          title="Expand to full screen"
          onClick={openModal}
        >
          <Maximize className="w-4 h-4 group-hover:scale-110" />
        </Button>

        {children}
      </div>

      {/* Full Screen Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-opacity-50 z-50 flex items-center justify-center p-4 bg-background">
          <Button
            aria-label="Close modal"
            className="absolute top-4 right-4 z-10 p-2"
            size={"icon"}
            onClick={closeModal}
          >
            <X className="w-6 h-6" />
          </Button>
          <div className="rounded-lg w-full h-full max-w-7xl p-3 overflow-hidden space-x-4">
            <FilterSelect
              config={config}
              filterOptions={filterOptions}
              selectedFilter={selectedFilter}
              onFilterChange={onFilterChange}
            />

            <div className="w-full">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
