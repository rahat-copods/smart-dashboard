"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { ChatHeader } from "@/components/chatHeader"
import { MessageBubble } from "@/components/messageBubble"
import { MessageInput } from "@/components/messageInput"
import { InsightsSidebar } from "@/components/insightsSidebar"
import type { AssistantMessage, ChatMessage } from "@/types/chat"
import { ChatStorage } from "@/hooks/chatStorage"
import { useChat } from "@/hooks/useChat"

export default function ChatPage() {
  const params = useParams()
  const chatId = params.id as string
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [user, setUser] = useState("")
  const [chatTitle, setChatTitle] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activeMessage, setActiveMessage] = useState<AssistantMessage | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const observerRef = useRef<IntersectionObserver | null>(null)

  const {
    sendQuery,
    isStreaming,
    streamedContent,
    streamingStatus,
    insightContent,
    isInsightStreaming,
    generateInsights,
    usageMetrics
  } = useChat(chatId, messages, setMessages)

  // Function to set message ref
  const setMessageRef = useCallback((messageId: string, element: HTMLDivElement | null) => {
    if (element) {
      messageRefs.current.set(messageId, element)
    } else {
      messageRefs.current.delete(messageId)
    }
  }, [])


  // Set up intersection observer for assistant messages
  useEffect(() => {
    const assistantMessages = messages.filter((msg) => msg.role === "assistant") as AssistantMessage[]


    if (assistantMessages.length === 0) {
      setActiveMessage(null)
      return
    }

    // Clean up existing observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {

        // Find the entry with the highest intersection ratio
        const mostVisibleEntry = entries.reduce((prev, current) => {
          return current.intersectionRatio > prev.intersectionRatio ? current : prev
        })


        // Only update if the intersection ratio is above threshold
        if (mostVisibleEntry.intersectionRatio > 0.3) {
          const messageId = mostVisibleEntry.target.getAttribute("data-message-id")
          if (messageId) {
            const message = assistantMessages.find((msg) => msg.id === messageId)
            if (message) {
              setActiveMessage(message)
            }
          }
        }
      },
      {
        root: messagesContainerRef.current,
        rootMargin: "-20% 0px -20% 0px",
        threshold: [0, 0.1, 0.3, 0.5, 0.7, 1.0],
      },
    )

    // Observe all assistant message elements
    let observedCount = 0
    assistantMessages.forEach((message) => {
      const element = messageRefs.current.get(message.id)
      if (element && observerRef.current) {
        observerRef.current.observe(element)
        observedCount++
      }
    })


    // Set initial active message if none is set
    if (!activeMessage && assistantMessages.length > 0) {
      setActiveMessage(assistantMessages[assistantMessages.length - 1])
    }

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [messages])

  // Load chat messages on mount
  useEffect(() => {
    if (chatId) {
      const chat = ChatStorage.getChat(chatId)
      if (chat) {
        setMessages(chat.messages)
        setChatTitle(chat.title)
        setUser(chat.user)
      }
    }
  }, [chatId])

  // Auto-start processing for new chats
  const hasStartedProcessing = useRef(false)
  useEffect(() => {
    if (chatId && messages.length === 1 && messages[0].role === "user" && !hasStartedProcessing.current) {
      hasStartedProcessing.current = true
      const userQuestion = messages[0].question
      if (userQuestion && user) {
        sendQuery(userQuestion, user)
      }
    }
  }, [chatId, messages, sendQuery, user])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = (message: string) => {
    sendQuery(message, user)
  }

  if (!messages.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  const isLastMessage = (index: number) => {
    return index === messages.length - 1
  }

  return (
    <div className="flex flex-col h-screen w-full">
      <ChatHeader title={chatTitle} />

      <div className="flex flex-1 min-h-0">
        {/* Main Content Area */}
        <div className={`flex flex-col flex-1 min-h-0 transition-all duration-300 ${isSidebarOpen ? "mr-80" : "mr-0"}`}>
          {/* Messages Container - FIXED HEIGHT */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden"
            style={{
              height: "calc(100vh - 120px)", 
              maxHeight: "calc(100vh - 120px)",
            }}
          >
            <div className="p-4 space-y-6 pb-6">
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id + index}
                  message={message}
                  showSuggestions={isLastMessage(index) && message.role === "assistant" && !isStreaming}
                  onSuggestionClick={handleSubmit}
                  isStreaming={isLastMessage(index) ? isStreaming : false}
                  streamedContent={isLastMessage(index) ? streamedContent : ""}
                  streamingStatus={isLastMessage(index) ? streamingStatus : ""}
                  ref={
                    message.role === "assistant"
                      ? (el: HTMLDivElement | null) => setMessageRef(message.id, el)
                      : undefined
                  }
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input - Fixed at bottom */}
          <div className="flex-shrink-0 border-t bg-background">
            <MessageInput onSubmit={handleSubmit} disabled={isStreaming} placeholder="Ask a follow-up question..." />
          </div>
        </div>

        {/* Insights Sidebar */}
        <InsightsSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          usageMetrics={usageMetrics}
          message={activeMessage}
          insightContent={insightContent}
          isInsightStreaming={isInsightStreaming}
          isStreaming={isStreaming}
          generateInsights={generateInsights}
          userId={user}
        />
      </div>
    </div>
  )
}
