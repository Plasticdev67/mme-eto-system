"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const projectTypes = [
  { value: "STANDARD", label: "Standard" },
  { value: "BESPOKE_MAJOR", label: "Bespoke/Major" },
]

const workStreams = [
  { value: "COMMUNITY", label: "Community" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "BESPOKE", label: "Bespoke" },
  { value: "BLAST", label: "Blast" },
  { value: "BUND_CONTAINMENT", label: "Bund Containment" },
  { value: "REFURBISHMENT", label: "Refurbishment" },
  { value: "ADHOC", label: "Ad-hoc" },
]

const salesStages = [
  { value: "OPPORTUNITY", label: "Opportunity" },
  { value: "QUOTED", label: "Quoted" },
  { value: "ORDER", label: "Order" },
]

const projectStatuses = [
  { value: "OPPORTUNITY", label: "Opportunity" },
  { value: "QUOTATION", label: "Quotation" },
  { value: "DESIGN", label: "Design" },
  { value: "MANUFACTURE", label: "Manufacture" },
  { value: "INSTALLATION", label: "Installation" },
  { value: "REVIEW", label: "Review" },
  { value: "COMPLETE", label: "Complete" },
]

const contractTypes = [
  { value: "STANDARD", label: "Standard" },
  { value: "NEC", label: "NEC" },
  { value: "FRAMEWORK_CALLOFF", label: "Framework Call-off" },
  { value: "OTHER", label: "Other" },
]

function toDateInputValue(date: string | Date | null | undefined): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  return d.toISOString().split("T")[0]
}

type ProjectData = {
  id: string
  name: string
  projectNumber: string
  customerId: string | null
  coordinatorId: string | null
  projectType: string
  workStream: string
  salesStage: string
  projectStatus: string
  contractType: string
  siteLocation: string | null
  notes: string | null
  enquiryReceived: string | Date | null
  quoteSubmitted: string | Date | null
  orderReceived: string | Date | null
  targetCompletion: string | Date | null
  actualCompletion: string | Date | null
}

export function EditProjectForm({
  project,
  customers,
  users,
}: {
  project: ProjectData
  customers: { id: string; name: string }[]
  users: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    try {
      await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      router.push(`/projects/${project.id}`)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const selectClass = "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-6 p-6">
          {/* Project Number (read only) */}
          <div className="space-y-2">
            <Label>Project Number</Label>
            <p className="font-mono text-sm font-medium text-gray-900">{project.projectNumber}</p>
          </div>

          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input id="name" name="name" required defaultValue={project.name} />
          </div>

          {/* Customer & Coordinator */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer</Label>
              <select id="customerId" name="customerId" className={selectClass} defaultValue={project.customerId || ""}>
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coordinatorId">Project Coordinator</Label>
              <select id="coordinatorId" name="coordinatorId" className={selectClass} defaultValue={project.coordinatorId || ""}>
                <option value="">Select coordinator...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Type & Work Stream */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectType">Project Type</Label>
              <select id="projectType" name="projectType" className={selectClass} defaultValue={project.projectType}>
                {projectTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workStream">Work Stream</Label>
              <select id="workStream" name="workStream" className={selectClass} defaultValue={project.workStream}>
                {workStreams.map((w) => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Sales Stage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectStatus">Project Status</Label>
              <select id="projectStatus" name="projectStatus" className={selectClass} defaultValue={project.projectStatus}>
                {projectStatuses.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salesStage">Sales Stage</Label>
              <select id="salesStage" name="salesStage" className={selectClass} defaultValue={project.salesStage}>
                {salesStages.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contract Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contractType">Contract Type</Label>
              <select id="contractType" name="contractType" className={selectClass} defaultValue={project.contractType}>
                {contractTypes.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteLocation">Site Location</Label>
              <Input id="siteLocation" name="siteLocation" defaultValue={project.siteLocation || ""} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="enquiryReceived">Enquiry Received</Label>
              <Input id="enquiryReceived" name="enquiryReceived" type="date" defaultValue={toDateInputValue(project.enquiryReceived)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quoteSubmitted">Quote Submitted</Label>
              <Input id="quoteSubmitted" name="quoteSubmitted" type="date" defaultValue={toDateInputValue(project.quoteSubmitted)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderReceived">Order Received</Label>
              <Input id="orderReceived" name="orderReceived" type="date" defaultValue={toDateInputValue(project.orderReceived)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetCompletion">Target Completion</Label>
              <Input id="targetCompletion" name="targetCompletion" type="date" defaultValue={toDateInputValue(project.targetCompletion)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actualCompletion">Actual Completion</Label>
              <Input id="actualCompletion" name="actualCompletion" type="date" defaultValue={toDateInputValue(project.actualCompletion)} />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={project.notes || ""} />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
