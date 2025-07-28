"use client";

import {
  User,
  Bot,
  Brain,
  Code,
  Database,
  Copy,
  AlertCircle,
  Info,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { format as sqlFormatter } from "sql-formatter";

interface MessageBubbleProps {
  message: ChatMessage;
  onCopy?: (text: string) => void;
  showSuggestions?: boolean;
  suggestions?: string[];
  onSuggestionClick: (suggestion: string) => void;
  isRetry?: boolean;
}

export function MessageBubble({
  message,
  onCopy,
  showSuggestions = false,
  onSuggestionClick,
  isRetry = false,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isSystem = message.role === "system";

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Function to convert table data to CSV and trigger download
  const exportToCSV = (
    data: Record<string, any>[] | null,
    filename: string
  ) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","), // Header row
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header] ?? "";
            // Escape commas and quotes in values
            const escaped = value.toString().replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderTable = (data: Record<string, any>[]) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground border rounded-md">
          No results found
        </div>
      );
    }

    const headers = Object.keys(data[0]);

    // Calculate pagination
    const totalPages = Math.ceil(data.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentData = data.slice(startIndex, endIndex);

    // Calculate dynamic height based on content
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
                        title={row[header]?.toString() || "—"}
                      >
                        {row[header]?.toString() || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination and Export Controls */}
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
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
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
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
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
  };

  const renderSuggestions = () => {
    if (!isAssistant || !showSuggestions || message.suggestions.length === 0)
      return null;

    return (
      <div className="mt-6 space-y-3 max-w-4xl space-x-3">
        <div className="text-sm text-muted-foreground font-medium flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Follow-up questions:
        </div>
        <div className="flex flex-wrap gap-2">
          {message.suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-sm h-auto py-2 px-3 whitespace-normal text-left justify-start transition-colors"
              onClick={() => onSuggestionClick(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  if (isSystem) {
    return null;
  }

  if (isUser) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <div className="flex space-x-3 w-full flex-row-reverse space-x-reverse">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1 text-right">
              <div className="inline-block p-3 rounded-lg bg-primary text-primary-foreground">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.question}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isAssistant) {
    return (
      <div className="space-y-4">
        <div className="flex justify-start">
          <div className="flex space-x-3 w-full">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted-foreground">
              <Bot className="w-4 h-4 text-background" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="bg-muted/20 border border-muted rounded-lg p-4 space-y-4">
                {message.thought_process && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Brain className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-muted-foreground">
                        Analysis
                      </span>
                    </div>
                    <div className="text-sm leading-relaxed text-primary">
                      {message.thought_process}
                    </div>
                  </div>
                )}

                {message.partial && message.partial_reason ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Info className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                        Partial Result
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Incomplete
                      </Badge>
                    </div>
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      {message.partial_reason}
                    </div>
                  </div>
                ) : (
                  message.error && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                          Error Occurred
                        </span>
                      </div>
                      <div className="text-sm text-red-800 dark:text-red-200">
                        {message.error}
                      </div>
                    </div>
                  )
                )}

                {message.sql_query && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Code className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold">
                          Query Executed
                        </span>
                        {isRetry && (
                          <Badge variant="outline" className="text-xs">
                            Retry
                          </Badge>
                        )}
                      </div>
                      {onCopy && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCopy(message.sql_query!)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="bg-muted border rounded-md p-3">
                      <pre className="text-sm font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                        {message.sql_query}
                      </pre>
                    </div>
                  </div>
                )}

                {message.query_result && message.query_result.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold">Results</span>
                        <Badge variant="secondary" className="text-xs">
                          {message.query_result.length} rows
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          exportToCSV(message.query_result, "query_results")
                        }
                        title="Export as CSV"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                    {renderTable(message.query_result)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {renderSuggestions()}
      </div>
    );
  }

  return null;
}
