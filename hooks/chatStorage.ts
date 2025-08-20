import { v4 as uuidv4 } from "uuid";

import { AssistantMessage, Chat, UserMessage } from "@/types/chat";

export class ChatStorage {
  private static readonly STORAGE_KEY = "chats";

  static getAllChats(): Chat[] {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);

      if (!stored) return [];

      const chats = JSON.parse(stored);

      return chats.map((chat: any) => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error loading chats:", error);

      return [];
    }
  }

  static saveChats(chats: Chat[]): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(chats));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error saving chats:", error);
    }
  }

  static getChat(id: string): Chat | null {
    const chats = this.getAllChats();

    return chats.find((chat) => chat.id === id) || null;
  }

  static createChat(title: string, userId: string): Chat {
    const newChat: Chat = {
      id: uuidv4(),
      title: title.length > 50 ? title.slice(0, 47) + "..." : title,
      user: userId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const chats = this.getAllChats();

    chats.unshift(newChat);
    this.saveChats(chats);

    return newChat;
  }

  static updateChat(chatId: string, updates: Partial<Chat>): void {
    const chats = this.getAllChats();
    const index = chats.findIndex((chat) => chat.id === chatId);

    if (index !== -1) {
      chats[index] = { ...chats[index], ...updates, updatedAt: new Date() };
      this.saveChats(chats);
    }
  }

  static deleteChat(chatId: string): void {
    const chats = this.getAllChats();
    const filtered = chats.filter((chat) => chat.id !== chatId);

    this.saveChats(filtered);
  }

  static addMessage(
    chatId: string,
    message: UserMessage | AssistantMessage,
  ): void {
    const chats = this.getAllChats();
    const chatIndex = chats.findIndex((chat) => chat.id === chatId);

    if (chatIndex !== -1) {
      chats[chatIndex].messages.push(message);
      chats[chatIndex].updatedAt = new Date();
      this.saveChats(chats);
    }
  }

  static updateLastMessage(chatId: string, updates: any): void {
    const chats = this.getAllChats();
    const chatIndex = chats.findIndex((chat) => chat.id === chatId);

    if (chatIndex !== -1 && chats[chatIndex].messages.length > 0) {
      const lastMessageIndex = chats[chatIndex].messages.length - 1;

      chats[chatIndex].messages[lastMessageIndex] = {
        ...chats[chatIndex].messages[lastMessageIndex],
        ...updates,
      };
      chats[chatIndex].updatedAt = new Date();
      this.saveChats(chats);
    }
  }

  static updateMessage(chatId: string, messageId: string, updates: any): void {
    const chats = this.getAllChats();
    const chatIndex = chats.findIndex((chat) => chat.id === chatId);

    if (chatIndex !== -1) {
      const messageIndex = chats[chatIndex].messages.findIndex(
        (msg) => msg.id === messageId,
      );

      if (messageIndex !== -1) {
        chats[chatIndex].messages[messageIndex] = {
          ...chats[chatIndex].messages[messageIndex],
          ...updates,
        };
        chats[chatIndex].updatedAt = new Date();
        this.saveChats(chats);
      }
    }
  }
}
