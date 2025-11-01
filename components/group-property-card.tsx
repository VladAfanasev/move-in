"use client"

import clsx from "clsx"
import { Bath, Bed, Calculator, MapPin, VectorSquare } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Property } from "@/lib/types"

interface GroupPropertyCardProps {
  property: Property
  notes?: string | null
  rating?: number | null
  addedAt: Date
  addedByName?: string | null
  onCalculateCosts?: (propertyId: string) => void
}

export function GroupPropertyCard({
  property,
  notes,
  rating,
  addedAt,
  addedByName,
  onCalculateCosts,
}: GroupPropertyCardProps) {
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  const primaryImage = property.images?.[0] || "/placeholder-property.svg"

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex">
          {/* Image */}
          <div className="relative h-48 w-64 flex-shrink-0">
            <Image
              src={primaryImage}
              alt={property.address}
              fill
              className="object-cover"
              sizes="256px"
            />
            {property.status !== "available" ? (
              <div className="absolute top-3 left-3">
                <Badge className={getStatusColor(property.status)}>
                  {getStatusText(property.status)}
                </Badge>
              </div>
            ) : null}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col justify-between p-6">
            <div>
              {/* Header */}
              <div className="mb-4">
                <h3 className="mb-1 line-clamp-1 font-semibold text-lg">{property.address}</h3>
                <div className="flex items-center text-gray-600 text-sm">
                  <MapPin className="mr-1 h-4 w-4" />
                  {property.zipCode} {property.city}
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <div
                  className={clsx(
                    "font-bold text-xl",
                    property.status !== "available" ? "line-through" : "",
                  )}
                >
                  <span>{formatPrice(property.price)}</span>
                  <span className="ml-1 text-sm">k.k.</span>
                </div>
              </div>

              {/* Property Details */}
              <div className="mb-4 flex items-center gap-6 text-sm">
                {property.squareFeet && (
                  <div className="flex items-center">
                    <VectorSquare className="mr-1 h-4 w-4 text-gray-500" />
                    <span>{Math.round(Number(property.squareFeet))} m²</span>
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

              {/* Group-specific info */}
              <div className="space-y-2">
                {notes && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Notities:</span>
                    <p className="text-gray-600">{notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-gray-500 text-xs">
                  <span>
                    Toegevoegd op {formatDate(addedAt)}
                    {addedByName && ` door ${addedByName}`}
                  </span>
                  {rating && (
                    <div className="flex items-center">
                      <span className="mr-1">Beoordeling:</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={`star-${i}`}
                            className={i < rating ? "text-yellow-400" : "text-gray-300"}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => onCalculateCosts?.(property.id)}
                className="bg-primary hover:bg-primary/90"
              >
                <Calculator className="mr-2 h-4 w-4" />
                Kosten berekenen
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
