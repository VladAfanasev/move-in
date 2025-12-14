"use client"

import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PropertyFiltersProps {
  onFiltersChange?: (filters: PropertyFilters) => void
}

export interface PropertyFilters {
  propertyType: string[]
  status: string[]
  priceMin: number | null
  priceMax: number | null
  bedroomsMin: number | null
  bedroomsMax: number | null
  city: string
}

export function PropertyFilters({ onFiltersChange }: PropertyFiltersProps) {
  const baseId = useId()
  const [filters, setFilters] = useState<PropertyFilters>({
    propertyType: [],
    status: [],
    priceMin: null,
    priceMax: null,
    bedroomsMin: null,
    bedroomsMax: null,
    city: "",
  })

  const updateFilters = (newFilters: Partial<PropertyFilters>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    onFiltersChange?.(updated)
  }

  const handlePropertyTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked
      ? [...filters.propertyType, type]
      : filters.propertyType.filter(t => t !== type)
    updateFilters({ propertyType: newTypes })
  }

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatuses = checked
      ? [...filters.status, status]
      : filters.status.filter(s => s !== status)
    updateFilters({ status: newStatuses })
  }

  const clearFilters = () => {
    const clearedFilters: PropertyFilters = {
      propertyType: [],
      status: [],
      priceMin: null,
      priceMax: null,
      bedroomsMin: null,
      bedroomsMax: null,
      city: "",
    }
    setFilters(clearedFilters)
    onFiltersChange?.(clearedFilters)
  }

  return (
    <div className="w-80 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Filters</h2>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Wis alles
        </Button>
      </div>

      {/* Property Type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Type woning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${baseId}-house`}
              checked={filters.propertyType.includes("house")}
              onCheckedChange={checked => handlePropertyTypeChange("house", !!checked)}
            />
            <Label htmlFor={`${baseId}-house`} className="text-sm">
              Huis
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${baseId}-apartment`}
              checked={filters.propertyType.includes("apartment")}
              onCheckedChange={checked => handlePropertyTypeChange("apartment", !!checked)}
            />
            <Label htmlFor={`${baseId}-apartment`} className="text-sm">
              Appartement
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${baseId}-available`}
              checked={filters.status.includes("available")}
              onCheckedChange={checked => handleStatusChange("available", !!checked)}
            />
            <Label htmlFor={`${baseId}-available`} className="text-sm">
              Beschikbaar
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${baseId}-in_option`}
              checked={filters.status.includes("in_option")}
              onCheckedChange={checked => handleStatusChange("in_option", !!checked)}
            />
            <Label htmlFor={`${baseId}-in_option`} className="text-sm">
              In optie
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${baseId}-sold`}
              checked={filters.status.includes("sold")}
              onCheckedChange={checked => handleStatusChange("sold", !!checked)}
            />
            <Label htmlFor={`${baseId}-sold`} className="text-sm">
              Verkocht
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Prijs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor={`${baseId}-priceMin`} className="text-sm">
              Van
            </Label>
            <Input
              id={`${baseId}-priceMin`}
              type="number"
              placeholder="€ 0"
              value={filters.priceMin || ""}
              onChange={e =>
                updateFilters({
                  priceMin: e.target.value ? parseInt(e.target.value, 10) : null,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor={`${baseId}-priceMax`} className="text-sm">
              Tot
            </Label>
            <Input
              id={`${baseId}-priceMax`}
              type="number"
              placeholder="€ Geen max"
              value={filters.priceMax || ""}
              onChange={e =>
                updateFilters({
                  priceMax: e.target.value ? parseInt(e.target.value, 10) : null,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Bedrooms */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Kamers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor={`${baseId}-bedroomsMin`} className="text-sm">
              Van
            </Label>
            <Input
              id={`${baseId}-bedroomsMin`}
              type="number"
              placeholder="0"
              value={filters.bedroomsMin || ""}
              onChange={e =>
                updateFilters({
                  bedroomsMin: e.target.value ? parseInt(e.target.value, 10) : null,
                })
              }
            />
          </div>
          <div>
            <Label htmlFor={`${baseId}-bedroomsMax`} className="text-sm">
              Tot
            </Label>
            <Input
              id={`${baseId}-bedroomsMax`}
              type="number"
              placeholder="Geen max"
              value={filters.bedroomsMax || ""}
              onChange={e =>
                updateFilters({
                  bedroomsMax: e.target.value ? parseInt(e.target.value, 10) : null,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* City */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Plaats</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Zoek plaats..."
            value={filters.city}
            onChange={e => updateFilters({ city: e.target.value })}
          />
        </CardContent>
      </Card>
    </div>
  )
}
