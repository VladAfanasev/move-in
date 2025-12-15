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
        `📡 Broadcasting percentage update: ${currentPercentage} from ${user.id} to session ${sessionId}`,
      )
      const broadcastData = {
        type: "percentage-update",
        userId: user.id,
        percentage: currentPercentage,
        status: status || "adjusting",
      }
      console.log("📤 Broadcast data:", broadcastData)
      broadcastToSession(sessionId, broadcastData, user.id)
    } else if (status) {
      console.log(`Broadcasting status change: ${status} from ${user.id}`)
      broadcastToSession(
        sessionId,
        {
          type: "status-change",
          userId: user.id,
          status,
        },
        user.id,
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating realtime session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
