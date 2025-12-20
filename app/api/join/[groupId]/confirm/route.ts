import { randomBytes } from "crypto"
import { and, eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params

  // Get redirect URL from form data
  const formData = await request.formData()
  const redirectUrl = formData.get("redirect") as string | null
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    const loginRedirect = redirectUrl
      ? `/login?redirectTo=/join/${groupId}?redirect=${encodeURIComponent(redirectUrl)}`
      : `/login?redirectTo=/join/${groupId}`
    redirect(loginRedirect)
  }

  // Dynamic imports to avoid build-time database connection
  const { db } = await import("@/db/client")
  const { buyingGroups, groupMembers, groupJoinRequests } = await import("@/db/schema")

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
        eq(groupMembers.status, "active"),
      ),
    )
    .limit(1)

  if (existingMember.length > 0) {
    // User is already a member, redirect to group page
    redirect(`/dashboard/groups/${groupId}`)
  }

  try {
    // Check for existing pending join request
    const existingRequest = await db
      .select()
      .from(groupJoinRequests)
      .where(
        and(
          eq(groupJoinRequests.groupId, groupId),
          eq(groupJoinRequests.userId, user.id),
          eq(groupJoinRequests.status, "pending"),
        ),
      )
      .limit(1)

    if (existingRequest.length > 0) {
      // Request already exists, redirect to group page with pending status
      redirect(`/dashboard/groups/${groupId}?joined=pending`)
    }

    // Generate secure token for this request
    const requestToken = randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days expiry

    // Create join request instead of directly adding to group
    await db.insert(groupJoinRequests).values({
      groupId,
      userId: user.id,
      requestToken,
      message: null,
      expiresAt,
    })
  } catch (error) {
    console.error("Error creating join request:", error)
    console.error("Error details:", error instanceof Error ? error.message : String(error))
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    return new Response(
      JSON.stringify({
        error: "Failed to create join request",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  // Redirect to the group page to show pending status
  redirect(`/dashboard/groups/${groupId}?joined=pending`)
}
