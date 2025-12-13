"use client"

import type { User } from "@supabase/supabase-js"
import { Calculator } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { CostCalculationForm } from "@/components/cost-calculation-form"
import { CostEditPanel } from "@/components/cost-edit-panel"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

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
    <div className="relative flex flex-1 flex-col space-y-4 p-6">
      {/* Property Info & Cost Summary Row - Fixed Layout */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Property Info */}
        <Card className="overflow-hidden">
          <div className="flex">
            {/* Left side: Property Image + Title (60%) */}
            <div className="flex w-3/5">
              {/* Property Image - Compact */}
              <div className="relative h-24 w-32 bg-muted">
                <Image
                  src={property.images?.[0] || "/placeholder-property.svg"}
                  alt={property.address}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>

              {/* Property Title Info */}
              <div className="flex flex-1 flex-col justify-center p-4">
                <h1 className="flex items-center font-bold text-lg">
                  <Calculator className="mr-2 h-4 w-4 text-primary" />
                  {property.address}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {property.zipCode} {property.city}
                </p>
              </div>
            </div>

            {/* Right side: Vraagprijs only (40%) */}
            <div className="flex w-2/5 flex-col justify-center p-4">
              <div className="text-center">
                <div className="font-semibold text-xl">
                  {formatCurrency(Number(property.price))}
                </div>
                <div className="text-muted-foreground text-xs">Vraagprijs</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Total Costs Summary */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Totale kosten</CardTitle>
                <p className="text-muted-foreground text-sm">Koopprijs + alle bijkosten</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  className="text-muted-foreground"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCostEdit(!showCostEdit)}
                >
                  {showCostEdit ? "Verberg kosten" : "Bekijk/Bewerk kosten"}
                </Button>
                <div className="text-right">
                  <div className="font-bold text-2xl">
                    {formatCurrency(
                      Number(property.price) + 2500 + Number(property.price) * 0.02 + 750,
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Main Content - Cost Calculation Form */}
      <CostCalculationForm
        property={property}
        group={group}
        members={members}
        currentUser={currentUser}
        isSessionLocked={isSessionLocked}
      />

      {/* Cost Edit Panel - Floating Overlay */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-96 transform bg-background shadow-2xl transition-transform duration-300 ease-in-out ${
          showCostEdit ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <CostEditPanel property={property} onClose={() => setShowCostEdit(false)} />
      </div>

      {/* Backdrop */}
      {showCostEdit && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
          onClick={() => setShowCostEdit(false)}
        />
      )}
    </div>
  )
}
