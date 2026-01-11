import { type NextRequest, NextResponse } from "next/server"
import { broadcastToSession } from "@/lib/sse-connections"
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

    // Broadcast the change to other users without database storage
    if (currentPercentage !== undefined) {
      console.log(
        `📡 Broadcasting percentage update: ${currentPercentage}% from ${user.id} to session ${sessionId}`,
      )
      const broadcastData = {
        type: "percentage-update",
        userId: user.id,
        percentage: currentPercentage,
        status: status || "adjusting",
        timestamp: Date.now(),
      }
      console.log("📤 Broadcast data:", broadcastData)

      try {
        broadcastToSession(sessionId, broadcastData, user.id)
        console.log(`✅ Successfully broadcasted percentage update to session ${sessionId}`)
      } catch (error) {
        console.error(`❌ Failed to broadcast percentage update:`, error)
        return NextResponse.json({ error: "Broadcast failed" }, { status: 500 })
      }
    } else if (status) {
      console.log(
        `📡 Broadcasting status change: ${status} from ${user.id} to session ${sessionId}`,
      )
      const statusData = {
        type: "status-change",
        userId: user.id,
        status,
        timestamp: Date.now(),
      }

      try {
        broadcastToSession(sessionId, statusData, user.id)
        console.log(`✅ Successfully broadcasted status change to session ${sessionId}`)
      } catch (error) {
        console.error(`❌ Failed to broadcast status change:`, error)
        return NextResponse.json({ error: "Broadcast failed" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating realtime session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
