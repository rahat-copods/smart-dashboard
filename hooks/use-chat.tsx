"use client"

import { useState, useCallback } from "react"
import { ChatStorage, type Chat, type ChatMessage } from "@/lib/chat-storage"

interface ThinkingState {
  status: "initializing" | "thinking" | "generating" | "executing" | "complete"
  text: string
  isActive: boolean
  sqlQuery?: string
}

export function useChat(chatId: string, userId: string) {
  const [chat, setChat] = useState<Chat | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentThinking, setCurrentThinking] = useState<ThinkingState | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadChat = useCallback(() => {
    try {
      const loadedChat = ChatStorage.getChat(chatId)
      setChat(loadedChat)
      setError(null)
    } catch (err) {
      setError("Failed to load chat")
      console.error("Error loading chat:", err)
    }
  }, [chatId])

  const updateThinking = useCallback(
    (status: ThinkingState["status"], text?: string, append = false, sqlQuery?: string) => {
      setCurrentThinking((prev) => {
        if (!prev) return null
        return {
          ...prev,
          status,
          text: append && text ? prev.text + text : text || prev.text,
          isActive: status !== "complete",
          sqlQuery: sqlQuery || prev.sqlQuery,
        }
      })
    },
    [],
  )

  const executeQuery = useCallback(
    async (sqlQuery: string, attempt = 1): Promise<boolean> => {
      try {
        updateThinking("executing", "Executing query...", true, sqlQuery)

        const response = await fetch("http://localhost:8000/api/query/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, query: sqlQuery }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Execution failed")
        }

        const resultData = await response.json()
        updateThinking("complete", "Query executed successfully.", true)

        // Create assistant message with all data
        const assistantMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: "Query executed successfully.",
          timestamp: new Date(),
          sqlQuery,
          queryResult: resultData.data,
          thinkingProcess: currentThinking?.text || "",
        }

        if (chat) {
          const updatedChat = {
            ...chat,
            messages: [...chat.messages, assistantMessage],
          }
          setChat(updatedChat)
          ChatStorage.saveChat(updatedChat)
        }

        setCurrentThinking(null)
        setIsLoading(false)
        return true
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Execution failed"
        updateThinking("executing", `Execution failed: ${errorMsg}`, true)

        if (attempt < 3) {
          // Retry logic would go here
          return false
        } else {
          const errorMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "assistant",
            content: `Query execution failed after 3 attempts: ${errorMsg}`,
            timestamp: new Date(),
            thinkingProcess: currentThinking?.text || "",
          }

          if (chat) {
            const updatedChat = {
              ...chat,
              messages: [...chat.messages, errorMessage],
            }
            setChat(updatedChat)
            ChatStorage.saveChat(updatedChat)
          }

          setCurrentThinking(null)
          setIsLoading(false)
          return false
        }
      }
    },
    [chat, currentThinking, updateThinking, userId],
  )

  const processMessage = useCallback(
    async (messageContent: string) => {
      if (isLoading || !chat) return

      setIsLoading(true)
      setError(null)

      // Create thinking state
      setCurrentThinking({
        status: "initializing",
        text: "",
        isActive: true,
      })

      try {
        const apiMessages = ChatStorage.formatMessagesForAPI(chat.messages)

        const source = new EventSource(
          `http://localhost:8000/api/query/inference?user_id=${encodeURIComponent(userId)}&question=${encodeURIComponent(messageContent)}&messages=${encodeURIComponent(JSON.stringify(apiMessages))}`,
        )

        source.onmessage = async (event) => {
          const data = JSON.parse(event.data)

          switch (data.status) {
            case "initialize":
              updateThinking("initializing", "Initializing AI process...")
              break
            case "thinking":
              if (data.message) {
                updateThinking("thinking", data.message, true)
              }
              break
            case "generatingQuery":
              updateThinking("generating", "Generating SQL query...", true)
              break
            case "inference_complete":
              if (data.query) {
                updateThinking("generating", "Generated SQL query.", true, data.query)
                await executeQuery(data.query, 1)
              }
              source.close()
              break
            case "error":
              updateThinking("complete", `Error: ${data.error}`, true)
              setError(data.error)
              source.close()
              setIsLoading(false)
              break
          }
        }

        source.onerror = () => {
          source.close()
          setError("Connection error occurred")
          setCurrentThinking(null)
          setIsLoading(false)
        }
      } catch (err) {
        setError("Failed to process message")
        setCurrentThinking(null)
        setIsLoading(false)
      }
    },
    [chat, isLoading, userId, updateThinking, executeQuery],
  )

  const sendMessage = useCallback(
    async (content: string) => {
      if (!chat) return

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
      }

      const updatedChat = {
        ...chat,
        messages: [...chat.messages, userMessage],
      }

      setChat(updatedChat)
      ChatStorage.saveChat(updatedChat)

      await processMessage(content)
    },
    [chat, processMessage],
  )

  return {
    chat,
    isLoading,
    currentThinking,
    error,
    loadChat,
    sendMessage,
  }
}
