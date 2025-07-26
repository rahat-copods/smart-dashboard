"use client";

import { useEffect, useRef, useState } from "react";
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

  // Generate suggestions based on recent user questions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const shouldShowCurrentThinking = currentThinking && currentThinking.isActive;

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages, currentThinking]);

  // Generate suggestions from recent user messages and results
  useEffect(() => {
    if (chat?.messages) {
      const lastAssistantMessage = chat.messages
        .filter((msg) => msg.role === "assistant")
        .slice(-1)[0];

      const lastUserMessage = chat.messages
        .filter((msg) => msg.role === "user")
        .slice(-1)[0];

      if (lastAssistantMessage && lastUserMessage) {
        // Generate contextual suggestions based on the last interaction
        const userQuestion = lastUserMessage.question.toLowerCase();
        const hasResults =
          lastAssistantMessage.query_result &&
          lastAssistantMessage.query_result.length > 0;

        let generatedSuggestions: string[] = [];

        if (hasResults) {
          // Suggestions based on successful queries
          generatedSuggestions = [
            "Show me the trends for this data over time",
            "What are the top 10 results from this query?",
            "Can you group this data differently?",
            "Export this data to CSV format",
          ];

          // Add more specific suggestions based on query content
          if (
            userQuestion.includes("sales") ||
            userQuestion.includes("revenue")
          ) {
            generatedSuggestions.unshift(
              "Compare this with last month's sales"
            );
          } else if (
            userQuestion.includes("user") ||
            userQuestion.includes("customer")
          ) {
            generatedSuggestions.unshift(
              "Show user demographics for this data"
            );
          } else if (userQuestion.includes("product")) {
            generatedSuggestions.unshift("Show product performance metrics");
          }
        } else {
          // Suggestions when no results or errors occurred
          generatedSuggestions = [
            "Help me write a different query",
            "Show me available tables and columns",
            "What data is available to query?",
            "Give me some example queries",
          ];
        }

        setSuggestions(generatedSuggestions.slice(0, 4)); // Limit to 4 suggestions
      }
    }
  }, [chat?.messages]);

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

  const handleSuggestionClick = (suggestion: string) => {
    console.log("Suggestion clicked in ChatPage:", suggestion); // Debug log
    sendMessage(suggestion);
  };

  if (!chat) {
    if (error) {
      router.push("/");
      return null;
    }

    return (
      <ChatLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </ChatLayout>
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
    <ChatLayout currentChatId={chatId}>
      <ChatHeader title={chat.title} />

      <div className="flex-1 flex flex-col min-h-0">
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
                  message.role === "user" &&
                  !isLoading &&
                  !currentThinking
                }
                suggestions={suggestions}
                onSuggestionClick={handleSuggestionClick}
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

            {/* Only show error if there's an actual error */}
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

        {error}

        {/* Fixed Input at Bottom */}
        <MessageInput
          onSubmit={sendMessage}
          disabled={isLoading}
          placeholder="Ask a follow-up question..."
        />
      </div>
    </ChatLayout>
  );
}
