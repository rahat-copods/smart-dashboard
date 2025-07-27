"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowUp, Loader2, Send } from "lucide-react"

interface MessageInputProps {
  onSubmit: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({ onSubmit, disabled = false, placeholder = "Type your message..." }: MessageInputProps) {
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || disabled) return

    onSubmit(message.trim())
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
            className="resize-none pr-12 min-h-[80px] bg-background"
          />
          <Button
            type="submit"
            disabled={disabled || !message.trim()}
            size="icon"
            className="absolute bottom-3 right-3 h-8 w-8"
          >
            {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
          </Button>
        </div>
      </form>
    </div>
  )
}
