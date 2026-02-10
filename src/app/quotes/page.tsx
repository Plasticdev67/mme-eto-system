import { Card, CardContent } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function QuotesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Quotes</h1>
        <p className="text-sm text-gray-500">Quote builder and management</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Coming in Phase B</h3>
          <p className="mt-1 text-sm text-gray-500">
            The quoting system is next on the build list. Per-product cost breakdown with labour, materials, subcontractors, and margin.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
