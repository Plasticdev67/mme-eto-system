"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FolderKanban,
  Columns3,
  ListChecks,
  FileText,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  UsersRound,
  BookOpen,
  PoundSterling,
  Upload,
  History,
  Gauge,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react"
import { useLayout } from "./layout-context"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Board", href: "/board", icon: Columns3 },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Tracker", href: "/tracker", icon: ListChecks },
  { name: "Quotes", href: "/quotes", icon: FileText },
  { name: "Purchasing", href: "/purchasing", icon: ShoppingCart },
  { name: "Finance", href: "/finance", icon: PoundSterling },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Suppliers", href: "/suppliers", icon: Truck },
  { name: "Catalogue", href: "/catalogue", icon: BookOpen },
  { name: "Team", href: "/team", icon: UsersRound },
  { name: "Capacity", href: "/capacity", icon: Gauge },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Import", href: "/import", icon: Upload },
  { name: "Audit Trail", href: "/settings/audit", icon: History },
]

export function Sidebar() {
  const pathname = usePathname()
  const { collapsed, toggleCollapsed } = useLayout()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {(!collapsed || mobileOpen) ? (
          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
              MM
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900">MME System</span>
            </div>
          </Link>
        ) : (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
            MM
          </div>
        )}
        {/* Mobile close button */}
        <button
          className="md:hidden rounded-lg p-1 text-gray-400 hover:bg-gray-100"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3 overflow-y-auto flex-1">
        {navigation.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              title={collapsed && !mobileOpen ? item.name : undefined}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-blue-600" : "text-gray-400")} />
              {(!collapsed || mobileOpen) && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle — desktop only */}
      <div className="hidden md:block absolute bottom-4 left-0 right-0 px-3">
        <button
          onClick={toggleCollapsed}
          className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden rounded-lg bg-white border border-border p-2 shadow-sm"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar (slide-out) */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r border-border bg-white transition-transform duration-200 md:hidden w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-border bg-white transition-all duration-200 hidden md:flex md:flex-col",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {navContent}
      </aside>
    </>
  )
}
