import { useState, useCallback, useRef } from "react";

import { ChatStorage } from "@/hooks/chatStorage";
import { AssistantMessage, UserMessage, ChatMessage } from "@/types/chat";
import { UsageMetrics } from "@/types";

type StreamResponse = {
  type: "status" | "content" | "partialResult" | "result" | "error" | "usage";
  text: string;
};

export const useChat = (
  chatId: string,
  messages: ChatMessage[],
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [streamingStatus, setStreamingStatus] = useState("");
  const [insightContent, setInsightContent] = useState("");
  const [isInsightStreaming, setIsInsightStreaming] = useState(false);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics>({
    executionTime: "0.00",
    totalTokensUsed: 0,
  });

  // Add ref to track current token usage
  const currentTokensUsed = useRef(0);

  const sendQuery = useCallback(
    async (question: string, userId: string) => {
      const userMessage: UserMessage = {
        id: crypto.randomUUID(),
        role: "user",
        question,
        timestamp: new Date(),
      };

      const chat = ChatStorage.getChat(chatId);

      if (chat && chat.messages.length > 1) {
        setMessages((prev) => [...prev, userMessage]);
        ChatStorage.addMessage(chatId, userMessage);
      }

      const assistantMessage: AssistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        timestamp: new Date(),
        query: null,
        summary: null,
        data: null,
        visuals: null,
        streamedContent: "",
        insights: null,
        insightsError: null,
        error: null,
        info: { executionTime: 0.0, tokensUsage: 0 },
      };

      setMessages((prev) => [...prev, assistantMessage]);
      ChatStorage.addMessage(chatId, assistantMessage);
      setIsStreaming(true);
      setStreamedContent("");
      setStreamingStatus("Thinking");

      // Reset token counter for this request
      currentTokensUsed.current = 0;

      let accumulatedContent = "";
      let startTime: number | null = null;
      let timerId: NodeJS.Timeout | null = null;

      const formatExecutionTime = (ms: number): string => {
        const seconds = Math.floor(ms / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10);

        return `${seconds}.${milliseconds.toString().padStart(2, "0")}`;
      };

      try {
        const response = await fetch("/api/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            messages: [
              ...messages.map((msg) => ({
                role: msg.role,
                content:
                  msg.role === "user"
                    ? msg.question
                    : (msg.summary ?? "no summary, most likely failed message"),
              })),
              { role: "user", content: question },
            ],
          }),
        });

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            try {
              const parsed: StreamResponse = JSON.parse(line);

              if (parsed.type === "status") {
                setStreamingStatus(parsed.text);
                if (!startTime) {
                  startTime = performance.now();
                  timerId = setInterval(() => {
                    if (startTime) {
                      const elapsed = performance.now() - startTime;

                      setUsageMetrics((prev) => ({
                        ...prev,
                        executionTime: formatExecutionTime(elapsed),
                      }));
                    }
                  }, 100);
                }
                accumulatedContent = accumulatedContent + "\n";
              } else if (parsed.type === "content") {
                accumulatedContent += parsed.text;
                setStreamedContent(accumulatedContent);
              } else if (parsed.type === "usage") {
                const usageData = JSON.parse(parsed.text);
                const newTokens = usageData.total_tokens || 0;

                // Update both ref and state
                currentTokensUsed.current += newTokens;
                setUsageMetrics((prev) => ({
                  ...prev,
                  totalTokensUsed: prev.totalTokensUsed + newTokens,
                }));
              } else if (parsed.type === "partialResult") {
                const partialResult = JSON.parse(parsed.text);

                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;

                  if (
                    updated[lastIndex] &&
                    updated[lastIndex].role === "assistant"
                  ) {
                    updated[lastIndex] = {
                      ...updated[lastIndex],
                      ...partialResult,
                      streamedContent: accumulatedContent,
                    };
                  }

                  return updated;
                });
                ChatStorage.updateLastMessage(chatId, {
                  ...partialResult,
                  streamedContent: accumulatedContent,
                });
              } else if (parsed.type === "result" || parsed.type === "error") {
                const result = JSON.parse(parsed.text);

                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;

                  if (
                    updated[lastIndex] &&
                    updated[lastIndex].role === "assistant"
                  ) {
                    updated[lastIndex] = {
                      ...updated[lastIndex],
                      ...result,
                      streamedContent: accumulatedContent,
                    };
                  }

                  return updated;
                });
                ChatStorage.updateLastMessage(chatId, {
                  ...result,
                  streamedContent: accumulatedContent,
                });
              }
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error("Error parsing stream chunk:", error);
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Failed to parse server response";

              setMessages((prev) => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;

                if (
                  updated[lastIndex] &&
                  updated[lastIndex].role === "assistant"
                ) {
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    error: errorMessage,
                    streamedContent: accumulatedContent,
                  };
                }

                return updated;
              });
              ChatStorage.updateLastMessage(chatId, {
                error: errorMessage,
                streamedContent: accumulatedContent,
              });
            }
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error sending query:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;

          if (updated[lastIndex] && updated[lastIndex].role === "assistant") {
            updated[lastIndex] = {
              ...updated[lastIndex],
              error: errorMessage,
              streamedContent: accumulatedContent,
            };
          }

          return updated;
        });
        ChatStorage.updateLastMessage(chatId, {
          error: errorMessage,
          streamedContent: accumulatedContent,
        });
      } finally {
        if (timerId) {
          clearInterval(timerId);
        }

        const endTime = performance.now();
        let tokensUsed = currentTokensUsed.current;
        const finalExecutionTime = startTime
          ? formatExecutionTime(endTime - startTime)
          : "0.00";

        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;

          if (updated[lastIndex] && updated[lastIndex].role === "assistant") {
            updated[lastIndex] = {
              ...updated[lastIndex],
              info: {
                ...updated[lastIndex].info,
                executionTime: +finalExecutionTime,
                tokensUsage: tokensUsed,
              },
            };
          }

          return updated;
        });

        ChatStorage.updateLastMessage(chatId, {
          info: {
            executionTime: finalExecutionTime,
            tokensUsage: tokensUsed, // Now uses the correct value
          },
        });

        setIsStreaming(false);
        setStreamingStatus("");
        setStreamedContent("");
        setUsageMetrics({ executionTime: "0.00", totalTokensUsed: 0 });
      }
    },
    [chatId, messages, setMessages], // Remove usageMetrics.totalTokensUsed from dependencies
  );

  const generateInsights = useCallback(
    async (userId: string, data: Record<string, any>[], messageId: string) => {
      setIsInsightStreaming(true);
      setInsightContent("");
      let accumulatedInsight = "";

      try {
        const response = await fetch("/api/insights", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            messages: [
              ...messages.map((msg) => ({
                role: msg.role,
                content:
                  msg.role === "user"
                    ? msg.question
                    : (msg.summary ?? "no summary, most likely failed message"),
              })),
              {
                role: "user",
                content:
                  "Please give me insights for this data \n" +
                  JSON.stringify(data),
              },
            ],
          }),
        });

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            try {
              const parsed: StreamResponse = JSON.parse(line);

              if (parsed.type === "status") {
              } else if (parsed.type === "content") {
                accumulatedInsight += parsed.text;
                setInsightContent(accumulatedInsight);
              } else if (parsed.type === "usage") {
                const usageData = JSON.parse(parsed.text);
                const newTokens = usageData.total_tokens || 0;

                currentTokensUsed.current += newTokens;

                setMessages((prev) => {
                  const updated = [...prev];
                  const messageIndex = updated.findIndex(
                    (msg) => msg.id === messageId,
                  );

                  if (
                    messageIndex !== -1 &&
                    updated[messageIndex].role === "assistant"
                  ) {
                    updated[messageIndex] = {
                      ...updated[messageIndex],
                      info: {
                        ...updated[messageIndex].info,
                        tokensUsage: currentTokensUsed.current,
                      },
                    } as AssistantMessage;

                    ChatStorage.updateMessage(chatId, messageId, {
                      info: {
                        ...updated[messageIndex].info,
                        tokensUsage: currentTokensUsed.current,
                      },
                    });
                  }

                  return updated;
                });
              } else if (parsed.type === "partialResult") {
              } else if (parsed.type === "result" || parsed.type === "error") {
                const result = JSON.parse(parsed.text);

                setMessages((prev) => {
                  const updated = [...prev];
                  const messageIndex = updated.findIndex(
                    (msg) => msg.id === messageId,
                  );

                  if (
                    messageIndex !== -1 &&
                    updated[messageIndex].role === "assistant"
                  ) {
                    updated[messageIndex] = {
                      ...updated[messageIndex],
                      insights: result,
                    } as AssistantMessage;
                  }

                  return updated;
                });
                ChatStorage.updateMessage(chatId, messageId, {
                  insights: result,
                });
              }
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error("Error parsing insights stream chunk:", error);
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Failed to parse insights response";

              setMessages((prev) => {
                const updated = [...prev];
                const messageIndex = updated.findIndex(
                  (msg) => msg.id === messageId,
                );

                if (
                  messageIndex !== -1 &&
                  updated[messageIndex].role === "assistant"
                ) {
                  updated[messageIndex] = {
                    ...updated[messageIndex],
                    insightsError: errorMessage,
                  } as AssistantMessage;
                }

                return updated;
              });
              ChatStorage.updateMessage(chatId, messageId, {
                insightsError: errorMessage,
              });
            }
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error generating insights:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        setMessages((prev) => {
          const updated = [...prev];
          const messageIndex = updated.findIndex((msg) => msg.id === messageId);

          if (
            messageIndex !== -1 &&
            updated[messageIndex].role === "assistant"
          ) {
            updated[messageIndex] = {
              ...updated[messageIndex],
              insightsError: errorMessage,
            } as AssistantMessage;
          }

          return updated;
        });
        ChatStorage.updateMessage(chatId, messageId, {
          insightsError: errorMessage,
        });
      } finally {
        setIsInsightStreaming(false);
        setInsightContent("");
      }
    },
    [chatId, messages, setMessages],
  );

  return {
    sendQuery,
    generateInsights,
    isStreaming,
    streamedContent,
    streamingStatus,
    isInsightStreaming,
    insightContent,
    usageMetrics,
  };
};
