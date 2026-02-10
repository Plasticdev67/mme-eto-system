import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const product = await prisma.product.update({
    where: { id },
    data: {
      currentDepartment: body.currentDepartment,
      productionStatus: body.productionStatus,
      currentOperationalStatus: body.currentOperationalStatus,
    },
  })

  return NextResponse.json(product)
}
