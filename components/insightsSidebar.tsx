"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PanelRightClose,
  PanelRightOpen,
  Lightbulb,
  FileText,
  Database,
  BarChart3,
  Brain,
  Hash,
  Clock,
  MessageSquare,
  Eye,
  ScrollText,
} from "lucide-react";
import type { AssistantMessage } from "@/types/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface InsightsSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  message: AssistantMessage | null;
  messageIndex: number;
  isStreaming?: boolean;
  streamedContent?: string;
  insightContent: string;
  isInsightStreaming: boolean;
  generateInsights: (
    userId: string,
    data: Record<string, any>[]
  ) => Promise<void>;
  userId: string;
}

export function InsightsSidebar({
  isOpen,
  onToggle,
  message,
  messageIndex,
  isStreaming = false,
  streamedContent = "",
  insightContent,
  isInsightStreaming,
  generateInsights,
  userId,
}: InsightsSidebarProps) {
  const [insights, setInsights] = useState<any[]>([]);

  // Generate insights when message or streaming content changes
  useEffect(() => {
    if (!message) {
      setInsights([]);
      return;
    }

    const newInsights = [];

    // Get the content to analyze (streaming content if available, otherwise message content)
    const contentToAnalyze = isStreaming
      ? streamedContent
      : message.streamedContent || "";

    // Word count insight
    if (contentToAnalyze) {
      const words = contentToAnalyze
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);
      const wordCount = words.length;
      const charCount = contentToAnalyze.length;
      const charCountNoSpaces = contentToAnalyze.replace(/\s/g, "").length;
      const sentences = contentToAnalyze
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 0).length;
      const paragraphs = contentToAnalyze
        .split(/\n\s*\n/)
        .filter((p) => p.trim().length > 0).length;
      const readingTime = Math.ceil(wordCount / 200); // Average reading speed
      const avgWordsPerSentence =
        sentences > 0 ? Math.round(wordCount / sentences) : 0;

      newInsights.push({
        type: "content",
        title: "Content Analysis",
        items: [
          { label: "Words", value: wordCount.toLocaleString(), icon: Hash },
          {
            label: "Characters",
            value: charCount.toLocaleString(),
            icon: FileText,
          },
          {
            label: "Characters (no spaces)",
            value: charCountNoSpaces.toLocaleString(),
            icon: FileText,
          },
          { label: "Sentences", value: sentences, icon: ScrollText },
          { label: "Paragraphs", value: paragraphs, icon: ScrollText },
          {
            label: "Avg words/sentence",
            value: avgWordsPerSentence,
            icon: Hash,
          },
          { label: "Reading Time", value: `${readingTime} min`, icon: Clock },
        ],
        icon: MessageSquare,
      });
    }

    // Data insights
    if (message.data && message.data.length > 0) {
      const rowCount = message.data.length;
      const columnCount = Object.keys(message.data[0]).length;
      newInsights.push({
        type: "data",
        title: "Data Summary",
        items: [
          { label: "Rows", value: rowCount.toLocaleString(), icon: Hash },
          { label: "Columns", value: columnCount, icon: Hash },
        ],
        icon: Database,
      });
    }

    // Chart insights
    if (message.chartConfig && message.chartConfig.length > 0) {
      newInsights.push({
        type: "visualization",
        title: "Visualizations",
        items: [
          { label: "Charts", value: message.chartConfig.length, icon: Hash },
        ],
        icon: BarChart3,
      });
    }

    // SQL Query insights
    if (message.sqlQuery) {
      const queryLength = message.sqlQuery.length;
      const queryLines = message.sqlQuery.split("\n").length;
      const queryWords = message.sqlQuery.trim().split(/\s+/).length;
      newInsights.push({
        type: "query",
        title: "SQL Query",
        items: [
          {
            label: "Characters",
            value: queryLength.toLocaleString(),
            icon: Hash,
          },
          { label: "Lines", value: queryLines, icon: Hash },
          { label: "Words", value: queryWords, icon: Hash },
        ],
        icon: Database,
      });
    }

    setInsights(newInsights);
  }, [message, isStreaming, streamedContent]);

  const handleInsightClick = () => {
    if (!message || !message.data || !message.data.length) return;
    generateInsights(userId, message.data);
  };
  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full bg-background border-l border-border transition-all duration-300 ease-in-out z-40 ${
          isOpen ? "w-80" : "w-12"
        }`}
      >
        {/* Toggle Button */}
        <div className="absolute top-4 left-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
          >
            {isOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Sidebar Content */}
        {isOpen && (
          <div className="p-4 pt-16 h-full overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-lg">Insights</h3>
              </div>

              {/* Active Message Indicator */}
              {message && messageIndex >= 0 && (
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 " />
                  <span className="text-sm font-medium ">
                    Viewing Message #{messageIndex + 1}
                  </span>
                </div>
              )}
              <>
                <Button onClick={handleInsightClick}>Generate Insights</Button>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {isInsightStreaming ? insightContent : message?.insights}
                </ReactMarkdown>
              </>

              {/* {insights.length > 0 ? (
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <insight.icon className="w-4 h-4" />
                          {insight.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {insight.items.map((item: any, itemIndex: number) => (
                            <div
                              key={itemIndex}
                              className="flex justify-between items-center"
                            >
                              <div className="flex items-center gap-2">
                                <item.icon className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {item.label}:
                                </span>
                              </div>
                              <span className="text-sm font-medium">
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No insights available</p>
                  <p className="text-xs mt-1">
                    Scroll to an assistant message to view insights
                  </p>
                </div>
              )} */}

              {/* Streaming Status */}
              {/* {isStreaming && (
                <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm text-green-700 dark:text-green-300">
                        Analyzing response...
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )} */}

              {/* Message Status */}
              {/* {message && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Message Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant="outline" className="text-xs">
                          {message.role}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Position:</span>
                        <Badge variant="secondary" className="text-xs">
                          #{messageIndex + 1}
                        </Badge>
                      </div>
                      {message.sqlResult?.partial && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant="destructive" className="text-xs">
                            Partial
                          </Badge>
                        </div>
                      )}
                      {message.error && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Error:</span>
                          <Badge variant="destructive" className="text-xs">
                            Yes
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )} */}
            </div>
          </div>
        )}

        {/* Collapsed State Indicator */}
        {!isOpen && (
          <div className="absolute top-20 left-2 transform -rotate-90 origin-left whitespace-nowrap text-xs text-muted-foreground">
            Insights
          </div>
        )}
      </div>
    </>
  );
}
