"use client"

import { useState } from "react"
import { Loader2, Brain, Code, Database, AlertCircle, Lightbulb, ChevronRight, ChevronDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { ThinkingState } from "@/lib/types"

export function ThinkingIndicator({ status, text, isActive, sqlQuery }: ThinkingState) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusIcon = () => {
    switch (status) {
      case "initializing":
        return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      case "reasoning":
        return <Brain className="w-4 h-4 text-muted-foreground" />
      case "generatingQuery":
        return <Code className="w-4 h-4 text-muted-foreground" />
      case "explaining":
        return <Lightbulb className="w-4 h-4 text-muted-foreground" />
      case "suggesting":
        return <Lightbulb className="w-4 h-4 text-muted-foreground" />
      case "partial":
      case "partial_reason":
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />
      case "executing":
        return <Database className="w-4 h-4 text-muted-foreground" />
      case "system_error":
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />
      default:
        return <Brain className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusLabel = () => {
    switch (status) {
      case "initializing":
        return "Initializing..."
      case "reasoning":
        return "AI Reasoning Process"
      case "generatingQuery":
        return "Generating SQL"
      case "explaining":
        return "Explaining Results"
      case "suggesting":
        return "Suggesting Follow-ups"
      case "partial":
        return "Partial Result"
      case "partial_reason":
        return "Partial Result Reason"
      case "executing":
        return "Executing Query"
      case "complete":
        return "Process Complete"
      case "system_error":
        return "Error Occurred"
      default:
        return "Processing..."
    }
  }

  return (
    <div className="flex justify-start">
      <div className="flex space-x-3 max-w-4xl">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted-foreground flex items-center justify-center">
          <Brain className="w-4 h-4 text-background" />
        </div>

        <div className="flex-1">
          <Card className="bg-muted/30 border-muted backdrop-blur-sm">
            <CardContent className={isExpanded ? "p-3" : "px-3 py-2"}>
              <button
                className="flex items-center space-x-2 text-sm font-semibold focus:outline-none group w-full"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <span className="relative">
                  <span className="font-light bg-gradient-to-r from-foreground/70 via-foreground to-foreground/70 bg-[length:200%_100%] bg-clip-text text-transparent animate-[shimmer_1s_ease-in-out_infinite] group-hover:from-primary group-hover:via-primary group-hover:to-primary transition-all duration-300">
                    Thinking
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%] animate-[shimmer_1s_ease-in-out_infinite] opacity-30"></span>
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon()}
                      <span className="text-sm font-semibold text-foreground/80">{getStatusLabel()}</span>
                    </div>
                    {text ? (
                      <div className="p-3 rounded-md bg-muted/50 border border-muted/50">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                          {text}
                          {isActive && <span className="animate-pulse ml-1 text-primary">▋</span>}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {sqlQuery && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Code className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-foreground/80">Current SQL</span>
                      </div>
                      <div className="p-3 rounded-md bg-muted/50 border border-muted/50">
                        <pre className="text-sm font-mono text-foreground/90 overflow-x-auto whitespace-pre-wrap">
                          {sqlQuery}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  )
}
