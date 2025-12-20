"use client"

import { ShieldX } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface NoAccessAlertProps {
  groupName: string
}

export function NoAccessAlert({ groupName }: NoAccessAlertProps) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="flex items-start gap-3 p-4">
        <ShieldX className="mt-0.5 h-4 w-4 text-red-600" />
        <div className="flex-1 space-y-1">
          <div className="font-medium text-red-800 text-sm">Geen toegang</div>
          <div className="text-red-700 text-sm">
            Je hebt momenteel geen toegang tot <strong>{groupName}</strong>.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
