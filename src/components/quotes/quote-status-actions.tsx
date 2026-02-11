"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Send, CheckCircle, XCircle, RotateCcw } from "lucide-react"

export function QuoteStatusActions({
  quoteId,
  currentStatus,
  onStatusChange,
}: {
  quoteId: string
  currentStatus: string
  onStatusChange: () => void
}) {
  const [updating, setUpdating] = useState(false)

  async function updateStatus(newStatus: string) {
    setUpdating(true)
    try {
      await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      onStatusChange()
    } finally {
      setUpdating(false)
    }
  }

  if (currentStatus === "DRAFT") {
    return (
      <Button onClick={() => updateStatus("SUBMITTED")} disabled={updating} size="sm">
        <Send className="mr-1 h-4 w-4" />
        {updating ? "Submitting..." : "Submit Quote"}
      </Button>
    )
  }

  if (currentStatus === "SUBMITTED") {
    return (
      <div className="flex items-center gap-2">
        <Button onClick={() => updateStatus("ACCEPTED")} disabled={updating} size="sm" className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="mr-1 h-4 w-4" />
          Accept
        </Button>
        <Button onClick={() => updateStatus("DECLINED")} disabled={updating} size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
          <XCircle className="mr-1 h-4 w-4" />
          Decline
        </Button>
      </div>
    )
  }

  if (currentStatus === "DECLINED" || currentStatus === "ACCEPTED") {
    return (
      <Button onClick={() => updateStatus("REVISED")} disabled={updating} size="sm" variant="outline">
        <RotateCcw className="mr-1 h-4 w-4" />
        Revise
      </Button>
    )
  }

  if (currentStatus === "REVISED") {
    return (
      <Button onClick={() => updateStatus("SUBMITTED")} disabled={updating} size="sm">
        <Send className="mr-1 h-4 w-4" />
        Re-submit
      </Button>
    )
  }

  return null
}
