"use client"

import { Home, Plus } from "lucide-react"
import Link from "next/link"
import { GroupPropertyCard } from "@/components/group-property-card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface GroupProperty {
  notes: string | null
  rating: number | null
  groupPropertyStatus: string | null
  addedAt: Date
  addedBy: string
  addedByName: string | null
  property: {
    id: string
    description: string | null
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    price: string
    bedrooms: number | null
    bathrooms: string | null
    squareFeet: number | null
    lotSize: string | null
    yearBuilt: number | null
    propertyType: "house" | "apartment"
    status: "available" | "in_option" | "sold" | "archived"
    images: string[] | null
    features: string[] | null
    metadata: unknown
    createdAt: Date
    updatedAt: Date
    listedBy: string
  }
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
  joinedAt: Date
}

interface GroupPropertiesSectionProps {
  groupProperties: GroupProperty[]
  members: Member[]
  onCalculateCosts?: (propertyId: string) => void
}

export function GroupPropertiesSection({
  groupProperties,
  onCalculateCosts,
}: GroupPropertiesSectionProps) {
  const handleCalculateCosts = (propertyId: string) => {
    // For now, just call the callback or show a placeholder
    if (onCalculateCosts) {
      onCalculateCosts(propertyId)
    } else {
      // Placeholder for future cost calculation feature
      console.log("Cost calculation for property:", propertyId)
      alert("Kostencalculatie functie komt binnenkort beschikbaar!")
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
        <div className="space-y-4">
          {groupProperties.map((groupProperty, index) => (
            <div key={groupProperty.property.id}>
              <GroupPropertyCard
                property={groupProperty.property}
                notes={groupProperty.notes}
                rating={groupProperty.rating}
                addedAt={groupProperty.addedAt}
                addedByName={groupProperty.addedByName}
                onCalculateCosts={handleCalculateCosts}
              />
              {index < groupProperties.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
