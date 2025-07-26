"use client"

import { User, Bot, Brain, Code, Database, Copy, AlertCircle, Info, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"
import { ChatMessage } from "@/lib/types"

interface MessageBubbleProps {
  message: ChatMessage
  onCopy?: (text: string) => void
  showSuggestions?: boolean
  suggestions?: string[]
  onSuggestionClick?: (suggestion: string) => void
  isRetry?: boolean
}

export function MessageBubble({ 
  message, 
  onCopy, 
  showSuggestions = false, 
  suggestions = [], 
  onSuggestionClick,
  isRetry = false 
}: MessageBubbleProps) {
  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"
  const isDeveloper = message.role === "developer"

  const renderTable = (data: Record<string, any>[]) => {
    if (!data || data.length === 0) {
      return <div className="text-center py-8 text-muted-foreground">No results found</div>
    }

    const headers = Object.keys(data[0])
    return (
      <div className="border rounded-md" style={{ height: '400px', width: '100%' }}>
        <div className="h-full overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-background border-b">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="font-semibold min-w-[120px] p-3 text-left border-r last:border-r-0">
                    {header.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-muted/50 border-b last:border-b-0">
                  {headers.map((header) => (
                    <td key={header} className="font-mono text-sm py-2 px-3 border-r last:border-r-0">
                      {row[header]?.toString() || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderSuggestions = () => {
    if (!showSuggestions || suggestions.length === 0) return null

    return (
      <div className="mt-6 space-y-3">
        <div className="text-sm text-muted-foreground font-medium flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Suggested follow-ups:
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-sm h-auto py-2 px-3 whitespace-normal text-left justify-start hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => {
                console.log('Suggestion clicked:', suggestion); // Debug log
                onSuggestionClick?.(suggestion);
              }}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    )
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
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.question}</p>
              </div>
            </div>
          </div>
        </div>
        {renderSuggestions()}
      </div>
    )
  }

  // Developer Error Message (for retry scenarios)
  if (isDeveloper) {
    return (
      <div className="flex justify-start">
        <div className="flex space-x-3 max-w-4xl">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
            <RotateCcw className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="inline-block p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                  Query Failed - Retrying
                </span>
              </div>
              <p className="text-sm text-red-800 dark:text-red-200">
                {message.error}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Assistant Message (Main AI Response)
  if (isAssistant) {
    return (
      <div className="space-y-4">
        <div className="flex justify-start">
          <div className="flex space-x-3 max-w-4xl">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted-foreground">
              <Bot className="w-4 h-4 text-background" />
            </div>

            <div className="flex-1 space-y-4">
              
              {/* Always show thinking process if it exists */}
              {message.thought_process && (
                <Card className="bg-muted/30 border-muted">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Brain className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-muted-foreground">
                          AI Thinking Process
                        </span>
                      </div>
                      <div className="p-3 rounded-md bg-muted/50 border border-muted">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                          {message.thought_process}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Combined Message Block for other content */}
              {(message.error || message.partial_reason || message.sql_query) && (
                <Card className="bg-muted/30 border-muted">
                  <CardContent className="p-4 space-y-4">
                    
                    {/* Error Display */}
                    {message.error && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                            Error Occurred
                          </span>
                        </div>
                        <div className="p-3 rounded-md bg-red-50 border border-red-200 dark:bg-red-950/50 dark:border-red-800">
                          <p className="text-sm text-red-800 dark:text-red-200">
                            {message.error}
                          </p>
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
                        <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/50 dark:border-yellow-800">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            {message.partial_reason}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* SQL Query */}
                    {message.sql_query && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Code className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold">Generated SQL</span>
                            {isRetry && (
                              <Badge variant="outline" className="text-xs">
                                Retry
                              </Badge>
                            )}
                          </div>
                          {onCopy && (
                            <Button variant="ghost" size="sm" onClick={() => onCopy(message.sql_query!)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="p-3 rounded-md bg-green-50 border border-green-200 dark:bg-green-950/50 dark:border-green-800">
                          <pre className="text-sm font-mono text-green-800 dark:text-green-200 overflow-x-auto whitespace-pre-wrap">
                            {message.sql_query}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Query Results - Separate from the combined block */}
              {message.query_result && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Database className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold">Query Results</span>
                      <Badge variant="secondary" className="text-xs">
                        {message.query_result.length} rows
                      </Badge>
                    </div>
                    {renderTable(message.query_result)}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
        {renderSuggestions()}
      </div>
    )
  }

  return null
}