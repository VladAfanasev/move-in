"use client"

import type { User } from "@supabase/supabase-js"
import { Check, Plus, Scale, Target, User as UserIcon } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { CalculationInvitePopover } from "@/app/features/cost-calculation/components/calculation-invite-popover"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PropertyGoalIndicator } from "@/components/ui/property-goal-indicator"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useCalculationSession } from "@/hooks/use-calculation-session"

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
}

export function CostCalculationForm({
  property,
  group,
  members: _members,
  currentUser,
  isSessionLocked = false,
}: CostCalculationFormProps) {
  // Session state for percentage negotiation
  const [sessionMembers, setSessionMembers] = useState<SessionMember[]>([])
  const [yourPercentage, setYourPercentage] = useState(25)
  const [yourStatus, setYourStatus] = useState<"adjusting" | "confirmed">("adjusting")
  const [loading, setLoading] = useState(true)

  // Get current user's name from members list
  const currentMember = _members.find(m => m.userId === currentUser.id)
  const currentUserName = currentMember?.fullName || currentUser.email || "Unknown User"

  // Real-time session management
  const {
    isConnected,
    onlineMembers,
    emitPercentageUpdate,
    emitStatusChange,
    getOnlineMemberCount,
  } = useCalculationSession({
    sessionId: `${group.id}-${property.id}`, // Create session ID from group and property
    userId: currentUser.id,
    userName: currentUserName,
    groupId: group.id,
    propertyId: property.id,
  })

  // Initialize session members from actual group members
  useEffect(() => {
    if (_members.length > 0 && sessionMembers.length === 0) {
      const initialMembers: SessionMember[] = _members
        .filter(member => member.status === "active")
        .map(member => ({
          userId: member.userId,
          name: member.fullName || member.email || "Unknown User",
          percentage: 25, // Default percentage
          status: "adjusting" as const,
          isOnline: onlineMembers.includes(member.userId), // Check if online
        }))

      setSessionMembers(initialMembers)
    }
  }, [_members, sessionMembers.length, onlineMembers])

  // Update online status when online members change
  useEffect(() => {
    setSessionMembers(prevMembers =>
      prevMembers.map(member => ({
        ...member,
        isOnline: onlineMembers.includes(member.userId),
      })),
    )
  }, [onlineMembers])

  // Calculate total costs (simplified - could be passed as prop)
  const totalCosts = Number(property.price) + 2500 + Number(property.price) * 0.02 + 750

  // Calculate session totals
  const totalPercentage = sessionMembers.reduce((sum, member) => {
    if (member.userId === currentUser.id) {
      return sum + yourPercentage
    }
    return sum + member.percentage
  }, 0)

  const yourAmount = Math.round((totalCosts * yourPercentage) / 100)
  const allConfirmed = sessionMembers.every(member =>
    member.userId === currentUser.id ? yourStatus === "confirmed" : member.status === "confirmed",
  )

  // Handle percentage change
  const handlePercentageChange = (newPercentage: number) => {
    if (yourStatus === "confirmed" || isSessionLocked) return
    setYourPercentage(newPercentage)
    setYourStatus("adjusting")

    // Emit real-time update
    emitPercentageUpdate(newPercentage, "adjusting")

    // Update session members locally for immediate feedback
    setSessionMembers(prev =>
      prev.map(member =>
        member.userId === currentUser.id
          ? { ...member, percentage: newPercentage, status: "adjusting" }
          : member,
      ),
    )
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

  // Initialize session members
  const initializeSessionMembers = useCallback(() => {
    const members = _members
      .filter(m => m.status === "active")
      .map((member, index) => ({
        userId: member.userId,
        name:
          member.userId === currentUser.id
            ? `${member.fullName || member.email?.split("@")[0] || "Unknown User"} (U)`
            : member.fullName || member.email?.split("@")[0] || `Member ${index + 1}`,
        percentage: member.userId === currentUser.id ? yourPercentage : 25,
        status: "adjusting" as const,
      }))
    setSessionMembers(members)
    setLoading(false)
  }, [_members, currentUser.id, yourPercentage])

  // Initialize on component mount
  useEffect(() => {
    initializeSessionMembers()
  }, [initializeSessionMembers])

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
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {/* Progress & Your Investment */}
          <div className="space-y-4 lg:col-span-1 xl:col-span-2">
            {/* Goal Progress Indicator */}
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

            {/* Your Investment */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Jouw investering</CardTitle>
                  <div className="flex items-center space-x-2">
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
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {yourStatus === "adjusting" ? (
                  <>
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="font-medium">Percentage</span>
                        <span className="font-semibold text-xl transition-all duration-300 ease-out">
                          {yourPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <Slider
                        value={[yourPercentage]}
                        onValueChange={value => handlePercentageChange(value[0])}
                        min={10}
                        max={90}
                        step={0.1}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-muted-foreground text-xs">
                        <span>10%</span>
                        <span>50%</span>
                        <span>90%</span>
                      </div>
                    </div>

                    <div className="rounded-lg bg-muted p-4 text-center transition-all duration-300 ease-out">
                      <div className="font-semibold text-2xl transition-all duration-500 ease-out">
                        {formatCurrency(yourAmount)}
                      </div>
                      <div className="text-muted-foreground text-sm">Jouw investering</div>
                    </div>

                    <Button
                      onClick={handleConfirm}
                      disabled={!canConfirm}
                      className="w-full"
                      size="lg"
                    >
                      {canConfirm
                        ? `Bevestig ${yourPercentage.toFixed(1)}%`
                        : yourPercentage < 10 || yourPercentage > 90
                          ? "Percentage moet tussen 10-90% zijn"
                          : "Totaal moet 100% zijn om te bevestigen"}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="motion-safe:fade-in relative rounded-lg border border-green-200 bg-green-50 p-4 text-center shadow-sm motion-safe:animate-in motion-safe:duration-500 dark:border-green-800 dark:bg-green-900/20">
                      {/* Success indicator */}
                      <div
                        className="-top-2 -right-2 motion-safe:zoom-in absolute flex h-6 w-6 items-center justify-center rounded-full bg-green-500 motion-safe:animate-in motion-safe:delay-200 motion-safe:duration-300"
                        role="status"
                        aria-label="Succesvol bevestigd"
                      >
                        <Check className="h-3 w-3 text-white" aria-hidden="true" />
                      </div>

                      <div className="mt-2 font-semibold text-2xl text-green-700 transition-all duration-500 dark:text-green-300">
                        {yourPercentage.toFixed(1)}%
                      </div>
                      <div className="font-medium text-green-600 transition-all duration-500 dark:text-green-400">
                        {formatCurrency(yourAmount)}
                      </div>
                      <div className="mt-1 text-green-600/80 text-xs dark:text-green-400/80">
                        ✓ Bevestigd
                      </div>
                    </div>

                    <Button
                      onClick={handleChangeMind}
                      variant="outline"
                      className="w-full border-green-200 text-green-700 transition-all duration-300 hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900/20"
                    >
                      Verander mijn aandeel
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Members Panel */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4" />
                      <div>
                        <span>Groepsleden</span>
                        <div className="font-normal text-muted-foreground text-xs">
                          {getOnlineMemberCount()}{" "}
                          {getOnlineMemberCount() === 1 ? "lid actief" : "leden actief"} in deze
                          sessie
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
                                        aria-label="Online nu"
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
                                  {displayStatus === "confirmed"
                                    ? "Bevestigd"
                                    : "Aan het aanpassen"}
                                </div>
                              </div>
                            </div>

                            {/* Confirmation badge */}
                            {displayStatus === "confirmed" && (
                              <div
                                className="motion-safe:zoom-in flex h-8 w-8 items-center justify-center rounded-full bg-green-100 shadow-md motion-safe:animate-in motion-safe:duration-300 dark:bg-green-900/30"
                                role="status"
                                aria-label="Bevestigd"
                              >
                                <Check className="motion-safe:zoom-in h-4 w-4 text-green-600 motion-safe:animate-in motion-safe:delay-150 dark:text-green-400" />
                              </div>
                            )}
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

                            {/* Visual progress indicator with smooth animation */}
                            <div>
                              <Progress
                                value={currentPercentage}
                                className="h-1.5 transition-all duration-700 ease-out"
                                max={100}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
