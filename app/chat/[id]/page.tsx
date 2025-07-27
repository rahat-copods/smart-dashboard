"use client";

import { useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ChatLayout } from "@/components/chatLayout";
import { ChatHeader } from "@/components/chatHeader";
import { MessageBubble } from "@/components/messageBubble";
import { MessageInput } from "@/components/messageInput";
import { ThinkingIndicator } from "@/components/thinkingIndicator";
import { useChat } from "@/hooks/use-chat";

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatId = params.id as string;
  const userId = searchParams.get("userId") || "";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    chat,
    isLoading,
    currentThinking,
    error,
    loadChat,
    sendMessage,
    processMessage,
  } = useChat(chatId, userId);

  const shouldShowCurrentThinking = currentThinking && currentThinking.isActive;

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages, currentThinking]);

  // Auto-start processing for new chats
  const hasStartedProcessing = useRef(false);
  useEffect(() => {
    if (
      chat &&
      chat.messages.length === 1 &&
      chat.messages[0].role === "user" &&
      !hasStartedProcessing.current // Add this guard
    ) {
      hasStartedProcessing.current = true;
      const userQuestion = chat.messages[0].question;
      if (userQuestion) {
        console.log(
          `[${new Date().toISOString()}] useChat called for chatId: ${chatId}`
        );
        processMessage(userQuestion, chat, 1);
      }
    }
  }, [processMessage]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  if (!chat) {
    if (error) {
      router.push("/");
      return null;
    }

    return (
      <>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </>
    );
  }

  const isLastMessage = (index: number) => {
    return index === chat.messages.length - 1;
  };

  const isRetryMessage = (message: any, index: number) => {
    // Check if previous message was a system error message
    if (index > 0) {
      const prevMessage = chat.messages[index - 1];
      return prevMessage.role === "system";
    }
    return false;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-3xl">
      <ChatHeader title={chat.title} />
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6 pb-6">
          {chat.messages.map((message, index) => (
            <MessageBubble
              key={index}
              message={message}
              onCopy={handleCopy}
              showSuggestions={
                isLastMessage(index) &&
                message.role === "assistant" &&
                !shouldShowCurrentThinking &&
                !isLoading
              }
              onSuggestionClick={sendMessage}
              isRetry={isRetryMessage(message, index)}
            />
          ))}

          {/* Current Thinking - Only during active streaming */}
          {shouldShowCurrentThinking && currentThinking && (
            <ThinkingIndicator
              status={currentThinking.status}
              text={currentThinking.text}
              isActive={currentThinking.isActive}
              sqlQuery={currentThinking.sqlQuery}
            />
          )}

          {error && !shouldShowCurrentThinking && (
            <div className="text-center p-4">
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <MessageInput
        onSubmit={sendMessage}
        disabled={isLoading}
        placeholder="Ask a follow-up question..."
      />
    </div>
  );
}
