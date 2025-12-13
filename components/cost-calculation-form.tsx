"use client"

import type { User } from "@supabase/supabase-js"
import { Check, Plus, Scale, Target, User as UserIcon } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { CalculationInvitePopover } from "@/components/calculation-invite-popover"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
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
        isOnline: onlineMembers.includes(member.userId)
      }))
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
            ? "You"
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

  const getProgressMessage = () => {
    if (totalPercentage < 95) {
      return `Nog nodig: ${(100 - totalPercentage).toFixed(1)}%`
    }
    if (totalPercentage >= 95 && totalPercentage < 100) {
      return `Bijna daar! ${(100 - totalPercentage).toFixed(1)}% resterend`
    }
    if (totalPercentage === 100 && allConfirmed) {
      return "🎉 ALLE LEDEN BEVESTIGD"
    }
    if (totalPercentage === 100) {
      return "100% bereikt! Wachten op bevestiging van iedereen..."
    }
    if (totalPercentage > 100) {
      return `Over de limiet! ${(totalPercentage - 100).toFixed(1)}% te veel`
    }
    return ""
  }

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
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Progress & Your Investment */}
          <div className="space-y-4 lg:col-span-2">
            {/* Total Progress */}
            <Card>
              <CardContent className="pt-4">
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold">Totale dekking</span>
                    <span
                      className={`font-semibold text-lg ${
                        totalPercentage === 100 ? "text-green-600" : ""
                      }`}
                    >
                      {totalPercentage % 1 === 0
                        ? `${totalPercentage.toFixed(0)}%`
                        : `${totalPercentage.toFixed(1)}%`}
                    </span>
                  </div>
                  <Progress value={Math.min(100, totalPercentage)} className="h-3" />
                  <div
                    className={`mt-2 text-center ${
                      totalPercentage === 100 && allConfirmed
                        ? "text-green-600"
                        : totalPercentage > 100
                          ? "text-red-600"
                          : totalPercentage >= 95
                            ? "text-yellow-600"
                            : "text-orange-600"
                    }`}
                  >
                    <span className="font-medium text-sm">{getProgressMessage()}</span>
                  </div>
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
                        <span className="font-semibold text-xl">{yourPercentage.toFixed(1)}%</span>
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

                    <div className="rounded-lg bg-muted p-4 text-center">
                      <div className="font-semibold text-2xl">{formatCurrency(yourAmount)}</div>
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
                    <div className="rounded-lg bg-green-50 p-4 text-center">
                      <div className="mt-2 font-semibold text-2xl">
                        {yourPercentage.toFixed(1)}%
                      </div>
                      <div className="font-medium">{formatCurrency(yourAmount)}</div>
                    </div>

                    <Button onClick={handleChangeMind} variant="outline" className="w-full">
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
                <div className="space-y-2">
                  {sessionMembers.map(member => {
                    const isYou = member.userId === currentUser.id
                    const displayStatus = isYou ? yourStatus : member.status
                    const currentPercentage = isYou ? yourPercentage : member.percentage

                    return (
                      <div
                        key={member.userId}
                        className={`space-y-3 rounded-lg p-4 ${
                          isYou ? "border border-primary/20 bg-primary/5" : "bg-muted/50"
                        }`}
                      >
                        {/* Header: Name and Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{member.name}</span>
                            {member.isOnline && (
                              <div className="h-2 w-2 rounded-full bg-green-500" title="Online" />
                            )}
                          </div>
                          {displayStatus === "confirmed" && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Percentage and Amount */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-lg">
                              {currentPercentage.toFixed(1)}%
                            </span>
                            <span className="text-muted-foreground text-sm">
                              {formatCurrency((totalCosts * currentPercentage) / 100)}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <Progress value={currentPercentage} className="h-2" max={100} />
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
