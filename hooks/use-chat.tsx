"use client";

import { useState, useCallback } from "react";
import { ChatStorage } from "@/lib/chat-storage";
import { Chat, ChatMessage, ThinkingState } from "@/types";

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
        if (!prev) {
          return {
            status,
            text: text || "",
            isActive: status !== "complete" && status !== "system_error",
            sqlQuery: null,
          };
        }
        return {
          ...prev,
          status,
          text: append && text ? prev.text + text : text || prev.text,
          isActive: status !== "complete" && status !== "system_error",
          sqlQuery: null,
        };
      });
    },
    []
  );

  const explainError = useCallback(
    async (currentChat: Chat): Promise<string> => {
      if (!userId) {
        return "User ID not available";
      }
      setIsLoading(false);

      try {
        const apiMessages = ChatStorage.formatMessagesForAPI(
          currentChat.messages
        );
        const source = new EventSource(
          `http://localhost:8000/api/query/explain-error?user_id=${encodeURIComponent(
            userId
          )}&messages=${encodeURIComponent(JSON.stringify(apiMessages))}`
        );

        let explanation = "";
        let sourceClosedManually = false;

        return new Promise((resolve, reject) => {
          source.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch (data.status) {
              case "initializing":
              case "reasoning":
                updateThinking("reasoning", data.message, true);
                break;
              case "explanation_complete":
                explanation = data.reasoning || "No explanation provided";
                sourceClosedManually = true;
                source.close();
                resolve(explanation);
                break;
              case "error":
                sourceClosedManually = true;
                source.close();
                reject(new Error(data.message || "Failed to explain error"));
                break;
            }
          };

          source.onerror = () => {
            if (!sourceClosedManually) {
              source.close();
              reject(new Error("Connection error occurred"));
            }
          };
        });
      } catch (err) {
        console.error("Error explaining error:", err);
        return "Unable to explain the error due to a connection issue.";
      }
    },
    [userId, updateThinking]
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
          reasoning: data.reasoning,
          partial: data.partial,
          partial_reason: data.partial_reason,
          sql_query: sqlQuery,
          query_result: resultData.data,
          explanation: data.explanation,
          visuals: data.visuals,
          suggestions: data.suggestions || [],
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
          reasoning: data.reasoning,
          partial: data.partial,
          partial_reason: data.partial_reason,
          sql_query: sqlQuery,
          query_result: null,
          explanation: data.explanation,
          visuals: data.visuals,
          suggestions: data.suggestions || [],
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
    [updateThinking, userId]
  );

  const processMessage = useCallback(
    async (
      messageContent: string,
      currentChat: Chat,
      attempt = 1,
      includeData = false
    ) => {
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
          currentChat.messages,
          includeData
        );

        const source = new EventSource(
          `http://localhost:8000/api/query/inference?user_id=${encodeURIComponent(
            userId
          )}&messages=${encodeURIComponent(JSON.stringify(apiMessages))}`
        );

        let sourceClosedManually = false;

        source.onmessage = async (event) => {
          const data = JSON.parse(event.data);
          switch (data.status) {
            case "initializing":
              updateThinking("initializing", data.message);
              break;
            case "reasoning":
              updateThinking("reasoning", data.message, true);
              break;
            case "generatingQuery":
              updateThinking(
                "generatingQuery",
                data.message,
                true,
                data.message
              );
              break;
            case "explaining":
              updateThinking("explaining", data.message, true);
              break;
            case "suggesting":
              updateThinking("suggesting", data.message, true);
              break;
            case "partial":
              updateThinking("partial", data.message, true);
              break;
            // case "partial_reason":
            //   updateThinking("partial_reason", data.message, true);
            //   break;
            case "inference_complete":
              if (data.sql_query) {
                const queryResult = await executeQuery(
                  data,
                  currentChat,
                  attempt
                );

                if (!queryResult.success && attempt < 3) {
                  // Create system message with the error (not shown)
                  const systemMessage: ChatMessage = {
                    id: Date.now().toString(),
                    role: "system",
                    timestamp: new Date(),
                    error:
                      queryResult.error +
                        " This ERROR is from the db server understand explain in depth and then respond with fixed query" ||
                      "",
                    show: false,
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
                  await processMessage(
                    messageContent,
                    updatedChat,
                    attempt + 1,
                    includeData
                  );
                  return;
                } else if (!queryResult.success && attempt === 3) {
                  // On third attempt failure, explain the error
                  updateThinking("reasoning", "Analyzing error...", true);
                  setCurrentThinking(null);
                  setError(null);
                  const errorMsg: ChatMessage = {
                    id: Date.now().toString(),
                    role: "system",
                    timestamp: new Date(),
                    error:
                      queryResult.error +
                      " read last 3 conversations understand what is the possible error explain it in simple terms that a non technical person can understand",
                    show: true,
                  };
                  const chatWithError: Chat = {
                    ...currentChat,
                    messages: [...currentChat.messages, errorMsg],
                  };
                  const errorExplanation = await explainError(chatWithError);

                  const systemMessage: ChatMessage = {
                    id: Date.now().toString(),
                    role: "system",
                    timestamp: new Date(),
                    error: errorExplanation,
                    show: true,
                  };

                  const assistantMessage: ChatMessage = {
                    id: Date.now().toString(),
                    timestamp: new Date(),
                    role: "assistant",
                    error: data.error,
                    reasoning: data.reasoning, // Changed from thought_process
                    partial: data.partial,
                    partial_reason: data.partial_reason,
                    sql_query: data.sql_query,
                    query_result: [],
                    visuals: data.visuals,
                    explanation: data.explanation, // Added
                    suggestions: data.suggestions || [],
                  };

                  const updatedChat = {
                    ...queryResult.updatedChat,
                    messages: [
                      ...queryResult.updatedChat.messages,
                      assistantMessage,
                      systemMessage,
                    ],
                  };
                  setChat(updatedChat);
                  ChatStorage.saveChat(updatedChat);
                }

                setError(null);
                setIsLoading(false);
              } else {
                // Create assistant message with successful result
                const assistantMessage: ChatMessage = {
                  id: Date.now().toString(),
                  timestamp: new Date(),
                  role: "assistant",
                  error: data.error,
                  reasoning: data.reasoning,
                  partial: data.partial,
                  partial_reason: data.partial_reason,
                  sql_query: null,
                  query_result: [],
                  explanation: data.explanation,
                  visuals: data.visuals,
                  suggestions: data.suggestions || [],
                };

                const updatedChat = {
                  ...currentChat,
                  messages: [...currentChat.messages, assistantMessage],
                };
                setChat(updatedChat);
                ChatStorage.saveChat(updatedChat);
              }
              sourceClosedManually = true;
              source.close();
              break;
            case "system_error":
              updateThinking("system_error", data.message, true);
              setError(data.message);
              sourceClosedManually = true;
              source.close();
              setIsLoading(false);
              break;
          }
        };

        source.onerror = () => {
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
    [isLoading, userId, updateThinking, executeQuery, explainError]
  );

  const sendMessage = useCallback(
    async (content: string, includeData = false) => {
      if (!chat) return;
      setError(null);
      setCurrentThinking(null);

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        question: content,
        timestamp: new Date(),
      };

      const updatedChat = {
        ...chat,
        messages: [...chat.messages, userMessage],
      };

      setChat(updatedChat);
      ChatStorage.saveChat(updatedChat);

      await processMessage(content, updatedChat, 1, includeData);
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
