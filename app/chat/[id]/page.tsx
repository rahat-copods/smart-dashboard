"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ChatHeader } from "@/components/chatHeader";
import { MessageBubble } from "@/components/messageBubble";
import { MessageInput } from "@/components/messageInput";
import { ThinkingIndicator } from "@/components/thinkingIndicator";
import { AssistantMessage, Chat, ChatMessage, UserMessage } from "@/types/chat";
import { ChatStorage } from "@/hooks/chatStorage";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [user, setUser] = useState("");
  const [chatTitle, setChatTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendQuery, isStreaming, streamedContent, streamingStatus } = useChat(
    chatId,
    messages,
    setMessages
  );
  // Load chat messages on mount
  useEffect(() => {
    if (chatId) {
      const chat = ChatStorage.getChat(chatId);
      if (chat) {
        console.log(chat, "chat");
        setMessages(chat.messages);
        setChatTitle(chat.title);
        setUser(chat.user);
      }
    }
  }, [chatId]);

  // Auto-start processing for new chats
  const hasStartedProcessing = useRef(false);
  useEffect(() => {
    if (
      chatId &&
      messages.length === 1 &&
      messages[0].role === "user" &&
      !hasStartedProcessing.current
    ) {
      hasStartedProcessing.current = true;
      const userQuestion = messages[0].question;
      if (userQuestion && user) {
        sendQuery(userQuestion, user);
      }
    }
  }, [chatId, messages, sendQuery, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (message: string) => {
    sendQuery(message, user);
  };
  if (!messages.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const isLastMessage = (index: number) => {
    return index === messages.length - 1;
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full">
      <ChatHeader title={chatTitle} />
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6 pb-6">
          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              message={message}
              userId={user}
              showSuggestions={
                isLastMessage(index) &&
                message.role === "assistant" &&
                !isStreaming
              }
              onSuggestionClick={handleSubmit}
              isStreaming={isLastMessage(index) ? isStreaming : false}
              streamedContent={isLastMessage(index) ? streamedContent : ""}
            />
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <MessageInput
        onSubmit={handleSubmit}
        disabled={isStreaming}
        placeholder="Ask a follow-up question..."
      />
    </div>
  );
}
