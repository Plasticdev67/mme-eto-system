"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Check, X } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

type CatalogueItem = {
  id: string
  partCode: string
  description: string
  classId: string
  active: boolean
  guideMaterialCost: string | number | null
  guideLabourHours: string | number | null
  guideLabourRate: string | number | null
  guideSubcontractCost: string | number | null
  guidePlantCost: string | number | null
  _count: { products: number }
}

export function EditCatalogueRow({ item }: { item: CatalogueItem }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  const [description, setDescription] = useState(item.description)
  const [guideMaterialCost, setGuideMaterialCost] = useState(String(item.guideMaterialCost || ""))
  const [guideLabourHours, setGuideLabourHours] = useState(String(item.guideLabourHours || ""))
  const [guideLabourRate, setGuideLabourRate] = useState(String(item.guideLabourRate || ""))
  const [guideSubcontractCost, setGuideSubcontractCost] = useState(String(item.guideSubcontractCost || ""))
  const [guidePlantCost, setGuidePlantCost] = useState(String(item.guidePlantCost || ""))

  useEffect(() => {
    if (editing && nameRef.current) nameRef.current.focus()
  }, [editing])

  const guideCost =
    (Number(guideLabourHours || 0) * Number(guideLabourRate || 0)) +
    Number(guideMaterialCost || 0) +
    Number(guideSubcontractCost || 0) +
    Number(guidePlantCost || 0)

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/catalogue/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          guideMaterialCost: guideMaterialCost || null,
          guideLabourHours: guideLabourHours || null,
          guideLabourRate: guideLabourRate || null,
          guideSubcontractCost: guideSubcontractCost || null,
          guidePlantCost: guidePlantCost || null,
        }),
      })
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setDescription(item.description)
    setGuideMaterialCost(String(item.guideMaterialCost || ""))
    setGuideLabourHours(String(item.guideLabourHours || ""))
    setGuideLabourRate(String(item.guideLabourRate || ""))
    setGuideSubcontractCost(String(item.guideSubcontractCost || ""))
    setGuidePlantCost(String(item.guidePlantCost || ""))
    setEditing(false)
  }

  const inputClass = "w-full rounded border border-border px-2 py-1 text-sm text-right focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
  const smallInput = "w-20 rounded border border-border px-2 py-1 text-xs text-right focus:border-blue-500 focus:outline-none"

  if (editing) {
    return (
      <tr className="bg-blue-50/30">
        <td className="px-4 py-2 font-mono text-xs font-medium text-gray-700">{item.partCode}</td>
        <td className="px-4 py-2">
          <input ref={nameRef} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
        </td>
        <td className="px-4 py-2"><input value={guideMaterialCost} onChange={(e) => setGuideMaterialCost(e.target.value)} className={smallInput} placeholder="0" /></td>
        <td className="px-4 py-2"><input value={guideLabourHours} onChange={(e) => setGuideLabourHours(e.target.value)} className={smallInput} placeholder="0" /></td>
        <td className="px-4 py-2"><input value={guideLabourRate} onChange={(e) => setGuideLabourRate(e.target.value)} className={smallInput} placeholder="0" /></td>
        <td className="px-4 py-2"><input value={guideSubcontractCost} onChange={(e) => setGuideSubcontractCost(e.target.value)} className={smallInput} placeholder="0" /></td>
        <td className="px-4 py-2"><input value={guidePlantCost} onChange={(e) => setGuidePlantCost(e.target.value)} className={smallInput} placeholder="0" /></td>
        <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">{formatCurrency(guideCost)}</td>
        <td className="px-4 py-2 text-center text-xs text-gray-500">{item._count.products}</td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={handleSave} disabled={saving}>
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              <X className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </td>
      </tr>
    )
  }

  const actualGuideCost =
    (Number(item.guideLabourHours || 0) * Number(item.guideLabourRate || 0)) +
    Number(item.guideMaterialCost || 0) +
    Number(item.guideSubcontractCost || 0) +
    Number(item.guidePlantCost || 0)

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-2 font-mono text-xs font-medium text-gray-700">{item.partCode}</td>
      <td className="px-4 py-2 text-sm text-gray-900">{item.description}</td>
      <td className="px-4 py-2 text-right text-xs text-gray-600">{item.guideMaterialCost ? formatCurrency(item.guideMaterialCost) : "—"}</td>
      <td className="px-4 py-2 text-right text-xs text-gray-600">{item.guideLabourHours ? `${item.guideLabourHours}h` : "—"}</td>
      <td className="px-4 py-2 text-right text-xs text-gray-600">{item.guideLabourRate ? formatCurrency(item.guideLabourRate) : "—"}</td>
      <td className="px-4 py-2 text-right text-xs text-gray-600">{item.guideSubcontractCost ? formatCurrency(item.guideSubcontractCost) : "—"}</td>
      <td className="px-4 py-2 text-right text-xs text-gray-600">{item.guidePlantCost ? formatCurrency(item.guidePlantCost) : "—"}</td>
      <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">
        {actualGuideCost > 0 ? formatCurrency(actualGuideCost) : "—"}
      </td>
      <td className="px-4 py-2 text-center">
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">{item._count.products}</Badge>
      </td>
      <td className="px-4 py-2">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4 text-gray-400" />
        </Button>
      </td>
    </tr>
  )
}
