"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Database, Code } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface QueryResult {
  sql: string
  data: Record<string, any>[]
}

export default function Component() {
  const [userId, setUserId] = useState<string>("")
  const [query, setQuery] = useState<string>("")
  const [result, setResult] = useState<QueryResult | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId || !query.trim()) {
      setError("Please select a user ID and enter a query")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("http://localhost:8000/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          question: query.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message || errorData.error || `Server error: ${response.status} ${response.statusText}`,
        )
      }

      const data = await response.json()

      if (!data) {
        throw new Error("No data received from server")
      }

      setResult(data)
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Unable to connect to the server. Please check if the API is running.")
      } else {
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
      }
    } finally {
      setLoading(false)
    }
  }

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

  const ShimmerEffect = () => (
    <div className="animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
      </div>
    </div>
  )

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

        {/* Always show all three cards */}
        <div className="space-y-6">
          {/* Query Builder and SQL side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Query Builder Card - Left */}
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
                      <Select value={userId} onValueChange={setUserId} >
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
                        Running Query...
                      </>
                    ) : (
                      "Run Query"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* SQL Display Card - Right */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Generated SQL
                </CardTitle>
                <CardDescription>The SQL query generated from your natural language input</CardDescription>
              </CardHeader>
              <CardContent className="h-full">
                <div className="bg-muted text-muted-foreground  p-4 rounded-lg overflow-x-auto min-h-full flex items-center">
                  {loading ? (
                    <ShimmerEffect />
                  ) : result?.sql ? (
                    <pre className="text-sm font-mono whitespace-pre-wrap">{result.sql}</pre>
                  ) : (
                    <div className="text-center w-full text-muted-foreground">
                      <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">SQL query will appear here after you run a query</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full-width Result Table */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Query Results
              </CardTitle>
              <CardDescription>
                {loading
                  ? "Executing query..."
                  : result && result?.data?.length > 0
                    ? `Found ${result.data.length} result${result.data.length === 1 ? "" : "s"}`
                    : "Data will appear here after you run a query"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <ShimmerEffect />
                  <ShimmerEffect />
                  <ShimmerEffect />
                </div>
              ) : result?.data ? (
                renderTable(result.data)
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No data available</h3>
                  <p className="text-sm">Please pass a query to see results here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
