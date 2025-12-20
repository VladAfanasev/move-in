"use client"

import type { User } from "@supabase/supabase-js"
import { Calculator } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { CostCalculationForm } from "@/app/features/cost-calculation/components/cost-calculation-form"
import { CostEditPanel } from "@/app/features/cost-calculation/components/cost-edit-panel"
import { Card } from "@/components/ui/card"

interface Property {
  id: string
  address: string
  city: string
  zipCode: string
  price: string
  squareFeet: number | null
  bedrooms: number | null
  bathrooms: string | null
  images?: string[] | null
}

interface Group {
  id: string
  name: string
}

interface Member {
  userId: string
  fullName: string | null
  email: string | null
  role: "owner" | "admin" | "member"
  status: "pending" | "active" | "left" | "removed"
}

interface CostCalculationPageClientProps {
  property: Property
  group: Group
  members: Member[]
  currentUser: User
  isSessionLocked?: boolean
}

export function CostCalculationPageClient({
  property,
  group,
  members,
  currentUser,
  isSessionLocked = false,
}: CostCalculationPageClientProps) {
  const [showCostEdit, setShowCostEdit] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="relative flex flex-1 flex-col space-y-4 p-4 sm:p-6">
      {/* Property Info Card with Integrated Costs - Mobile Optimized */}
      <Card className="overflow-hidden">
        <div className="flex flex-col">
          {/* Top: Property Image + Info */}
          <div className="flex">
            {/* Property Image - Mobile Responsive */}
            <div className="relative h-20 w-24 shrink-0 bg-muted sm:h-24 sm:w-32">
              <Image
                src={property.images?.[0] || "/placeholder-property.svg"}
                alt={property.address}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 96px, 128px"
              />
            </div>

            {/* Property Title Info */}
            <div className="flex flex-1 flex-col justify-center p-3 sm:p-4">
              <h1 className="flex items-center font-bold text-base sm:text-lg">
                <Calculator className="mr-2 h-4 w-4 text-primary" />
                {property.address}
              </h1>
              <p className="text-muted-foreground text-sm">
                {property.zipCode} {property.city}
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
                Vraagprijs:{" "}
                <span className="font-semibold">{formatCurrency(Number(property.price))}</span>
              </p>
            </div>
          </div>

          {/* Bottom: Total Costs Section - Clickable */}
          <div className="border-t bg-muted/30 px-3 py-3 sm:px-4 sm:py-4">
            <button
              type="button"
              className="-m-2 w-full rounded-md p-2 text-left transition-colors hover:bg-muted/50"
              onClick={() => setShowCostEdit(!showCostEdit)}
              aria-label="Open cost editor"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-muted-foreground text-sm">Totale kosten</div>
                  <div className="text-muted-foreground text-xs">
                    Koopprijs + alle bijkosten • Tik om te bewerken
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xl sm:text-2xl">
                    {formatCurrency(
                      Number(property.price) + 2500 + Number(property.price) * 0.02 + 750,
                    )}
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </Card>

      {/* Main Content - Cost Calculation Form */}
      <CostCalculationForm
        property={property}
        group={group}
        members={members}
        currentUser={currentUser}
        isSessionLocked={isSessionLocked}
      />

      {/* Cost Edit Panel - Mobile Optimized Overlay */}
      <div
        className={`fixed inset-0 z-50 transform bg-background shadow-2xl transition-transform duration-300 ease-in-out sm:inset-y-0 sm:right-0 sm:left-auto sm:w-96 ${
          showCostEdit
            ? "translate-x-0 translate-y-0"
            : "translate-y-full sm:translate-x-full sm:translate-y-0"
        }`}
      >
        <CostEditPanel property={property} onClose={() => setShowCostEdit(false)} />
      </div>

      {/* Backdrop */}
      {showCostEdit && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
          onClick={() => setShowCostEdit(false)}
          aria-label="Close cost editor"
        />
      )}
    </div>
  )
}
