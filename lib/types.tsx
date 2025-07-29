interface BaseMessage {
  id: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
}

interface UserMessage extends BaseMessage {
  role: "user";
  question: string;
}

interface AssistantMessage extends BaseMessage {
  role: "assistant";
  error: string | null;
  reasoning: string; // Changed from thought_process
  partial: boolean | null;
  partial_reason: string | null;
  sql_query: string | null;
  query_result: any[] | null;
  explanation: string; // Added to match backend
  suggestions: string[];
}

interface SystemMessage extends BaseMessage {
  role: "system";
  error: string;
  show?: boolean;
}

export type ChatMessage = UserMessage | AssistantMessage | SystemMessage;

export interface Chat {
  id: string;
  title: string;
  user: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ThinkingState {
  status:
    | "initializing"
    | "reasoning" 
    | "generatingQuery" 
    | "explaining"
    | "suggesting"
    | "partial"
    | "partial_reason"
    | "executing"
    | "complete"
    | "system_error";
  text: string;
  isActive: boolean;
  sqlQuery?: string|null;
}