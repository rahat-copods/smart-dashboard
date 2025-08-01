"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Database, Send, Loader2 } from "lucide-react";
import { ChatHeader } from "@/components/chatHeader";
import { ChatStorage } from "@/hooks/chatStorage";
import { ChatMessage } from "@/types";

export default function HomePage() {
  const [userId, setUserId] = useState("");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || !query.trim() || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const newChat = ChatStorage.createChat(query.trim(), userId);

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user" as const,
        question: query.trim(),
        timestamp: new Date(),
      };

      newChat.messages.push(userMessage);
      ChatStorage.addMessage(newChat.id, userMessage);
      router.push(`/chat/${newChat.id}`);
    } catch (err) {
      console.error("Failed to create chat:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && query.trim()) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const examples = [
    "Can you explain me the database?",
    "What's the total revenue for last month?",
    "List the top 5 products by sales",
    "Find customers who haven't ordered recently",
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <ChatHeader title="Smart Dashboard" />

      <div className="flex items-center justify-center min-h-full p-8">
        <div className="w-full max-w-2xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <Database className="w-12 h-12 text-primary" />
              <h1 className="text-4xl font-bold">Smart Dashboard</h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Ask questions about your data in natural language
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2 ">
                <Label htmlFor="userId" className="text-base font-medium">
                  Select Test Database
                </Label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger className="h-12 text-base w-full">
                    <SelectValue placeholder="Choose a database to query data for" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user01">
                      DVD Rental - May-2005—May-2013
                    </SelectItem>
                    <SelectItem value="user02">
                      Clothing Store Aug-2016—Aug-2018
                    </SelectItem>
                    <SelectItem value="user03">
                      Hospital Management Jan-1950—Dec-2023
                    </SelectItem>
                    <SelectItem value="user04">
                      Healthcare Patient May-2019—Jun-2024
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="query" className="text-base font-medium">
                  Ask a question
                </Label>
                <div className="relative">
                  <Textarea
                    id="query"
                    placeholder="e.g., Show me the top 10 customers by revenue this month"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    rows={4}
                    className="resize-none text-base pr-12 min-h-[120px]"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !userId || !query.trim()}
                    size="icon"
                    className="absolute bottom-3 right-3 h-8 w-8"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Press Enter to send, or click the send button
              </p>
            </div>
          </form>

          {/* Examples */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Try asking:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {examples.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleExampleClick(example)}
                  disabled={isLoading}
                  className="p-3 text-left text-sm bg-card border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
