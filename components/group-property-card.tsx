"use client"

import clsx from "clsx"
import { Bath, Bed, Calculator, Clock, MapPin, MessageSquare, User } from "lucide-react"
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "available":
        return {
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          text: "Beschikbaar",
        }
      case "in_option":
        return {
          color: "bg-amber-50 text-amber-700 border-amber-200",
          text: "In optie",
        }
      case "sold":
        return {
          color: "bg-red-50 text-red-700 border-red-200",
          text: "Verkocht",
        }
      case "archived":
        return {
          color: "bg-slate-50 text-slate-700 border-slate-200",
          text: "Gearchiveerd",
        }
      default:
        return {
          color: "bg-slate-50 text-slate-700 border-slate-200",
          text: status,
        }
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
  const statusConfig = getStatusConfig(property.status)
  const isUnavailable = property.status !== "available"

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-primary/5 hover:shadow-xl">
      {/* Image Section with Compact Aspect Ratio */}
      <div className="relative aspect-[16/9] overflow-hidden bg-muted sm:aspect-[3/2]">
        <Image
          src={primaryImage}
          alt={property.address}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Status Badge */}
        {isUnavailable && (
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className={clsx("border font-medium", statusConfig.color)}>
              {statusConfig.text}
            </Badge>
          </div>
        )}

        {/* Price Overlay */}
        <div className="absolute right-3 bottom-3 left-3">
          <div className="w-fit rounded-md bg-white/80 px-3 py-2 shadow-lg backdrop-blur-sm">
            <div
              className={clsx(
                "font-bold text-lg text-slate-900 sm:text-xl",
                isUnavailable && "line-through opacity-60",
              )}
            >
              {formatPrice(property.price)}
              <span className="ml-1 font-normal text-slate-600 text-xs">k.k.</span>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Property Header */}
        <div className="mb-3">
          <h3 className="mb-1 line-clamp-1 font-semibold text-base text-slate-900 sm:text-lg">
            {property.address}
          </h3>
          <div className="flex items-center text-slate-600 text-sm">
            <MapPin className="mr-1.5 h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">
              {property.zipCode} {property.city}
            </span>
          </div>
        </div>

        {/* Property Features */}
        <div className="mb-3 flex items-center gap-3 text-slate-600 text-sm">
          {property.squareFeet && (
            <div className="flex items-center gap-1">
              <div className="flex h-4 w-4 items-center justify-center rounded bg-slate-100">
                <div className="h-2.5 w-2.5 rounded-sm border border-slate-400" />
              </div>
              <span className="font-medium">{Math.round(Number(property.squareFeet))} m²</span>
            </div>
          )}
          {property.bedrooms && (
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4 text-slate-500" />
              <span className="font-medium">{Math.round(Number(property.bedrooms))}</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4 text-slate-500" />
              <span className="font-medium">{Math.round(Number(property.bathrooms))}</span>
            </div>
          )}
        </div>

        {/* Notes Section */}
        {notes && (
          <div className="mb-3 rounded border border-slate-200 bg-slate-50 p-2">
            <div className="flex items-start gap-1.5">
              <MessageSquare className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
              <div>
                <p className="mb-0.5 font-medium text-slate-700 text-xs">Notities</p>
                <p className="line-clamp-2 text-slate-600 text-xs leading-relaxed">{notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Meta Information */}
        <div className="mb-3 flex items-center justify-between text-slate-500 text-xs">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Toegevoegd {formatDate(addedAt)}</span>
          </div>
          {addedByName && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{addedByName}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button
          onClick={() => onCalculateCosts?.(property.id)}
          className="h-9 w-full bg-primary font-medium text-sm shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md"
          disabled={isUnavailable}
        >
          <Calculator className="mr-1.5 h-4 w-4" />
          {isUnavailable ? "Niet beschikbaar" : "Kosten berekenen"}
        </Button>
      </CardContent>
    </Card>
  )
}
