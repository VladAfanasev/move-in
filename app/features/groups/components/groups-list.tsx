"use client"

import { Euro, MapPin, Users } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Group {
  id: string
  name: string
  description: string | null
  targetBudget: string | null
  targetLocation: string | null
  maxMembers: number | null
  createdAt: Date
  memberCount: number
  userRole: "owner" | "admin" | "member" | null
  userStatus: "pending" | "active" | "left" | "removed" | null
}

interface GroupsListProps {
  groups: Group[]
}

export function GroupsList({ groups }: GroupsListProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 font-semibold text-lg">Nog geen groepen</h3>
        <p className="mb-4 text-muted-foreground">
          Je bent nog geen lid van een koopgroep. Maak je eerste groep aan om te beginnen.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {groups.map(group => (
        <Link key={group.id} href={`/dashboard/groups/${group.id}`}>
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                </div>
                {group.userRole && (
                  <Badge variant="outline" className="ml-2">
                    {group.userRole}
                  </Badge>
                )}
              </div>
              {group.description && (
                <CardDescription className="line-clamp-2">{group.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-muted-foreground text-sm">
                <Users className="mr-2 h-4 w-4" />
                {group.memberCount} {group.memberCount === 1 ? "lid" : "leden"}
                {group.maxMembers && ` / ${group.maxMembers}`}
              </div>

              {group.targetLocation && (
                <div className="flex items-center text-muted-foreground text-sm">
                  <MapPin className="mr-2 h-4 w-4" />
                  <span className="truncate">{group.targetLocation}</span>
                </div>
              )}

              {group.targetBudget && (
                <div className="flex items-center text-muted-foreground text-sm">
                  <Euro className="mr-2 h-4 w-4" />€{Number(group.targetBudget).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
