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
        streamedContent: "",
        status: "",
      };
      setMessages((prev) => [...prev, assistantMessage]);
      ChatStorage.addMessage(chatId, assistantMessage);
      setIsStreaming(true);
      setStreamedContent("");
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
                content: msg.role === "user" ? msg.question : msg.finalSummary,
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
                accumulatedContent += `**Status:** ${parsed.text}\n`;
                setStreamedContent(accumulatedContent);
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;
                  if (
                    updated[lastIndex] &&
                    updated[lastIndex].role === "assistant"
                  ) {
                    updated[lastIndex] = {
                      ...updated[lastIndex],
                      streamedContent: accumulatedContent,
                    };
                  }
                  return updated;
                });
                ChatStorage.updateLastMessage(chatId, {
                  streamedContent: accumulatedContent,
                });
              } else if (parsed.type === "content") {
                accumulatedContent += parsed.text;
                setStreamedContent(accumulatedContent);
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;
                  if (
                    updated[lastIndex] &&
                    updated[lastIndex].role === "assistant"
                  ) {
                    updated[lastIndex] = {
                      ...updated[lastIndex],
                      streamedContent: accumulatedContent,
                    };
                  }
                  return updated;
                });
                ChatStorage.updateLastMessage(chatId, {
                  streamedContent: accumulatedContent,
                });
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
                      data: result.data,
                      chartConfig: result.chartConfig,
                      sqlQuery: result.sqlQuery,
                      error: result.error,
                      finalSummary: result.finalSummary,
                      streamedContent: accumulatedContent,
                    };
                  }
                  return updated;
                });
                // Store final result
                ChatStorage.updateLastMessage(chatId, {
                  data: result.data,
                  chartConfig: result.chartConfig,
                  sqlQuery: result.sqlQuery,
                  error: result.error,
                  finalSummary: result.finalSummary,
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
      }
    },
    [chatId, messages, setMessages]
  );

  return { sendQuery, isStreaming, streamedContent };
};
