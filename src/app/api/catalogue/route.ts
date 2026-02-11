import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const items = await prisma.productCatalogue.findMany({
    orderBy: { partCode: "asc" },
    include: {
      _count: { select: { products: true } },
    },
  })
  return NextResponse.json(items)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const item = await prisma.productCatalogue.create({
    data: {
      partCode: body.partCode,
      description: body.description,
      classId: body.classId || "PROD",
      guideMaterialCost: body.guideMaterialCost ? parseFloat(body.guideMaterialCost) : null,
      guideLabourHours: body.guideLabourHours ? parseFloat(body.guideLabourHours) : null,
      guideLabourRate: body.guideLabourRate ? parseFloat(body.guideLabourRate) : null,
      guideSubcontractCost: body.guideSubcontractCost ? parseFloat(body.guideSubcontractCost) : null,
      guidePlantCost: body.guidePlantCost ? parseFloat(body.guidePlantCost) : null,
    },
  })

  return NextResponse.json(item, { status: 201 })
}
