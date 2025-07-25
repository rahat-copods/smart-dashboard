"use client"

import { Database } from "lucide-react"

interface ChatHeaderProps {
  title: string
}

export function ChatHeader({ title }: ChatHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background sticky top-0 z-10">
      <div className="flex items-center space-x-2">
        <Database className="w-5 h-5 text-primary" />
        <span className="font-semibold text-foreground">{title}</span>
      </div>
    </header>
  )
}
