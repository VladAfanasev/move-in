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

  // Check if user is already an active member
  const existingMember = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId), 
        eq(groupMembers.userId, user.id),
        eq(groupMembers.status, "active")
      )
    )
    .limit(1)

  if (existingMember.length > 0) {
    // User is already a member, redirect to group page
    redirect(`/dashboard/groups/${groupId}`)
  }

  try {

    // Check group capacity
    if (group[0].maxMembers) {
      const currentMembers = await db
        .select()
        .from(groupMembers)
        .where(eq(groupMembers.groupId, groupId))

      if (currentMembers.length >= group[0].maxMembers) {
        return new Response(JSON.stringify({ error: "Group is full" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      }
    }

    // Check if user has any previous membership (including removed/left)
    const previousMembership = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)))
      .limit(1)

    if (previousMembership.length > 0) {
      // Update existing record to rejoin
      await db
        .update(groupMembers)
        .set({
          status: "active",
          role: "member",
          joinedAt: new Date(),
          leftAt: null,
        })
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)))
    } else {
      // Add user to group as new member
      await db.insert(groupMembers).values({
        groupId: groupId,
        userId: user.id,
        role: "member",
        status: "active",
      })
    }

  } catch (error) {
    console.error("Error joining group:", error)
    console.error("Error details:", error instanceof Error ? error.message : String(error))
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    return new Response(JSON.stringify({ 
      error: "Failed to join group", 
      details: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  // Redirect to the group page after successful join
  redirect(`/dashboard/groups/${groupId}`)
}
