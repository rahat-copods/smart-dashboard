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
  thought_process: string;
  partial: boolean | null;
  partial_reason: string | null;
  sql_query: string | null;
  query_result: any[] | null;
  suggestions: string[];
}

interface SystemMessage extends BaseMessage {
  role: "system";
  error: string;
}

export type ChatMessage = UserMessage | AssistantMessage | SystemMessage;

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}
