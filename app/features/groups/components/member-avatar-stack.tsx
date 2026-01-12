"use client"

import { Users } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { getJoinRequestsAction } from "@/actions/groups/join-request"
import { CompactMemberList } from "@/app/features/groups/components/compact-member-list"
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

interface JoinRequest {
  id: string
  userId: string
  message: string | null
  requestedAt: Date
  expiresAt: Date
  userFullName: string | null
  userEmail: string | null
  userAvatarUrl: string | null
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
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  // Check if user can view requests (owner/admin)
  const canViewRequests = (currentUserRole === "owner" || currentUserRole === "admin") && groupId

  // Load pending requests and count - only on mount
  const loadJoinRequests = useCallback(async () => {
    if (!(canViewRequests && groupId)) return

    try {
      setLoadingRequests(true)
      const requests = await getJoinRequestsAction(groupId)
      setJoinRequests(requests)
      setPendingRequestsCount(requests.length)
    } catch (error) {
      // Silently handle - user might not have permission
      console.error("Error loading join requests:", error)
      setJoinRequests([])
      setPendingRequestsCount(0)
    } finally {
      setLoadingRequests(false)
    }
  }, [canViewRequests, groupId])

  // Only load once on mount - removed duplicate useEffect
  useEffect(() => {
    if (canViewRequests) {
      loadJoinRequests()
    }
  }, [loadJoinRequests, canViewRequests])

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
          <div className="flex items-center space-x-2">
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
                  className={cn(
                    sizeClasses[size],
                    borderClasses[size],
                    "shadow-sm ring-background",
                  )}
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

            {/* Pending requests indicator */}
            {pendingRequestsCount > 0 && (
              <div className="h-3 w-3 animate-pulse rounded-full bg-red-500"></div>
            )}
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80" align="center">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">Groepsleden</h4>
            <span className="text-muted-foreground text-sm">({activeMembers.length})</span>
          </div>

          <CompactMemberList
            members={members}
            currentUserRole={currentUserRole}
            groupId={groupId}
            joinRequests={joinRequests}
            loadingRequests={loadingRequests}
            onMemberUpdate={() => {
              onMemberUpdate?.()
              loadJoinRequests()
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
