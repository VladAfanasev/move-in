import { type NextRequest, NextResponse } from "next/server"
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
    const { userId, currentPercentage, status } = body

    // Verify the user is updating their own data
    if (user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`Database session ${sessionId} update from ${user.id}:`, {
      currentPercentage,
      status,
    })

    // Parse sessionId format: "groupId-propertyId"
    // UUIDs have format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (8-4-4-4-12 characters)
    const uuidRegex =
      /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i
    const match = sessionId.match(uuidRegex)

    if (!match) {
      console.error("Invalid sessionId format (expected: uuid-uuid):", sessionId)
      return NextResponse.json({ error: "Invalid session format" }, { status: 400 })
    }

    const [, groupId, propertyId] = match

    // For single-user sessions, we'll simply log the update
    // In a production app, you might want to store this in a cache or simple table
    console.log(
      `✅ Single user database update for session ${sessionId} (groupId: ${groupId}, propertyId: ${propertyId})`,
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating database session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
