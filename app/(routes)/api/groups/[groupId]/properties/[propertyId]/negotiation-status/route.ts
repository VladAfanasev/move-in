import { and, eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/db/client"
import { costCalculations, negotiationSessions } from "@/db/schema/cost-calculations"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string; propertyId: string }> },
) {
  try {
    const { groupId, propertyId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get cost calculation for this group and property
    const calculation = await db
      .select()
      .from(costCalculations)
      .where(
        and(eq(costCalculations.groupId, groupId), eq(costCalculations.propertyId, propertyId)),
      )
      .limit(1)

    if (calculation.length === 0) {
      return NextResponse.json({ isCompleted: false })
    }

    // Check if there's a completed negotiation session
    const completedSession = await db
      .select()
      .from(negotiationSessions)
      .where(
        and(
          eq(negotiationSessions.calculationId, calculation[0].id),
          eq(negotiationSessions.status, "completed"),
        ),
      )
      .limit(1)

    return NextResponse.json({
      isCompleted: completedSession.length > 0,
      sessionId: completedSession[0]?.id || null,
      lockedAt: completedSession[0]?.lockedAt || null,
    })
  } catch (error) {
    console.error("Error checking negotiation status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
