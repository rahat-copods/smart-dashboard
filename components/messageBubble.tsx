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
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import type { ChatMessage } from "@/lib/types";

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
  const renderTable = (data: Record<string, any>[]) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No results found
        </div>
      );
    }

    const headers = Object.keys(data[0]);
    return (
      <div
        className="border rounded-md"
        style={{ height: "400px", width: "100%" }}
      >
        <div className="h-full overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-background border-b">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="font-semibold min-w-[120px] p-3 text-left border-r last:border-r-0"
                  >
                    {header
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-muted/50 border-b last:border-b-0"
                >
                  {headers.map((header) => (
                    <td
                      key={header}
                      className="font-mono text-sm py-2 px-3 border-r last:border-r-0"
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
    );
  };

  const renderSuggestions = () => {
    if (!isAssistant || !showSuggestions || message.suggestions.length === 0) return null;

    return (
      <div className="mt-6 space-y-3">
        <div className="text-sm text-muted-foreground font-medium flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Suggested follow-ups:
        </div>
        <div className="flex flex-wrap gap-2">
          {message.suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-sm h-auto py-2 px-3 whitespace-normal text-left justify-start hover:bg-primary hover:text-primary-foreground transition-colors bg-transparent"
              onClick={()=>onSuggestionClick(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  // Don't render system messages at all
  if (isSystem) {
    return null;
  }

  // User Message
  if (isUser) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <div className="flex space-x-3 max-w-4xl flex-row-reverse space-x-reverse">
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

  // Assistant Message (Main AI Response) - Unified Single Bubble
  if (isAssistant) {
    console.log(message);

    return (
      <div className="space-y-4">
        <div className="flex justify-start">
          <div className="flex space-x-3 max-w-4xl">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted-foreground">
              <Bot className="w-4 h-4 text-background" />
            </div>

            <div className="flex-1">
              {/* Single Unified Message Bubble */}
              <div className="bg-muted/20 border border-muted rounded-lg p-4 space-y-4">
                {/* Thinking Process */}
                {message.thought_process && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Brain className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-muted-foreground">
                        AI Thinking Process
                      </span>
                    </div>
                    <div className="text-sm leading-relaxed text-muted-foreground">
                      {message.thought_process}
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {message.error && (
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
                )}

                {/* Partial Reason */}
                {message.partial && message.partial_reason && (
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
                )}

                {/* SQL Query */}
                {message.sql_query && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Code className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold">
                          Generated SQL
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
                    <div className="bg-green-50 border border-green-200 dark:bg-green-950/50 dark:border-green-800 rounded-md p-3">
                      <pre className="text-sm font-mono text-green-800 dark:text-green-200 overflow-x-auto whitespace-pre-wrap">
                        {message.sql_query}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Query Results */}
                {message.query_result && message.query_result.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold">
                        Query Results
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {message.query_result.length} rows
                      </Badge>
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
