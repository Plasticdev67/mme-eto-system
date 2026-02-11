"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type LayoutContextType = {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  toggleCollapsed: () => void
}

const LayoutContext = createContext<LayoutContextType>({
  collapsed: false,
  setCollapsed: () => {},
  toggleCollapsed: () => {},
})

export function useLayout() {
  return useContext(LayoutContext)
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <LayoutContext.Provider value={{ collapsed, setCollapsed, toggleCollapsed: () => setCollapsed(!collapsed) }}>
      {children}
    </LayoutContext.Provider>
  )
}
