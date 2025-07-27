"use client";

import * as React from "react";
import {
  PenSquare,
  Search,
  MessageSquare,
  Trash2,
  Database,
  PanelLeft,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
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
  SidebarFooter,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chat } from "@/lib/types";
import { ChatStorage } from "@/lib/chat-storage";
import { ThemeSwitch } from "./theme-switch";
import { useState } from "react";


export function AppSidebar({  ...props }) {
  const [currentChatId, setCurrentChatId ]=useState<string | null>(null); 
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useSidebar();
  React.useEffect(() => {
    setCurrentChatId(pathname.split("/")[2])
    loadChats();
  }, [pathname]);

  const loadChats = () => {
    const allChats = ChatStorage.getAllChats();
    setChats(allChats);
  };

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChat = () => {
    router.push("/");
  };

  const handleChatClick = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    ChatStorage.deleteChat(chatId);
    loadChats();

    if (currentChatId === chatId) {
      router.push("/");
    }
  };

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader
        className={`border-b border-border/50 flex ${isCollapsed ? "flex-col" : "flex-row"} items-center justify-between`}
      >
        {/* Logo and branding */}
        <div className="flex items-center justify-center px-3 py-2">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Database className="h-4 w-4" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight">
                  Smart Dashboard
                </span>
                <span className="text-xs text-muted-foreground">
                  AI Assistant
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Toggle button - positioned below logo when collapsed */}
        <SidebarTrigger />
      </SidebarHeader>

      <SidebarContent className={isCollapsed ? "mx-auto pt-10" : "px-2 pt-10"}>
        {/* New Chat Button */}
        <div className={isCollapsed ? "mx-auto" : "px-3 pb-2"}>
          <Button
            onClick={handleNewChat}
            className="w-full justify-start bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm px-2"
            size={isCollapsed ? "icon" : "default"}
          >
            <PenSquare className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">New Chat</span>}
          </Button>
        </div>
        {/* Search Section */}
        {!isCollapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Search
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="relative px-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 bg-background/50 border-border/50 focus:border-border focus:bg-background"
                />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Recent Chats Section */}
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel
            className={`px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider ${isCollapsed ? "sr-only" : ""}`}
          >
            Recent Chats
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {filteredChats.length === 0
                ? !isCollapsed && (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <div className="mb-4 rounded-full bg-muted/50 p-4">
                        <MessageSquare className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        No chats yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Start a new conversation to get started
                      </p>
                    </div>
                  )
                : filteredChats.map((chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton
                        onClick={() => handleChatClick(chat.id)}
                        isActive={currentChatId === chat.id}
                        className="w-full justify-start py-4"
                        tooltip={chat.title}
                      >
                        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                        {!isCollapsed && (
                          <div className="flex-1 min-w-0 ml-3">
                            <p className="truncate text-sm font-medium leading-5">
                              {chat.title}
                            </p>
                          </div>
                        )}
                      </SidebarMenuButton>
                      {!isCollapsed && (
                        <SidebarMenuAction
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          showOnHover
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          <span className="sr-only">Delete chat</span>
                        </SidebarMenuAction>
                      )}
                    </SidebarMenuItem>
                  ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Theme Switch at the bottom */}
      <SidebarFooter className="border-t border-border/50 p-2">
        <div
          className={`flex ${isCollapsed ? "justify-center" : "justify-end px-1"}`}
        >
          <ThemeSwitch />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
