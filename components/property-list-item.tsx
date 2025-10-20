"use client"

import clsx from "clsx"
import { Bath, Bed, Heart, VectorSquare } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Property } from "@/lib/types"

interface PropertyListItemProps {
  property: Property
  onViewDetails?: (propertyId: string) => void
  onToggleFavorite?: (propertyId: string) => void
  isFavorite?: boolean
}

export function PropertyListItem({
  property,
  onViewDetails,
  onToggleFavorite,
  isFavorite = false,
}: PropertyListItemProps) {
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
        return "bg-green-100 text-green-800"
      case "in_option":
        return "bg-yellow-100 text-yellow-800"
      case "sold":
        return "bg-red-100 text-red-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
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

  const primaryImage = property.images?.[0] || "/placeholder-property.jpg"

  return (
    <Card className="overflow-hidden rounded-none border-none shadow-none">
      <CardContent className="p-0">
        <div className="flex">
          {/* Image */}
          <div className="relative h-48 w-64 flex-shrink-0">
            <Image
              src={primaryImage}
              alt={property.address}
              fill
              className="rounded-lg object-cover"
              sizes="256px"
            />
            {property.status !== "available" ? (
              <div className="absolute top-3 left-3">
                <Badge className={getStatusColor(property.status)}>
                  {getStatusText(property.status)}
                </Badge>
              </div>
            ) : null}

            <div className="absolute top-3 right-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 bg-white/80 p-1 hover:bg-white"
                onClick={() => onToggleFavorite?.(property.id)}
              >
                <Heart
                  className={`h-4 w-4 ${
                    isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
                  }`}
                />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col justify-between px-4">
            <div>
              {/* Header */}
              <div className="mb-2 flex flex-col items-start space-y-4">
                <button
                  type="button"
                  onClick={() => onViewDetails?.(property.id)}
                  className="flex h-full flex-col text-left"
                >
                  <h3 className="mb-1 line-clamp-1 font-semibold text-lg">{property.address}</h3>
                  <div className="flex items-center text-gray-600 text-sm">
                    {property.zipCode} {property.city}
                  </div>
                </button>
                <div className="grid gap-2">
                  <div
                    className={clsx(
                      "font-bold text-lg",
                      property.status !== "available" ? "line-through" : "",
                    )}
                  >
                    <span>{formatPrice(property.price)}</span>
                    <span className="ml-1">k.k.</span>
                  </div>
                  {/* Property Details */}
                  <div className="mb-3 flex items-center gap-6 text-sm">
                    {property.squareFeet && (
                      <div className="flex items-center">
                        <VectorSquare className="mr-1 h-4 w-4 text-gray-500" />
                        <span>{Math.round(Number(property.squareFeet))} m²</span>
                      </div>
                    )}
                    {property.lotSize && (
                      <div className="flex items-center">
                        <VectorSquare className="mr-1 h-4 w-4 text-gray-500" />
                        <span>{Math.round(Number(property.lotSize))} m²</span>
                      </div>
                    )}
                    {property.bedrooms && (
                      <div className="flex items-center">
                        <Bed className="mr-1 h-5 w-5 text-gray-500" />
                        <span>{Math.round(Number(property.bedrooms))}</span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center">
                        <Bath className="mr-1 h-4 w-4 text-gray-500" />
                        <span>{Math.round(Number(property.bathrooms))}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
