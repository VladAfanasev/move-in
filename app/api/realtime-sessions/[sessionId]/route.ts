import { type NextRequest, NextResponse } from "next/server"
import {
  checkAndCompleteSession,
  getOrCreateNegotiationSession,
  updateMemberSessionStatus,
} from "@/lib/cost-calculations"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { currentPercentage, status } = body

    console.log(`Realtime session ${sessionId} update from ${user.id}:`, {
      currentPercentage,
      status,
    })

    // Parse sessionId format: {groupId}-{propertyId}
    const parts = sessionId.split("-")
    if (parts.length < 2) {
      return NextResponse.json({ error: "Invalid session ID format" }, { status: 400 })
    }
    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    // So we need to join all parts except the last 5 for groupId, and last 5 for propertyId
    const groupId = parts.slice(0, 5).join("-")
    const propertyId = parts.slice(5).join("-")

    // Persist to database (broadcasting is handled by client via Supabase Realtime)
    if (currentPercentage !== undefined) {
      console.log(`💾 Persisting percentage update: ${currentPercentage}% from ${user.id}`)

      try {
        // Get the cost calculation to find the database session
        const { getOrCreateCostCalculation } = await import("@/lib/cost-calculations")
        const calculation = await getOrCreateCostCalculation(groupId, propertyId, user)

        // Get or create the negotiation session
        const dbSessionId = await getOrCreateNegotiationSession(calculation.id, user.id)

        // Update member status and percentage in database
        const updateStatus = status === "confirmed" ? "confirmed" : "adjusting"
        await updateMemberSessionStatus(dbSessionId, user.id, {
          currentPercentage: currentPercentage,
          status: updateStatus,
        })

        console.log(
          `✅ Persisted to database: ${currentPercentage}% with status ${updateStatus} for user ${user.id}`,
        )

        // Check if session is complete (all confirmed + total 100%)
        if (status === "confirmed") {
          const completionResult = await checkAndCompleteSession(dbSessionId)

          if (completionResult.completed) {
            console.log(`🎉 Session ${dbSessionId} completed!`)

            // Broadcast session-completed via Supabase Realtime
            const contractUrl = `/dashboard/groups/${groupId}/properties/${propertyId}/contract`
            const channelName = `session:${sessionId}`

            const channel = supabase.channel(channelName)
            await channel.send({
              type: "broadcast",
              event: "session-completed",
              payload: { sessionId: dbSessionId, redirectUrl: contractUrl, timestamp: Date.now() },
            })

            return NextResponse.json({
              success: true,
              completed: true,
              redirectUrl: contractUrl,
            })
          }
        }
      } catch (dbError) {
        console.error("Failed to persist to database:", dbError)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }
    } else if (status) {
      console.log(`💾 Persisting status change: ${status} from ${user.id}`)

      try {
        const { getOrCreateCostCalculation } = await import("@/lib/cost-calculations")
        const calculation = await getOrCreateCostCalculation(groupId, propertyId, user)
        const dbSessionId = await getOrCreateNegotiationSession(calculation.id, user.id)

        await updateMemberSessionStatus(dbSessionId, user.id, {
          status: status as "adjusting" | "confirmed",
        })
        console.log(`✅ Persisted status ${status} to database for user ${user.id}`)
      } catch (dbError) {
        console.error("Failed to persist status to database:", dbError)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating realtime session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
