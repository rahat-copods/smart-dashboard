"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import type { ReactNode } from "react"

interface ChatLayoutProps {
  children: ReactNode
  currentChatId?: string
}

export function ChatLayout({ children, currentChatId }: ChatLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar currentChatId={currentChatId} />
      <SidebarInset className="flex flex-col min-h-screen">{children}</SidebarInset>
    </SidebarProvider>
  )
}
