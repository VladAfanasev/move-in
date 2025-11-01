"use client"

import { PropertyCard } from "@/components/property-card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Property } from "@/lib/types"

interface PropertiesGridProps {
  properties: Property[]
  isLoading?: boolean
  onViewDetails?: (propertyId: string) => void
  emptyMessage?: string
}

export function PropertiesGrid({
  properties,
  isLoading = false,
  onViewDetails,
  emptyMessage = "Geen woningen gevonden.",
}: PropertiesGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Suspense only
          <div key={index} className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="py-12 text-center">
        <h3 className="mb-2 font-medium text-gray-900 text-lg">Geen woningen</h3>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {properties.map(property => (
        <PropertyCard key={property.id} property={property} onViewDetails={onViewDetails} />
      ))}
    </div>
  )
}
