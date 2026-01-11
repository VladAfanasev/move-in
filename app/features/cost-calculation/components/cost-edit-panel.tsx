"use client"

import { X } from "lucide-react"
import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Property {
  id: string
  price: string
}

interface CostEditPanelProps {
  property: Property
  onClose: () => void
}

export function CostEditPanel({ property, onClose }: CostEditPanelProps) {
  const formId = useId()

  // Cost calculation state
  const [costs, setCosts] = useState({
    purchasePrice: Number(property.price),
    notaryFees: 2500,
    transferTax: 0, // Will be calculated
    renovationCosts: 0,
    brokerFees: 0,
    inspectionCosts: 750,
    otherCosts: 0,
  })

  // Calculate derived values
  const transferTax = costs.purchasePrice * 0.02 // 2% transfer tax in Netherlands
  const totalCosts =
    costs.purchasePrice +
    costs.notaryFees +
    transferTax +
    costs.renovationCosts +
    costs.brokerFees +
    costs.inspectionCosts +
    costs.otherCosts

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b bg-background p-4 sm:p-6">
        <h2 className="font-semibold text-lg">Kosten bewerken</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor={`${formId}-purchasePrice`}>Koopprijs</Label>
            <Input
              id={`${formId}-purchasePrice`}
              type="number"
              value={costs.purchasePrice}
              onChange={e => setCosts(prev => ({ ...prev, purchasePrice: Number(e.target.value) }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor={`${formId}-notaryFees`}>Notariskosten</Label>
            <Input
              id={`${formId}-notaryFees`}
              type="number"
              value={costs.notaryFees}
              onChange={e => setCosts(prev => ({ ...prev, notaryFees: Number(e.target.value) }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Overdrachtsbelasting (2%)</Label>
            <Input value={formatCurrency(transferTax)} disabled className="mt-1 bg-muted" />
          </div>

          <div>
            <Label htmlFor={`${formId}-renovationCosts`}>Renovatiekosten</Label>
            <Input
              id={`${formId}-renovationCosts`}
              type="number"
              value={costs.renovationCosts || ""}
              placeholder="0"
              onChange={e =>
                setCosts(prev => ({ ...prev, renovationCosts: Number(e.target.value) || 0 }))
              }
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor={`${formId}-inspectionCosts`}>Inspecties</Label>
            <Input
              id={`${formId}-inspectionCosts`}
              type="number"
              value={costs.inspectionCosts || ""}
              placeholder="0"
              onChange={e =>
                setCosts(prev => ({ ...prev, inspectionCosts: Number(e.target.value) || 0 }))
              }
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor={`${formId}-otherCosts`}>Overige kosten</Label>
            <Input
              id={`${formId}-otherCosts`}
              type="number"
              value={costs.otherCosts || ""}
              placeholder="0"
              onChange={e =>
                setCosts(prev => ({ ...prev, otherCosts: Number(e.target.value) || 0 }))
              }
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor={`${formId}-brokerFees`}>Makelaarkosten</Label>
            <Input
              id={`${formId}-brokerFees`}
              type="number"
              value={costs.brokerFees || ""}
              placeholder="0"
              onChange={e =>
                setCosts(prev => ({ ...prev, brokerFees: Number(e.target.value) || 0 }))
              }
              className="mt-1"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between font-semibold text-lg">
            <span>Totale kosten:</span>
            <span>{formatCurrency(totalCosts)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons - Sticky at bottom */}
      <div className="border-t bg-background p-4 sm:p-6">
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
          <Button onClick={onClose} className="flex-1">
            Opslaan
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuleren
          </Button>
        </div>
      </div>
    </div>
  )
}
