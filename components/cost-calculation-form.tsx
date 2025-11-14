"use client"

import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { useEffect, useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle, CheckCircle, Users, Settings, Play } from "lucide-react"

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
  const [memberProposals, _setMemberProposals] = useState<MemberProposal[]>([])

  // Intention setting state
  const [showIntentionModal, setShowIntentionModal] = useState(false)
  const [tempDesiredPercentage, setTempDesiredPercentage] = useState(25)
  const [tempMaxPercentage, setTempMaxPercentage] = useState(40)
  
  // Initialize member intentions based on group members
  const [memberIntentions, setMemberIntentions] = useState<MemberIntention[]>(() => 
    _members
      .filter(m => m.status === "active")
      .map((member, index) => ({
        userId: member.userId,
        userName: member.userId === currentUser.id ? "You" : 
                member.fullName || member.email?.split("@")[0] || `Member ${index + 1}`,
        status: index === 1 ? "intentions_set" : index === 2 ? "intentions_set" : "not_set" as const,
        // Mock some members having set their intentions
        ...(index === 1 && { desiredPercentage: 30, maxPercentage: 45 }),
        ...(index === 2 && { desiredPercentage: 25, maxPercentage: 35 }),
      }))
  )

  // Calculate if session can be started
  const allIntentionsSet = memberIntentions.every(intention => intention.status === "intentions_set")
  const canStartSession = allIntentionsSet && memberIntentions.length >= 2

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
  const handlePercentageChange = (percentage: number) => {
    setIsPercentageMode(true)
    const amount = Math.round((totalCosts * percentage) / 100)
    setUserProposal(prev => ({
      ...prev,
      investmentPercentage: percentage,
      investmentAmount: amount,
    }))
  }

  // Update percentage when amount changes
  const handleAmountChange = (amount: number) => {
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

  const handleSubmitProposal = async () => {
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
      setTempDesiredPercentage(currentMember.desiredPercentage)
      setTempMaxPercentage(currentMember.maxPercentage || 40)
    }
    setShowIntentionModal(true)
  }

  const handleSubmitIntention = async () => {
    // TODO: Submit intention to server
    setMemberIntentions(prev => prev.map(intention => 
      intention.userId === currentUser.id 
        ? { 
            ...intention, 
            desiredPercentage: tempDesiredPercentage,
            maxPercentage: tempMaxPercentage,
            status: "intentions_set" 
          }
        : intention
    ))
    setShowIntentionModal(false)
  }

  const handleStartLiveSession = async () => {
    // Mark everyone as ready for session
    setMemberIntentions(prev => prev.map(intention => ({
      ...intention,
      status: "ready_for_session"
    })))
    
    // TODO: Create live session and redirect
    console.log("Starting live negotiation session...")
    router.push(`/dashboard/groups/${group.id}/negotiate/${property.id}/live`)
  }

  const getMemberStatusText = (intention: MemberIntention) => {
    switch (intention.status) {
      case "not_set":
        return intention.userId === currentUser.id ? "Set your intentions" : "Waiting for intentions"
      case "setting":
        return "Setting intentions..."
      case "intentions_set":
        return canStartSession ? "Ready to start session" : "Intentions set"
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
      {/* Group Members Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Groep Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {memberIntentions.map((intention) => {
              const isYou = intention.userId === currentUser.id
              const canSetIntentions = isYou && intention.status === "not_set"
              
              return (
                <div 
                  key={intention.userId}
                  className={`flex items-center justify-between rounded-lg p-4 ${
                    isYou ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`h-3 w-3 rounded-full ${
                      intention.status === "intentions_set" ? "bg-green-500" :
                      intention.status === "not_set" ? "bg-gray-300" :
                      "bg-yellow-500"
                    }`} />
                    <div>
                      <div className="font-medium">{intention.userName}</div>
                      {intention.desiredPercentage && intention.maxPercentage && (
                        <div className="text-sm text-muted-foreground">
                          Gewenst: {intention.desiredPercentage}% • Max: {intention.maxPercentage}%
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm font-medium ${getMemberStatusColor(intention)}`}>
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

          {/* Session Status */}
          {allIntentionsSet && (
            <div className="mt-6 rounded-lg bg-green-50 border border-green-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-semibold text-green-800">All intentions set!</div>
                    <div className="text-sm text-green-700">
                      {canReach100 ? 
                        "100% is achievable with current maximum values" : 
                        "⚠️ 100% might not be achievable - adjust in live session"
                      }
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleStartLiveSession}
                  className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>Start Live Session</span>
                </Button>
              </div>
            </div>
          )}

          {!allIntentionsSet && (
            <div className="mt-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div className="text-sm text-yellow-800">
                  Waiting for all members to set their intentions before starting the live session.
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Intention Setting Modal */}
      <Dialog open={showIntentionModal} onOpenChange={setShowIntentionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Your Investment Intentions</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-medium mb-1">Total property costs: {formatCurrency(totalCosts)}</p>
              <p className="text-muted-foreground">
                Set your desired percentage and maximum you're willing to invest
              </p>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <Label>Desired percentage</Label>
                <span className="font-semibold">{tempDesiredPercentage}%</span>
              </div>
              <Slider
                value={[tempDesiredPercentage]}
                onValueChange={value => setTempDesiredPercentage(value[0])}
                min={5}
                max={80}
                step={1}
                className="mb-2"
              />
              <div className="text-sm text-muted-foreground">
                Amount: {formatCurrency((totalCosts * tempDesiredPercentage) / 100)}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <Label>Maximum percentage (if needed)</Label>
                <span className="font-semibold">{tempMaxPercentage}%</span>
              </div>
              <Slider
                value={[tempMaxPercentage]}
                onValueChange={value => setTempMaxPercentage(value[0])}
                min={tempDesiredPercentage}
                max={90}
                step={1}
                className="mb-2"
              />
              <div className="text-sm text-muted-foreground">
                Amount: {formatCurrency((totalCosts * tempMaxPercentage) / 100)}
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              <p className="font-medium">How this works:</p>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>Your <strong>desired percentage</strong> is what you prefer to invest</li>
                <li>Your <strong>maximum percentage</strong> is the most you're willing to invest</li>
                <li>In the live session, you can negotiate anywhere between these values</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setShowIntentionModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmitIntention} className="flex-1">
                Set Intentions
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
                onChange={e => setCosts(prev => ({ ...prev, notaryFees: Number(e.target.value) }))}
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
                onChange={e => setCosts(prev => ({ ...prev, otherCosts: Number(e.target.value) }))}
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

      {/* Investment Proposal */}
      <Card>
        <CardHeader>
          <CardTitle>Jouw investeringsvoorstel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label>Investering percentage</Label>
              <span className="font-semibold">{userProposal.investmentPercentage.toFixed(1)}%</span>
            </div>
            <Slider
              value={[userProposal.investmentPercentage]}
              onValueChange={value => handlePercentageChange(value[0])}
              min={minInvestmentPercentage}
              max={maxInvestmentPercentage}
              step={0.1}
              className="mb-2"
            />
            <div className="flex justify-between text-muted-foreground text-xs">
              <span>Min: {minInvestmentPercentage}%</span>
              <span>Max: {maxInvestmentPercentage}%</span>
            </div>
          </div>

          <div>
            <Label htmlFor={`${formId}-investmentAmount`}>Investeringsbedrag (€)</Label>
            <Input
              id={`${formId}-investmentAmount`}
              type="number"
              value={userProposal.investmentAmount}
              onChange={e => handleAmountChange(Number(e.target.value))}
              className="mt-1"
              min={Math.round((totalCosts * minInvestmentPercentage) / 100)}
              max={Math.round((totalCosts * maxInvestmentPercentage) / 100)}
            />
            <p className="mt-1 text-muted-foreground text-xs">
              Min: {formatCurrency(Math.round((totalCosts * minInvestmentPercentage) / 100))} - Max:{" "}
              {formatCurrency(Math.round((totalCosts * maxInvestmentPercentage) / 100))}
            </p>
          </div>

          <div>
            <Label htmlFor={`${formId}-notes`}>Opmerkingen (optioneel)</Label>
            <Textarea
              id={`${formId}-notes`}
              value={userProposal.notes}
              onChange={e => setUserProposal(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Voeg eventuele opmerkingen toe..."
              className="mt-1"
            />
          </div>

          <Button onClick={handleSubmitProposal} className="w-full" size="lg">
            Voorstel indienen
          </Button>
        </CardContent>
      </Card>

      {/* Member Proposals */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Voorstellen van groepsleden</CardTitle>
        </CardHeader>
        <CardContent>
          {memberProposals.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="mb-2">Nog geen voorstellen ingediend.</p>
              <p className="text-sm">
                Deel deze pagina met groepsleden zodat zij hun voorstel kunnen doen:
              </p>
              <div className="mt-3 rounded-lg bg-muted p-3">
                <code className="break-all text-xs">
                  {typeof window !== "undefined" ? window.location.href : ""}
                </code>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {memberProposals.map((proposal, index) => (
                <div key={`${proposal.userId}-${index}`} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{proposal.userName}</h4>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        proposal.status === "submitted"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {proposal.status === "submitted" ? "Ingediend" : "Concept"}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Percentage: </span>
                      <span className="font-medium">
                        {proposal.investmentPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Bedrag: </span>
                      <span className="font-medium">
                        {formatCurrency(proposal.investmentAmount)}
                      </span>
                    </div>
                  </div>
                  {proposal.notes && (
                    <p className="mt-2 text-muted-foreground text-sm">{proposal.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
