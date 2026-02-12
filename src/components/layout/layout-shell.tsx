"use client"

import { cn } from "@/lib/utils"
import { useLayout } from "./layout-context"
import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Header } from "./header"

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useLayout()
  const pathname = usePathname()

  // Login page — no sidebar/header
  if (pathname === "/login") {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className={cn("flex-1 transition-all duration-200", collapsed ? "pl-16" : "pl-60")}>
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
