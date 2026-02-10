import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart } from "lucide-react"

export default function PurchasingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Purchase Orders</h1>
        <p className="text-sm text-gray-500">Manage purchase orders linked to projects</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ShoppingCart className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Coming in Phase C</h3>
          <p className="mt-1 text-sm text-gray-500">
            Purchase orders tied to projects and products, with auto-generated PO numbers and delivery tracking.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
