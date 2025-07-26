"use client"

import { useEffect, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { ChatLayout } from "@/components/chatLayout"
import { ChatHeader } from "@/components/chatHeader"
import { MessageBubble } from "@/components/messageBubble"
import { MessageInput } from "@/components/messageInput"
import { ThinkingIndicator } from "@/components/thinkingIndicator"
import { useChat } from "@/hooks/use-chat"

export default function ChatPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const chatId = params.id as string
  const userId = searchParams.get("userId") || ""
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { chat, isLoading, currentThinking, error, loadChat, sendMessage } = useChat(chatId, userId)

  useEffect(() => {
    loadChat()
  }, [loadChat])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chat?.messages, currentThinking])

  // Auto-start processing for new chats
  useEffect(() => {
    if (chat && chat.messages.length === 1 && chat.messages[0].role === "user" && !isLoading) {
      console.log(chat)
      // Use processMessage directly to avoid creating duplicate user message
      const userQuestion = chat.messages[0].question;
      if (userQuestion) {
        sendMessage(userQuestion);
      }
    }
  }, [chat, isLoading, sendMessage])

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  if (!chat) {
    if (error) {
      router.push("/")
      return null
    }

    return (
      <ChatLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </ChatLayout>
    )
  }

  return (
    <ChatLayout currentChatId={chatId}>
      <ChatHeader title={chat.title} />

      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6 pb-6">
            {chat.messages.map((message) => (
              <MessageBubble key={message.id} message={message} onCopy={handleCopy} />
            ))}

            {/* Current Thinking */}
            {currentThinking && (
              <ThinkingIndicator
                status={currentThinking.status}
                text={currentThinking.text}
                isActive={currentThinking.isActive}
                sqlQuery={currentThinking.sqlQuery}
              />
            )}

            {error && (
              <div className="text-center p-4">
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                  {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Fixed Input at Bottom */}
        <MessageInput onSubmit={sendMessage} disabled={isLoading} placeholder="Ask a follow-up question..." />
      </div>
    </ChatLayout>
  )
}