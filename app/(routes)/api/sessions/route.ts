import { type NextRequest, NextResponse } from "next/server"
import {
  getMemberIntentions,
  getOrCreateCostCalculation,
  getOrCreateNegotiationSession,
  initializeSessionParticipants,
} from "@/lib/cost-calculations"
import { getGroupMembers } from "@/lib/groups"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { groupId, propertyId, initialCosts } = body

    if (!(groupId && propertyId)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get or create cost calculation
    const calculation = await getOrCreateCostCalculation(groupId, propertyId, user, initialCosts)

    // Get group members
    const members = await getGroupMembers(groupId)

    // Get member intentions
    const intentions = await getMemberIntentions(calculation.id, members)

    // Check if all intentions are set
    const allIntentionsSet = intentions.every(i => i.status === "intentions_set")

    if (!allIntentionsSet) {
      return NextResponse.json(
        { error: "Not all members have set their intentions" },
        { status: 400 },
      )
    }

    // Create negotiation session
    const sessionId = await getOrCreateNegotiationSession(calculation.id, user.id)

    // Initialize participants
    await initializeSessionParticipants(sessionId, intentions)

    return NextResponse.json({
      sessionId,
      calculationId: calculation.id,
    })
  } catch (error) {
    console.error("Error creating session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
