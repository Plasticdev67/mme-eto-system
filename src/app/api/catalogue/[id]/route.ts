import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const data: Record<string, unknown> = {}
  if (body.partCode !== undefined) data.partCode = body.partCode
  if (body.description !== undefined) data.description = body.description
  if (body.classId !== undefined) data.classId = body.classId
  if (body.active !== undefined) data.active = body.active
  if (body.guideMaterialCost !== undefined) data.guideMaterialCost = body.guideMaterialCost ? parseFloat(body.guideMaterialCost) : null
  if (body.guideLabourHours !== undefined) data.guideLabourHours = body.guideLabourHours ? parseFloat(body.guideLabourHours) : null
  if (body.guideLabourRate !== undefined) data.guideLabourRate = body.guideLabourRate ? parseFloat(body.guideLabourRate) : null
  if (body.guideSubcontractCost !== undefined) data.guideSubcontractCost = body.guideSubcontractCost ? parseFloat(body.guideSubcontractCost) : null
  if (body.guidePlantCost !== undefined) data.guidePlantCost = body.guidePlantCost ? parseFloat(body.guidePlantCost) : null

  const item = await prisma.productCatalogue.update({
    where: { id },
    data,
  })

  return NextResponse.json(item)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.productCatalogue.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
