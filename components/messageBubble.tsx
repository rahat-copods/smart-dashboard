"use client";

import {
  User,
  Bot,
  Code,
  AlertCircle,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useState, forwardRef } from "react";
import type { ChatMessage } from "@/types/chat";
import ChartsComponent from "./visuals";
import { cn } from "@/lib/utils";
import DataTableComponent from "./visuals/dataTableComponent";
import MarkdownRenderer from "./markdownRenderer";

interface MessageBubbleProps {
  message: ChatMessage;
  showSuggestions?: boolean;
  onSuggestionClick: (suggestion: string) => void;
  isStreaming?: boolean;
  streamedContent?: string;
  streamingStatus?: string;
}

export const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
  (
    {
      message,
      showSuggestions = false,
      onSuggestionClick,
      isStreaming = false,
      streamedContent = "",
      streamingStatus = "",
    },
    ref
  ) => {
    const isUser = message.role === "user";
    const isAssistant = message.role === "assistant";

    // Collapsible states
    const [isQueryExpanded, setIsQueryExpanded] = useState(false);
    const [isContentExpanded, setIsContentExpanded] = useState(false);

    // Derive current status
    const currentStatus = isStreaming ? streamingStatus : "Completed";

    // Use streamedContent during streaming, fall back to message.streamedContent when done
    const displayContent = isStreaming
      ? streamedContent
      : (message.role === "assistant" && message.streamedContent) || "";

    const renderSuggestions = () => {
      if (
        !isAssistant ||
        !showSuggestions ||
        !message.query?.suggestions ||
        message.query.suggestions.length === 0
      )
        return null;

      return (
        <div className="mt-6 space-y-3 max-w-4xl">
          <div className="text-sm text-muted-foreground font-medium flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Follow-up questions:
          </div>
          <div className="flex flex-wrap gap-2">
            {message.query.suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-sm h-auto py-2 px-3 whitespace-normal text-left justify-start transition-colors bg-transparent"
                onClick={() => onSuggestionClick(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      );
    };

    if (isUser) {
      return (
        <div className="space-y-4">
          <div className="flex justify-end">
            <div className="flex space-x-3 w-full flex-row-reverse space-x-reverse max-w-4xl">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1 text-right">
                <div className="inline-block p-3 rounded-lg bg-primary text-primary-foreground">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-left">
                    {message.question}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isAssistant) {
      return (
        <>
          <div
            ref={ref}
            data-message-id={message.id}
            className="space-y-4 relative"
          >
            <div className="flex justify-start">
              <div className="flex space-x-3 w-full max-w-4xl">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted-foreground">
                  <Bot className="w-4 h-4 text-background" />
                </div>
                <div className="flex-1 min-w-0 bg-muted/30 border border-muted  p-1 rounded-lg space-y-4 transition-all duration-300 relative">
                  <div className="p-3">
                    {/* Display current status and streaming content */}
                    <div className="space-y-2">
                      <button
                        className="flex items-center space-x-1 text-sm font-normal focus:outline-none group hover:text-primary text-muted-foreground"
                        onClick={() => setIsContentExpanded(!isContentExpanded)}
                      >
                        <span className="relative w-4 h-4">
                          {/* Brain icon (visible by default, fades out on hover) */}
                          <Brain className="absolute inset-0 w-4 h-4 transition-all duration-200 transform group-hover:opacity-0 group-hover:scale-90" />
                          {/* Chevron icon (hidden by default, fades in on hover, rotates if expanded) */}
                          <ChevronRight
                            className={cn(
                              "absolute inset-0 w-4 h-4 transition-all duration-200 transform opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100",
                              isContentExpanded && "rotate-90"
                            )}
                            strokeWidth={1.5}
                          />
                        </span>
                        <span
                          className={cn(
                            isStreaming &&
                              "animate-gradient bg-gradient-to-r from-[var(--muted-foreground)] via-[var(--text-primary)] to-[var(--muted-foreground)] bg-[length:300%_100%] bg-left bg-clip-text text-transparent"
                          )}
                        >
                          {currentStatus}
                        </span>
                      </button>
                      {isContentExpanded && displayContent && (
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap pl-4 border-l-2 border-gray-200">
                          <MarkdownRenderer>{displayContent}</MarkdownRenderer>
                        </div>
                      )}
                    </div>

                    {message.query?.isPartial &&
                      message.query?.partialReason && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Info className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-semibold text-primary">
                              Partial Result
                            </span>
                            <Badge variant="outline" className="text-xs">
                              Incomplete
                            </Badge>
                          </div>
                          <div className="text-sm text-primary">
                            {message.query.partialReason}
                          </div>
                        </div>
                      )}

                    {message.error && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-semibold text-muted-foreground">
                            Error Occurred
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {message.error}
                        </div>
                      </div>
                    )}

                    {message.data && message.visuals ? (
                      message.visuals.visuals.map((visual, index) => (
                        <ChartsComponent
                          key={index}
                          config={visual}
                          chartData={message.data}
                        />
                      ))
                    ) : (
                      <DataTableComponent data={message.data} />
                    )}

                    {message.query && (
                      <Card className="bg-muted/30 border-muted p-1 py-2">
                        <CardContent
                          className={isQueryExpanded ? "p-3" : "px-3 py-2"}
                        >
                          <div className="flex items-center justify-between">
                            <button
                              className="flex items-center space-x-2 text-sm font-semibold focus:outline-none group"
                              onClick={() =>
                                setIsQueryExpanded(!isQueryExpanded)
                              }
                            >
                              <Code className="w-4 h-4 text-green-600" />
                              <span className="text-foreground/80">
                                Query Executed
                              </span>
                              {isQueryExpanded ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              )}
                            </button>
                          </div>
                          {isQueryExpanded && (
                            <div className="bg-muted/50 border border-muted rounded-md p-3 mt-2">
                              <pre className="text-sm font-mono text-foreground/90 overflow-x-auto whitespace-pre-wrap">
                                {message.query.sqlQuery}
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  {/* <p className="text-xs text-muted-foreground text-right">{message.id}</p> */}
                </div>
              </div>
            </div>
            {renderSuggestions()}
          </div>
        </>
      );
    }

    return null;
  }
);

MessageBubble.displayName = "MessageBubble";
