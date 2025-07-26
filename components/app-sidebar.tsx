"use client"

import * as React from "react"
import { PenSquare, Search, MessageSquare, Trash2, Database, PanelLeft } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Chat } from "@/lib/types"
import { ChatStorage } from "@/lib/chat-storage"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentChatId?: string
}

export function AppSidebar({ currentChatId, ...props }: AppSidebarProps) {
  const [chats, setChats] = React.useState<Chat[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const router = useRouter()
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar()

  React.useEffect(() => {
    loadChats()
  }, [pathname])

  const loadChats = () => {
    const allChats = ChatStorage.getAllChats()
    setChats(allChats)
  }

  const filteredChats = chats.filter((chat) => chat.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleNewChat = () => {
    router.push("/")
  }

  const handleChatClick = (chatId: string) => {
    router.push(`/chat/${chatId}`)
  }

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    ChatStorage.deleteChat(chatId)
    loadChats()

    if (currentChatId === chatId) {
      router.push("/")
    }
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2">
            <Database className="w-6 h-6 text-primary" />
            <span className="font-semibold group-data-[collapsible=icon]:hidden">SQL Chat</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 group-data-[collapsible=icon]:mx-auto"
          >
            <PanelLeft className="w-4 h-4" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </div>
        <Button onClick={handleNewChat} className="w-full mt-2 bg-transparent" variant="outline">
          <PenSquare className="w-4 h-4 mr-2" />
          <span className="group-data-[collapsible=icon]:hidden">New chat</span>
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Search</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search chats"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredChats.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 px-4">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm group-data-[collapsible=icon]:hidden">No chats yet</p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      onClick={() => handleChatClick(chat.id)}
                      isActive={currentChatId === chat.id}
                      className="w-full justify-start"
                      tooltip={chat.title}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                        <p className="truncate">{chat.title}</p>
                        <p className="text-xs text-muted-foreground">{chat.messages.length} messages</p>
                      </div>
                    </SidebarMenuButton>
                    <SidebarMenuAction onClick={(e) => handleDeleteChat(chat.id, e)} showOnHover>
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Delete chat</span>
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
