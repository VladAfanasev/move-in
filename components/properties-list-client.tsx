"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { PropertiesGrid } from "@/components/properties-grid"
import { PropertiesHeader } from "@/components/properties-header"
import type { Property } from "@/lib/types"

interface PropertiesListClientProps {
  properties: Property[]
}

export function PropertiesListClient({ properties }: PropertiesListClientProps) {
  const router = useRouter()
  const [sortedProperties, setSortedProperties] = useState(properties)

  const handleViewDetails = (propertyId: string) => {
    router.push(`/dashboard/properties/${propertyId}`)
  }

  const handleSortChange = (sortValue: string) => {
    const sorted = [...properties].sort((a, b) => {
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
    setSortedProperties(sorted)
  }

  return (
    <>
      <PropertiesHeader totalCount={properties.length} onSortChange={handleSortChange} />
      <PropertiesGrid
        properties={sortedProperties}
        onViewDetails={handleViewDetails}
        emptyMessage="Er zijn nog geen woningen toegevoegd. Voeg de eerste woning toe om te beginnen."
      />
    </>
  )
}
