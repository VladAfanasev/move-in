"use client"

import { Home, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GroupPropertyCard } from "@/app/features/groups/components/group-property-card"
import { Button } from "@/components/ui/button"

import type { CachedProperty } from "@/lib/types"

interface GroupProperty {
  notes: string | null
  rating: number | null
  groupPropertyStatus: string | null
  addedAt: Date | string
  addedBy: string
  addedByName: string | null
  property: CachedProperty
}

interface Member {
  userId: string
  fullName: string | null
  email: string | null
  avatarUrl: string | null
  role: "owner" | "admin" | "member"
  status: "pending" | "active" | "left" | "removed"
  contributionAmount: string | null
  ownershipPercentage: string | null
  joinedAt: Date | string
}

interface GroupPropertiesSectionProps {
  groupProperties: GroupProperty[]
  members: Member[]
  groupId: string
  onCalculateCosts?: (propertyId: string) => void
  initialCompletedNegotiations?: string[]
}

export function GroupPropertiesSection({
  groupProperties,
  groupId,
  onCalculateCosts,
  initialCompletedNegotiations = [],
}: GroupPropertiesSectionProps) {
  const router = useRouter()
  const completedNegotiations = new Set(initialCompletedNegotiations)

  const handleCalculateCosts = (propertyId: string) => {
    if (onCalculateCosts) {
      onCalculateCosts(propertyId)
    } else {
      // Navigate to cost calculation page
      router.push(`/dashboard/groups/${groupId}/calculate/${propertyId}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Home className="h-5 w-5" />
            <h2 className="font-semibold text-lg">
              Opgeslagen woningen ({groupProperties.length})
            </h2>
          </div>
        </div>
      </div>

      {groupProperties.length === 0 ? (
        <div className="py-12 text-center">
          <Home className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 font-medium text-gray-900 text-lg">Nog geen woningen</h3>
          <p className="mt-2 text-gray-500">
            Ga naar de woningen pagina om woningen toe te voegen aan deze groep.
          </p>
          <div className="mt-6">
            <Link href="/dashboard/properties">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Woningen bekijken
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {groupProperties.map(groupProperty => (
            <GroupPropertyCard
              key={groupProperty.property.id}
              property={groupProperty.property}
              notes={groupProperty.notes}
              rating={groupProperty.rating}
              addedAt={groupProperty.addedAt}
              addedByName={groupProperty.addedByName}
              onCalculateCosts={handleCalculateCosts}
              hasCompletedNegotiation={completedNegotiations.has(groupProperty.property.id)}
              groupId={groupId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
