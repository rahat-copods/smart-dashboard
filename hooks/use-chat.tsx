"use client";

import { useState, useCallback } from "react";
import { ChatStorage } from "@/lib/chat-storage";
import { Chat, ChatMessage } from "@/lib/types";

interface ThinkingState {
  status: "initializing" | "thinking" | "generating" | "executing" | "complete";
  text: string;
  isActive: boolean;
  sqlQuery?: string;
}

export function useChat(chatId: string) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentThinking, setCurrentThinking] = useState<ThinkingState | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const loadChat = useCallback(() => {
    try {
      const loadedChat = ChatStorage.getChat(chatId);
      setChat(loadedChat);
      setUserId(loadedChat?.user || null);
      setError(null);
    } catch (err) {
      setError("Failed to load chat");
      console.error("Error loading chat:", err);
    }
  }, [chatId]);

  const updateThinking = useCallback(
    (
      status: ThinkingState["status"],
      text?: string,
      append = false,
      sqlQuery?: string
    ) => {
      setCurrentThinking((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status,
          text: append && text ? prev.text + text : text || prev.text,
          isActive: status !== "complete",
          sqlQuery: sqlQuery || prev.sqlQuery,
        };
      });
    },
    []
  );

  const executeQuery = useCallback(
    async (
      data: any,
      currentChat: Chat,
      attempt: number
    ): Promise<{ success: boolean; error?: string; updatedChat: Chat }> => {
      const sqlQuery = data.sql_query;
      try {
        updateThinking(
          "executing",
          `Executing query (attempt ${attempt}/3)...`,
          true,
          sqlQuery
        );

        const response = await fetch(
          "http://localhost:8000/api/query/execute",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, query: sqlQuery }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Execution failed");
        }

        const resultData = await response.json();
        updateThinking("complete", "Query executed successfully.", true);

        // Create assistant message with successful result
        const assistantMessage: ChatMessage = {
          id: Date.now().toString(),
          timestamp: new Date(),
          role: "assistant",
          error: data.error,
          thought_process: data.thought_process, // Use captured text
          partial: data.partial,
          partial_reason: data.partial_reason,
          sql_query: sqlQuery,
          query_result: resultData.data,
          suggestions: data.suggestions,
        };

        const updatedChat = {
          ...currentChat,
          messages: [...currentChat.messages, assistantMessage],
        };
        setChat(updatedChat);
        ChatStorage.saveChat(updatedChat);

        return { success: true, updatedChat };
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Execution failed";
        updateThinking(
          "executing",
          `Execution failed (attempt ${attempt}/3): ${errorMsg}`,
          true
        );
        const assistantMessage: ChatMessage = {
          id: Date.now().toString(),
          timestamp: new Date(),
          role: "assistant",
          error: data.error,
          thought_process: data.thought_process, // Use captured text
          partial: data.partial,
          partial_reason: data.partial_reason,
          sql_query: sqlQuery,
          query_result: null,
          suggestions: data.suggestions,
        };

        const updatedChat = {
          ...currentChat,
          messages: [...currentChat.messages, assistantMessage],
        };
        setChat(updatedChat);
        ChatStorage.saveChat(updatedChat);

        return { success: false, error: errorMsg, updatedChat };
      }
    },
    [chat, currentThinking, updateThinking, userId]
  );

  const processMessage = useCallback(
    async (messageContent: string, currentChat: Chat, attempt = 1) => {
      if (isLoading || !userId) return;

      setIsLoading(true);
      setError(null);

      // Create thinking state
      setCurrentThinking({
        status: "initializing",
        text: "",
        isActive: true,
      });

      try {
        const apiMessages = ChatStorage.formatMessagesForAPI(
          currentChat.messages
        );

        const source = new EventSource(
          `http://localhost:8000/api/query/inference?user_id=${encodeURIComponent(userId)}&messages=${encodeURIComponent(JSON.stringify(apiMessages))}`
        );

        let sourceClosedManually = false;

        source.onmessage = async (event) => {
          const data = JSON.parse(event.data);

          switch (data.status) {
            case "initialize":
              updateThinking("initializing", "Initializing AI process...");
              break;
            case "thinking":
              if (data.message) {
                updateThinking("thinking", data.message, true);
              }
              break;
            case "generatingQuery":
              updateThinking("generating", "Generating SQL query...", true);
              break;
            case "inference_complete":
              if (data.sql_query) {
                updateThinking(
                  "generating",
                  "Generated SQL query.",
                  true,
                  data.sql_query
                );

                const queryResult = await executeQuery(
                  data,
                  currentChat,
                  attempt
                );

                if (!queryResult.success && attempt < 3) {
                  // Create system message with the error
                  const systemMessage: ChatMessage = {
                    id: Date.now().toString(),
                    role: "system",
                    timestamp: new Date(),
                    error:
                      queryResult.error +
                        "This ERROR is from the db server understand explain in depth and then respond with fixed query" ||
                      "",
                  };

                  const updatedChat = {
                    ...queryResult.updatedChat,
                    messages: [
                      ...queryResult.updatedChat.messages,
                      systemMessage,
                    ],
                  };
                  setChat(updatedChat);
                  ChatStorage.saveChat(updatedChat);

                  // Retry with updated message history
                  sourceClosedManually = true;
                  source.close();
                  // Don't clear currentThinking on retry, let it continue
                  await processMessage(
                    messageContent,
                    updatedChat,
                    attempt + 1
                  );
                  return;
                } else if (!queryResult.success && attempt === 3) {
                  // Capture the thinking process text BEFORE clearing currentThinking
                  const thoughtProcessText = currentThinking?.text || "";

                  const assistantMessage: ChatMessage = {
                    id: Date.now().toString(),
                    timestamp: new Date(),
                    role: "assistant",
                    error: data.error,
                    partial: data.partial,
                    partial_reason: data.partial_reason,
                    thought_process: thoughtProcessText, // Use captured text
                    sql_query: data.sql_query,
                    query_result: [],
                    suggestions: data.suggestions,
                  };

                  const updatedChat = {
                    ...queryResult.updatedChat,
                    messages: [
                      ...queryResult.updatedChat.messages,
                      assistantMessage,
                    ],
                  };
                  setChat(updatedChat);
                  ChatStorage.saveChat(updatedChat);
                }

                // Clear any previous errors on successful completion
                setError(null);
                setIsLoading(false);
              }
              sourceClosedManually = true;
              source.close();
              break;
            case "error":
              updateThinking("complete", `Error: ${data.error}`, true);
              setError(data.error);
              sourceClosedManually = true;
              source.close();
              setIsLoading(false);
              break;
          }
        };

        source.onerror = () => {
          // Only show connection error if the source wasn't closed manually
          if (!sourceClosedManually) {
            setError("Connection error occurred");
          }
          source.close();
          setIsLoading(false);
        };
      } catch (err) {
        setError("Failed to process message");
        setCurrentThinking(null);
        setIsLoading(false);
      }
    },
    [isLoading, userId, updateThinking, executeQuery]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!chat) return;
      // Clear any previous errors and thinking state when sending a new message
      setError(null);
      setCurrentThinking(null);

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        question: content, // User's question goes in question property
        timestamp: new Date(),
      };

      const updatedChat = {
        ...chat,
        messages: [...chat.messages, userMessage],
      };

      setChat(updatedChat);
      ChatStorage.saveChat(updatedChat);

      await processMessage(content, updatedChat, 1); // Start with attempt 1
    },
    [chat, processMessage]
  );

  return {
    chat,
    isLoading,
    currentThinking,
    error,
    loadChat,
    sendMessage,
    processMessage,
  };
}
