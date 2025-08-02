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
      };
      setMessages((prev) => [...prev, assistantMessage]);
      ChatStorage.addMessage(chatId, assistantMessage);
      setIsStreaming(true);
      setStreamedContent("");
      setStreamingStatus("Thinking");
      let accumulatedContent = "";

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
                accumulatedContent = accumulatedContent + '\n'
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
                // Store partial results in case of error
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
                // Store final result
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
        // Store partial results and error
        ChatStorage.updateLastMessage(chatId, {
          error: errorMessage,
          streamedContent: accumulatedContent,
        });
      } finally {
        setIsStreaming(false);
        setStreamingStatus("");
        setStreamedContent("");
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
  };
};
