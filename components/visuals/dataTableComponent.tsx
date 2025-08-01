import React, { useState } from "react";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCellValue } from "@/lib/utils";

export default function DataTableComponent({data}: {data:any[]}) {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  if (!data) {
    return null
  }
  if ( data.length === 0) {
    return (
      <div className="text-sm text-center py-8 text-muted-foreground border rounded-md">
        No data found
      </div>
    );
  }

  const headers = Object.keys(data[0]);
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const headerHeight = 48;
  const rowHeight = 40;
  const currentRows = Math.min(currentData.length, rowsPerPage);
  const contentHeight = headerHeight + currentRows * rowHeight;
  const maxHeight = headerHeight + 8 * rowHeight;
  const tableHeight = Math.min(contentHeight, maxHeight);

  return (
    <div className="space-y-2">
      <div
        className="border rounded-md overflow-hidden w-full"
        style={{ height: `${tableHeight}px` }}
      >
        <div className="h-full overflow-auto">
          <table className="w-full border-collapse min-w-full">
            <thead className="sticky top-0 bg-background border-b">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="font-semibold min-w-[120px] max-w-[200px] p-3 text-left border-r last:border-r-0 truncate"
                    title={header
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  >
                    {header
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, index) => (
                <tr
                  key={startIndex + index}
                  className="hover:bg-muted/50 border-b last:border-b-0"
                >
                  {headers.map((header) => (
                    <td
                      key={header}
                      className="font-mono text-sm py-2 px-3 border-r last:border-r-0 min-w-[120px] max-w-[200px] truncate"
                      title={formatCellValue(row[header])}
                    >
                      {formatCellValue(row[header])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of{" "}
          {data.length} rows
        </div>
        <div className="flex items-center space-x-2">
          {totalPages > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
