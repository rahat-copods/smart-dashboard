'use client'
import { randomBytes } from "crypto";
import { useState, useEffect, useRef } from "react";


interface Chat {
  id: string;
  title: string;
  user: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  question?: string;
  response?: string;
  summary?: string;
  insight?: string | null;
  timestamp: string;
}

interface StreamResponse {
  data: any[] | null;
  chartConfig: any | null;
  finalSummary: string | null;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [streamedContent, setStreamedContent] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"data" | "chart">("data");
  const [responseData, setResponseData] = useState<StreamResponse | null>(null);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const streamRef = useRef<ReadableStreamDefaultReader | null>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const storedChats = localStorage.getItem("chatHistory");
    if (storedChats) {
      setChatHistory(JSON.parse(storedChats));
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setStreamedContent([]);
    setResponseData(null);

    const userId = "user03";
    const timestamp = new Date().toISOString();
    const newMessage: ChatMessage = {
      role: "user",
      question: input,
      timestamp,
    };

    // Update chat history
    const currentChat: Chat = {
      id: randomBytes(16).toString("hex"),
      title: input.slice(0, 30),
      user: userId,
      messages: [newMessage],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setChatHistory((prev) => [...prev, currentChat]);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          messages: [
            { role: "user", content: input },
            // Include previous messages from the current chat
            ...(chatHistory
              .find((chat) => chat.user === userId)
              ?.messages.filter((msg) => msg.role === "assistant")
              .map((msg) => ({
                role: "assistant",
                content: JSON.stringify({
                  response: msg.response,
                  summary: msg.summary,
                }),
              })) || []),
          ],
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      streamRef.current = reader;
      const decoder = new TextDecoder();
      let finalJson = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        try {
          // Try to parse as JSON (final payload)
          const parsed = JSON.parse(chunk);
          setResponseData(parsed);
          const assistantMessage: ChatMessage = {
            role: "assistant",
            response: parsed.finalSummary || "Query completed",
            summary: parsed.finalSummary || "",
            insight: null,
            timestamp: new Date().toISOString(),
          };
          setChatHistory((prev) =>
            prev.map((chat) =>
              chat.id === currentChat.id
                ? { ...chat, messages: [...chat.messages, assistantMessage] }
                : chat
            )
          );
        } catch {
          // Treat as markdown stream
          setStreamedContent((prev) => [...prev, chunk]);
        }
      }
    } catch (error: any) {
      setStreamedContent((prev) => [...prev, `**Error**: ${error.message}\n`]);
    } finally {
      setIsLoading(false);
      streamRef.current = null;
    }

    setInput("");
  };

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your query (e.g., 'Show total sales by category')"
            className="w-full p-2 border rounded"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
            disabled={isLoading}
          >
            Submit
          </button>
        </form>

        {/* Collapsible Streamed Content */}
        <div className="bg-white p-4 rounded shadow mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Query Progress</h2>
            <button
              onClick={toggleCollapse}
              className="text-blue-500 hover:underline"
            >
              {isCollapsed ? "Expand" : "Collapse"}
            </button>
          </div>
          {!isCollapsed && (
            <div className="mt-2 max-h-64 overflow-y-auto">
              {streamedContent.map((line, index) => (
                <p
                  key={index}
                  className={`text-sm ${
                    isLoading && index === streamedContent.length - 1
                      ? "animate-pulse text-gray-500"
                      : ""
                  }`}
                >
                  {line}
                </p>
              ))}
              {isLoading && (
                <p className="text-sm animate-pulse text-gray-500">
                  Processing...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tabs for Data and Chart */}
        {responseData && (
          <div className="bg-white p-4 rounded shadow">
            <div className="flex border-b">
              <button
                className={`px-4 py-2 ${
                  activeTab === "data" ? "border-b-2 border-blue-500" : ""
                }`}
                onClick={() => setActiveTab("data")}
              >
                Raw Data
              </button>
              <button
                className={`px-4 py-2 ${
                  activeTab === "chart" ? "border-b-2 border-blue-500" : ""
                }`}
                onClick={() => setActiveTab("chart")}
              >
                Chart
              </button>
            </div>
            <div className="mt-4">
              {activeTab === "data" && (
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(responseData.data, null, 2)}
                </pre>
              )}
              {activeTab === "chart" && responseData.chartConfig && (
                "charts"
              )}
            </div>
          </div>
        )}

        {/* Chat History */}
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Chat History</h2>
          {chatHistory.map((chat) => (
            <div key={chat.id} className="bg-white p-2 rounded shadow mt-2">
              <h3 className="font-medium">{chat.title}</h3>
              {chat.messages.map((msg, index) => (
                <p key={index} className="text-sm">
                  <strong>{msg.role === "user" ? "You" : "Assistant"}:</strong>{" "}
                  {msg.question || msg.response}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}