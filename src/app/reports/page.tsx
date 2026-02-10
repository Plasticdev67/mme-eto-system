import { Card, CardContent } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">Analytics and reporting</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <BarChart3 className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Coming in Phase D</h3>
          <p className="mt-1 text-sm text-gray-500">
            Project profitability, WIP reports, quote conversion rates, and production capacity analysis. Export to CSV/Excel.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
