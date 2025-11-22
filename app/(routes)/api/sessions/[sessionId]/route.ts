import { type NextRequest, NextResponse } from "next/server"
import { getNegotiationSession, updateMemberSessionStatus } from "@/lib/cost-calculations"
import { broadcastToSession } from "@/lib/sse-connections"
import { createClient } from "@/lib/supabase/server"

export async function GET(
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

    const session = await getNegotiationSession(sessionId)

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error("Error getting session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    const { currentPercentage, status, isOnline } = body

    console.log(`Session ${sessionId} update from ${user.id}:`, {
      currentPercentage,
      status,
      isOnline,
    })

    await updateMemberSessionStatus(sessionId, user.id, {
      currentPercentage,
      status,
      isOnline,
    })

    // Broadcast the change to other users
    if (currentPercentage !== undefined) {
      console.log(`Broadcasting percentage update: ${currentPercentage} from ${user.id}`)
      broadcastToSession(
        sessionId,
        {
          type: "percentage-update",
          userId: user.id,
          percentage: currentPercentage,
          status: status || "adjusting",
        },
        user.id,
      )
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

    // Get updated session
    const updatedSession = await getNegotiationSession(sessionId)

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error("Error updating session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
