"use client"

import { Crown, MoreHorizontal, Shield, User, Users, UserX } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { updateMemberStatusAction } from "../actions"

interface Member {
  userId: string
  role: "owner" | "admin" | "member"
  status: "pending" | "active" | "left" | "removed"
  contributionAmount: string | null
  ownershipPercentage: string | null
  joinedAt: Date
  fullName: string | null
  email: string | null
  avatarUrl: string | null
}

interface GroupMembersProps {
  members: Member[]
  currentUserRole: "owner" | "admin" | "member"
  groupId: string
}

const roleLabels = {
  owner: "Eigenaar",
  admin: "Beheerder",
  member: "Lid",
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: User,
}

const statusLabels = {
  pending: "In afwachting",
  active: "Actief",
  left: "Verlaten",
  removed: "Verwijderd",
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  left: "bg-gray-100 text-gray-800",
  removed: "bg-red-100 text-red-800",
}

export function GroupMembers({ members, currentUserRole, groupId }: GroupMembersProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const canManageMember = (member: Member) => {
    if (currentUserRole === "owner") return true
    if (currentUserRole === "admin" && member.role === "member") return true
    return false
  }

  const handleMemberAction = async (memberId: string, action: "remove" | "promote") => {
    setLoading(memberId)

    try {
      if (action === "remove") {
        await updateMemberStatusAction(groupId, memberId, "removed")
        toast.success("Lid verwijderd uit de groep")
      }
      router.refresh()
    } catch (error) {
      toast.error("Er is een fout opgetreden")
      console.error("Error updating member:", error)
    } finally {
      setLoading(null)
    }
  }

  const activeMembers = members.filter(member => member.status === "active")
  const pendingMembers = members.filter(member => member.status === "pending")

  return (
    <div className="space-y-6">
      {/* Active Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Actieve leden ({activeMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeMembers.map(member => {
            const RoleIcon = roleIcons[member.role]

            return (
              <div
                key={member.userId}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.avatarUrl || ""} />
                    <AvatarFallback>
                      {member.fullName
                        ? member.fullName.charAt(0).toUpperCase()
                        : member.email
                          ? member.email.charAt(0).toUpperCase()
                          : "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {member.fullName || member.email || "Onbekend"}
                      </span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <RoleIcon className="h-3 w-3" />
                        {roleLabels[member.role]}
                      </Badge>
                    </div>
                    {member.email && (
                      <p className="text-muted-foreground text-sm">{member.email}</p>
                    )}
                    {member.contributionAmount && (
                      <p className="text-muted-foreground text-sm">
                        Bijdrage: €{Number(member.contributionAmount).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {canManageMember(member) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={loading === member.userId}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleMemberAction(member.userId, "remove")}
                        className="text-red-600"
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Verwijderen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )
          })}

          {activeMembers.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              Geen actieve leden in deze groep
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pending Members */}
      {pendingMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Uitnodigingen ({pendingMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingMembers.map(member => (
              <div
                key={member.userId}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.avatarUrl || ""} />
                    <AvatarFallback>
                      {member.fullName
                        ? member.fullName.charAt(0).toUpperCase()
                        : member.email
                          ? member.email.charAt(0).toUpperCase()
                          : "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {member.fullName || member.email || "Onbekend"}
                      </span>
                      <Badge className={statusColors[member.status]} variant="secondary">
                        {statusLabels[member.status]}
                      </Badge>
                    </div>
                    {member.email && (
                      <p className="text-muted-foreground text-sm">{member.email}</p>
                    )}
                  </div>
                </div>

                {canManageMember(member) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMemberAction(member.userId, "remove")}
                    disabled={loading === member.userId}
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
