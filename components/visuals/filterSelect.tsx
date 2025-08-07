import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartVisual } from "@/lib/api/types";

interface FilterSelectProps {
  config: ChartVisual;
  selectedFilter: string;
  onFilterChange: (value: string) => void;
  filterOptions: string[];
}

export function FilterSelect({
  config,
  selectedFilter,
  onFilterChange,
  filterOptions,
}: FilterSelectProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h3 className="text-lg font-semibold">{config.title}</h3>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </div>
      {config.filterSelect && (
        <Select value={selectedFilter} onValueChange={onFilterChange}>
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
      )}
    </div>
  );
}
