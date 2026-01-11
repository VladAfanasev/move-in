"use client"

import type { User } from "@supabase/supabase-js"
import { Calculator } from "lucide-react"
import Image from "next/image"
import { useMemo, useState } from "react"
import { CostCalculationForm } from "@/app/features/cost-calculation/components/cost-calculation-form"
import { CostEditPanel } from "@/app/features/cost-calculation/components/cost-edit-panel"
import { Card, CardContent } from "@/components/ui/card"
import { PropertyGoalIndicator } from "@/components/ui/property-goal-indicator"
import { useRealtimeSession } from "@/hooks/use-realtime-session"

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

interface SessionMember {
  userId: string
  name: string
  percentage: number
  status: "adjusting" | "confirmed"
  isOnline?: boolean
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
  const [yourPercentage, setYourPercentage] = useState(25)
  const [yourStatus, setYourStatus] = useState<"adjusting" | "confirmed">("adjusting")
  const [remoteMemberData, setRemoteMemberData] = useState<
    Record<
      string,
      {
        percentage: number
        status: "adjusting" | "confirmed"
      }
    >
  >({})

  // Real-time session management
  const {
    onlineMembers,
    isConnected,
    connectionQuality,
    emitPercentageUpdate,
    emitStatusChange,
    getOnlineMemberCount,
  } = useRealtimeSession({
    sessionId: `${group.id}-${property.id}`,
    userId: currentUser.id,
    onPercentageUpdate: data => {
      setRemoteMemberData(prev => ({
        ...prev,
        [data.userId]: {
          percentage: data.percentage,
          status: data.status as "adjusting" | "confirmed",
        },
      }))
    },
    onStatusChange: data => {
      setRemoteMemberData(prev => ({
        ...prev,
        [data.userId]: {
          ...prev[data.userId],
          status: data.status as "adjusting" | "confirmed",
        },
      }))
    },
  })

  // Derive session members from actual members and real-time data
  const sessionMembers = useMemo<SessionMember[]>(() => {
    const activeMembers = members.filter(member => member.status === "active")

    return activeMembers
      .sort((a, b) => {
        // Current user always comes first
        if (a.userId === currentUser.id) return -1
        if (b.userId === currentUser.id) return 1
        // Then sort alphabetically by name
        const nameA = a.fullName || a.email || "Unknown User"
        const nameB = b.fullName || b.email || "Unknown User"
        return nameA.localeCompare(nameB)
      })
      .map(member => ({
        userId: member.userId,
        name: member.fullName || member.email || "Unknown User",
        percentage: remoteMemberData[member.userId]?.percentage ?? 25,
        status: remoteMemberData[member.userId]?.status ?? "adjusting",
        isOnline: onlineMembers.includes(member.userId),
      }))
  }, [members, currentUser.id, onlineMembers, remoteMemberData])

  // Calculate session totals - derived state
  const totalPercentage = useMemo(() => {
    return sessionMembers.reduce((sum, member) => {
      if (member.userId === currentUser.id) {
        return sum + yourPercentage
      }
      return sum + member.percentage
    }, 0)
  }, [sessionMembers, yourPercentage, currentUser.id])

  const allConfirmed = useMemo(() => {
    return sessionMembers.every(member =>
      member.userId === currentUser.id ? yourStatus === "confirmed" : member.status === "confirmed",
    )
  }, [sessionMembers, yourStatus, currentUser.id])

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
      {/* Desktop: 2-column layout (left: property+progress, right: members) */}
      {/* Mobile: Stack vertically (property, progress, members) */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left Column: Property Info + Progress Circle (stacked on desktop, separate on mobile) */}
        <div className="flex flex-col space-y-4">
          {/* Property Info Card with Integrated Costs - Mobile Optimized */}
          <Card className="overflow-hidden">
            <div className="flex flex-col">
              {/* Top: Property Image + Info */}
              <div className="flex">
                {/* Property Image - Mobile Responsive */}
                <div className="relative h-auto w-24 shrink-0 bg-muted sm:w-32">
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
                      <div className="font-semibold text-muted-foreground text-sm">
                        Totale kosten
                      </div>
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

          {/* Progress Circle Card */}
          <Card>
            <CardContent className="py-6">
              <PropertyGoalIndicator
                percentage={totalPercentage}
                allConfirmed={allConfirmed}
                memberCount={sessionMembers.length}
                size="md"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Members (Cost Calculation Form) */}
        <div className="lg:col-span-1">
          <CostCalculationForm
            property={property}
            group={group}
            members={members}
            currentUser={currentUser}
            isSessionLocked={isSessionLocked}
            sessionMembers={sessionMembers}
            yourPercentage={yourPercentage}
            setYourPercentage={setYourPercentage}
            yourStatus={yourStatus}
            setYourStatus={setYourStatus}
            loading={false}
            totalPercentage={totalPercentage}
            allConfirmed={allConfirmed}
            hideProgressCircle={true}
            onlineMembers={onlineMembers}
            isConnected={isConnected}
            connectionQuality={connectionQuality}
            emitPercentageUpdate={emitPercentageUpdate}
            emitStatusChange={emitStatusChange}
            getOnlineMemberCount={getOnlineMemberCount}
          />
        </div>
      </div>

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
