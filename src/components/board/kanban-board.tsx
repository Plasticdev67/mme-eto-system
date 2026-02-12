"use client"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { ProjectCard } from "./project-card"

type BoardProject = {
  id: string
  projectNumber: string
  name: string
  projectStatus: string
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

const BOARD_COLUMNS = [
  "OPPORTUNITY",
  "QUOTATION",
  "DESIGN",
  "MANUFACTURE",
  "INSTALLATION",
  "REVIEW",
] as const

const columnColors: Record<string, string> = {
  OPPORTUNITY: "border-t-gray-400",
  QUOTATION: "border-t-blue-400",
  DESIGN: "border-t-indigo-400",
  MANUFACTURE: "border-t-amber-400",
  INSTALLATION: "border-t-green-400",
  REVIEW: "border-t-purple-400",
}

const columnLabels: Record<string, string> = {
  OPPORTUNITY: "Sales / Opportunity",
  QUOTATION: "Quotation",
  DESIGN: "Design",
  MANUFACTURE: "Production",
  INSTALLATION: "Installation",
  REVIEW: "Review",
}

function groupByStatus(projects: BoardProject[]) {
  const grouped: Record<string, BoardProject[]> = {}
  for (const status of BOARD_COLUMNS) {
    grouped[status] = []
  }
  for (const project of projects) {
    const status = project.projectStatus as string
    if (grouped[status]) {
      grouped[status].push(project)
    } else {
      grouped["OPPORTUNITY"].push(project)
    }
  }
  return grouped
}

export function KanbanBoard({ initialProjects }: { initialProjects: BoardProject[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [filterClassification, setFilterClassification] = useState("ALL")
  const [filterPriority, setFilterPriority] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProjects = projects.filter((p) => {
    if (filterClassification !== "ALL" && p.classification !== filterClassification) return false
    if (filterPriority !== "ALL" && p.priority !== filterPriority) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!p.name.toLowerCase().includes(q) &&
          !p.projectNumber.toLowerCase().includes(q) &&
          !(p.customer?.name || "").toLowerCase().includes(q)) return false
    }
    return true
  })

  const grouped = groupByStatus(filteredProjects)

  async function handleDragEnd(result: DropResult) {
    const { draggableId, destination, source } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId) return

    const newStatus = destination.droppableId

    // Optimistic update
    setProjects((prev) =>
      prev.map((p) =>
        p.id === draggableId ? { ...p, projectStatus: newStatus } : p
      )
    )

    // Persist to server
    try {
      const res = await fetch(`/api/projects/${draggableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectStatus: newStatus }),
      })
      if (!res.ok) {
        // Revert on failure
        setProjects((prev) =>
          prev.map((p) =>
            p.id === draggableId ? { ...p, projectStatus: source.droppableId } : p
          )
        )
      }
    } catch {
      // Revert on error
      setProjects((prev) =>
        prev.map((p) =>
          p.id === draggableId ? { ...p, projectStatus: source.droppableId } : p
        )
      )
    }
  }

  const selectClass = "rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {/* Board Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          type="text"
          placeholder="Search board..."
          className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs w-48 focus:border-blue-500 focus:outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select className={selectClass} value={filterClassification} onChange={(e) => setFilterClassification(e.target.value)}>
          <option value="ALL">All Types</option>
          <option value="NORMAL">Normal</option>
          <option value="MEGA">Mega</option>
          <option value="SUB_CONTRACT">Sub-contract</option>
        </select>
        <select className={selectClass} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="ALL">All Priorities</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">
          {filteredProjects.length} of {projects.length} projects
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {BOARD_COLUMNS.map((status) => {
          const color = columnColors[status] || "border-t-gray-300"
          const label = columnLabels[status] || status
          const colProjects = grouped[status]

          return (
            <Droppable key={status} droppableId={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex flex-col rounded-lg border border-border ${color} border-t-4 min-w-[260px] max-w-[300px] ${
                    snapshot.isDraggingOver ? "bg-blue-50/50" : "bg-gray-50/50"
                  }`}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                    <h3 className="text-xs font-semibold uppercase text-gray-700">{label}</h3>
                    <span className="flex items-center justify-center h-5 min-w-5 rounded-full bg-gray-200 px-1.5 text-[10px] font-semibold text-gray-600">
                      {colProjects.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-2 p-2 overflow-y-auto max-h-[calc(100vh-220px)] min-h-[100px]">
                    {colProjects.map((project, index) => (
                      <Draggable key={project.id} draggableId={project.id} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={dragSnapshot.isDragging ? "opacity-90 rotate-1" : ""}
                          >
                            <ProjectCard project={project} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {colProjects.length === 0 && !snapshot.isDraggingOver && (
                      <div className="py-8 text-center text-xs text-gray-400">
                        No projects
                      </div>
                    )}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          )
        })}
      </div>
    </DragDropContext>
  )
}
