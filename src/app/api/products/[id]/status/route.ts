import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const data: Record<string, unknown> = {}
  if (body.currentDepartment !== undefined) data.currentDepartment = body.currentDepartment
  if (body.productionStatus !== undefined) data.productionStatus = body.productionStatus
  if (body.currentOperationalStatus !== undefined) data.currentOperationalStatus = body.currentOperationalStatus

  const product = await prisma.product.update({
    where: { id },
    data,
  })

  return NextResponse.json(product)
}
