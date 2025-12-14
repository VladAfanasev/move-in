"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PropertiesHeaderProps {
  totalCount: number
  onSortChange?: (value: string) => void
}

export function PropertiesHeader({ totalCount, onSortChange }: PropertiesHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="text-muted-foreground text-sm">
        {totalCount} {totalCount === 1 ? "woning" : "woningen"} gevonden
      </div>

      <Select onValueChange={onSortChange} defaultValue="newest">
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Sorteer op..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Nieuwste eerst</SelectItem>
          <SelectItem value="oldest">Oudste eerst</SelectItem>
          <SelectItem value="price-low">Prijs: laag naar hoog</SelectItem>
          <SelectItem value="price-high">Prijs: hoog naar laag</SelectItem>
          <SelectItem value="size-large">Oppervlakte: groot naar klein</SelectItem>
          <SelectItem value="size-small">Oppervlakte: klein naar groot</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
