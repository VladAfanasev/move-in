"use client"

import { Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface PendingJoinAlertProps {
  groupName: string
}

export function PendingJoinAlert({ groupName }: PendingJoinAlertProps) {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="flex items-start gap-3 p-4">
        <Clock className="mt-0.5 h-4 w-4 text-orange-600" />
        <div className="flex-1 space-y-1">
          <div className="font-medium text-orange-800 text-sm">Aanvraag verzonden</div>
          <div className="text-orange-700 text-sm">
            Je aanvraag om lid te worden van <strong>{groupName}</strong> is verzonden naar de
            groepseigenaar. Je ontvangt een melding zodra je aanvraag is goedgekeurd en je volledige
            toegang hebt tot de groep.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
