import { type NextRequest, NextResponse } from "next/server"
import { broadcastToSession } from "@/lib/sse-connections"
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
    const { sessionId, type, data, excludeUserId } = body

    if (!(sessionId && type)) {
      return NextResponse.json({ error: "Missing sessionId or type" }, { status: 400 })
    }

    // Broadcast the message to all connected users in the session
    broadcastToSession(sessionId, { type, ...data }, excludeUserId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error broadcasting message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
