import type { User } from "@supabase/supabase-js"
import { and, eq, sql } from "drizzle-orm"
import { db } from "@/db/client"
import {
  costCalculations,
  memberProposals,
  memberSessionParticipation,
  negotiationSessions,
} from "@/db/schema/cost-calculations"

export interface MemberIntention {
  userId: string
  userName: string
  desiredPercentage?: number
  maxPercentage?: number
  status: "not_set" | "setting" | "intentions_set" | "ready_for_session"
}

export interface NegotiationSession {
  id: string
  calculationId: string
  status: "intention_setting" | "active" | "completed" | "cancelled"
  totalPercentage: number
  createdAt: string
  participants: {
    userId: string
    currentPercentage: number
    intendedPercentage?: number
    status: "adjusting" | "confirmed" | "locked"
    isOnline: boolean
    lastActivity: Date
  }[]
}

// Get or create a cost calculation for a group and property
export async function getOrCreateCostCalculation(
  groupId: string,
  propertyId: string,
  user: User,
  initialCosts?: {
    purchasePrice: number
    notaryFees?: number
    transferTax?: number
    renovationCosts?: number
    brokerFees?: number
    inspectionCosts?: number
    otherCosts?: number
  },
) {
  // First try to find existing calculation
  const existing = await db
    .select()
    .from(costCalculations)
    .where(and(eq(costCalculations.groupId, groupId), eq(costCalculations.propertyId, propertyId)))
    .limit(1)

  if (existing.length > 0) {
    return existing[0]
  }

  // Create new calculation if it doesn't exist
  const costs = initialCosts || {
    purchasePrice: 0,
    notaryFees: 2500,
    transferTax: 0,
    renovationCosts: 0,
    brokerFees: 0,
    inspectionCosts: 750,
    otherCosts: 0,
  }

  const transferTax = costs.purchasePrice * 0.02 // 2% transfer tax in Netherlands
  const totalCosts =
    costs.purchasePrice +
    (costs.notaryFees ?? 2500) +
    transferTax +
    (costs.renovationCosts ?? 0) +
    (costs.brokerFees ?? 0) +
    (costs.inspectionCosts ?? 750) +
    (costs.otherCosts ?? 0)

  const [newCalculation] = await db
    .insert(costCalculations)
    .values({
      groupId,
      propertyId,
      createdBy: user.id,
      purchasePrice: costs.purchasePrice.toString(),
      notaryFees: (costs.notaryFees ?? 2500).toString(),
      transferTax: transferTax.toString(),
      renovationCosts: (costs.renovationCosts ?? 0).toString(),
      brokerFees: (costs.brokerFees ?? 0).toString(),
      inspectionCosts: (costs.inspectionCosts ?? 750).toString(),
      otherCosts: (costs.otherCosts ?? 0).toString(),
      totalCosts: totalCosts.toString(),
      totalEquityNeeded: totalCosts.toString(), // Simplified for now
    })
    .returning()

  return newCalculation
}

// Get member intentions for a cost calculation
export async function getMemberIntentions(
  calculationId: string,
  groupMembers: Array<{ userId: string; fullName: string | null; email: string | null }>,
): Promise<MemberIntention[]> {
  // Get existing proposals/intentions
  const proposals = await db
    .select()
    .from(memberProposals)
    .where(eq(memberProposals.calculationId, calculationId))

  return groupMembers.map((member, index) => {
    const proposal = proposals.find(p => p.userId === member.userId)

    return {
      userId: member.userId,
      userName: member.fullName || member.email?.split("@")[0] || `Member ${index + 1}`,
      desiredPercentage: proposal?.preferredInvestment
        ? Number(proposal.preferredInvestment)
        : undefined,
      maxPercentage: proposal?.maxInvestment ? Number(proposal.maxInvestment) : undefined,
      status: proposal ? "intentions_set" : "not_set",
    }
  })
}

