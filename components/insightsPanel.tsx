"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { MessageSquare, X, Send, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ChatMessage } from "@/lib/types"

interface InsightMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface InsightsPanelProps {
  isOpen: boolean
  onClose: () => void
  initialData: ChatMessage
  userId: string
}

export function InsightsPanel({ isOpen, onClose, initialData, userId }: InsightsPanelProps) {
  const [messages, setMessages] = useState<InsightMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0 && initialData && userId) {
      generateInitialInsights()
    }
  }, [isOpen, initialData, userId])

  const generateInitialInsights = async () => {
    if (!initialData || !userId) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `http://localhost:8000/api/query/insights?user_id=${userId}&data=${encodeURIComponent(JSON.stringify(initialData))}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate insights")
      }

      const initialMessage: InsightMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.result,
        timestamp: new Date(),
      }

      setMessages([initialMessage])
    } catch (error) {
      console.error("Failed to generate initial insights:", error)
      const errorMessage: InsightMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "Sorry, I couldn't analyze your data right now. Please try asking me a specific question about your results.",
        timestamp: new Date(),
      }
      setMessages([errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: InsightMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const previousMessages = [
        {
          role: "user",
          content:
            `Please analyze and explain the following data:\n\n` +
            `Data: ${JSON.stringify(initialData)}`,
        },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: "user",
          content: userMessage.content,
        },
      ];

      const response = await fetch(
        `http://localhost:8000/api/query/insights?user_id=${userId}&data=${encodeURIComponent(JSON.stringify(initialData))}&messages=${encodeURIComponent(JSON.stringify(previousMessages))}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process follow-up message")
      }

      const assistantMessage: InsightMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.result.explanation || "I'm not sure how to help with that. Could you be more specific?",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Failed to send message:", error)
      const errorMessage: InsightMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Data Insights</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`flex space-x-2 max-w-[85%] ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === "user" ? "bg-primary" : "bg-muted-foreground"
                }`}
              >
                {message.role === "user" ? (
                  <User className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <Bot className="w-4 h-4 text-background" />
                )}
              </div>
              <Card className={`${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/30"}`}>
                <CardContent className="p-3">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
                  <div
                    className={`text-xs mt-2 opacity-70 ${
                      message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}

        {isLoading && messages.length > 0 && (
          <div className="flex justify-start">
            <div className="flex space-x-2 max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted-foreground">
                <Bot className="w-4 h-4 text-background" />
              </div>
              <Card className="bg-muted/30">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4 bg-muted/30">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your data..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading} size="sm">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-2">Press Enter to send, Shift+Enter for new line</div>
      </div>
    </div>
  )
}