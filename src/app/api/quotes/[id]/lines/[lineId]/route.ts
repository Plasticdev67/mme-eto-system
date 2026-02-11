import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  const { id: quoteId, lineId } = await params
  const body = await request.json()

  // Recalculate derived fields
  const labourHours = parseFloat(body.labourHours) || 0
  const labourRate = parseFloat(body.labourRate) || 0
  const labourCost = labourHours * labourRate
  const materialCost = parseFloat(body.materialCost) || 0
  const subcontractCost = parseFloat(body.subcontractCost) || 0
  const plantCost = parseFloat(body.plantCost) || 0
  const quantity = parseInt(body.quantity) || 1

  const directCost = (labourCost + materialCost + subcontractCost + plantCost) * quantity
  const overheadPercent = parseFloat(body.overheadPercent) || 0
  const overheadCost = directCost * (overheadPercent / 100)
  const costTotal = directCost + overheadCost

  const marginPercent = parseFloat(body.marginPercent) || 0
  const sellPrice = marginPercent < 100 ? costTotal / (1 - marginPercent / 100) : costTotal

  const line = await prisma.quoteLine.update({
    where: { id: lineId },
    data: {
      description: body.description,
      quantity,
      labourHours,
      labourRate,
      labourCost,
      materialCost,
      subcontractCost,
      plantCost,
      overheadPercent,
      overheadCost,
      costTotal,
      marginPercent,
      sellPrice,
    },
  })

  // Recalculate quote totals
  await recalcQuoteTotals(quoteId)

  return NextResponse.json(line)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  const { id: quoteId, lineId } = await params
  await prisma.quoteLine.delete({ where: { id: lineId } })
  await recalcQuoteTotals(quoteId)
  return NextResponse.json({ success: true })
}

async function recalcQuoteTotals(quoteId: string) {
  const lines = await prisma.quoteLine.findMany({ where: { quoteId } })
  let totalCost = 0
  let totalSell = 0
  for (const line of lines) {
    totalCost += Number(line.costTotal || 0)
    totalSell += Number(line.sellPrice || 0)
  }
  const overallMargin = totalSell > 0 ? ((totalSell - totalCost) / totalSell) * 100 : 0

  await prisma.quote.update({
    where: { id: quoteId },
    data: { totalCost, totalSell, overallMargin },
  })
}
