"use client"

import { Badge } from "@/components/ui/badge"
import { getDepartmentColor, prettifyEnum } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useState } from "react"

const departments = ["PLANNING", "DESIGN", "PRODUCTION", "INSTALLATION", "REVIEW", "COMPLETE"]

export function ProductStatusActions({
  productId,
  currentDepartment,
  currentProductionStage,
}: {
  productId: string
  currentDepartment: string
  currentProductionStage: string | null
}) {
  const router = useRouter()
  const [updating, setUpdating] = useState(false)

  async function updateDepartment(newDepartment: string) {
    setUpdating(true)
    try {
      await fetch(`/api/products/${productId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentDepartment: newDepartment }),
      })
      router.refresh()
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="group relative">
      <Badge
        variant="secondary"
        className={`cursor-pointer ${getDepartmentColor(currentDepartment)} ${updating ? "opacity-50" : ""}`}
      >
        {prettifyEnum(currentDepartment)}
      </Badge>
      {/* Dropdown on hover */}
      <div className="absolute left-0 top-full z-50 hidden pt-1 group-hover:block">
        <div className="rounded-lg border border-border bg-white p-1 shadow-lg">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => updateDepartment(dept)}
              disabled={updating || dept === currentDepartment}
              className={`block w-full rounded px-3 py-1.5 text-left text-xs transition-colors ${
                dept === currentDepartment
                  ? "bg-blue-50 font-medium text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {prettifyEnum(dept)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
