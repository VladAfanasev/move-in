"use client"

import { Bell, Calendar, CheckCircle2, UserPlus, Users } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ActionItemsData {
  pendingInvitations: number
  pendingJoinRequests: number
  activeNegotiations: number
  scheduledViewings: number
}

interface ActionCardsProps {
  actionItems: ActionItemsData
}

export function ActionCards({ actionItems }: ActionCardsProps) {
  const cards = [
    {
      title: "Uitnodigingen",
      count: actionItems.pendingInvitations,
      icon: UserPlus,
      description: "Groepsuitnodigingen die wachten op je reactie",
      href: "/dashboard/groups",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Aanmeldingen",
      count: actionItems.pendingJoinRequests,
      icon: Users,
      description: "Leden die willen deelnemen aan je groepen",
      href: "/dashboard/groups",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Onderhandelingen",
      count: actionItems.activeNegotiations,
      icon: CheckCircle2,
      description: "Onderhandelingen die je bevestiging vereisen",
      href: "/dashboard/groups",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Bezichtigingen",
      count: actionItems.scheduledViewings,
      icon: Calendar,
      description: "Geplande woningbezichtigingen",
      href: "/dashboard/properties",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  // Filter to show only cards with items
  const activeCards = cards.filter(card => card.count > 0)

  // If no action items, show a single card with a message
  if (activeCards.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Actie vereist
          </CardTitle>
          <CardDescription>Taken die je aandacht vereisen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-center">
            <div>
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500" />
              <p className="font-medium text-sm">Alles is bij!</p>
              <p className="mt-1 text-muted-foreground text-sm">
                Geen acties vereist op dit moment
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {activeCards.map(card => (
        <Card key={card.title} className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className={`rounded-lg p-1.5 ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <Badge variant="secondary" className="font-bold text-base">
                {card.count}
              </Badge>
            </div>
            <CardTitle className="mt-3 text-sm">{card.title}</CardTitle>
            <CardDescription className="text-xs leading-tight">{card.description}</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <Link href={card.href}>
              <Button variant="ghost" size="sm" className="h-6 w-full text-xs">
                Bekijk alle →
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
