import {
  ChartConfig,
  InsightsResult,
  SqlGenerationResult,
} from "@/lib/api/types";

export interface BaseMessage {
  id: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
}

export interface UserMessage extends BaseMessage {
  role: "user";
  question: string;
}

export interface AssistantMessage extends BaseMessage {
  role: "assistant";
  query: SqlGenerationResult | null;
  streamedContent: string;
  data: any | null;
  visuals: ChartConfig | null;
  error: string | null;
  summary: string | null;
  insights: InsightsResult | null;
  insightsError: string | null;
  info: {executionTime: number}
}

export type ChatMessage = UserMessage | AssistantMessage;

export interface Chat {
  id: string;
  title: string;
  user: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StreamResponse {
  type: "status" | "content" | "result";
  text: string;
}
