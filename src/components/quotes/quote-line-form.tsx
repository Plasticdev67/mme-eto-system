"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
import { Plus, Trash2 } from "lucide-react"

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

type QuoteLine = {
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
}

export function QuoteLineForm({
  quoteId,
  catalogueItems,
  defaultOverhead,
  defaultMargin,
  onLineAdded,
}: {
  quoteId: string
  catalogueItems: CatalogueItem[]
  defaultOverhead: number
  defaultMargin: number
  onLineAdded?: () => void
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [labourHours, setLabourHours] = useState("")
  const [labourRate, setLabourRate] = useState("45")
  const [materialCost, setMaterialCost] = useState("")
  const [subcontractCost, setSubcontractCost] = useState("")
  const [plantCost, setPlantCost] = useState("")
  const [overheadPercent, setOverheadPercent] = useState(String(defaultOverhead))
  const [marginPercent, setMarginPercent] = useState(String(defaultMargin))
  const [catalogueItemId, setCatalogueItemId] = useState("")

  function handleCatalogueSelect(id: string) {
    setCatalogueItemId(id)
    if (id) {
      const item = catalogueItems.find((c) => c.id === id)
      if (item) {
        setDescription(item.description)
        setMaterialCost(String(item.guideMaterialCost || ""))
        setLabourHours(String(item.guideLabourHours || ""))
        setLabourRate(String(item.guideLabourRate || "45"))
        setSubcontractCost(String(item.guideSubcontractCost || ""))
        setPlantCost(String(item.guidePlantCost || ""))
      }
    }
  }

  // Live calculation
  const lh = Number(labourHours) || 0
  const lr = Number(labourRate) || 0
  const mc = Number(materialCost) || 0
  const sc = Number(subcontractCost) || 0
  const pc = Number(plantCost) || 0
  const qty = Number(quantity) || 1
  const oh = Number(overheadPercent) || 0
  const mg = Number(marginPercent) || 0

  const labourTotal = lh * lr
  const directCost = (labourTotal + mc + sc + pc) * qty
  const overheadCostCalc = directCost * (oh / 100)
  const costTotal = directCost + overheadCostCalc
  const sellPrice = mg < 100 ? costTotal / (1 - mg / 100) : costTotal
  const profit = sellPrice - costTotal

  async function handleSubmit() {
    if (!description.trim()) return
    setSaving(true)
    try {
      await fetch(`/api/quotes/${quoteId}/lines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogueItemId: catalogueItemId || null,
          description,
          quantity: qty,
          labourHours: lh,
          labourRate: lr,
          materialCost: mc,
          subcontractCost: sc,
          plantCost: pc,
          overheadPercent: oh,
          marginPercent: mg,
        }),
      })
      // Reset form
      setDescription("")
      setQuantity("1")
      setLabourHours("")
      setMaterialCost("")
      setSubcontractCost("")
      setPlantCost("")
      setCatalogueItemId("")
      if (onLineAdded) onLineAdded()
      else router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full rounded border border-border px-2 py-1.5 text-sm text-right focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"

  return (
    <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50/30 p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">From Catalogue</Label>
          <select
            value={catalogueItemId}
            onChange={(e) => handleCatalogueSelect(e.target.value)}
            className="w-full rounded border border-border bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Custom line item...</option>
            {catalogueItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.partCode} — {item.description}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-[2] space-y-1">
          <Label className="text-xs">Description *</Label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-border px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Line item description..."
          />
        </div>
        <div className="w-16 space-y-1">
          <Label className="text-xs">Qty</Label>
          <input value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Labour Hrs</Label>
          <input value={labourHours} onChange={(e) => setLabourHours(e.target.value)} className={inputClass} placeholder="0" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Labour Rate</Label>
          <input value={labourRate} onChange={(e) => setLabourRate(e.target.value)} className={inputClass} placeholder="45" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Materials</Label>
          <input value={materialCost} onChange={(e) => setMaterialCost(e.target.value)} className={inputClass} placeholder="0" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Subcontract</Label>
          <input value={subcontractCost} onChange={(e) => setSubcontractCost(e.target.value)} className={inputClass} placeholder="0" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Plant</Label>
          <input value={plantCost} onChange={(e) => setPlantCost(e.target.value)} className={inputClass} placeholder="0" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Overhead %</Label>
          <input value={overheadPercent} onChange={(e) => setOverheadPercent(e.target.value)} className={inputClass} placeholder="10" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Margin %</Label>
          <input value={marginPercent} onChange={(e) => setMarginPercent(e.target.value)} className={inputClass} placeholder="15" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-blue-200">
        <div className="flex items-center gap-6 text-sm">
          <span className="text-gray-500">Cost: <span className="font-mono font-medium text-gray-900">{formatCurrency(costTotal)}</span></span>
          <span className="text-gray-500">Sell: <span className="font-mono font-medium text-blue-700">{formatCurrency(sellPrice)}</span></span>
          <span className="text-gray-500">Profit: <span className={`font-mono font-medium ${profit >= 0 ? "text-green-700" : "text-red-600"}`}>{formatCurrency(profit)}</span></span>
        </div>
        <Button onClick={handleSubmit} disabled={saving || !description.trim()} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          {saving ? "Adding..." : "Add Line"}
        </Button>
      </div>
    </div>
  )
}

export function QuoteLineRow({
  line,
  quoteId,
  onDelete,
}: {
  line: QuoteLine
  quoteId: string
  onDelete?: () => void
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await fetch(`/api/quotes/${quoteId}/lines/${line.id}`, { method: "DELETE" })
      if (onDelete) onDelete()
      else router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-2.5 text-sm text-gray-900">
        {line.product?.partCode || line.catalogueItem?.partCode || "—"}
      </td>
      <td className="px-4 py-2.5 text-sm text-gray-900">{line.description}</td>
      <td className="px-4 py-2.5 text-center font-mono text-sm">{line.quantity}</td>
      <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-600">{Number(line.labourHours || 0)}h @ {formatCurrency(line.labourRate)}</td>
      <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-600">{formatCurrency(line.materialCost)}</td>
      <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-600">{formatCurrency(line.subcontractCost)}</td>
      <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-600">{Number(line.overheadPercent || 0)}%</td>
      <td className="px-4 py-2.5 text-right font-mono text-sm text-gray-900">{formatCurrency(line.costTotal)}</td>
      <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-600">{Number(line.marginPercent || 0)}%</td>
      <td className="px-4 py-2.5 text-right font-mono text-sm font-medium text-blue-700">{formatCurrency(line.sellPrice)}</td>
      <td className="px-4 py-2.5">
        <Button size="sm" variant="ghost" onClick={handleDelete} disabled={deleting}>
          <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
        </Button>
      </td>
    </tr>
  )
}
