"use client"

import { User, Bot, Brain, Code, Database, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ChatMessage } from "@/lib/chat-storage"

interface MessageBubbleProps {
  message: ChatMessage
  onCopy?: (text: string) => void
}

export function MessageBubble({ message, onCopy }: MessageBubbleProps) {
  const isUser = message.role === "user"

  const renderTable = (data: Record<string, any>[]) => {
    if (!data || data.length === 0) {
      return <div className="text-center py-4 text-muted-foreground">No results found</div>
    }

    const headers = Object.keys(data[0])
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header} className="font-semibold">
                  {header.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
                {headers.map((header) => (
                  <TableCell key={header} className="font-mono text-sm">
                    {row[header]?.toString() || "—"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Message */}
      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div className={`flex space-x-3 max-w-4xl ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}>
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              isUser ? "bg-primary" : "bg-muted-foreground"
            }`}
          >
            {isUser ? (
              <User className="w-4 h-4 text-primary-foreground" />
            ) : (
              <Bot className="w-4 h-4 text-background" />
            )}
          </div>

          <div className={`flex-1 space-y-2 ${isUser ? "text-right" : ""}`}>
            <div
              className={`inline-block p-3 rounded-lg ${
                isUser ? "bg-primary text-primary-foreground" : "bg-muted border"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.question}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Thinking Process */}
      {!isUser && message.thought_process && (
        <div className="flex justify-start">
          <div className="flex space-x-3 max-w-4xl">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="inline-block p-3 rounded-lg bg-purple-50 border border-purple-200 dark:bg-purple-950 dark:border-purple-800">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                    AI Thinking Process
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-purple-800 dark:text-purple-200">
                  {message.thought_process}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SQL Query */}
      {message.sql_query && (
        <div className="flex justify-start">
          <div className="flex space-x-3 max-w-4xl">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
              <Code className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Code className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold">Generated SQL</span>
                    </div>
                    {onCopy && (
                      <Button variant="ghost" size="sm" onClick={() => onCopy(message.sql_query!)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <pre className="text-sm font-mono bg-muted p-3 rounded overflow-x-auto">{message.sql_query}</pre>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Query Results */}
      {message.query_result && (
        <div className="flex justify-start">
          <div className="flex space-x-3 max-w-4xl">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Database className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-semibold">Query Results ({message.query_result.length} rows)</span>
                  </div>
                  {renderTable(message.query_result)}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
