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
  partial?: boolean;
  partial_reason?: string;
  sql_query: string | null;
  query_result: any[];
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
