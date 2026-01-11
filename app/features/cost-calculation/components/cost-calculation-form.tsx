"use client"

import type { User } from "@supabase/supabase-js"
import { Check, Plus, Scale, Target, User as UserIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { CalculationInvitePopover } from "@/app/features/cost-calculation/components/calculation-invite-popover"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PropertyGoalIndicator } from "@/components/ui/property-goal-indicator"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRealtimeSession } from "@/hooks/use-realtime-session"

interface Property {
  id: string
  address: string
  city: string
  zipCode: string
  price: string
  squareFeet: number | null
  bedrooms: number | null
  bathrooms: string | null
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

interface SessionMember {
  userId: string
  name: string
  percentage: number
  status: "adjusting" | "confirmed"
  isOnline?: boolean
}

interface CostCalculationFormProps {
  property: Property
  group: Group
  members: Member[]
  currentUser: User
  isSessionLocked?: boolean
  // Optional props for when session state is managed externally
  sessionMembers?: SessionMember[]
  setSessionMembers?: React.Dispatch<React.SetStateAction<SessionMember[]>>
  yourPercentage?: number
  setYourPercentage?: React.Dispatch<React.SetStateAction<number>>
  yourStatus?: "adjusting" | "confirmed"
  setYourStatus?: React.Dispatch<React.SetStateAction<"adjusting" | "confirmed">>
  loading?: boolean
  totalPercentage?: number
  allConfirmed?: boolean
  hideProgressCircle?: boolean
  // Optional realtime props for when realtime is managed externally
  onlineMembers?: string[]
  isConnected?: boolean
  connectionQuality?: "excellent" | "good" | "poor" | "disconnected"
  emitPercentageUpdate?: (percentage: number, status: "adjusting" | "confirmed") => void
  emitStatusChange?: (status: "adjusting" | "confirmed") => void
  getOnlineMemberCount?: () => number
}

export function CostCalculationForm({
  property,
  group,
  members: _members,
  currentUser,
  isSessionLocked = false,
  // External session state props
  sessionMembers: externalSessionMembers,
  setSessionMembers: externalSetSessionMembers,
  yourPercentage: externalYourPercentage,
  setYourPercentage: externalSetYourPercentage,
  yourStatus: externalYourStatus,
  setYourStatus: externalSetYourStatus,
  loading: externalLoading,
  totalPercentage: externalTotalPercentage,
  allConfirmed: externalAllConfirmed,
  hideProgressCircle = false,
  // External realtime props
  onlineMembers: externalOnlineMembers,
  isConnected: externalIsConnected,
  connectionQuality: externalConnectionQuality,
  emitPercentageUpdate: externalEmitPercentageUpdate,
  emitStatusChange: externalEmitStatusChange,
  getOnlineMemberCount: externalGetOnlineMemberCount,
}: CostCalculationFormProps) {
  // Session state for percentage negotiation (use external if available)
  const [internalSessionMembers, setInternalSessionMembers] = useState<SessionMember[]>([])
  const [internalYourPercentage, setInternalYourPercentage] = useState(25)
  const [internalYourStatus, setInternalYourStatus] = useState<"adjusting" | "confirmed">(
    "adjusting",
  )
  const [internalLoading, setInternalLoading] = useState(true)

  // Use external state if provided, otherwise use internal state
  const sessionMembers = externalSessionMembers ?? internalSessionMembers
  const setSessionMembers = externalSetSessionMembers ?? setInternalSessionMembers
  const yourPercentage = externalYourPercentage ?? internalYourPercentage
  const setYourPercentage = externalSetYourPercentage ?? setInternalYourPercentage
  const yourStatus = externalYourStatus ?? internalYourStatus
  const setYourStatus = externalSetYourStatus ?? setInternalYourStatus
  const loading = externalLoading ?? internalLoading

  // Real-time session management (only when using internal state)
  const internalRealtimeSession = useRealtimeSession({
    sessionId: `${group.id}-${property.id}`, // Use group-property format for real-time
    userId: currentUser.id,
    onPercentageUpdate: data => {
      if (!externalSessionMembers) {
        console.log("Processing percentage update from remote user:", data)
        // Update session members when receiving real-time percentage updates
        setSessionMembers(prev =>
          prev.map(member =>
            member.userId === data.userId
              ? {
                  ...member,
                  percentage: data.percentage,
                  status: data.status as "adjusting" | "confirmed",
                }
              : member,
          ),
        )
      }
    },
    onStatusChange: data => {
      if (!externalSessionMembers) {
        console.log("Processing status change from remote user:", data)
        // Update session members when receiving real-time status changes
        setSessionMembers(prev =>
          prev.map(member =>
            member.userId === data.userId
              ? { ...member, status: data.status as "adjusting" | "confirmed" }
              : member,
          ),
        )
      }
    },
    onOnlineMembersChange: members => {
      if (!externalSessionMembers) {
        console.log("Online members changed:", members)
        // Update online status for all session members
        setSessionMembers(prev =>
          prev.map(member => ({
            ...member,
            isOnline: members.includes(member.userId),
          })),
        )
      }
    },
  })

  // Use external realtime props if available, otherwise use internal
  const onlineMembers = externalOnlineMembers ?? internalRealtimeSession.onlineMembers
  const isConnected = externalIsConnected ?? internalRealtimeSession.isConnected
  const connectionQuality = externalConnectionQuality ?? internalRealtimeSession.connectionQuality
  const emitPercentageUpdate =
    externalEmitPercentageUpdate ?? internalRealtimeSession.emitPercentageUpdate
  const emitStatusChange = externalEmitStatusChange ?? internalRealtimeSession.emitStatusChange
  const getOnlineMemberCount =
    externalGetOnlineMemberCount ?? internalRealtimeSession.getOnlineMemberCount

  // Initialize session members from actual group members (only when using internal state)
  useEffect(() => {
    if (!externalSessionMembers && _members.length > 0 && sessionMembers.length === 0) {
      const initialMembers: SessionMember[] = _members
        .filter(member => member.status === "active")
        .sort((a, b) => {
          // Current user always comes first
          if (a.userId === currentUser.id) return -1
          if (b.userId === currentUser.id) return 1
          // Then sort alphabetically by name
          const nameA = a.fullName || a.email || "Unknown User"
          const nameB = b.fullName || b.email || "Unknown User"
          return nameA.localeCompare(nameB)
        })
        .map(member => ({
          userId: member.userId,
          name: member.fullName || member.email || "Unknown User",
          percentage: 25, // Always start with 25% for all members initially
          status: "adjusting" as const,
          isOnline: onlineMembers.includes(member.userId), // Check if online
        }))

      setSessionMembers(initialMembers)
      setInternalLoading(false)
    } else if (externalSessionMembers) {
      // If using external state, don't manage loading internally
      setInternalLoading(false)
    }
  }, [
    _members,
    currentUser.id,
    externalSessionMembers,
    onlineMembers,
    setSessionMembers,
    sessionMembers.length,
  ])

  // Update online status when online members change (only when using internal state)
  useEffect(() => {
    if (!externalSessionMembers && sessionMembers.length > 0) {
      setSessionMembers(prevMembers =>
        prevMembers.map(member => ({
          ...member,
          isOnline: onlineMembers.includes(member.userId),
        })),
      )
    }
  }, [onlineMembers, externalSessionMembers, sessionMembers.length, setSessionMembers])

  // Calculate total costs (simplified - could be passed as prop)
  const totalCosts = Number(property.price) + 2500 + Number(property.price) * 0.02 + 750

  // Calculate session totals (use external if provided)
  const totalPercentage =
    externalTotalPercentage ??
    sessionMembers.reduce((sum, member) => {
      if (member.userId === currentUser.id) {
        return sum + yourPercentage
      }
      return sum + member.percentage
    }, 0)

  const allConfirmed =
    externalAllConfirmed ??
    sessionMembers.every(member =>
      member.userId === currentUser.id ? yourStatus === "confirmed" : member.status === "confirmed",
    )

  // Debounced emit function
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle percentage change
  const handlePercentageChange = (newPercentage: number) => {
    if (yourStatus === "confirmed" || isSessionLocked) return

    // Update local state first for immediate UI feedback
    setYourPercentage(newPercentage)
    setYourStatus("adjusting")

    // Update session members locally for immediate feedback (only for current user)
    setSessionMembers(prev =>
      prev.map(member =>
        member.userId === currentUser.id
          ? { ...member, percentage: newPercentage, status: "adjusting" }
          : member,
      ),
    )

    // Debounced emit to avoid spam during rapid slider movements
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      emitPercentageUpdate(newPercentage, "adjusting")
    }, 150) // 150ms debounce for smoother UX
  }

  // Handle confirm
  const handleConfirm = () => {
    if (Math.abs(totalPercentage - 100) >= 0.01) return
    setYourStatus("confirmed")

    // Emit real-time status change
    emitStatusChange("confirmed")

    setSessionMembers(prev =>
      prev.map(member =>
        member.userId === currentUser.id ? { ...member, status: "confirmed" } : member,
      ),
    )
  }

  // Handle change mind
  const handleChangeMind = () => {
    setYourStatus("adjusting")

    // Emit real-time status change
    emitStatusChange("adjusting")

    setSessionMembers(prev =>
      prev.map(member =>
        member.userId === currentUser.id ? { ...member, status: "adjusting" } : member,
      ),
    )
  }

  // Check if user can confirm
  const canConfirm =
    yourPercentage >= 10 &&
    yourPercentage <= 90 &&
    Math.abs(totalPercentage - 100) < 0.01 &&
    yourStatus === "adjusting"

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-3/4 rounded bg-gray-200"></div>
              <div className="h-20 rounded bg-gray-200"></div>
              <div className="h-4 w-1/2 rounded bg-gray-200"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={50}>
      <div className="space-y-4">
        {/* Investment Negotiation - Main Focus */}
        <div className="space-y-4">
          {/* Goal Progress Indicator - Conditionally hidden */}
          {!hideProgressCircle && (
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="flex justify-center">
                  <PropertyGoalIndicator
                    percentage={totalPercentage}
                    allConfirmed={allConfirmed}
                    memberCount={sessionMembers.length}
                    size="md"
                    showMessage={true}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Members Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-4 w-4" />
                    <div>
                      <span>Groepsleden</span>
                      <div className="flex items-center gap-2">
                        <div className="font-normal text-muted-foreground text-xs">
                          {getOnlineMemberCount()}{" "}
                          {getOnlineMemberCount() === 1 ? "lid actief" : "leden actief"}
                        </div>
                        {/* Connection status indicator */}
                        <div
                          className={`h-2 w-2 rounded-full ${
                            !isConnected
                              ? "animate-pulse bg-red-500"
                              : connectionQuality === "excellent"
                                ? "bg-green-500"
                                : connectionQuality === "good"
                                  ? "bg-yellow-500"
                                  : "bg-orange-500"
                          }`}
                          title={
                            !isConnected
                              ? "Verbinding verbroken"
                              : `Verbinding: ${connectionQuality}`
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <CalculationInvitePopover
                    groupId={group.id}
                    propertyId={property.id}
                    groupName={group.name}
                  >
                    <Button variant="outline" size="sm">
                      <Plus className="mr-1 h-3 w-3" />
                      Uitnodigen
                    </Button>
                  </CalculationInvitePopover>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                {sessionMembers.map(member => {
                  const isYou = member.userId === currentUser.id
                  const displayStatus = isYou ? yourStatus : member.status
                  const currentPercentage = isYou ? yourPercentage : member.percentage
                  const memberAmount = (totalCosts * currentPercentage) / 100

                  return (
                    <div
                      key={member.userId}
                      className={`relative overflow-hidden rounded-xl transition-all duration-300 ${
                        displayStatus === "confirmed"
                          ? "border-2 border-green-500 bg-green-50/50 shadow-lg dark:border-green-400 dark:bg-green-900/20"
                          : isYou
                            ? "border-2 border-primary bg-primary/5 shadow-lg"
                            : "border border-muted bg-card/50 hover:bg-card/80 hover:shadow-sm"
                      }`}
                    >
                      <div className="space-y-3 p-4">
                        {/* Header with name, status, and online indicator */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Member avatar circle */}
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold text-sm ${
                                isYou
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {member.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${isYou ? "text-primary" : ""}`}>
                                  {member.name}
                                </span>
                                {member.isOnline && (
                                  <div className="relative">
                                    <div
                                      className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-sm"
                                      title="Online nu"
                                    />
                                    {/* Breathing animation ring */}
                                    <div
                                      className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-green-400/50 motion-safe:animate-ping"
                                      aria-hidden="true"
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {displayStatus === "confirmed" ? "Bevestigd" : "Aan het aanpassen"}
                              </div>
                            </div>
                          </div>

                          {/* Right side: Action buttons for current user or confirmation badge */}
                          <div className="flex items-center gap-2">
                            {isYou && displayStatus === "adjusting" && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        // Calculate what percentage is needed to reach exactly 100%
                                        const otherMembersTotal = sessionMembers
                                          .filter(member => member.userId !== currentUser.id)
                                          .reduce((sum, member) => sum + member.percentage, 0)

                                        const neededPercentage = 100 - otherMembersTotal
                                        const constrainedPercentage = Math.max(
                                          10,
                                          Math.min(90, neededPercentage),
                                        )

                                        if (yourStatus === "confirmed" || isSessionLocked) return
                                        handlePercentageChange(constrainedPercentage)
                                      }}
                                      disabled={yourStatus === "confirmed" || isSessionLocked}
                                    >
                                      <Target className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Vul automatisch aan tot 100%</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        // Calculate equal split among all members
                                        const totalMembers = sessionMembers.length
                                        const equalPercentage = 100 / totalMembers
                                        const constrainedPercentage = Math.max(
                                          10,
                                          Math.min(90, equalPercentage),
                                        )

                                        if (yourStatus === "confirmed" || isSessionLocked) return
                                        handlePercentageChange(constrainedPercentage)
                                      }}
                                      disabled={yourStatus === "confirmed" || isSessionLocked}
                                    >
                                      <Scale className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Gelijke verdeling</p>
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}

                            {/* Confirmation badge for all confirmed users */}
                            {displayStatus === "confirmed" && (
                              <div className="relative">
                                <output
                                  className="motion-safe:zoom-in motion-safe:bounce-in flex h-10 w-10 items-center justify-center rounded-full bg-green-500 shadow-lg motion-safe:animate-in motion-safe:duration-500 dark:bg-green-600"
                                  aria-label="Bevestigd"
                                >
                                  <Check className="motion-safe:zoom-in h-6 w-6 text-white motion-safe:animate-in motion-safe:delay-300 motion-safe:duration-300" />
                                </output>
                                {/* Pulse ring animation for extra attention */}
                                <div className="absolute inset-0 h-10 w-10 animate-ping-limited rounded-full bg-green-400/30" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Investment details */}
                        <div className="space-y-2">
                          {/* Percentage and amount with smooth transitions */}
                          <div className="flex items-baseline justify-between">
                            <span className="font-bold text-2xl text-foreground transition-all duration-500 ease-out">
                              {currentPercentage.toFixed(1)}%
                            </span>
                            <span className="font-medium text-muted-foreground text-sm transition-all duration-500 ease-out">
                              {formatCurrency(memberAmount)}
                            </span>
                          </div>

                          {/* Progress bar - Interactive for current user, read-only for others */}
                          {isYou && displayStatus === "adjusting" ? (
                            <div className="space-y-2">
                              <Slider
                                value={[yourPercentage]}
                                onValueChange={value => handlePercentageChange(value[0])}
                                min={10}
                                max={90}
                                step={0.1}
                                className="transition-all duration-700 ease-out"
                                disabled={yourStatus === "confirmed" || isSessionLocked}
                              />
                              <div className="flex justify-between text-muted-foreground text-xs">
                                <span>10%</span>
                                <span>50%</span>
                                <span>90%</span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <Progress
                                value={currentPercentage}
                                className="h-1.5 transition-all duration-700 ease-out"
                                max={100}
                              />
                            </div>
                          )}
                        </div>

                        {/* Confirm button for current user */}
                        {isYou && (
                          <div className="pt-2">
                            {displayStatus === "adjusting" ? (
                              <Button
                                onClick={handleConfirm}
                                disabled={!canConfirm}
                                className="w-full"
                                size="sm"
                              >
                                {canConfirm
                                  ? `Bevestig ${yourPercentage.toFixed(1)}%`
                                  : yourPercentage < 10 || yourPercentage > 90
                                    ? "Percentage moet tussen 10-90% zijn"
                                    : "Totaal moet 100% zijn om te bevestigen"}
                              </Button>
                            ) : (
                              <Button
                                onClick={handleChangeMind}
                                variant="outline"
                                className="w-full border-green-200 text-green-700 transition-all duration-300 hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900/20"
                                size="sm"
                              >
                                Verander mijn aandeel
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}
