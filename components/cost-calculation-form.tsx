"use client"

import type { User } from "@supabase/supabase-js"
import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"

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
    const amount = Math.round((totalCosts * percentage) / 100)
    setUserProposal(prev => ({
      ...prev,
      investmentPercentage: percentage,
      investmentAmount: amount,
    }))
  }

  // Update percentage when amount changes
  const handleAmountChange = (amount: number) => {
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

  // Initialize investment amount based on percentage
  if (userProposal.investmentAmount === 0) {
    handlePercentageChange(userProposal.investmentPercentage)
  }

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

  return (
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
  )
}
