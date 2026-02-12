import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")

  const where = projectId ? { projectId } : {}

  const ncrs = await prisma.nonConformanceReport.findMany({
    where,
    orderBy: { raisedDate: "desc" },
    include: {
      parentProject: { select: { id: true, projectNumber: true, name: true } },
      project: { select: { id: true, partCode: true, description: true } },
    },
  })

  return NextResponse.json(ncrs)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Auto-generate NCR number
  const lastNcr = await prisma.nonConformanceReport.findFirst({
    orderBy: { ncrNumber: "desc" },
  })
  const lastNum = lastNcr ? parseInt(lastNcr.ncrNumber.replace("NCR-", "")) : 0
  const ncrNumber = `NCR-${String(lastNum + 1).padStart(4, "0")}`

  const ncr = await prisma.nonConformanceReport.create({
    data: {
      ncrNumber,
      projectId: body.projectId,
      productId: body.productId || null,
      title: body.title,
      description: body.description || null,
      severity: body.severity || "MINOR",
      costImpact: body.costImpact ? parseFloat(body.costImpact) : null,
    },
  })

  // Update project NCR cost total
  if (body.costImpact) {
    const ncrs = await prisma.nonConformanceReport.findMany({
      where: { projectId: body.projectId },
    })
    const totalNcrCost = ncrs.reduce(
      (sum, n) => sum + Number(n.costImpact || 0),
      0
    )
    await prisma.project.update({
      where: { id: body.projectId },
      data: { ncrCost: totalNcrCost },
    })
  }

  return NextResponse.json(ncr, { status: 201 })
}