// Set member intentions
export async function setMemberIntentions(
  calculationId: string,
  userId: string,
  desiredPercentage: number,
  maxPercentage: number,
) {
  // Upsert the member proposal with intention data
  await db
    .insert(memberProposals)
    .values({
      calculationId,
      userId,
      investmentAmount: "0", // Will be calculated later
      investmentPercentage: desiredPercentage.toString(),
      preferredInvestment: desiredPercentage.toString(),
      maxInvestment: maxPercentage.toString(),
      status: "draft",
    })
    .onConflictDoUpdate({
      target: [memberProposals.calculationId, memberProposals.userId],
      set: {
        preferredInvestment: desiredPercentage.toString(),
        maxInvestment: maxPercentage.toString(),
        updatedAt: sql`now()`,
      },
    })
}

// Get or create a negotiation session
export async function getOrCreateNegotiationSession(
  calculationId: string,
  createdBy: string,
): Promise<string> {
  // Try to find existing active session
  const existing = await db
    .select()
    .from(negotiationSessions)
    .where(
      and(
        eq(negotiationSessions.calculationId, calculationId),
        eq(negotiationSessions.status, "active"),
      ),
    )
    .limit(1)

  if (existing.length > 0) {
    return existing[0].id
  }

  // Create new session
  const [newSession] = await db
    .insert(negotiationSessions)
    .values({
      calculationId,
      createdBy,
      status: "active",
    })
    .returning()

  return newSession.id
}

// Get negotiation session details
export async function getNegotiationSession(sessionId: string): Promise<NegotiationSession | null> {
  const session = await db
    .select()
    .from(negotiationSessions)
    .where(eq(negotiationSessions.id, sessionId))
    .limit(1)

  if (session.length === 0) {
    return null
  }

  const participants = await db
    .select()
    .from(memberSessionParticipation)
    .where(eq(memberSessionParticipation.sessionId, sessionId))

  return {
    id: session[0].id,
    calculationId: session[0].calculationId,
    status: session[0].status as "intention_setting" | "active" | "completed" | "cancelled",
    totalPercentage: Number(session[0].totalPercentage),
    createdAt: session[0].createdAt.toISOString(),
    participants: participants.map((p: any) => ({
      userId: p.userId,
      currentPercentage: Number(p.currentPercentage),
      intendedPercentage: p.intendedPercentage ? Number(p.intendedPercentage) : undefined,
      status: p.status as "adjusting" | "confirmed" | "locked",
      isOnline: p.isOnline === "true",
      lastActivity: p.lastActivity,
    })),
  }
}

// Initialize session participants
export async function initializeSessionParticipants(
  sessionId: string,
  memberIntentions: MemberIntention[],
) {
  const participantData = memberIntentions.map(intention => ({
    sessionId,
    userId: intention.userId,
    currentPercentage: intention.desiredPercentage?.toString() || "0",
    intendedPercentage: intention.desiredPercentage?.toString(),
    status: "adjusting" as const,
    isOnline: "true",
  }))

  await db.insert(memberSessionParticipation).values(participantData).onConflictDoNothing()
}

// Update member session status
export async function updateMemberSessionStatus(
  sessionId: string,
  userId: string,
  updates: {
    currentPercentage?: number
    status?: "adjusting" | "confirmed" | "locked"
    isOnline?: boolean
  },
) {
  const updateData: any = {
    lastActivity: sql`now()`,
    updatedAt: sql`now()`,
  }

  if (updates.currentPercentage !== undefined) {
    updateData.currentPercentage = updates.currentPercentage.toString()
  }
  if (updates.status !== undefined) {
    updateData.status = updates.status
  }
  if (updates.isOnline !== undefined) {
    updateData.isOnline = updates.isOnline.toString()
  }

  await db
    .update(memberSessionParticipation)
    .set(updateData)
    .where(
      and(
        eq(memberSessionParticipation.sessionId, sessionId),
        eq(memberSessionParticipation.userId, userId),
      ),
    )

  // Update session total percentage
  await updateSessionTotalPercentage(sessionId)
}

// Update session total percentage
async function updateSessionTotalPercentage(sessionId: string) {
  const participants = await db
    .select()
    .from(memberSessionParticipation)
    .where(eq(memberSessionParticipation.sessionId, sessionId))

  const total = participants.reduce((sum: number, p: any) => sum + Number(p.currentPercentage), 0)

  await db
    .update(negotiationSessions)
    .set({
      totalPercentage: total.toString(),
      updatedAt: sql`now()`,
    })
    .where(eq(negotiationSessions.id, sessionId))
}
