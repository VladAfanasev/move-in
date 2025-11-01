import { and, eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect(`/login?returnTo=/join/${groupId}`)
  }

  try {
    // Dynamic imports to avoid build-time database connection
    const { db } = await import("@/db/client")
    const { buyingGroups, groupMembers } = await import("@/db/schema")

    // Check if group exists
    const group = await db
      .select({ id: buyingGroups.id, maxMembers: buyingGroups.maxMembers })
      .from(buyingGroups)
      .where(eq(buyingGroups.id, groupId))
      .limit(1)

    if (group.length === 0) {
      return new Response(JSON.stringify({ error: "Group not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)))
      .limit(1)

    if (existingMember.length > 0) {
      return new Response(JSON.stringify({ success: true, groupId, alreadyMember: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Check group capacity
    if (group[0].maxMembers) {
      const currentMembers = await db
        .select()
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "active")))

      if (currentMembers.length >= group[0].maxMembers) {
        return new Response(JSON.stringify({ error: "Group is full" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      }
    }

    // Add user to group
    await db.insert(groupMembers).values({
      groupId: groupId,
      userId: user.id,
      role: "member",
      status: "active",
    })

    // Return success response for fetch requests
    return new Response(JSON.stringify({ success: true, groupId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error joining group:", error)
    return new Response(JSON.stringify({ error: "Failed to join group" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
