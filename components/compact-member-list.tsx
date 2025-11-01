"use client"

import { Crown, MoreHorizontal, Shield, User, UserX } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { updateMemberStatusAction } from "@/actions/groups/management"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAvatarProps } from "@/lib/avatar-utils"
import { cn } from "@/lib/utils"

interface Member {
  userId: string
  fullName: string | null
  email: string | null
  avatarUrl?: string | null
  role: "owner" | "admin" | "member"
  status: "pending" | "active" | "left" | "removed"
}

interface CompactMemberListProps {
  members: Member[]
  className?: string
  currentUserRole?: "owner" | "admin" | "member"
  groupId?: string
  onMemberUpdate?: () => void
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

export function CompactMemberList({
  members,
  className,
  currentUserRole,
  groupId,
  onMemberUpdate,
}: CompactMemberListProps) {
  const [loading, setLoading] = useState<string | null>(null)

  // Filter to only show active members, sorted by role (owner first, then admin, then member)
  const activeMembers = members
    .filter(member => member.status === "active")
    .sort((a, b) => {
      const roleOrder = { owner: 0, admin: 1, member: 2 }
      return roleOrder[a.role] - roleOrder[b.role]
    })

  const canManageMember = (member: Member) => {
    if (!(currentUserRole && groupId)) return false
    return currentUserRole === "owner" || (currentUserRole === "admin" && member.role === "member")
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!groupId) return

    setLoading(memberId)

    try {
      await updateMemberStatusAction(groupId, memberId, "removed")
      toast.success("Lid verwijderd uit de groep")
      onMemberUpdate?.()
    } catch (error) {
      toast.error("Er is een fout opgetreden")
      console.error("Error removing member:", error)
    } finally {
      setLoading(null)
    }
  }

  if (activeMembers.length === 0) {
    return <div className="py-4 text-center text-muted-foreground text-sm">Geen actieve leden</div>
  }

  return (
    <div className={cn("space-y-3", className)}>
      {activeMembers.map(member => {
        const { initials, colorClass, avatarUrl } = getAvatarProps(
          member.userId,
          member.fullName,
          member.avatarUrl,
        )
        const RoleIcon = roleIcons[member.role]
        const isOwner = member.role === "owner"
        const canManage = canManageMember(member)

        return (
          <div key={member.userId} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8 ring-2 ring-background">
                <AvatarImage src={avatarUrl} alt={member.fullName || ""} />
                <AvatarFallback
                  className="font-bold text-sm text-white"
                  style={{
                    backgroundColor: colorClass,
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)",
                  }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="truncate font-medium text-sm">
                    {member.fullName || member.email || "Onbekend"}
                  </span>
                  {isOwner && (
                    <Badge
                      variant="secondary"
                      className="flex items-center space-x-1 border-yellow-200 bg-yellow-100 text-yellow-800"
                    >
                      <Crown className="h-3 w-3" />
                      <span className="text-xs">{roleLabels[member.role]}</span>
                    </Badge>
                  )}
                  {!isOwner && member.role === "admin" && (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <RoleIcon className="h-3 w-3" />
                      <span className="text-xs">{roleLabels[member.role]}</span>
                    </Badge>
                  )}
                </div>
                {member.email && member.fullName && (
                  <p className="truncate text-muted-foreground text-xs">{member.email}</p>
                )}
              </div>
            </div>

            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={loading === member.userId}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleRemoveMember(member.userId)}
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
    </div>
  )
}
