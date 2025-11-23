import { ArrowLeft, Calculator } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { CostCalculationForm } from "@/components/cost-calculation-form"
// import { DealContractCard } from "@/components/deal-contract-card"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering to prevent build-time prerendering
export const dynamic = "force-dynamic"

interface CostCalculationPageProps {
  params: Promise<{
    id: string
    propertyId: string
  }>
}

export default async function CostCalculationPage({ params }: CostCalculationPageProps) {
  const { id: groupId, propertyId } = await params

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  // Dynamic imports to avoid build-time database connection
  const { getGroupById, getGroupMembers } = await import("@/lib/groups")
  const { getPropertyById } = await import("@/lib/properties")
  const {
    getOrCreateCostCalculation,
    // getNegotiationSession,
    // getOrCreateNegotiationSession,
    getCompletedNegotiationSession,
  } = await import("@/lib/cost-calculations")

  const [group, members, property] = await Promise.all([
    getGroupById(groupId),
    getGroupMembers(groupId),
    getPropertyById(propertyId),
  ])

  if (!group) {
    notFound()
  }

  if (!property) {
    notFound()
  }

  // Check if user is a member of this group
  const userMember = members.find(member => member.userId === user.id)
  if (!userMember || userMember.status !== "active") {
    redirect("/dashboard/groups")
  }

  // Get or create cost calculation and check for sessions
  const calculation = await getOrCreateCostCalculation(groupId, propertyId, user)

  // Check for completed session (for contract display)
  const completedSession = await getCompletedNegotiationSession(calculation.id)

  // Always get or create an active session (for cost calculation form)
  // const sessionId = await getOrCreateNegotiationSession(calculation.id, user.id)
  // const activeSession = await getNegotiationSession(sessionId)

  // Use completed session data for contract if available, otherwise use active session
  // const sessionForContract = completedSession || activeSession
  const isSessionLocked = !!completedSession

  // const totalCosts = Number(calculation.totalCosts)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader
        title="Kosten berekenen"
        backButton={
          <Link href={`/dashboard/groups/${groupId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar groep
            </Button>
          </Link>
        }
      />

      <div className="flex flex-1 flex-col space-y-6 p-6">
        {/* Property Header */}
        <Card className="overflow-hidden">
          <div className="flex">
            {/* Property Image - Full Height Left Side */}
            <div className="relative min-h-[200px] w-80 bg-muted">
              <Image
                src={property.images?.[0] || "/placeholder-property.svg"}
                alt={property.address}
                fill
                className="object-cover"
                sizes="320px"
              />
            </div>

            {/* Property Info - Right Side */}
            <div className="flex-1 p-6">
              {/* Title with Icon and Address */}
              <div className="mb-4">
                <h1 className="mb-2 flex items-center font-bold text-xl">
                  <Calculator className="mr-2 h-5 w-5 text-primary" />
                  {property.address}, {property.zipCode} {property.city}
                </h1>
              </div>

              {/* Compact Property Stats */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="block font-medium text-primary">Vraagprijs</span>
                  <span className="font-semibold text-lg">
                    {formatCurrency(Number(property.price))}
                  </span>
                </div>
                <div>
                  <span className="block font-medium text-primary">Oppervlakte</span>
                  <span className="font-semibold">{property.squareFeet} m²</span>
                </div>
                <div>
                  <span className="block font-medium text-primary">Kamers</span>
                  <span className="font-semibold">{property.bedrooms} kamers</span>
                </div>
              </div>

              {/* Secondary Stats Row */}
              <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="block font-medium text-muted-foreground">Badkamers</span>
                  <span className="font-semibold">{property.bathrooms}</span>
                </div>
                <div>
                  <span className="block font-medium text-muted-foreground">Type</span>
                  <span className="font-semibold capitalize">{property.propertyType}</span>
                </div>
                <div>
                  <span className="block font-medium text-muted-foreground">Status</span>
                  <span className="font-semibold capitalize">{property.status}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Cost Calculation Form */}
        <CostCalculationForm
          property={property}
          group={group}
          members={members}
          currentUser={user}
          isSessionLocked={isSessionLocked}
        />

        {/* Deal Contract Card
        <DealContractCard
          property={property}
          group={group}
          members={members}
          participants={sessionForContract?.participants || []}
          totalCosts={totalCosts}
          isSessionLocked={isSessionLocked}
          sessionLockedAt={isSessionLocked ? completedSession?.createdAt : undefined}
        /> */}
      </div>
    </div>
  )
}
