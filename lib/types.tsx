interface BaseMessage {
  id: string;
  role: "user" | "assistant" | "developer";
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
}

interface DeveloperMessage extends BaseMessage {
  role: "developer";
  error: string;
}

export type ChatMessage = UserMessage | AssistantMessage | DeveloperMessage;

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}
