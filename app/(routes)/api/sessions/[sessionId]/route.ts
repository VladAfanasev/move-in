import { type NextRequest, NextResponse } from "next/server"
import { getNegotiationSession, updateMemberSessionStatus } from "@/lib/cost-calculations"
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

    await updateMemberSessionStatus(sessionId, user.id, {
      currentPercentage,
      status,
      isOnline,
    })

    // Get updated session
    const updatedSession = await getNegotiationSession(sessionId)

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error("Error updating session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
