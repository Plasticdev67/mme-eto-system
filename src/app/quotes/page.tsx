import { prisma } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate, prettifyEnum } from "@/lib/utils"
import { NewQuoteDialog } from "@/components/quotes/new-quote-dialog"

function getQuoteStatusColor(status: string) {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    SUBMITTED: "bg-blue-100 text-blue-800",
    ACCEPTED: "bg-green-100 text-green-800",
    DECLINED: "bg-red-100 text-red-800",
    REVISED: "bg-amber-100 text-amber-800",
  }
  return colors[status] || "bg-gray-100 text-gray-800"
}

async function getQuotes() {
  return prisma.quote.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      project: {
        select: { id: true, projectNumber: true, name: true, customer: { select: { name: true } } },
      },
      createdBy: { select: { name: true } },
      _count: { select: { quoteLines: true } },
    },
  })
}

async function getProjectsForQuote() {
  return prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, projectNumber: true, name: true },
  })
}

export default async function QuotesPage() {
  const [quotes, projects] = await Promise.all([getQuotes(), getProjectsForQuote()])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quotes</h1>
          <p className="text-sm text-gray-500">{quotes.length} quotes</p>
        </div>
        <NewQuoteDialog projects={projects} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Quote No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-500">Lines</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Cost</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Sell</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Margin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <Link href={`/quotes/${quote.id}`} className="font-mono text-sm font-medium text-blue-600 hover:text-blue-700">
                        {quote.quoteNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <Link href={`/projects/${quote.project.id}`} className="text-gray-900 hover:text-blue-600">
                        <span className="font-mono text-xs text-gray-500">{quote.project.projectNumber}</span>{" "}
                        {quote.project.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{quote.project.customer?.name || "—"}</td>
                    <td className="px-6 py-3">
                      <Badge variant="secondary" className={getQuoteStatusColor(quote.status)}>
                        {prettifyEnum(quote.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-center font-mono text-gray-600">{quote._count.quoteLines}</td>
                    <td className="px-6 py-3 text-right font-mono text-gray-600">{quote.totalCost ? formatCurrency(quote.totalCost) : "—"}</td>
                    <td className="px-6 py-3 text-right font-mono font-medium text-gray-900">{quote.totalSell ? formatCurrency(quote.totalSell) : "—"}</td>
                    <td className="px-6 py-3 text-right font-mono text-gray-600">
                      {quote.overallMargin ? `${Number(quote.overallMargin).toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">{formatDate(quote.dateCreated)}</td>
                  </tr>
                ))}
                {quotes.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      No quotes yet. Create your first quote to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
