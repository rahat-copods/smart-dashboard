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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
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
  } = useChat(chatId, messages, setMessages)

  // Function to set message ref
  const setMessageRef = useCallback((messageId: string, element: HTMLDivElement | null) => {
    if (element) {
      messageRefs.current.set(messageId, element)
    } else {
      messageRefs.current.delete(messageId)
    }
  }, [])

  // Enhanced scroll event listener
  useEffect(() => {
    const container = messagesContainerRef.current
    console.log("📜 Setting up scroll listener, container:", !!container)

    if (!container) {
      console.log("❌ No container found for scroll listener")
      return
    }

    // Check container dimensions
    console.log("📐 Container dimensions:", {
      scrollHeight: container.scrollHeight,
      clientHeight: container.clientHeight,
      isScrollable: container.scrollHeight > container.clientHeight,
      offsetHeight: container.offsetHeight,
    })

    const handleScroll = (event: Event) => {
      console.log(`📜 VERTICAL SCROLL DETECTED!`, {
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        scrollPercentage:
          ((container.scrollTop / (container.scrollHeight - container.clientHeight)) * 100).toFixed(1) + "%",
      })
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    console.log("✅ Scroll listener attached to container")

    return () => {
      container.removeEventListener("scroll", handleScroll)
      console.log("🧹 Scroll listener removed")
    }
  }, [messages])

  // Set up intersection observer for assistant messages
  useEffect(() => {
    const assistantMessages = messages.filter((msg) => msg.role === "assistant") as AssistantMessage[]

    console.log("🔄 Setting up observer for", assistantMessages.length, "assistant messages")

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
        console.log("👁️ Observer triggered - entries:", entries.length)

        // Find the entry with the highest intersection ratio
        const mostVisibleEntry = entries.reduce((prev, current) => {
          return current.intersectionRatio > prev.intersectionRatio ? current : prev
        })

        console.log("🏆 Most visible ratio:", mostVisibleEntry.intersectionRatio.toFixed(3))

        // Only update if the intersection ratio is above threshold
        if (mostVisibleEntry.intersectionRatio > 0.3) {
          const messageId = mostVisibleEntry.target.getAttribute("data-message-id")
          if (messageId) {
            const message = assistantMessages.find((msg) => msg.id === messageId)
            if (message) {
              console.log("🎯 Setting active message to:", message.id.slice(0, 8))
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

    console.log(`📈 Observing ${observedCount}/${assistantMessages.length} messages`)

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
              height: "calc(100vh - 120px)", // Fixed height to force scrolling
              maxHeight: "calc(100vh - 120px)",
            }}
          >
            <div className="p-4 space-y-6 pb-6">
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id + index}
                  message={message}
                  userId={user}
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
                  isActive={message.role === "assistant" && activeMessage?.id === message.id}
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
          message={activeMessage}
          insightContent={insightContent}
          isInsightStreaming={isInsightStreaming}
          generateInsights={generateInsights}
          userId={user}
        />
      </div>
    </div>
  )
}
