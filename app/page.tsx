"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Database, Code, AlertCircle, CheckCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

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

export default function Component() {
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

  // Force re-render function
  const [, forceUpdate] = useState({})
  const triggerUpdate = useCallback(() => {
    forceUpdate({})
  }, [])

  const appendThinkingText = useCallback(
    (text: string) => {
      setThinkingText((prev) => {
        const newText = prev + text
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
    setResult(null)
    setThinkingText("")
    setSqlQuery("")
    setCurrentStatus("")
    setExecutionStatus("idle")
    setAttemptCount(1)

    const newSource = new EventSource(
      `http://localhost:8000/api/query/inference?user_id=${userId}&question=${encodeURIComponent(query)}&messages=${encodeURIComponent(JSON.stringify(messages))}`,
    )

    setSource(newSource)

    newSource.onmessage = async (event) => {
      const data: StreamData = JSON.parse(event.data)

      if (data.status === "initialize") {
        setCurrentStatus("initialize")
        appendThinkingText("Initializing...")
      } else if (data.status === "thinking") {
        setCurrentStatus("thinking")
        if (data.message) {
          appendThinkingText(data.message)
        }
      } else if (data.status === "generatingQuery") {
        setCurrentStatus("generatingQuery")
        appendThinkingText("Generating SQL query...")
      } else if (data.status === "inference_complete") {
        if (data.error) {
          setError(data.error)
          newSource.close()
          setSource(null)
          setLoading(false)
          return
        }

        if (data.query) {
          setSqlQuery(data.query)
          setMessages(data.messages || [])
          setCurrentStatus("sqlGenerated")
          appendThinkingText("Generated SQL query.")

          const success = await executeQuery(data.query, 1)
          if (success || attemptCount >= maxAttempts) {
            setLoading(false)
          }
        }

        newSource.close()
        setSource(null)
      } else if (data.status === "error") {
        setError(data.error || "Inference failed")
        appendThinkingText(`Error: ${data.error}`)
        newSource.close()
        setSource(null)
        setLoading(false)
      }
    }

    newSource.onerror = () => {
      setError("Stream error or closed")
      appendThinkingText("Stream error or closed")
      newSource.close()
      setSource(null)
      setLoading(false)
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 py-8">
          <h1 className="text-3xl font-bold text-foreground">Natural Language SQL Query</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ask questions in plain English and get SQL queries with results from your database
          </p>
        </div>

        {/* Cards */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Query Builder Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Query Builder
                </CardTitle>
                <CardDescription>Select a user and ask a question about the data</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2 w-full">
                      <Label htmlFor="userId">User ID</Label>
                      <Select value={userId} onValueChange={setUserId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a user ID" />
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
                      <Label htmlFor="query">Ask a question</Label>
                      <Textarea
                        id="query"
                        placeholder="e.g., Show me the top 10 customers by revenue"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={loading}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>
                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                      {error}
                    </div>
                  )}
                  <Button type="submit" disabled={loading || !userId || !query.trim()} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Run Query"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* SQL Display Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Generated SQL
                  {getStatusIcon()}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {loading && (
                    <span className="text-sm font-medium">
                      {getStatusMessage()} {getExecutionMessage() && `• ${getExecutionMessage()}`}
                    </span>
                  )}
                  {!loading && "The SQL query and AI reasoning process"}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-full">
                <div className="bg-muted p-4 rounded-lg overflow-x-auto min-h-[150px] flex flex-col">
                  {thinkingText || sqlQuery ? (
                    <div className="flex-1 overflow-y-auto space-y-4">
                      {thinkingText && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              AI Process
                            </span>
                          </div>
                          <StreamingText text={thinkingText} />
                        </div>
                      )}
                      {sqlQuery && (
                        <div className="p-3 bg-background rounded border">
                          <div className="flex items-center gap-2 mb-2">
                            <Code className="w-4 h-4" />
                            <span className="text-sm font-semibold">Generated SQL:</span>
                          </div>
                          <pre className="text-sm font-mono text-foreground whitespace-pre-wrap bg-muted p-2 rounded">
                            {sqlQuery}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center w-full text-muted-foreground flex-1 flex flex-col justify-center">
                      <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">AI reasoning and SQL query will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Result Table Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Query Results
                {executionStatus === "executing" && <Loader2 className="w-4 h-4 animate-spin" />}
                {executionStatus === "executed" && <CheckCircle className="w-4 h-4 text-green-500" />}
                {executionStatus === "failed" && <AlertCircle className="w-4 h-4 text-orange-500" />}
              </CardTitle>
              <CardDescription>
                {loading && executionStatus === "executing"
                  ? "Executing query..."
                  : loading
                    ? "Processing query..."
                    : result && result.data?.length > 0
                      ? `Found ${result.data.length} result${result.data.length === 1 ? "" : "s"}`
                      : "Results will appear here after query execution"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result?.data ? (
                renderTable(result.data)
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No data available</h3>
                  <p className="text-sm">Please run a query to see results here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
