"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Database, Send, Loader2 } from "lucide-react";

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
import { ChatHeader } from "@/components/chatHeader";
import { ChatStorage } from "@/hooks/chatStorage";
import { ChatMessage } from "@/types/chat";

export default function HomePage() {
  const [userId, setUserId] = useState("");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          router.replace("/login");

          return;
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.replace("/login");

        return;
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

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
      // eslint-disable-next-line no-console
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

  // Show loading spinner while checking authentication
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

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
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2 ">
                <Label className="text-base font-medium" htmlFor="userId">
                  Select Test Database
                </Label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger className="h-12 text-base w-full">
                    <SelectValue placeholder="Choose a database to query data for" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user01">
                      DVD Rental — May 2005-May 2013
                    </SelectItem>
                    <SelectItem value="user02">
                      Clothing Store — Aug 2016-Aug 2018
                    </SelectItem>
                    <SelectItem value="user03">
                      Hospital Management — Jan 2023-Dec 2023
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium" htmlFor="query">
                  Ask a question
                </Label>
                <div className="relative">
                  <Textarea
                    className="resize-none text-base pr-12 min-h-[120px]"
                    disabled={isLoading}
                    id="query"
                    placeholder="e.g., Show me the top 10 customers by revenue this month"
                    rows={4}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Button
                    className="absolute bottom-3 right-3 h-8 w-8"
                    disabled={isLoading || !userId || !query.trim()}
                    size="icon"
                    type="submit"
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
                  className="p-3 text-left text-sm bg-card border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                  type="button"
                  onClick={() => handleExampleClick(example)}
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
