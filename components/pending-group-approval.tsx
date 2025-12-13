"use client"

import { Clock, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PendingGroupApprovalProps {
  groupName: string
  propertyAddress: string
  onRefresh?: () => void
}

export function PendingGroupApproval({
  groupName,
  propertyAddress,
  onRefresh,
}: PendingGroupApprovalProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-xl">Wacht op goedkeuring</CardTitle>
          <CardDescription>
            Je verzoek om lid te worden van deze groep wordt beoordeeld
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Group Info */}
          <div className="space-y-4 text-center">
            <div className="rounded-lg bg-muted p-4">
              <div className="mb-2 flex items-center justify-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{groupName}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Koopgroep
              </Badge>
            </div>

            <div className="rounded-lg bg-blue-50 p-4">
              <p className="font-medium text-blue-900 text-sm">Eigenschap berekening</p>
              <p className="mt-1 text-blue-700 text-xs">{propertyAddress}</p>
              <p className="mt-2 text-blue-600 text-xs">
                Zodra je bent goedgekeurd krijg je toegang tot de live kostenberekening
              </p>
            </div>
          </div>

          {/* Status Info */}
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-yellow-500"></div>
              <div>
                <p className="font-medium">Verzoek verstuurd</p>
                <p className="text-muted-foreground text-xs">
                  De groepseigenaar heeft een notificatie ontvangen
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-gray-300"></div>
              <div>
                <p className="text-muted-foreground">In afwachting van goedkeuring</p>
                <p className="text-muted-foreground text-xs">
                  Dit kan enkele minuten tot uren duren
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {onRefresh && (
              <Button variant="outline" onClick={onRefresh} className="w-full">
                Status vernieuwen
              </Button>
            )}

            <p className="text-center text-muted-foreground text-xs">
              Je krijgt automatisch toegang zodra je verzoek is goedgekeurd
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
