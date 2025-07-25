"use client"

import { Loader2, Brain, Code, Database } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface ThinkingIndicatorProps {
  status: "initializing" | "thinking" | "generating" | "executing" | "complete"
  text: string
  isActive: boolean
  sqlQuery?: string
}

export function ThinkingIndicator({ status, text, isActive, sqlQuery }: ThinkingIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "initializing":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case "thinking":
        return <Brain className="w-4 h-4 text-purple-500" />
      case "generating":
        return <Code className="w-4 h-4 text-green-500" />
      case "executing":
        return <Database className="w-4 h-4 text-orange-500" />
      default:
        return <Brain className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusLabel = () => {
    switch (status) {
      case "initializing":
        return "Initializing..."
      case "thinking":
        return "AI Thinking Process"
      case "generating":
        return "Generating SQL"
      case "executing":
        return "Executing Query"
      case "complete":
        return "Process Complete"
      default:
        return "Processing..."
    }
  }

  return (
    <div className="flex justify-start">
      <div className="flex space-x-3 max-w-4xl">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>

        <div className="flex-1 space-y-2">
          <div className="inline-block p-3 rounded-lg bg-purple-50 border border-purple-200 dark:bg-purple-950 dark:border-purple-800">
            {/* <div className="flex items-center space-x-2 mb-2">
              {getStatusIcon()}
              <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">{getStatusLabel()}</span>
            </div> */}

            {status === "initializing" && !text ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-blue-700 dark:text-blue-300">Initializing...</span>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-purple-800 dark:text-purple-200">
                {text}
                {isActive && <span className="animate-pulse ml-1">▋</span>}
              </p>
            )}
          </div>

          {sqlQuery && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Code className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold">Current SQL</span>
                </div>
                <pre className="text-sm font-mono bg-muted p-3 rounded overflow-x-auto">{sqlQuery}</pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
