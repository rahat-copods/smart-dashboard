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
  const [activeAssistantMessage, setActiveAssistantMessage] = useState<ChatMessage | null>(null)
  const [activeMessageIndex, setActiveMessageIndex] = useState<number>(-1)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const { sendQuery, isStreaming, streamedContent, streamingStatus } = useChat(chatId, messages, setMessages)

  // Load chat messages on mount
  useEffect(() => {
    if (chatId) {
      const chat = ChatStorage.getChat(chatId)
      if (chat) {
        console.log(chat, "chat")
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Improved scroll-based message detection
  useEffect(() => {
    if (!messagesContainerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find assistant messages that are more than 50% visible
        let bestCandidate: {
          message: ChatMessage
          index: number
          ratio: number
        } | null = null

        entries.forEach((entry) => {
          // Only consider entries that are more than 50% visible
          if (entry.intersectionRatio > 0.5) {
            const messageIndex = Number.parseInt(entry.target.getAttribute("data-message-index") || "-1")
            const message = messages[messageIndex]

            if (message && message.role === "assistant") {
              // If this is the first candidate or has a higher intersection ratio
              if (!bestCandidate || entry.intersectionRatio > bestCandidate.ratio) {
                bestCandidate = {
                  message,
                  index: messageIndex,
                  ratio: entry.intersectionRatio,
                }
              }
            }
          }
        })

        // Update active message if we found a suitable candidate
        if (bestCandidate && bestCandidate.index !== activeMessageIndex) {
          setActiveAssistantMessage(bestCandidate.message)
          setActiveMessageIndex(bestCandidate.index)

          // Auto-open sidebar when there's an assistant message visible
          if (!isSidebarOpen) {
            setIsSidebarOpen(true)
          }
        }
      },
      {
        root: messagesContainerRef.current,
        // Use 0px margins to get accurate intersection ratios
        rootMargin: "0px",
        // Use more granular thresholds including 0.5 (50%)
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0],
      },
    )

    // Observe all message elements
    messageRefs.current.forEach((element) => {
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [messages, activeMessageIndex, isSidebarOpen])

  // Update active message when streaming content changes (for the last message)
  useEffect(() => {
    if (isStreaming && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === "assistant") {
        setActiveAssistantMessage(lastMessage)
        setActiveMessageIndex(messages.length - 1)
      }
    }
  }, [messages, streamedContent, isStreaming])

  const handleSubmit = (message: string) => {
    sendQuery(message, user)
  }

  const setMessageRef = useCallback((index: number, element: HTMLDivElement | null) => {
    if (element) {
      messageRefs.current.set(index, element)
    } else {
      messageRefs.current.delete(index)
    }
  }, [])

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
    <div className="flex flex-col flex-1 min-h-0 w-full">
      <ChatHeader title={chatTitle} />
      <div className="flex flex-1 min-h-0">
        {/* Main Content Area */}
        <div className={`flex flex-col flex-1 min-h-0 transition-all duration-300 ${isSidebarOpen ? "mr-80" : "mr-0"}`}>
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto" ref={messagesContainerRef}>
            <div className="p-4 space-y-6 pb-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  ref={(el) => setMessageRef(index, el)}
                  data-message-index={index}
                  // Add some padding to ensure proper intersection detection
                  className="py-2"
                >
                  <MessageBubble
                    message={message}
                    userId={user}
                    showSuggestions={isLastMessage(index) && message.role === "assistant" && !isStreaming}
                    onSuggestionClick={handleSubmit}
                    isStreaming={isLastMessage(index) ? isStreaming : false}
                    streamedContent={isLastMessage(index) ? streamedContent : ""}
                    streamingStatus={isLastMessage(index) ? streamingStatus : ""}
                    isActive={index === activeMessageIndex}
                  />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <MessageInput onSubmit={handleSubmit} disabled={isStreaming} placeholder="Ask a follow-up question..." />
        </div>

        {/* Insights Sidebar */}
        <InsightsSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          message={activeAssistantMessage as AssistantMessage}
          messageIndex={activeMessageIndex}
          isStreaming={isStreaming && activeMessageIndex === messages.length - 1}
          streamedContent={activeMessageIndex === messages.length - 1 ? streamedContent : ""}
        />
      </div>
    </div>
  )
}
