"use client"

import { Check, Crown, MoreHorizontal, Shield, User, UserX, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { updateMemberStatusAction } from "@/actions/groups/management"
import {
  approveJoinRequestAction,
  rejectJoinRequestAction,
} from "@/actions/groups/process-join-request"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
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

interface CompactMemberListProps {
  members: Member[]
  className?: string
  currentUserRole?: "owner" | "admin" | "member"
  groupId?: string
  joinRequests?: JoinRequest[]
  loadingRequests?: boolean
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
  joinRequests = [],
  loadingRequests = false,
  onMemberUpdate,
}: CompactMemberListProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)

  // Load join requests if user can manage members
  const canViewRequests = (currentUserRole === "owner" || currentUserRole === "admin") && groupId

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

  const handleApproveRequest = async (requestId: string) => {
    setProcessingRequestId(requestId)

    try {
      await approveJoinRequestAction(requestId)
      toast.success("Aanvraag goedgekeurd")
      // Refresh both requests and members
      onMemberUpdate?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Er is een fout opgetreden"
      toast.error(errorMessage)
      console.error("Error approving request:", error)
    } finally {
      setProcessingRequestId(null)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequestId(requestId)

    try {
      await rejectJoinRequestAction(requestId)
      toast.success("Aanvraag afgewezen")
      onMemberUpdate?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Er is een fout opgetreden"
      toast.error(errorMessage)
      console.error("Error rejecting request:", error)
    } finally {
      setProcessingRequestId(null)
    }
  }

  if (activeMembers.length === 0) {
    return <div className="py-4 text-center text-muted-foreground text-sm">Geen actieve leden</div>
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Active Members */}
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

      {/* Join Requests Section - only show if there are requests or we're loading */}
      {canViewRequests && (loadingRequests || joinRequests.length > 0) && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-sm">
                Aanvragen ({loadingRequests ? "..." : joinRequests.length})
              </h4>
              {loadingRequests && (
                <div className="h-3 w-3 animate-spin rounded-full border border-gray-300 border-t-transparent" />
              )}
            </div>

            {/* Loading skeleton while fetching requests */}
            {loadingRequests && (
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-2">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-gray-300"></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-300"></div>
                        <div className="h-5 w-16 animate-pulse rounded bg-gray-300"></div>
                      </div>
                      <div className="mt-1 h-3 w-32 animate-pulse rounded bg-gray-200"></div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <div className="h-7 w-7 animate-pulse rounded bg-gray-300"></div>
                    <div className="h-7 w-7 animate-pulse rounded bg-gray-300"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Actual requests when loaded */}
            {!loadingRequests &&
              joinRequests.map(request => {
                const { initials, colorClass, avatarUrl } = getAvatarProps(
                  request.userId,
                  request.userFullName,
                  request.userAvatarUrl,
                )

                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-2"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8 ring-2 ring-background">
                        <AvatarImage src={avatarUrl} alt={request.userFullName || ""} />
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
                            {request.userFullName || request.userEmail || "Onbekend"}
                          </span>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            Aanvraag
                          </Badge>
                        </div>
                        {request.userEmail && request.userFullName && (
                          <p className="truncate text-muted-foreground text-xs">
                            {request.userEmail}
                          </p>
                        )}
                        {request.message && (
                          <p className="truncate text-muted-foreground text-xs">
                            "{request.message}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 border-green-200 bg-green-50 px-2 text-green-700 hover:bg-green-100"
                        onClick={() => handleApproveRequest(request.id)}
                        disabled={processingRequestId === request.id}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 border-red-200 bg-red-50 px-2 text-red-700 hover:bg-red-100"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={processingRequestId === request.id}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
          </div>
        </>
      )}
    </div>
  )
}
