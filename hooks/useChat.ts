import { useState, useCallback } from "react";
import { ChatStorage } from "@/hooks/chatStorage";
import { AssistantMessage, UserMessage, ChatMessage } from "@/types/chat";

type StreamResponse = {
  type: "status" | "content" | "partialResult" | "result" | "error";
  text: string;
};

export const useChat = (
  chatId: string,
  messages: ChatMessage[],
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [streamingStatus, setStreamingStatus] = useState("");
  const [insightContent, setInsightContent] = useState("");
  const [isInsightStreaming, setIsInsightStreaming] = useState(false);
  const [executionTime, setExecutionTime] = useState("0.00"); // Changed to string for seconds.milliseconds format

  const sendQuery = useCallback(
    async (question: string, userId: string) => {
      // Create user message
      const userMessage: UserMessage = {
        id: crypto.randomUUID(),
        role: "user",
        question,
        timestamp: new Date(),
      };

      // Add user message if not the first message (skip if first to avoid duplication)
      const chat = ChatStorage.getChat(chatId);
      if (chat && chat.messages.length > 1) {
        setMessages((prev) => [...prev, userMessage]);
        ChatStorage.addMessage(chatId, userMessage);
      }

      // Add assistant message placeholder
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
        info: { executionTime: 0.00 },
      };
      setMessages((prev) => [...prev, assistantMessage]);
      ChatStorage.addMessage(chatId, assistantMessage);
      setIsStreaming(true);
      setStreamedContent("");
      setStreamingStatus("Thinking");
      let accumulatedContent = "";
      let startTime: number | null = null;
      let timerId: NodeJS.Timeout | null = null;

      // Function to format time as seconds.milliseconds
      const formatExecutionTime = (ms: number): string => {
        const seconds = Math.floor(ms / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10); // Get first two digits of milliseconds
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
                content: msg.role === "user" ? msg.question : msg.summary,
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
                  // Start updating executionTime every 100ms
                  timerId = setInterval(() => {
                    if (startTime) {
                      const elapsed = performance.now() - startTime;
                      setExecutionTime(formatExecutionTime(elapsed));
                    }
                  }, 100);
                }
                accumulatedContent = accumulatedContent + "\n";
              } else if (parsed.type === "content") {
                accumulatedContent += parsed.text;
                setStreamedContent(accumulatedContent);
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
        // Clear the interval
        if (timerId) {
          clearInterval(timerId);
        }

        // Calculate final execution time
        const endTime = performance.now();
        const finalExecutionTime = startTime
          ? formatExecutionTime(endTime - startTime)
          : "0.00";

        // Update messages with final execution time
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex] && updated[lastIndex].role === "assistant") {
            updated[lastIndex] = {
              ...updated[lastIndex],
              info: {
                ...updated[lastIndex].info,
                executionTime: +finalExecutionTime,
              },
            };
          }
          return updated;
        });

        // Update ChatStorage with final execution time
        ChatStorage.updateLastMessage(chatId, {
          info: {
            executionTime: finalExecutionTime,
          },
        });

        // Reset state
        setIsStreaming(false);
        setStreamingStatus("");
        setStreamedContent("");
        setExecutionTime("0.00"); // Reset to string format
      }
    },
    [chatId, messages, setMessages]
  );

  const generateInsights = useCallback(
    async (userId: string, data: Record<string, any>[]) => {
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
                content: msg.role === "user" ? msg.question : msg.summary,
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
              } else if (parsed.type === "partialResult") {
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
                      insights: result,
                    };
                  }
                  return updated;
                });
                ChatStorage.updateLastMessage(chatId, {
                  insights: result,
                });
              }
            } catch (error) {
              console.error("Error parsing insights stream chunk:", error);
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Failed to parse insights response";
              setMessages((prev) => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;
                if (
                  updated[lastIndex] &&
                    updated[lastIndex].role === "assistant"
                ) {
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    insightsError: errorMessage,
                  };
                }
                return updated;
              });
              ChatStorage.updateLastMessage(chatId, {
                insightsError: errorMessage,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error generating insights:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex] && updated[lastIndex].role === "assistant") {
            updated[lastIndex] = {
              ...updated[lastIndex],
              insightsError: errorMessage,
            };
          }
          return updated;
        });
        ChatStorage.updateLastMessage(chatId, {
          insightsError: errorMessage,
        });
      } finally {
        setIsInsightStreaming(false);
        setInsightContent("");
      }
    },
    [chatId, messages, setMessages]
  );

  return {
    sendQuery,
    generateInsights,
    isStreaming,
    streamedContent,
    streamingStatus,
    isInsightStreaming,
    insightContent,
    executionTime,
  };
};