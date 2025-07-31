import { BarChartConfig, LineChartConfig } from "./visuals";

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
  sqlQuery?: string;
  partial?: boolean;
  partial_reason?: string;
  error?: string;
  finalSummary?: string;
  streamedContent?: string;
  chartConfig?: Array<BarChartConfig | LineChartConfig> | null;
  suggestions?: string[];
  data?: any;
  status?: string;
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
  type: 'status' | 'content' | 'result';
  text: string;
}