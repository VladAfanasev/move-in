"use client"

import type { User } from "@supabase/supabase-js"
import { AlertCircle, CheckCircle, Play, Settings, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RangeSlider } from "@/components/ui/range-slider"

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

interface MemberProposal {
  userId: string
  userName: string
  investmentAmount: number
  investmentPercentage: number
  notes?: string
  status: "draft" | "submitted"
}

interface MemberIntention {
  userId: string
  userName: string
  desiredPercentage?: number
  maxPercentage?: number
  status: "not_set" | "setting" | "intentions_set" | "ready_for_session"
}

interface CostCalculationFormProps {
  property: Property
  group: Group
  members: Member[]
  currentUser: User
}

export function CostCalculationForm({
  property,
  group,
  members: _members,
  currentUser,
}: CostCalculationFormProps) {
  const router = useRouter()
  const formId = useId()
  // Cost calculation state
  const [costs, setCosts] = useState({
    purchasePrice: Number(property.price),
    notaryFees: 2500,
    transferTax: 0, // Will be calculated
    renovationCosts: 0,
    brokerFees: 0,
    inspectionCosts: 750,
    otherCosts: 0,
  })

  // User's investment proposal
  const [userProposal, setUserProposal] = useState({
    investmentPercentage: 33.33,
    investmentAmount: 0,
    notes: "",
  })

  // Member proposals (mock data for now)
  const [_memberProposals, _setMemberProposals] = useState<MemberProposal[]>([])

  // Intention setting state
  const [showIntentionModal, setShowIntentionModal] = useState(false)
  const [tempInvestmentRange, setTempInvestmentRange] = useState([25, 40])
  const [memberIntentions, setMemberIntentions] = useState<MemberIntention[]>([])
  const [calculationId, setCalculationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submittingIntention, setSubmittingIntention] = useState(false)
  const [startingSession, setStartingSession] = useState(false)
  const [existingSessionId, setExistingSessionId] = useState<string | null>(null)

  // Calculate if session can be started
  const allIntentionsSet = memberIntentions.every(
    intention => intention.status === "intentions_set",
  )
  const _canStartSession = allIntentionsSet && memberIntentions.length >= 2

  // Calculate if 100% is achievable
  const totalMaxPercentage = memberIntentions
    .filter(intention => intention.maxPercentage)
    .reduce((sum, intention) => sum + (intention.maxPercentage || 0), 0)
  const canReach100 = totalMaxPercentage >= 100

  // Calculate derived values
  const transferTax = costs.purchasePrice * 0.02 // 2% transfer tax in Netherlands
  const totalCosts =
    costs.purchasePrice +
    costs.notaryFees +
    transferTax +
    costs.renovationCosts +
    costs.brokerFees +
    costs.inspectionCosts +
    costs.otherCosts

  const maxInvestmentPercentage = 90
  const minInvestmentPercentage = 10

  // Update investment amount when percentage changes
  const _handlePercentageChange = (percentage: number) => {
    setIsPercentageMode(true)
    const amount = Math.round((totalCosts * percentage) / 100)
    setUserProposal(prev => ({
      ...prev,
      investmentPercentage: percentage,
      investmentAmount: amount,
    }))
  }

  // Update percentage when amount changes
  const _handleAmountChange = (amount: number) => {
    setIsPercentageMode(false)
    const percentage = Math.min(
      maxInvestmentPercentage,
      Math.max(minInvestmentPercentage, (amount / totalCosts) * 100),
    )
    setUserProposal(prev => ({
      ...prev,
      investmentAmount: amount,
      investmentPercentage: percentage,
    }))
  }

  // Keep track of whether we're in "percentage mode" (user is changing percentage)
  // or "amount mode" (user is changing amount directly)
  const [isPercentageMode, setIsPercentageMode] = useState(true)

  // Calculate the investment amount based on current percentage and total costs
  const calculatedAmount = Math.round((totalCosts * userProposal.investmentPercentage) / 100)

  // Update investment amount when total costs change and we're in percentage mode
  useEffect(() => {
    if (isPercentageMode) {
      setUserProposal(prev => ({
        ...prev,
        investmentAmount: calculatedAmount,
      }))
    }
  }, [calculatedAmount, isPercentageMode])

  // Initialize on first render
  useEffect(() => {
    if (userProposal.investmentAmount === 0) {
      setUserProposal(prev => ({
        ...prev,
        investmentAmount: calculatedAmount,
      }))
    }
  }, [calculatedAmount, userProposal.investmentAmount])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Initialize empty intentions for members
  const initializeEmptyIntentions = useCallback(() => {
    const intentions = _members
      .filter(m => m.status === "active")
      .map((member, index) => ({
        userId: member.userId,
        userName:
          member.userId === currentUser.id
            ? "You"
            : member.fullName || member.email?.split("@")[0] || `Member ${index + 1}`,
        status: "not_set" as const,
      }))
    setMemberIntentions(intentions)
  }, [_members, currentUser.id])

  // Load member intentions from database
  const loadMemberIntentions = useCallback(async () => {
    try {
      setLoading(true)

      // Create or get cost calculation first
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: group.id,
          propertyId: property.id,
          initialCosts: costs,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCalculationId(data.calculationId)

        // Check if session already exists
        if (data.sessionId) {
          setExistingSessionId(data.sessionId)
        }
      } else {
        // If session creation fails, still get/create calculation for intentions
        const _calcResponse = await fetch("/api/intentions", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
      }

      // Load current intentions
      const intentionsResponse = await fetch(
        `/api/intentions?groupId=${group.id}&propertyId=${property.id}`,
      )

      if (intentionsResponse.ok) {
        const intentionsData = await intentionsResponse.json()
        setMemberIntentions(intentionsData.intentions)
        if (intentionsData.calculationId) {
          setCalculationId(intentionsData.calculationId)
        }
      } else {
        // Initialize with empty intentions if API doesn't exist yet
        initializeEmptyIntentions()
      }
    } catch (error) {
      console.error("Error loading intentions:", error)
      initializeEmptyIntentions()
    } finally {
      setLoading(false)
    }
  }, [group.id, property.id, costs, initializeEmptyIntentions])

  // Load intentions on component mount
  useEffect(() => {
    loadMemberIntentions()
  }, [loadMemberIntentions])

  const _handleSubmitProposal = async () => {
    // TODO: Implement server action to save proposal
    console.log("Submitting proposal:", {
      propertyId: property.id,
      groupId: group.id,
      userId: currentUser.id,
      ...userProposal,
    })
    alert("Voorstel ingediend! Andere groepsleden kunnen nu jouw voorstel zien.")
  }

  const handleOpenIntentionModal = () => {
    const currentMember = memberIntentions.find(m => m.userId === currentUser.id)
    if (currentMember?.desiredPercentage) {
      setTempInvestmentRange([currentMember.desiredPercentage, currentMember.maxPercentage || 40])
    }
    setShowIntentionModal(true)
  }

  const handleSubmitIntention = async () => {
    if (!calculationId) {
      alert("Calculation not found. Please try refreshing the page.")
      return
    }

    try {
      setSubmittingIntention(true)

      const response = await fetch("/api/intentions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calculationId,
          desiredPercentage: tempInvestmentRange[0],
          maxPercentage: tempInvestmentRange[1],
        }),
      })

      if (response.ok) {
        // Update local state
        setMemberIntentions(prev =>
          prev.map(intention =>
            intention.userId === currentUser.id
              ? {
                  ...intention,
                  desiredPercentage: tempInvestmentRange[0],
                  maxPercentage: tempInvestmentRange[1],
                  status: "intentions_set",
                }
              : intention,
          ),
        )
        setShowIntentionModal(false)

        // Reload intentions to get latest data from all members
        await loadMemberIntentions()
      } else {
        const error = await response.json()
        alert(`Error setting intentions: ${error.error}`)
      }
    } catch (error) {
      console.error("Error submitting intention:", error)
      alert("Error setting intentions. Please try again.")
    } finally {
      setSubmittingIntention(false)
    }
  }

  const handleStartLiveSession = async () => {
    try {
      setStartingSession(true)

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: group.id,
          propertyId: property.id,
          initialCosts: costs,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Live negotiation session created:", data.sessionId)
        router.push(`/dashboard/groups/${group.id}/negotiate/${property.id}/live`)
      } else {
        const error = await response.json()
        alert(`Error starting session: ${error.error}`)
      }
    } catch (error) {
      console.error("Error starting live session:", error)
      alert("Error starting live session. Please try again.")
    } finally {
      setStartingSession(false)
    }
  }

  const getMemberStatusText = (intention: MemberIntention) => {
    switch (intention.status) {
      case "not_set":
        return intention.userId === currentUser.id
          ? "Set your intentions"
          : "Waiting for intentions"
      case "setting":
        return "Setting intentions..."
      case "intentions_set":
        return "Intentions set"
      case "ready_for_session":
        return "Ready!"
      default:
        return "Unknown status"
    }
  }

  const getMemberStatusColor = (intention: MemberIntention) => {
    switch (intention.status) {
      case "not_set":
        return intention.userId === currentUser.id ? "text-blue-600" : "text-orange-600"
      case "setting":
        return "text-yellow-600"
      case "intentions_set":
        return "text-green-600"
      case "ready_for_session":
        return "text-green-700"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Intention Setting Modal */}
      <Dialog open={showIntentionModal} onOpenChange={setShowIntentionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Your Investment Intentions</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="mb-1 font-medium">Total property costs: {formatCurrency(totalCosts)}</p>
              <p className="text-muted-foreground">Set your minimum and maximum investment range</p>
            </div>

            <RangeSlider
              label="Investment Range"
              value={tempInvestmentRange}
              onValueChange={setTempInvestmentRange}
              min={10}
              max={90}
              step={1}
              totalAmount={totalCosts}
              showAmountInputs={true}
            />

            <div className="rounded-lg bg-blue-50 p-3 text-blue-800 text-sm">
              <p className="font-medium">How this works:</p>
              <ul className="mt-1 list-inside list-disc space-y-1">
                <li>
                  Set your <strong>minimum</strong> and <strong>maximum</strong> investment amounts
                </li>
                <li>You can invest anywhere within this range</li>
                <li>In the live session, you can negotiate within these bounds</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowIntentionModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitIntention}
                className="flex-1"
                disabled={submittingIntention}
              >
                {submittingIntention ? "Setting..." : "Set Intentions"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual Cost Calculation */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Kosten overzicht</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor={`${formId}-purchasePrice`}>Koopprijs</Label>
                <Input
                  id={`${formId}-purchasePrice`}
                  type="number"
                  value={costs.purchasePrice}
                  onChange={e =>
                    setCosts(prev => ({ ...prev, purchasePrice: Number(e.target.value) }))
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor={`${formId}-notaryFees`}>Notariskosten</Label>
                <Input
                  id={`${formId}-notaryFees`}
                  type="number"
                  value={costs.notaryFees}
                  onChange={e =>
                    setCosts(prev => ({ ...prev, notaryFees: Number(e.target.value) }))
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Overdrachtsbelasting (2%)</Label>
                <Input value={formatCurrency(transferTax)} disabled className="mt-1 bg-muted" />
              </div>

              <div>
                <Label htmlFor={`${formId}-renovationCosts`}>Renovatiekosten</Label>
                <Input
                  id={`${formId}-renovationCosts`}
                  type="number"
                  value={costs.renovationCosts}
                  onChange={e =>
                    setCosts(prev => ({ ...prev, renovationCosts: Number(e.target.value) }))
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor={`${formId}-inspectionCosts`}>Inspecties</Label>
                <Input
                  id={`${formId}-inspectionCosts`}
                  type="number"
                  value={costs.inspectionCosts}
                  onChange={e =>
                    setCosts(prev => ({ ...prev, inspectionCosts: Number(e.target.value) }))
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor={`${formId}-otherCosts`}>Overige kosten</Label>
                <Input
                  id={`${formId}-otherCosts`}
                  type="number"
                  value={costs.otherCosts}
                  onChange={e =>
                    setCosts(prev => ({ ...prev, otherCosts: Number(e.target.value) }))
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between font-semibold text-lg">
                <span>Totale kosten:</span>
                <span>{formatCurrency(totalCosts)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Group Members Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Groep Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100 p-4" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {memberIntentions.map(intention => {
                  const isYou = intention.userId === currentUser.id
                  const canSetIntentions = isYou && intention.status === "not_set"

                  return (
                    <div
                      key={intention.userId}
                      className={`flex items-center justify-between rounded-lg p-4 ${
                        isYou ? "border border-blue-200 bg-blue-50" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            intention.status === "intentions_set"
                              ? "bg-green-500"
                              : intention.status === "not_set"
                                ? "bg-gray-300"
                                : "bg-yellow-500"
                          }`}
                        />
                        <div>
                          <div className="font-medium">{intention.userName}</div>
                          {intention.desiredPercentage && intention.maxPercentage && (
                            <div className="text-muted-foreground text-sm">
                              Gewenst: {intention.desiredPercentage}% • Max:{" "}
                              {intention.maxPercentage}%
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`font-medium text-sm ${getMemberStatusColor(intention)}`}>
                          {getMemberStatusText(intention)}
                        </span>

                        {canSetIntentions && (
                          <Button
                            size="sm"
                            onClick={handleOpenIntentionModal}
                            className="flex items-center space-x-1"
                          >
                            <Settings className="h-4 w-4" />
                            <span>Set</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Session Status */}
            {!loading && (
              <>
                {allIntentionsSet && (
                  <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-semibold text-green-800">Alle intenties aanwezig!</div>
                          <div className="text-green-700 text-sm">
                            {canReach100
                              ? "100% is achievable with current maximum values"
                              : "⚠️ 100% might not be achievable - adjust in live session"}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={handleStartLiveSession}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                        disabled={startingSession}
                      >
                        <Play className="h-4 w-4" />
                        <span>
                          {startingSession
                            ? "Sessie starten..."
                            : existingSessionId
                              ? "Ga naar sessie"
                              : "Start Live Sessie"}
                        </span>
                      </Button>
                    </div>
                  </div>
                )}

                {!allIntentionsSet && (
                  <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <div className="text-sm text-yellow-800">
                        Waiting for all members to set their intentions before starting the live
                        session.
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
