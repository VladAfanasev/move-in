"use client"

import type { User } from "@supabase/supabase-js"
import { useCallback, useEffect, useState } from "react"
import { useMockWebSocket } from "@/hooks/use-mock-websocket"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle, Clock, User as UserIcon } from "lucide-react"

interface Property {
  id: string
  address: string
  city: string
  zipCode: string
  price: string
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
  status: "adjusting" | "confirmed" | "locked"
  isOnline: boolean
  lastActivity?: number
}

interface LiveNegotiationSessionProps {
  property: Property
  group: Group
  members: Member[]
  currentUser: User
  totalCosts: number
}

export function LiveNegotiationSession({
  property,
  group,
  members,
  currentUser,
  totalCosts,
}: LiveNegotiationSessionProps) {
  // Convert members to session members with mock data based on intentions
  const [sessionMembers, setSessionMembers] = useState<SessionMember[]>(() => 
    members
      .filter(m => m.status === "active")
      .map((member, index) => {
        // Mock intention data - in real app this would come from the server
        const mockDesiredPercentages = [30, 25, 25, 20] // These should equal 100%
        
        return {
          userId: member.userId,
          name: member.userId === currentUser.id ? "You" : 
                member.fullName || member.email?.split("@")[0] || `Member ${index + 1}`,
          percentage: mockDesiredPercentages[index] || 25,
          status: "adjusting" as const,
          isOnline: true,
          lastActivity: Date.now(),
        }
      })
  )

  const [yourPercentage, setYourPercentage] = useState(() => {
    // Set initial percentage based on your desired percentage from intentions
    const yourMember = sessionMembers.find(m => m.userId === currentUser.id)
    return yourMember?.percentage || 25
  })
  const [yourStatus, setYourStatus] = useState<"adjusting" | "confirmed">("adjusting")
  const [sessionLocked, setSessionLocked] = useState(false)
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdown, setCountdown] = useState(5)

  // WebSocket connection
  const websocket = useMockWebSocket(`${group.id}-${property.id}`, currentUser.id)

  // Calculate totals
  const totalPercentage = sessionMembers.reduce((sum, member) => sum + member.percentage, 0)
  const remainingPercentage = 100 - totalPercentage
  const yourAmount = Math.round((totalCosts * yourPercentage) / 100)
  const allConfirmed = sessionMembers.every(member => 
    member.userId === currentUser.id ? yourStatus === "confirmed" : member.status === "confirmed"
  )

  // Progress bar color logic
  const getProgressColor = () => {
    if (totalPercentage < 95) return "bg-orange-500"
    if (totalPercentage >= 95 && totalPercentage < 100) return "bg-yellow-500"
    if (totalPercentage === 100) return "bg-green-500"
    if (totalPercentage > 100) return "bg-red-500"
    return "bg-orange-500"
  }

  const getProgressMessage = () => {
    if (totalPercentage < 95) {
      return `Still needed: ${(100 - totalPercentage).toFixed(1)}%`
    }
    if (totalPercentage >= 95 && totalPercentage < 100) {
      return `Almost there! ${(100 - totalPercentage).toFixed(1)}% remaining`
    }
    if (totalPercentage === 100 && allConfirmed) {
      return "🎉 ALL MEMBERS CONFIRMED + 100%!"
    }
    if (totalPercentage === 100) {
      return "✅ 100% reached! Waiting for everyone to confirm..."
    }
    if (totalPercentage > 100) {
      return `⚠️ Over limit! ${(totalPercentage - 100).toFixed(1)}% too much`
    }
    return ""
  }

  // Check if user can confirm
  const canConfirm = yourPercentage >= 10 && yourPercentage <= 90 && 
                    Math.abs(totalPercentage - 100) < 0.01 && 
                    yourStatus === "adjusting"

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case "percentage-update":
        if (message.userId !== currentUser.id) {
          setSessionMembers(prev => prev.map(member => 
            member.userId === message.userId 
              ? { ...member, percentage: message.percentage, status: message.status, lastActivity: Date.now() }
              : member
          ))
        }
        break
      
      case "status-change":
        if (message.userId !== currentUser.id) {
          setSessionMembers(prev => prev.map(member => 
            member.userId === message.userId 
              ? { ...member, status: message.status }
              : member
          ))
        }
        break
        
      case "member-join":
        // Handle new member joining
        console.log(`${message.name} joined the session`)
        break
        
      case "session-locked":
        setSessionLocked(true)
        setShowCountdown(false)
        break
    }
  }, [currentUser.id])

  // Set up WebSocket event listener
  useEffect(() => {
    websocket.on(handleWebSocketMessage)
    return () => websocket.off(handleWebSocketMessage)
  }, [websocket, handleWebSocketMessage])

  // Handle percentage change
  const handlePercentageChange = (newPercentage: number) => {
    if (yourStatus === "confirmed" || sessionLocked) return
    
    setYourPercentage(newPercentage)
    
    // Update session members
    setSessionMembers(prev => prev.map(member => 
      member.userId === currentUser.id 
        ? { ...member, percentage: newPercentage, status: "adjusting" }
        : member
    ))
    
    // Reset status to adjusting
    setYourStatus("adjusting")
    
    // Broadcast via WebSocket
    websocket.send({
      type: "percentage-update",
      userId: currentUser.id,
      percentage: newPercentage,
      status: "adjusting"
    })
  }

  // Handle confirm
  const handleConfirm = () => {
    setYourStatus("confirmed")
    
    // Update session members
    setSessionMembers(prev => prev.map(member => 
      member.userId === currentUser.id 
        ? { ...member, status: "confirmed" }
        : member
    ))
    
    // Broadcast via WebSocket
    websocket.send({
      type: "status-change",
      userId: currentUser.id,
      status: "confirmed"
    })
  }

  // Handle change mind
  const handleChangeMind = () => {
    setYourStatus("adjusting")
    
    // Update session members
    setSessionMembers(prev => prev.map(member => 
      member.userId === currentUser.id 
        ? { ...member, status: "adjusting" }
        : member
    ))
    
    // Broadcast via WebSocket
    websocket.send({
      type: "status-change",
      userId: currentUser.id,
      status: "adjusting"
    })
  }

  // Auto-lock session when conditions are met
  useEffect(() => {
    if (Math.abs(totalPercentage - 100) < 0.01 && allConfirmed && !sessionLocked) {
      setShowCountdown(true)
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            setSessionLocked(true)
            setShowCountdown(false)
            // TODO: Redirect to final overview
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [totalPercentage, allConfirmed, sessionLocked])

  // Lock session immediately
  const handleLockNow = () => {
    setSessionLocked(true)
    setShowCountdown(false)
    // TODO: Redirect to final overview
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Auto-lock countdown
  if (showCountdown) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="mb-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          </div>
          <h2 className="mb-2 font-semibold text-xl">🎉 ALL MEMBERS CONFIRMED + 100%!</h2>
          <p className="mb-4 text-muted-foreground">
            Session will lock in {countdown} seconds...
          </p>
          <Button onClick={handleLockNow} size="lg" className="w-full">
            Lock Session Now
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Session locked state
  if (sessionLocked) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="mb-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          </div>
          <h2 className="mb-2 font-semibold text-xl">🔒 Session Locked!</h2>
          <p className="mb-4 text-muted-foreground">
            All percentages have been finalized. Redirecting to overview...
          </p>
          <div className="space-y-2">
            {sessionMembers.map(member => (
              <div key={member.userId} className="flex justify-between rounded-lg bg-muted p-2">
                <span>{member.name}</span>
                <span className="font-semibold">{member.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Live Session Header */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              <div>
                <h2 className="font-semibold text-green-800">Live Negotiation Session</h2>
                <p className="text-sm text-green-700">
                  Everyone can now adjust their investment percentage. Session locks when all confirm and total = 100%
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-green-600">
                {sessionMembers.filter(m => m.isOnline).length} members online
              </div>
              <div className="text-xs text-green-600">
                Started: {new Date().toLocaleTimeString("nl-NL", { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Area - Left/Center */}
        <div className="space-y-6 lg:col-span-2">
        {/* Total Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">Total Progress</span>
                <span className="font-semibold text-lg">
                  {totalPercentage.toFixed(1)}/100%
                </span>
              </div>
              <Progress 
                value={Math.min(100, totalPercentage)} 
                className="h-4"
              />
              <div className={`mt-2 flex items-center space-x-2 ${
                totalPercentage === 100 && allConfirmed ? "text-green-600" :
                totalPercentage > 100 ? "text-red-600" :
                totalPercentage >= 95 ? "text-yellow-600" : "text-orange-600"
              }`}>
                {totalPercentage > 100 ? (
                  <AlertCircle className="h-4 w-4" />
                ) : totalPercentage === 100 && allConfirmed ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{getProgressMessage()}</span>
              </div>
            </div>
            
            {remainingPercentage !== 0 && (
              <div className="text-muted-foreground text-sm">
                Still needed: {remainingPercentage.toFixed(1)}%
              </div>
            )}
          </CardContent>
        </Card>

        {/* Your Investment */}
        <Card>
          <CardHeader>
            <CardTitle>Your Investment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {yourStatus === "adjusting" ? (
              <>
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-medium">Percentage</span>
                    <span className="font-semibold text-lg">{yourPercentage.toFixed(1)}%</span>
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
                  <div className="text-muted-foreground text-sm">Your investment</div>
                </div>

                <Button 
                  onClick={handleConfirm}
                  disabled={!canConfirm}
                  className="w-full"
                  size="lg"
                >
                  {canConfirm ? `Confirm ${yourPercentage.toFixed(1)}%` : 
                   yourPercentage < 10 || yourPercentage > 90 ? "Percentage must be 10-90%" :
                   "Total must be 100% to confirm"}
                </Button>
              </>
            ) : (
              <>
                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <div className="flex items-center justify-center space-x-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Confirmed</span>
                  </div>
                  <div className="mt-2 font-semibold text-2xl">{yourPercentage.toFixed(1)}%</div>
                  <div className="font-medium">{formatCurrency(yourAmount)}</div>
                </div>

                <Button 
                  onClick={handleChangeMind}
                  variant="outline"
                  className="w-full"
                >
                  Change my percentage
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Members Panel - Right */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5" />
              <span>Members Panel</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessionMembers.map((member) => {
                const isYou = member.userId === currentUser.id
                const displayStatus = isYou ? yourStatus : member.status
                
                return (
                  <div 
                    key={member.userId}
                    className={`rounded-lg p-3 ${
                      isYou ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">👤</span>
                        <span className="font-medium">{member.name}</span>
                        {member.isOnline && (
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Online" />
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge 
                          variant={displayStatus === "confirmed" ? "default" : "secondary"}
                          className={displayStatus === "confirmed" ? "bg-green-600" : ""}
                        >
                          {displayStatus === "confirmed" ? "✅ Confirmed" : "⏳ Adjusting"}
                        </Badge>
                        {member.lastActivity && member.lastActivity > Date.now() - 10000 && (
                          <span className="text-xs text-green-600">• Just updated</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="font-semibold text-lg">
                        {isYou ? yourPercentage.toFixed(1) : member.percentage.toFixed(1)}%
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {formatCurrency((totalCosts * (isYou ? yourPercentage : member.percentage)) / 100)}
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
  )
}