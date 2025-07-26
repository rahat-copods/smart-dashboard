"use client";

import { useState, useCallback } from "react";
import { ChatStorage, type Chat, type ChatMessage } from "@/lib/chat-storage";

interface ThinkingState {
  status: "initializing" | "thinking" | "generating" | "executing" | "complete";
  text: string;
  isActive: boolean;
  sqlQuery?: string;
}

export function useChat(chatId: string, userId: string) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentThinking, setCurrentThinking] = useState<ThinkingState | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const loadChat = useCallback(() => {
    try {
      const loadedChat = ChatStorage.getChat(chatId);
      setChat(loadedChat);
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
    async (sqlQuery: string, attempt: number): Promise<{ success: boolean; error?: string }> => {
      try {
        updateThinking("executing", `Executing query (attempt ${attempt}/3)...`, true, sqlQuery);

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
          question: "", // Empty for assistant messages
          thought_process: currentThinking?.text || "",
          sql_query: sqlQuery,
          query_result: resultData.data,
        };

        if (chat) {
          const updatedChat = {
            ...chat,
            messages: [...chat.messages, assistantMessage],
          };
          setChat(updatedChat);
          ChatStorage.saveChat(updatedChat);
        }

        return { success: true };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Execution failed";
        updateThinking("executing", `Execution failed (attempt ${attempt}/3): ${errorMsg}`, true);
        return { success: false, error: errorMsg };
      }
    },
    [chat, currentThinking, updateThinking, userId]
  );

  const getAIErrorExplanation = useCallback(
    async (finalError: string): Promise<string> => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/query/explain-error?user_id=${encodeURIComponent(userId)}&error=${encodeURIComponent(finalError)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          return data.explanation || finalError;
        }
      } catch (err) {
        console.error("Failed to get AI error explanation:", err);
      }
      
      // Fallback to original error if explanation fails
      return finalError;
    },
    [userId]
  );

  const processMessage = useCallback(
    async (messageContent: string, attempt = 1) => {
      if (isLoading || !chat) return;

      setIsLoading(true);
      setError(null);

      // Create thinking state
      setCurrentThinking({
        status: "initializing",
        text: "",
        isActive: true,
      });

      try {
        const apiMessages = ChatStorage.formatMessagesForAPI(chat.messages);

        const source = new EventSource(
          `http://localhost:8000/api/query/inference?user_id=${encodeURIComponent(userId)}&messages=${encodeURIComponent(JSON.stringify(apiMessages))}`
        );

        source.onmessage = async (event) => {
          const data = JSON.parse(event.data);
          console.log(data);
          
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
              if (data.query) {
                updateThinking(
                  "generating",
                  "Generated SQL query.",
                  true,
                  data.query
                );
                
                const queryResult = await executeQuery(data.query, attempt);
                
                if (!queryResult.success && attempt < 3) {
                  // Create developer message with the error
                  const developerMessage: ChatMessage = {
                    id: Date.now().toString(),
                    role: "developer",
                    timestamp: new Date(),
                    question: "", // Empty for developer messages
                    error: queryResult.error,
                  };

                  const updatedChat = {
                    ...chat,
                    messages: [...chat.messages, developerMessage],
                  };
                  setChat(updatedChat);
                  ChatStorage.saveChat(updatedChat);

                  // Retry with updated message history
                  source.close();
                  setCurrentThinking(null);
                  await processMessage(messageContent, attempt + 1);
                  return;
                } else if (!queryResult.success && attempt === 3) {
                  // Final failure - get AI explanation and create assistant message with error
                  const errorExplanation = await getAIErrorExplanation(queryResult.error || "Unknown error");
                  
                  const assistantMessage: ChatMessage = {
                    id: Date.now().toString(),
                    timestamp: new Date(),
                    role: "assistant",
                    question: "", // Empty for assistant messages
                    thought_process: currentThinking?.text || "",
                    sql_query: data.query,
                    error: errorExplanation,
                  };

                  const updatedChat = {
                    ...chat,
                    messages: [...chat.messages, assistantMessage],
                  };
                  setChat(updatedChat);
                  ChatStorage.saveChat(updatedChat);
                }
                
                setCurrentThinking(null);
                setIsLoading(false);
              }
              source.close();
              break;
            case "error":
              updateThinking("complete", `Error: ${data.error}`, true);
              setError(data.error);
              source.close();
              setIsLoading(false);
              break;
          }
        };

        source.onerror = () => {
          source.close();
          setError("Connection error occurred");
          setCurrentThinking(null);
          setIsLoading(false);
        };
      } catch (err) {
        setError("Failed to process message");
        setCurrentThinking(null);
        setIsLoading(false);
      }
    },
    [chat, isLoading, userId, updateThinking, executeQuery, getAIErrorExplanation]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!chat) return;

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

      await processMessage(content, 1); // Start with attempt 1
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
    processMessage, // Expose processMessage for auto-start
  };
}