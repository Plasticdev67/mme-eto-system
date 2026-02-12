"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, prettifyEnum } from "@/lib/utils"
import { AlertTriangle, Flame, Siren } from "lucide-react"

type BoardProject = {
  id: string
  projectNumber: string
  name: string
  customer: { name: string } | null
  priority: string
  isICUFlag: boolean
  classification: string
  ragStatus: string | null
  estimatedValue: string | number | null
  contractValue: string | number | null
  targetCompletion: string | null
  projectManager: { name: string } | null
  installManager: { name: string } | null
  coordinator: { name: string } | null
  _count: { products: number }
}

function getRagColor(rag: string | null) {
  if (!rag) return ""
  const map: Record<string, string> = {
    GREEN: "bg-green-500",
    AMBER: "bg-amber-500",
    RED: "bg-red-500",
  }
  return map[rag] || ""
}

function getPriorityIcon(priority: string, isICU: boolean) {
  if (isICU) return <Siren className="h-3.5 w-3.5 text-red-600" />
  if (priority === "CRITICAL") return <Flame className="h-3.5 w-3.5 text-red-500" />
  if (priority === "HIGH") return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
  return null
}

function getClassBadge(classification: string) {
  if (classification === "MEGA") return <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">Mega</Badge>
  if (classification === "SUB_CONTRACT") return <Badge variant="secondary" className="bg-teal-100 text-teal-700 text-[10px] px-1.5 py-0">Sub</Badge>
  return null
}

export function ProjectCard({ project }: { project: BoardProject }) {
  const value = project.contractValue || project.estimatedValue
  const priorityIcon = getPriorityIcon(project.priority, project.isICUFlag)
  const classBadge = getClassBadge(project.classification)

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="rounded-lg border border-border bg-white p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer space-y-2">
        {/* Top row: project number + RAG + priority */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {project.ragStatus && (
              <div className={`h-2.5 w-2.5 rounded-full ${getRagColor(project.ragStatus)}`} />
            )}
            <span className="font-mono text-xs font-semibold text-gray-900">{project.projectNumber}</span>
            {priorityIcon}
            {classBadge}
          </div>
          <span className="text-[10px] text-gray-400">{project._count.products} items</span>
        </div>

        {/* Name */}
        <div className="text-sm font-medium text-gray-800 leading-tight line-clamp-2">
          {project.name}
        </div>

        {/* Customer */}
        {project.customer && (
          <div className="text-xs text-gray-500 truncate">{project.customer.name}</div>
        )}

        {/* Bottom row: value + manager */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <span className="font-mono text-xs text-gray-600">
            {value ? formatCurrency(Number(value)) : "—"}
          </span>
          {project.projectManager && (
            <span className="text-[10px] text-gray-400 truncate max-w-[80px]">
              {project.projectManager.name}
            </span>
          )}
        </div>

        {/* Target date */}
        {project.targetCompletion && (
          <div className="text-[10px] text-gray-400">
            Target: {new Date(project.targetCompletion).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
          </div>
        )}
      </div>
    </Link>
  )
}
