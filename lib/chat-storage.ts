export interface Chat {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  sqlQuery?: string
  queryResult?: any[]
  thinkingProcess?: string // Store the thinking process separately
}

export class ChatStorage {
  private static STORAGE_KEY = "sql-chat-history"

  static getAllChats(): Chat[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []

      const chats = JSON.parse(stored)
      return chats.map((chat: any) => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }))
    } catch (error) {
      console.error("Error loading chats:", error)
      return []
    }
  }

  static getChat(id: string): Chat | null {
    const chats = this.getAllChats()
    return chats.find((chat) => chat.id === id) || null
  }

  static saveChat(chat: Chat): void {
    if (typeof window === "undefined") return

    try {
      const chats = this.getAllChats()
      const existingIndex = chats.findIndex((c) => c.id === chat.id)

      if (existingIndex >= 0) {
        chats[existingIndex] = { ...chat, updatedAt: new Date() }
      } else {
        chats.unshift(chat)
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(chats))
    } catch (error) {
      console.error("Error saving chat:", error)
    }
  }

  static deleteChat(id: string): void {
    if (typeof window === "undefined") return

    try {
      const chats = this.getAllChats()
      const filtered = chats.filter((chat) => chat.id !== id)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error("Error deleting chat:", error)
    }
  }

  static createNewChat(firstMessage: string): Chat {
    const id = Date.now().toString()
    const title = firstMessage.length > 50 ? firstMessage.substring(0, 50) + "..." : firstMessage

    return {
      id,
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  // Helper method to format messages for API calls (excludes thinking process and data)
  static formatMessagesForAPI(messages: ChatMessage[]): Array<{ role: "user" | "assistant"; content: string }> {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))
  }
}
