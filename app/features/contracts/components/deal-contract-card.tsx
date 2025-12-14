"use client"

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

interface DealContractCardProps {
  property: Property
  group: Group
  members: Member[]
  participants: SessionParticipant[]
  totalCosts: number
  isSessionLocked: boolean
  sessionLockedAt?: string
}

export function DealContractCard({
  property,
  group,
  members,
  participants,
  totalCosts,
  isSessionLocked,
  sessionLockedAt,
}: DealContractCardProps) {
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

  const handleGoToContract = () => {
    window.location.href = `/dashboard/groups/${group.id}/properties/${property.id}/contract`
  }

  const handleDownloadContract = async () => {
    try {
      const response = await fetch(
        `/api/groups/${group.id}/properties/${property.id}/contract/pdf`,
        {
          method: "POST",
        },
      )

      if (!response.ok) {
        throw new Error("Failed to generate PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `contract-${property.address.replace(/\s+/g, "_")}.html`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading contract:", error)
      alert("Er ging iets mis bij het downloaden van het contract. Probeer het opnieuw.")
    }
  }

  if (!isSessionLocked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Contract Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3 text-muted-foreground">
            <Users className="h-8 w-8" />
            <div>
              <p className="font-medium">Contract nog niet beschikbaar</p>
              <p className="text-sm">
                Het contract wordt beschikbaar zodra alle leden hun percentage hebben bevestigd en
                de negotiatie is afgerond.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Combine member data with participant data
  const dealData = participants.map(participant => {
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
  const totalAmount = dealData.reduce((sum, item) => sum + item.amount, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
              Deal Afgerond - Contract Beschikbaar
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
      <CardContent className="space-y-6">
        {/* Property & Investment Summary */}
        <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
          <div>
            <span className="block font-medium text-muted-foreground text-sm">Pand</span>
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

        {/* Investment Overview Table */}
        <div>
          <h4 className="mb-3 font-semibold">Investering Verdeling</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
                <TableHead className="text-right">Bedrag</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dealData.map(item => (
                <TableRow key={item.userId}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-muted-foreground text-xs">{item.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {item.percentage.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="bg-green-600">
                      Vergrendeld
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals Row */}
          <div className="mt-3 flex justify-between border-t pt-3 font-semibold">
            <span>Totaal</span>
            <div className="flex space-x-8 text-right">
              <span>{totalPercentage.toFixed(1)}%</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Contract Actions */}
        <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-green-700" />
            <h4 className="font-semibold text-green-800">Contract gereed voor ondertekening</h4>
          </div>
          <p className="text-green-700 text-sm">
            Het investeringscontract kan nu worden gedownload en ondertekend door alle leden.
          </p>
          <div className="flex space-x-3">
            <Button onClick={handleGoToContract} className="bg-green-600 hover:bg-green-700">
              <FileText className="mr-2 h-4 w-4" />
              Bekijk Contract
            </Button>
            <Button onClick={handleDownloadContract} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
