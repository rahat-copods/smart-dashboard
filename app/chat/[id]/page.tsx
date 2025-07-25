"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Send, User, Bot, Code, Database, Copy, Brain } from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ChatStorage, type Chat, type ChatMessage } from "@/lib/chat-storage"

interface ThinkingState {
  status: "initializing" | "thinking" | "generating" | "executing" | "complete"
  text: string
  isActive: boolean
  sqlQuery?: string
}

export default function ChatPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const chatId = params.id as string
  const userId = searchParams.get("userId") || ""

  const [chat, setChat] = useState<Chat | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentThinking, setCurrentThinking] = useState<ThinkingState | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadChat()
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
  }, [chat?.messages, currentThinking])

  // Auto-start processing if this is a new chat with only user message
  useEffect(() => {
    if (chat && chat.messages.length === 1 && chat.messages[0].role === "user" && !isLoading) {
      // Start processing the first message automatically
      processMessage(chat.messages[0].content)
    }
  }, [chat])

  const loadChat = () => {
    const loadedChat = ChatStorage.getChat(chatId)
    if (!loadedChat) {
      router.push("/")
      return
    }
    setChat(loadedChat)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const createThinkingState = useCallback((): ThinkingState => {
    return {
      status: "initializing",
      text: "",
      isActive: true,
    }
  }, [])

  const updateCurrentThinking = useCallback(
    (status: ThinkingState["status"], text?: string, append = false, sqlQuery?: string) => {
      setCurrentThinking((prev) => {
        if (!prev) return null
        return {
          ...prev,
          status,
          text: append && text ? prev.text + (prev.text ? " " : "") + text : text || prev.text,
          isActive: status !== "complete",
          sqlQuery: sqlQuery || prev.sqlQuery,
        }
      })
    },
    [],
  )

  const executeQuery = async (sqlQuery: string, attempt = 1): Promise<boolean> => {
    try {
      updateCurrentThinking("executing", "Executing query...", true, sqlQuery)

      const executeResponse = await fetch("http://localhost:8000/api/query/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, query: sqlQuery }),
      })

      if (!executeResponse.ok) {
        const errorData = await executeResponse.json().catch(() => ({}))
        throw new Error(errorData.error || "Execution failed")
      }

      const resultData = await executeResponse.json()

      // Update thinking state to complete
      updateCurrentThinking("complete", "Query executed successfully.", true)

      // Create assistant message with ALL data including thinking process
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Query executed successfully.",
        timestamp: new Date(),
        sqlQuery: sqlQuery,
        queryResult: resultData.data,
        thinkingProcess: currentThinking?.text || "", // Store the entire thinking process
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
      updateCurrentThinking("executing", `Execution failed: ${errorMsg}`, true)

      if (attempt < 3) {
        await retryWithAI(sqlQuery, errorMsg, attempt)
        return false
      } else {
        // Create error message with thinking process
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
  }

  const retryWithAI = async (failedQuery: string, errorMsg: string, attempt: number) => {
    updateCurrentThinking("thinking", "Requesting correction...", true)

    const correctionPrompt = `The query "${failedQuery}" failed with error: ${errorMsg}. Please review and provide a corrected query.`

    // Format messages for API - only role and content, no thinking process or data
    const apiMessages = ChatStorage.formatMessagesForAPI(chat?.messages || [])

    const retrySource = new EventSource(
      `http://localhost:8000/api/query/inference?user_id=${userId}&question=${encodeURIComponent(correctionPrompt)}&messages=${encodeURIComponent(JSON.stringify(apiMessages))}`,
    )

    retrySource.onmessage = async (event) => {
      const data = JSON.parse(event.data)

      if (data.status === "thinking") {
        if (data.message) {
          updateCurrentThinking("thinking", data.message, true)
        }
      } else if (data.status === "generatingQuery") {
        updateCurrentThinking("generating", "Generating corrected query...", true)
      } else if (data.status === "inference_complete") {
        if (data.query) {
          updateCurrentThinking("generating", "Generated corrected SQL.", true, data.query)
          await executeQuery(data.query, attempt + 1)
        }
        retrySource.close()
      }
    }

    retrySource.onerror = () => {
      retrySource.close()
      setIsLoading(false)
      setCurrentThinking(null)
    }
  }

  const processMessage = async (messageContent: string) => {
    if (isLoading) return

    setIsLoading(true)

    // Create new thinking state
    const thinkingState = createThinkingState()
    setCurrentThinking(thinkingState)

    // Format messages for API - only role and content, no thinking process or data
    const apiMessages = ChatStorage.formatMessagesForAPI(chat?.messages || [])

    // Start AI inference
    const source = new EventSource(
      `http://localhost:8000/api/query/inference?user_id=${userId}&question=${encodeURIComponent(messageContent)}&messages=${encodeURIComponent(JSON.stringify(apiMessages))}`,
    )

    source.onmessage = async (event) => {
      const data = JSON.parse(event.data)

      if (data.status === "initialize") {
        updateCurrentThinking("initializing", "Initializing AI process...")
      } else if (data.status === "thinking") {
        if (data.message) {
          updateCurrentThinking("thinking", data.message, true)
        }
      } else if (data.status === "generatingQuery") {
        updateCurrentThinking("generating", "Generating SQL query...", true)
      } else if (data.status === "inference_complete") {
        if (data.query) {
          updateCurrentThinking("generating", "Generated SQL query.", true, data.query)
          await executeQuery(data.query, 1)
        }
        source.close()
      } else if (data.status === "error") {
        updateCurrentThinking("complete", `Error: ${data.error}`, true)

        // Create error message with thinking process
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: `Error: ${data.error}`,
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
        source.close()
        setIsLoading(false)
      }
    }

    source.onerror = () => {
      source.close()
      setIsLoading(false)
      setCurrentThinking(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isLoading || !chat) return

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: newMessage.trim(),
      timestamp: new Date(),
    }

    const updatedChat = {
      ...chat,
      messages: [...chat.messages, userMessage],
    }
    setChat(updatedChat)
    ChatStorage.saveChat(updatedChat)

    const currentQuery = newMessage.trim()
    setNewMessage("")

    // Process the message
    await processMessage(currentQuery)
  }

  const renderTable = (data: Record<string, any>[]) => {
    if (!data || data.length === 0) {
      return <div className="text-center py-4 text-gray-500">No results found</div>
    }

    const headers = Object.keys(data[0])
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header} className="font-semibold">
                  {header.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
                {headers.map((header) => (
                  <TableCell key={header} className="font-mono text-sm">
                    {row[header]?.toString() || "—"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Shift+Enter: Allow new line (default behavior)
        return
      } else {
        // Enter: Submit form if there's text
        if (newMessage.trim()) {
          e.preventDefault()
          handleSubmit(e as any)
        }
      }
    }
  }

  const getThinkingStatusIcon = (status: ThinkingState["status"]) => {
    switch (status) {
      case "initializing":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case "thinking":
        return <Brain className="w-4 h-4 text-purple-500" />
      case "generating":
        return <Code className="w-4 h-4 text-green-500" />
      case "executing":
        return <Database className="w-4 h-4 text-orange-500" />
      case "complete":
        return <Brain className="w-4 h-4 text-gray-400" />
      default:
        return <Brain className="w-4 h-4 text-gray-400" />
    }
  }

  if (!chat) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar currentChatId={chatId} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span className="font-semibold">{chat.title}</span>
          </div>
        </header>

        <div className="flex-1 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chat.messages.map((message) => (
              <div key={message.id}>
                {/* User or Assistant Message */}
                <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4`}>
                  <div
                    className={`flex space-x-3 max-w-4xl ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === "user" ? "bg-blue-600" : "bg-gray-600"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>

                    <div className={`flex-1 space-y-2 ${message.role === "user" ? "text-right" : ""}`}>
                      <div
                        className={`inline-block p-3 rounded-lg ${
                          message.role === "user" ? "bg-blue-600 text-white" : "bg-white border border-gray-200"
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thinking Process (only for assistant messages) */}
                {message.role === "assistant" && message.thinkingProcess && (
                  <div className="flex justify-start mb-4">
                    <div className="flex space-x-3 max-w-4xl">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="inline-block p-3 rounded-lg bg-purple-50 border border-purple-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <Brain className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-semibold text-purple-700">AI Thinking Process</span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.thinkingProcess}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SQL Query */}
                {message.sqlQuery && (
                  <div className="flex justify-start mb-4">
                    <div className="flex space-x-3 max-w-4xl">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                        <Code className="w-4 h-4 text-white" />
                      </div>

                      <div className="flex-1">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Code className="w-4 h-4" />
                                <span className="text-sm font-semibold">Generated SQL:</span>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(message.sqlQuery!)}>
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            <pre className="text-sm font-mono bg-gray-100 p-3 rounded overflow-x-auto">
                              {message.sqlQuery}
                            </pre>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}

                {/* Query Results */}
                {message.queryResult && (
                  <div className="flex justify-start mb-4">
                    <div className="flex space-x-3 max-w-4xl">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center">
                        <Database className="w-4 h-4 text-white" />
                      </div>

                      <div className="flex-1">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-2 mb-3">
                              <Database className="w-4 h-4" />
                              <span className="text-sm font-semibold">
                                Query Results ({message.queryResult.length} rows)
                              </span>
                            </div>
                            {renderTable(message.queryResult)}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Current Thinking Message */}
            {currentThinking && (
              <div className="flex justify-start">
                <div className="flex space-x-3 max-w-4xl">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="inline-block p-3 rounded-lg bg-purple-50 border border-purple-200">
                      <div className="flex items-center space-x-2 mb-2">
                        {getThinkingStatusIcon(currentThinking.status)}
                        <span className="text-sm font-semibold text-purple-700">
                          {currentThinking.status === "initializing" && "Initializing..."}
                          {currentThinking.status === "thinking" && "AI Thinking Process"}
                          {currentThinking.status === "generating" && "Generating SQL"}
                          {currentThinking.status === "executing" && "Executing Query"}
                          {currentThinking.status === "complete" && "Process Complete"}
                        </span>
                      </div>

                      {currentThinking.status === "initializing" && !currentThinking.text ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          <span className="text-sm text-blue-700">Initializing...</span>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {currentThinking.text}
                          {currentThinking.isActive && <span className="animate-pulse ml-1">▋</span>}
                        </p>
                      )}
                    </div>

                    {currentThinking.sqlQuery && (
                      <Card className="mt-2">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Code className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold">Current SQL:</span>
                          </div>
                          <pre className="text-sm font-mono bg-gray-100 p-3 rounded overflow-x-auto">
                            {currentThinking.sqlQuery}
                          </pre>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
              <div className="relative">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a follow-up question..."
                  disabled={isLoading}
                  rows={3}
                  className="resize-none pr-12"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !newMessage.trim()}
                  size="icon"
                  className="absolute bottom-3 right-3 h-8 w-8"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
