"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate, prettifyEnum } from "@/lib/utils"
import { QuoteLineForm, QuoteLineRow } from "@/components/quotes/quote-line-form"
import { QuoteStatusActions } from "@/components/quotes/quote-status-actions"
import { ArrowLeft, FileText, Building2, User, Calendar, Hash } from "lucide-react"

type Quote = {
  id: string
  quoteNumber: string
  revisionNumber: number
  status: string
  dateCreated: string
  dateSubmitted: string | null
  validUntil: string | null
  totalCost: string | number | null
  totalSell: string | number | null
  overallMargin: string | number | null
  notes: string | null
  project: {
    id: string
    projectNumber: string
    name: string
    customer: { name: string } | null
    products: { id: string; partCode: string; description: string; quantity: number; catalogueItemId: string | null }[]
  }
  createdBy: { name: string } | null
  quoteLines: {
    id: string
    description: string
    quantity: number
    labourHours: string | number | null
    labourRate: string | number | null
    labourCost: string | number | null
    materialCost: string | number | null
    subcontractCost: string | number | null
    plantCost: string | number | null
    overheadPercent: string | number | null
    overheadCost: string | number | null
    costTotal: string | number | null
    marginPercent: string | number | null
    sellPrice: string | number | null
    product?: { partCode: string; description: string } | null
    catalogueItem?: { partCode: string; description: string } | null
  }[]
}

type CatalogueItem = {
  id: string
  partCode: string
  description: string
  guideMaterialCost: string | number | null
  guideLabourHours: string | number | null
  guideLabourRate: string | number | null
  guideSubcontractCost: string | number | null
  guidePlantCost: string | number | null
}

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

export default function QuoteDetailPage() {
  const router = useRouter()
  const params = useParams()
  const quoteId = params.id as string

  const [quote, setQuote] = useState<Quote | null>(null)
  const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([])
  const [loading, setLoading] = useState(true)

  async function loadQuote() {
    const res = await fetch(`/api/quotes/${quoteId}`)
    if (res.ok) {
      const data = await res.json()
      setQuote(data)
    }
  }

  async function loadCatalogue() {
    const res = await fetch("/api/catalogue")
    if (res.ok) {
      const data = await res.json()
      setCatalogueItems(data)
    }
  }

  useEffect(() => {
    Promise.all([loadQuote(), loadCatalogue()]).then(() => setLoading(false))
  }, [quoteId])

  function handleLineAdded() {
    loadQuote()
  }

  function handleStatusChange() {
    loadQuote()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading quote...</div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="space-y-4">
        <Link href="/quotes" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Back to Quotes
        </Link>
        <div className="py-20 text-center text-gray-500">Quote not found.</div>
      </div>
    )
  }

  const totalCost = Number(quote.totalCost) || 0
  const totalSell = Number(quote.totalSell) || 0
  const overallMargin = Number(quote.overallMargin) || 0
  const profit = totalSell - totalCost

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/quotes" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to Quotes
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">{quote.quoteNumber}</h1>
            <Badge variant="secondary" className={getQuoteStatusColor(quote.status)}>
              {prettifyEnum(quote.status)}
            </Badge>
            <span className="text-xs text-gray-400">Rev {quote.revisionNumber}</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {quote.project.projectNumber} — {quote.project.name}
          </p>
        </div>
        <QuoteStatusActions
          quoteId={quote.id}
          currentStatus={quote.status}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Quote Info Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Building2 className="h-3.5 w-3.5" /> Customer
            </div>
            <div className="text-sm font-medium text-gray-900">
              {quote.project.customer?.name || "No customer"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <User className="h-3.5 w-3.5" /> Created By
            </div>
            <div className="text-sm font-medium text-gray-900">
              {quote.createdBy?.name || "Unknown"}
            </div>
            <div className="text-xs text-gray-400">{formatDate(quote.dateCreated)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Calendar className="h-3.5 w-3.5" /> Submitted
            </div>
            <div className="text-sm font-medium text-gray-900">
              {quote.dateSubmitted ? formatDate(quote.dateSubmitted) : "Not yet"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Calendar className="h-3.5 w-3.5" /> Valid Until
            </div>
            <div className="text-sm font-medium text-gray-900">
              {quote.validUntil ? formatDate(quote.validUntil) : "Not set"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Totals Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div>
                <div className="text-xs text-gray-500 uppercase">Total Cost</div>
                <div className="text-lg font-mono font-medium text-gray-900">{formatCurrency(totalCost)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Total Sell</div>
                <div className="text-lg font-mono font-semibold text-blue-700">{formatCurrency(totalSell)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Profit</div>
                <div className={`text-lg font-mono font-medium ${profit >= 0 ? "text-green-700" : "text-red-600"}`}>
                  {formatCurrency(profit)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Margin</div>
                <div className={`text-lg font-mono font-medium ${overallMargin >= 0 ? "text-green-700" : "text-red-600"}`}>
                  {overallMargin.toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {quote.quoteLines.length} line{quote.quoteLines.length !== 1 ? "s" : ""}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Part Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Labour</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Materials</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Subcontract</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Overhead</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Margin</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Sell</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quote.quoteLines.map((line) => (
                  <QuoteLineRow key={line.id} line={line} quoteId={quote.id} onDelete={handleLineAdded} />
                ))}
                {quote.quoteLines.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-6 py-8 text-center text-gray-400">
                      No line items yet. Add your first line below.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Line Form */}
      {quote.status === "DRAFT" && (
        <QuoteLineForm
          quoteId={quote.id}
          catalogueItems={catalogueItems}
          defaultOverhead={10}
          defaultMargin={15}
          onLineAdded={handleLineAdded}
        />
      )}

      {/* Notes */}
      {quote.notes && (
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium uppercase text-gray-500 mb-2">Notes</div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
