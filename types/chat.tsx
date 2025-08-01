import { ChartConfig } from "./visuals";


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
  error?: string;
  finalSummary?: string;
  streamedContent?: string;
  chartConfig?: Array<ChartConfig> | null;
  sqlResult?: {error: string, partial: boolean, partialReason: string, sqlQuery: string, suggestions: string[]};
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