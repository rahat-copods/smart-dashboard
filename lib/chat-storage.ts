import { Chat, ChatMessage } from "../types";

export class ChatStorage {
  private static STORAGE_KEY = "sql-chat-history";

  static getAllChats(): Chat[] {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const chats = JSON.parse(stored);
      return chats.map((chat: Chat) => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          // Map thought_process to reasoning for backward compatibility
          reasoning: typeof msg.reasoning === "string" ? msg.reasoning : msg.thought_process || "",
          error: msg.error !== undefined ? msg.error : null,
          partial: msg.partial !== undefined ? msg.partial : null,
          partial_reason: msg.partial_reason !== undefined ? msg.partial_reason : null,
          sql_query: msg.sql_query !== undefined ? msg.sql_query : null,
          query_result: msg.query_result || null,
          explanation: typeof msg.explanation === "string" ? msg.explanation : "",
          visuals: msg.visuals || null,
          suggestions: Array.isArray(msg.suggestions) ? msg.suggestions : [],
          show: msg.show !== undefined ? msg.show : undefined,
        })),
      }));
    } catch (error) {
      console.error("Error loading chats:", error);
      return [];
    }
  }

  static getChat(id: string): Chat | null {
    const chats = this.getAllChats();
    return chats.find((chat) => chat.id === id) || null;
  }

  static saveChat(chat: Chat): void {
    if (typeof window === "undefined") return;

    try {
      const chats = this.getAllChats();
      const existingIndex = chats.findIndex((c) => c.id === chat.id);

      if (existingIndex >= 0) {
        chats[existingIndex] = { ...chat, updatedAt: new Date() };
      } else {
        chats.unshift(chat);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(chats));
    } catch (error) {
      console.error("Error saving chat:", error);
    }
  }

  static deleteChat(id: string): void {
    if (typeof window === "undefined") return;

    try {
      const chats = this.getAllChats();
      const filtered = chats.filter((chat) => chat.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  }

  static createNewChat(firstMessage: string, userId: string): Chat {
    const id = Date.now().toString();
    const title = firstMessage.length > 50 ? firstMessage.substring(0, 50) + "..." : firstMessage;

    return {
      id,
      title,
      messages: [],
      user: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static formatMessagesForAPI(
    messages: ChatMessage[],
    includeData: boolean = false
  ): Array<{ role: "user" | "assistant" | "system"; content: string }> {
    const apiMessages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [];

    messages.forEach((msg) => {
      switch (msg.role) {
        case "user":
          apiMessages.push({
            role: msg.role,
            content: msg.question || "",
          });
          break;

        case "assistant":
          const assistantContent = {
            reasoning: msg.reasoning || "",
            error: msg.error,
            partial: msg.partial,
            partial_reason: msg.partial_reason,
            sql_query: msg.sql_query,
            explanation: msg.explanation || "",
            visuals: msg.visuals,
            suggestions: Array.isArray(msg.suggestions) ? msg.suggestions : [],
          };

          apiMessages.push({
            role: msg.role,
            content: JSON.stringify(assistantContent),
          });

          if (includeData && msg.query_result !== undefined && msg.query_result !== null) {
            apiMessages.push({
              role: "system",
              content: `Previous query result data: ${JSON.stringify(msg.query_result)}`,
            });
          }
          break;

        case "system":
          if (!msg.show) {
            apiMessages.push({
              role: msg.role,
              content: msg.error || "",
            });
          }
          break;
      }
    });

    return apiMessages;
  }
}