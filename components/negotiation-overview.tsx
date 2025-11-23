"use client"

import type { User } from "@supabase/supabase-js"
import { CheckCircle, Download, FileText, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Property {
  id: string
  address: string
  city: string
  zipCode: string
  price: string
}

interface Group {
  id: string
  name: string
}

interface Member {
  userId: string
  fullName: string | null
  email: string | null
  role: "owner" | "admin" | "member"
  status: "pending" | "active" | "left" | "removed"
}

interface SessionParticipant {
  userId: string
  currentPercentage: number
  status: "adjusting" | "confirmed" | "locked"
}

interface NegotiationOverviewProps {
  property: Property
  group: Group
  members: Member[]
  participants: SessionParticipant[]
  totalCosts: number
  isSessionLocked: boolean
  sessionLockedAt?: string
}

export function NegotiationOverview({
  property,
  group,
  members,
  participants,
  totalCosts,
  isSessionLocked,
  sessionLockedAt,
}: NegotiationOverviewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Combine member data with participant data
  const overviewData = participants.map(participant => {
    const member = members.find(m => m.userId === participant.userId)
    const amount = Math.round((totalCosts * participant.currentPercentage) / 100)

    return {
      userId: participant.userId,
      name: member?.fullName || member?.email?.split("@")[0] || "Unknown Member",
      email: member?.email || "",
      role: member?.role || "member",
      percentage: participant.currentPercentage,
      amount,
      status: participant.status,
    }
  })

  const totalPercentage = participants.reduce((sum, p) => sum + p.currentPercentage, 0)
  const totalAmount = participants.reduce(
    (sum, p) => sum + Math.round((totalCosts * p.currentPercentage) / 100),
    0,
  )

  const handleDownloadContract = () => {
    // TODO: Generate and download PDF contract
    console.log("Generating contract PDF...")
    // This would integrate with a PDF generation service
  }

  const handleGoToContract = () => {
    // Navigate to contract page
    window.location.href = `/dashboard/groups/${group.id}/properties/${property.id}/contract`
  }

  if (!isSessionLocked) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mb-4">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="mb-2 font-semibold text-lg">Negotiatie nog bezig</h3>
            <p className="text-muted-foreground">
              Het overzicht wordt beschikbaar zodra alle leden hun percentage hebben bevestigd en de
              sessie is afgerond.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                Deal Afgerond
              </CardTitle>
              <p className="mt-1 text-muted-foreground text-sm">
                {sessionLockedAt && `Afgerond op ${formatDate(sessionLockedAt)}`}
              </p>
            </div>
            <Badge variant="default" className="bg-green-600">
              100% Bevestigd
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Property Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Pand Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block font-medium text-muted-foreground text-sm">Adres</span>
              <span className="font-semibold">
                {property.address}, {property.zipCode} {property.city}
              </span>
            </div>
            <div>
              <span className="block font-medium text-muted-foreground text-sm">
                Totale Investering
              </span>
              <span className="font-semibold text-lg">{formatCurrency(totalCosts)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Overview Table */}
      <Card>
        <CardHeader>
          <CardTitle>Investering Overzicht</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
                <TableHead className="text-right">Bedrag</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overviewData.map(item => (
                <TableRow key={item.userId}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-muted-foreground text-sm">{item.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {item.role === "owner" ? "Eigenaar" : item.role === "admin" ? "Admin" : "Lid"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {item.percentage.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={item.status === "locked" ? "default" : "secondary"}
                      className={item.status === "locked" ? "bg-green-600" : ""}
                    >
                      {item.status === "locked" ? "Vergrendeld" : "Bevestigd"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals Row */}
          <div className="mt-4 border-t pt-4">
            <div className="flex justify-between font-semibold text-lg">
              <span>Totaal</span>
              <div className="flex space-x-8">
                <span>{totalPercentage.toFixed(1)}%</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Contract
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Het contract is nu beschikbaar voor download. Alle leden kunnen het contract printen
              en ondertekenen.
            </p>
            <div className="flex space-x-3">
              <Button onClick={handleGoToContract} className="flex-1">
                <FileText className="mr-2 h-4 w-4" />
                Ga naar Contract
              </Button>
              <Button onClick={handleDownloadContract} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
