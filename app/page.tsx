"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Database, AlertCircle, CheckCircle, Send } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useRouter } from "next/navigation"
import { ChatStorage } from "@/lib/chat-storage"

interface QueryResult {
  sql: string
  data: Record<string, any>[]
}

interface StreamData {
  status: string
  message?: string
  query?: string
  error?: string
  partial?: boolean
  messages?: any[]
}

type ExecutionStatus = "idle" | "executing" | "executed" | "failed"

export default function HomePage() {
  const [userId, setUserId] = useState<string>("")
  const [query, setQuery] = useState<string>("")
  const [result, setResult] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [thinkingText, setThinkingText] = useState<string>("")
  const [sqlQuery, setSqlQuery] = useState<string>("")
  const [messages, setMessages] = useState<any[]>([])
  const [source, setSource] = useState<EventSource | null>(null)
  const [currentStatus, setCurrentStatus] = useState<string>("")
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>("idle")
  const [attemptCount, setAttemptCount] = useState<number>(0)
  const [maxAttempts] = useState<number>(3)
  const router = useRouter()

  // Force re-render function
  const [, forceUpdate] = useState({})
  const triggerUpdate = useCallback(() => {
    forceUpdate({})
  }, [])

  const appendThinkingText = useCallback(
    (text: string) => {
      setThinkingText((prev) => {
        const newText = prev + (prev ? " " : "") + text
        triggerUpdate()
        return newText
      })
    },
    [triggerUpdate],
  )

  const executeQuery = async (sqlQuery: string, attempt = 1): Promise<boolean> => {
    try {
      setExecutionStatus("executing")
      appendThinkingText("Executing query...")

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
      setResult({ sql: sqlQuery, data: resultData.data })
      setExecutionStatus("executed")
      appendThinkingText("Query executed successfully.")
      return true
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Execution failed"
      setExecutionStatus("failed")
      appendThinkingText(`Execution failed: ${errorMsg}`)

      if (attempt < maxAttempts) {
        // Retry with AI correction
        await retryWithAI(sqlQuery, errorMsg, attempt)
        return false
      } else {
        setError(`Query execution failed after ${maxAttempts} attempts: ${errorMsg}`)
        setLoading(false)
        return false
      }
    }
  }

  const retryWithAI = async (failedQuery: string, errorMsg: string, attempt: number) => {
    appendThinkingText("Requesting correction...")

    const correctionPrompt = `The query "${failedQuery}" failed with error: ${errorMsg}. Please review and provide a corrected query.`

    // Create new EventSource for retry
    const retrySource = new EventSource(
      `http://localhost:8000/api/query/inference?user_id=${userId}&question=${encodeURIComponent(correctionPrompt)}&messages=${encodeURIComponent(JSON.stringify(messages))}`,
    )

    retrySource.onmessage = async (event) => {
      const data: StreamData = JSON.parse(event.data)

      if (data.status === "thinking") {
        if (data.message) {
          appendThinkingText(data.message)
        }
      } else if (data.status === "generatingQuery") {
        setCurrentStatus("generatingQuery")
        appendThinkingText("Generating corrected query...")
      } else if (data.status === "inference_complete") {
        if (data.error) {
          setError(data.error)
          retrySource.close()
          setLoading(false)
          return
        }

        if (data.query) {
          setSqlQuery(data.query)
          setMessages(data.messages || [])
          setCurrentStatus("sqlGenerated")
          appendThinkingText(`Generated corrected SQL.`)

          await executeQuery(data.query, attempt + 1)
        }

        retrySource.close()
      } else if (data.status === "error") {
        setError(data.error || "AI correction failed")
        appendThinkingText(`AI correction error: ${data.error}`)
        retrySource.close()
        setLoading(false)
      }
    }

    retrySource.onerror = () => {
      setError("Stream error during retry")
      retrySource.close()
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !query.trim()) {
      setError("Please select a user ID and enter a query")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Create new chat
      const newChat = ChatStorage.createNewChat(query.trim())

      // Add user message to chat
      const userMessage = {
        id: Date.now().toString(),
        role: "user" as const,
        content: query.trim(),
        timestamp: new Date(),
      }

      newChat.messages.push(userMessage)

      // Save chat to storage
      ChatStorage.saveChat(newChat)

      // Redirect to chat page with userId as query parameter
      router.push(`/chat/${newChat.id}?userId=${encodeURIComponent(userId)}`)
    } catch (err) {
      setError("Failed to create chat. Please try again.")
      setLoading(false)
    }
  }

  const handleExampleClick = (example: string) => {
    setQuery(example)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  useEffect(() => {
    return () => {
      if (source) {
        source.close()
        setSource(null)
      }
    }
  }, [source])

  const renderTable = (data: Record<string, any>[]) => {
    if (!data || data.length === 0) {
      return <div className="text-center py-8 text-muted-foreground">No results found</div>
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

  const StreamingText = ({ text }: { text: string }) => {
    return (
      <div className="text-sm text-muted-foreground leading-relaxed">
        <p className="whitespace-pre-wrap">{text}</p>
        {loading && (
          <span className="inline-flex items-center ml-1">
            <span className="animate-pulse">▋</span>
          </span>
        )}
      </div>
    )
  }

  const getStatusIcon = () => {
    switch (executionStatus) {
      case "executing":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case "executed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusMessage = () => {
    switch (currentStatus) {
      case "initialize":
        return "Initializing..."
      case "thinking":
        return "AI is thinking..."
      case "generatingQuery":
        return "Generating query..."
      case "sqlGenerated":
        return "SQL generated"
      default:
        return ""
    }
  }

  const getExecutionMessage = () => {
    switch (executionStatus) {
      case "executing":
        return "Executing query..."
      case "executed":
        return "Query executed successfully"
      case "failed":
        return "Retrying..."
      default:
        return ""
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span className="font-semibold">SQL Chat</span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <Database className="w-12 h-12 text-blue-600" />
                <h1 className="text-4xl font-bold text-gray-900">SQL Chat</h1>
              </div>
              <p className="text-xl text-gray-600">Ask questions about your data in natural language</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userId" className="text-base font-medium">
                    Select User ID
                  </Label>
                  <Select value={userId} onValueChange={setUserId}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Choose a user ID to query data for" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user01">user01</SelectItem>
                      <SelectItem value="user02">user02</SelectItem>
                      <SelectItem value="user03">user03</SelectItem>
                      <SelectItem value="user04">user04</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="query" className="text-base font-medium">
                    Ask a question
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="query"
                      placeholder="e.g., Show me the top 10 customers by revenue this month"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={loading}
                      rows={4}
                      className="resize-none text-base pr-12 min-h-[120px]"
                    />
                    <Button
                      type="submit"
                      disabled={loading || !userId || !query.trim()}
                      size="icon"
                      className="absolute bottom-3 right-3 h-8 w-8"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}

              <div className="text-center">
              </div>
            </form>

            {/* Examples */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 text-center">Try asking:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Show me all customers from California",
                  "What's the total revenue for last month?",
                  "List the top 5 products by sales",
                  "Find customers who haven't ordered recently",
                ].map((example, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleExampleClick(example)}
                    disabled={loading}
                    className="p-3 text-left text-sm bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
