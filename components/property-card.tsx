"use client"

import { Bath, Bed, Calendar, MapPin, Square } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { Property } from "@/lib/types"

interface PropertyCardProps {
  property: Property
  onViewDetails?: (propertyId: string) => void
}

export function PropertyCard({ property, onViewDetails }: PropertyCardProps) {
  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price)
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "in_option":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "sold":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      case "archived":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Beschikbaar"
      case "in_option":
        return "In optie"
      case "sold":
        return "Verkocht"
      case "archived":
        return "Gearchiveerd"
      default:
        return status
    }
  }

  const primaryImage = property.images?.[0] || "/placeholder-property.svg"

  return (
    <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-lg">
      <div className="relative h-48 w-full">
        <Image
          src={primaryImage}
          alt={property.address}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-3 left-3">
          <Badge className={`${getStatusColor(property.status)}`}>
            {getStatusText(property.status)}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-white/90 text-gray-900">
            {property.propertyType === "house" ? "Huis" : "Appartement"}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="line-clamp-1 font-semibold text-lg">{property.address}</h3>
          <div className="flex items-center font-bold text-green-600 text-lg">
            {formatPrice(property.price)}
          </div>
        </div>
        <div className="flex items-center text-gray-600 text-sm">
          <MapPin className="mr-1 h-4 w-4" />
          {property.city}, {property.state}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-4 grid grid-cols-2 gap-3">
          {property.bedrooms && (
            <div className="flex items-center text-sm">
              <Bed className="mr-2 h-4 w-4 text-gray-500" />
              <span>{property.bedrooms} kamers</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center text-sm">
              <Bath className="mr-2 h-4 w-4 text-gray-500" />
              <span>{property.bathrooms} badkamers</span>
            </div>
          )}
          {property.squareFeet && (
            <div className="flex items-center text-sm">
              <Square className="mr-2 h-4 w-4 text-gray-500" />
              <span>{property.squareFeet} m²</span>
            </div>
          )}
          {property.yearBuilt && (
            <div className="flex items-center text-sm">
              <Calendar className="mr-2 h-4 w-4 text-gray-500" />
              <span>{property.yearBuilt}</span>
            </div>
          )}
        </div>

        <Button className="w-full" onClick={() => onViewDetails?.(property.id)}>
          Bekijk details
        </Button>
      </CardContent>
    </Card>
  )
}
