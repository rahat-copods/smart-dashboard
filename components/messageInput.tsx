"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowUp, Loader2, Database, DatabaseZap } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface MessageInputProps {
  onSubmit: (message: string, includeData?: boolean) => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({ onSubmit, disabled = false, placeholder = "Type your message..." }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [includeData, setIncludeData] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || disabled) return

    onSubmit(message.trim(), includeData)
    setMessage("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (message.trim()) {
        e.preventDefault()
        handleSubmit(e as any)
      }
    }
  }

  const toggleIncludeData = () => {
    setIncludeData(!includeData)
  }

  return (
    <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={3}
            className="resize-none pr-12 pl-12 min-h-[80px] bg-background"
          />

          <div className="absolute bottom-3 right-3 space-x-2">
          
          {/* Data Tool Button - Bottom Left */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  onClick={toggleIncludeData}
                  disabled={disabled}
                  size="icon"
                  variant={includeData ? "default" : "ghost"}
                  className={` h-8 w-8 ${
                    includeData 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {includeData ? (
                    <DatabaseZap className="w-4 h-4" />
                  ) : (
                    <Database className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {includeData 
                    ? "Include previous query results in context" 
                    : "Send data along with message"
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Submit Button - Bottom Right */}
          <Button
            type="submit"
            disabled={disabled || !message.trim()}
            size="icon"
            className=" h-8 w-8"
          >
            {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
          </Button>
          </div>
        </div>
        
        {/* Status indicator when includeData is active */}
        {includeData && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <DatabaseZap className="w-3 h-3" />
            <span>Previous query results will be included with your message</span>
          </div>
        )}
      </form>
    </div>
  )
}