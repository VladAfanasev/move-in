import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { CostCalculationPageClient } from "@/app/features/cost-calculation/components/cost-calculation-page-client"
import { PendingGroupApproval } from "@/app/features/groups/components/pending-group-approval"
// import { DealContractCard } from "@/app/features/contracts/components/deal-contract-card"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering to prevent build-time prerendering
export const dynamic = "force-dynamic"

interface CostCalculationPageProps {
  params: Promise<{
    id: string
    propertyId: string
  }>
  searchParams: Promise<{
    joined?: string
  }>
}

export default async function CostCalculationPage({ params, searchParams }: CostCalculationPageProps) {
  const { id: groupId, propertyId } = await params
  const { joined } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    const currentUrl = `/dashboard/groups/${groupId}/calculate/${propertyId}`
    redirect(`/login?redirectTo=${encodeURIComponent(currentUrl)}`)
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
  const isActiveMember = userMember && userMember.status === "active"

  // If not an active member, check for pending join request
  let hasPendingRequest = false
  if (!isActiveMember) {
    const { db } = await import("@/db/client")
    const { groupJoinRequests } = await import("@/db/schema")
    const { and, eq } = await import("drizzle-orm")

    const pendingRequest = await db
      .select()
      .from(groupJoinRequests)
      .where(
        and(
          eq(groupJoinRequests.groupId, groupId),
          eq(groupJoinRequests.userId, user.id),
          eq(groupJoinRequests.status, "pending"),
        ),
      )
      .limit(1)

    hasPendingRequest = pendingRequest.length > 0

    // If no active membership and no pending request, redirect to group join page
    if (!hasPendingRequest) {
      const currentUrl = `/dashboard/groups/${groupId}/calculate/${propertyId}`
      redirect(`/join/${groupId}?redirect=${encodeURIComponent(currentUrl)}`)
    }
  }

  // Only get/create calculations if user is an active member
  let calculation = null
  let completedSession = null
  let isSessionLocked = false

  if (isActiveMember) {
    // Get or create cost calculation and check for sessions
    calculation = await getOrCreateCostCalculation(groupId, propertyId, user)

    // Check for completed session (for contract display)
    completedSession = await getCompletedNegotiationSession(calculation.id)

    // Always get or create an active session (for cost calculation form)
    // const sessionId = await getOrCreateNegotiationSession(calculation.id, user.id)
    // const activeSession = await getNegotiationSession(sessionId)

    // Use completed session data for contract if available, otherwise use active session
    // const sessionForContract = completedSession || activeSession
    isSessionLocked = !!completedSession
  }

  // const totalCosts = Number(calculation.totalCosts)

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

      {isActiveMember ? (
        <CostCalculationPageClient
          property={property}
          group={group}
          members={members}
          currentUser={user}
          isSessionLocked={isSessionLocked}
        />
      ) : hasPendingRequest ? (
        <PendingGroupApproval
          groupName={group.name}
          propertyAddress={`${property.address}, ${property.city}`}
          showJoinedAlert={joined === "pending"}
        />
      ) : null}

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
  )
}
