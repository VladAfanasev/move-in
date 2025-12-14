"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { PropertiesHeader } from "@/app/features/properties/components/properties-header"
import { PropertiesList } from "@/app/features/properties/components/properties-list"
import {
  PropertyFilters,
  type PropertyFilters as PropertyFiltersType,
} from "@/app/features/properties/components/property-filters"
import type { Property } from "@/lib/types"

interface PropertiesListWithFiltersProps {
  properties: Property[]
}

export function PropertiesListWithFilters({ properties }: PropertiesListWithFiltersProps) {
  const router = useRouter()
  const [filters, setFilters] = useState<PropertyFiltersType>({
    propertyType: [],
    status: [],
    priceMin: null,
    priceMax: null,
    bedroomsMin: null,
    bedroomsMax: null,
    city: "",
  })
  const [sortValue, setSortValue] = useState("newest")
  const [favorites, setFavorites] = useState<string[]>([])

  // Filter properties based on current filters
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Property type filter
      if (
        filters.propertyType.length > 0 &&
        !filters.propertyType.includes(property.propertyType)
      ) {
        return false
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(property.status)) {
        return false
      }

      // Price filter
      const price = parseFloat(property.price)
      if (filters.priceMin !== null && price < filters.priceMin) {
        return false
      }
      if (filters.priceMax !== null && price > filters.priceMax) {
        return false
      }

      // Bedrooms filter
      const bedrooms = property.bedrooms || 0
      if (filters.bedroomsMin !== null && bedrooms < filters.bedroomsMin) {
        return false
      }
      if (filters.bedroomsMax !== null && bedrooms > filters.bedroomsMax) {
        return false
      }

      // City filter
      if (filters.city && !property.city.toLowerCase().includes(filters.city.toLowerCase())) {
        return false
      }

      return true
    })
  }, [properties, filters])

  // Sort filtered properties
  const sortedProperties = useMemo(() => {
    return [...filteredProperties].sort((a, b) => {
      switch (sortValue) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "price-low":
          return parseFloat(a.price) - parseFloat(b.price)
        case "price-high":
          return parseFloat(b.price) - parseFloat(a.price)
        case "size-large":
          return (b.squareFeet || 0) - (a.squareFeet || 0)
        case "size-small":
          return (a.squareFeet || 0) - (b.squareFeet || 0)
        default:
          return 0
      }
    })
  }, [filteredProperties, sortValue])

  const handleViewDetails = (propertyId: string) => {
    router.push(`/dashboard/properties/${propertyId}`)
  }

  const handleToggleFavorite = (propertyId: string) => {
    setFavorites(prev =>
      prev.includes(propertyId) ? prev.filter(id => id !== propertyId) : [...prev, propertyId],
    )
  }

  return (
    <div className="flex gap-8">
      {/* Left Sidebar - Filters */}
      <div className="flex-shrink-0">
        <PropertyFilters onFiltersChange={setFilters} />
      </div>

      {/* Right Content - Properties List */}
      <div className="flex-1">
        <PropertiesHeader totalCount={sortedProperties.length} onSortChange={setSortValue} />
        <PropertiesList
          properties={sortedProperties}
          onViewDetails={handleViewDetails}
          onToggleFavorite={handleToggleFavorite}
          favorites={favorites}
          emptyMessage="Geen woningen gevonden die voldoen aan de filters. Probeer andere filters."
        />
      </div>
    </div>
  )
}
