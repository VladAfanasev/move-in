"use client"

import { PropertyListItem } from "@/app/features/properties/components/property-list-item"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { Property } from "@/lib/types"

interface PropertiesListProps {
  properties: Property[]
  isLoading?: boolean
  onViewDetails?: (propertyId: string) => void
  onToggleFavorite?: (propertyId: string) => void
  favorites?: string[]
  emptyMessage?: string
}

export function PropertiesList({
  properties,
  isLoading = false,
  onViewDetails,
  onToggleFavorite,
  favorites = [],
  emptyMessage = "Geen woningen gevonden.",
}: PropertiesListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: Loading skeleton only
          <div key={index} className="flex overflow-hidden rounded-lg border">
            <Skeleton className="h-48 w-64 flex-shrink-0" />
            <div className="flex flex-1 flex-col justify-between p-6">
              <div>
                <Skeleton className="mb-2 h-6 w-3/4" />
                <Skeleton className="mb-3 h-4 w-1/2" />
                <div className="mb-3 flex gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="mb-3 h-4 w-full" />
                <Skeleton className="mb-4 h-4 w-2/3" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-10 w-32" />
              </div>
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
    <>
      {properties.map((property, index) => (
        <div key={property.id}>
          <PropertyListItem
            key={property.id}
            property={property}
            onViewDetails={onViewDetails}
            onToggleFavorite={onToggleFavorite}
            isFavorite={favorites.includes(property.id)}
          />
          {index < properties.length - 1 && <Separator className="my-4" />}
        </div>
      ))}
    </>
  )
}
