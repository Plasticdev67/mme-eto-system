import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      coordinator: true,
      products: {
        include: {
          designer: { select: { name: true } },
          coordinator: { select: { name: true } },
        },
      },
      _count: {
        select: { products: true, quotes: true, purchaseOrders: true, documents: true },
      },
    },
  })

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  return NextResponse.json(project)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const data: Record<string, unknown> = {}
  const fields = [
    "name", "customerId", "coordinatorId", "projectType", "workStream",
    "salesStage", "projectStatus", "contractType", "siteLocation", "notes",
  ]
  for (const field of fields) {
    if (body[field] !== undefined) data[field] = body[field]
  }
  const dateFields = ["enquiryReceived", "quoteSubmitted", "orderReceived", "targetCompletion", "actualCompletion"]
  for (const field of dateFields) {
    if (body[field] !== undefined) data[field] = body[field] ? new Date(body[field]) : null
  }

  const project = await prisma.project.update({
    where: { id },
    data,
  })

  return NextResponse.json(project)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.project.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
