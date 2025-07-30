"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Bot, User, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { ChatMessage } from "@/types";

interface InsightMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface InsightsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ChatMessage;
  userId: string;
}

export function InsightsPanel({
  isOpen,
  onClose,
  initialData,
  userId,
}: InsightsPanelProps) {
  const [messages, setMessages] = useState<InsightMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [panelWidth, setPanelWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Resize functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 320;
      const maxWidth = Math.min(800, window.innerWidth * 0.6);

      setPanelWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const createMessage = (
    role: "user" | "assistant",
    content: string
  ): InsightMessage => ({
    id: Date.now().toString(),
    role,
    content,
    timestamp: new Date(),
  });

  useEffect(() => {
    if (isOpen && messages.length === 0 && initialData && userId) {
      sendRequest({ isInitial: true });
    }
  }, [isOpen, initialData, userId]);

  const sendRequest = async ({
    isInitial = false,
    userInput = "",
  }: {
    isInitial?: boolean;
    userInput?: string;
  }) => {
    if (
      !initialData ||
      !userId ||
      (isInitial && messages.length > 0) ||
      (!isInitial && !userInput.trim()) ||
      isLoading
    ) {
      return;
    }

    setIsLoading(true);
    const newMessage = !isInitial
      ? createMessage("user", userInput.trim())
      : null;
    if (newMessage) {
      setMessages((prev) => [...prev, newMessage]);
      setInputValue("");
    }

    try {
      const previousMessages = [
        {
          role: "user",
          content: `Please analyze and explain the following data:\n\nData: ${JSON.stringify(initialData)}`,
        },
        ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
        ...(newMessage ? [{ role: "user", content: newMessage.content }] : []),
      ];

      const response = await fetch("http://localhost:8000/api/query/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          data: initialData,
          messages: previousMessages,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || data.partial_reason || "Failed to process request"
        );
      }

      const content = isInitial
        ? data.result
        : data.result.explanation ||
          "I'm not sure how to help with that. Could you be more specific?";
      setMessages((prev) => [...prev, createMessage("assistant", content)]);
    } catch (error) {
      console.error(
        `Failed to ${isInitial ? "generate initial insights" : "send message"}:`,
        error
      );
      const errorContent = isInitial
        ? "Sorry, I couldn't analyze your data right now. Please try asking me a specific question about your results."
        : `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`;
      setMessages((prev) => [
        ...prev,
        createMessage("assistant", errorContent),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => sendRequest({ userInput: inputValue });

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay for resizing */}
      {isResizing && <div className="fixed inset-0 z-40" />}

      <div
        ref={panelRef}
        className="fixed inset-y-0 right-0 bg-background border-l shadow-lg z-50 flex flex-col"
        style={{ width: `${panelWidth}px` }}
      >
        {/* Resize handle */}
        <div
          ref={resizeRef}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 transition-colors group"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Data Insights</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.length === 0 && isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex space-x-2 max-w-[85%] ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === "user"
                      ? "bg-primary"
                      : "bg-muted-foreground"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-primary-foreground" />
                  ) : (
                    <Bot className="w-4 h-4 text-background" />
                  )}
                </div>
                <Card
                  className={`${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/30"}`}
                >
                  <CardContent className="p-3">
                    <div className="text-sm leading-relaxed">
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                    <div
                      className={`text-xs mt-2 opacity-70 ${
                        message.role === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
                      <span className="text-xs text-muted-foreground">
                        Thinking...
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
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
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line • Drag left edge to
            resize
          </div>
        </div>
      </div>
    </>
  );
}
