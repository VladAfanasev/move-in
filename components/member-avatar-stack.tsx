"use client"

import { Users } from "lucide-react"
import { useState } from "react"
import { CompactMemberList } from "@/components/compact-member-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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

interface MemberAvatarStackProps {
  members: Member[]
  maxVisible?: number
  size?: "sm" | "md" | "lg"
  className?: string
  currentUserRole?: "owner" | "admin" | "member"
  groupId?: string
  onMemberUpdate?: () => void
}

export function MemberAvatarStack({
  members,
  maxVisible = 3,
  size = "md",
  className,
  currentUserRole,
  groupId,
  onMemberUpdate,
}: MemberAvatarStackProps) {
  const [open, setOpen] = useState(false)

  // Filter to only show active members
  const activeMembers = members.filter(member => member.status === "active")

  // Limit visible members
  const visibleMembers = activeMembers.slice(0, maxVisible)
  const remainingCount = Math.max(0, activeMembers.length - maxVisible)

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  }

  const borderClasses = {
    sm: "ring-1",
    md: "ring-2",
    lg: "ring-2",
  }

  if (activeMembers.length === 0) {
    return null
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex h-auto items-center space-x-2 rounded-lg p-2 transition-colors hover:bg-gray-50",
            className,
          )}
        >
          <div className="-space-x-1 flex">
            {visibleMembers.map(member => {
              const { initials, colorClass, avatarUrl } = getAvatarProps(
                member.userId,
                member.fullName,
                member.avatarUrl,
              )

              return (
                <Avatar
                  key={member.userId}
                  className={cn(
                    sizeClasses[size],
                    borderClasses[size],
                    "shadow-sm ring-background",
                    // Add special styling for owner
                    member.role === "owner" && "ring-yellow-400",
                  )}
                >
                  <AvatarImage src={avatarUrl} alt={member.fullName || ""} />
                  <AvatarFallback
                    className="font-bold text-white"
                    style={{
                      backgroundColor: colorClass,
                      textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)",
                    }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              )
            })}

            {remainingCount > 0 && (
              <Avatar
                className={cn(sizeClasses[size], borderClasses[size], "shadow-sm ring-background")}
              >
                <AvatarFallback
                  className="font-bold text-white"
                  style={{
                    backgroundColor: "#475569",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)",
                  }}
                >
                  +{remainingCount}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80" align="center">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">Members</h4>
            <span className="text-muted-foreground text-sm">({activeMembers.length})</span>
          </div>

          <CompactMemberList
            members={members}
            currentUserRole={currentUserRole}
            groupId={groupId}
            onMemberUpdate={onMemberUpdate}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
