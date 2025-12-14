"use server"

import { randomBytes } from "crypto"
import { and, eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { db } from "@/db/client"
import { buyingGroups, groupJoinRequests, groupMembers, profiles } from "@/db/schema"
import { notifyJoinRequest } from "@/lib/realtime-notifications"
import { createClient } from "@/lib/supabase/server"

export async function createJoinRequestAction(groupId: string, message?: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // Check if group exists
  const group = await db
    .select({ id: buyingGroups.id, name: buyingGroups.name })
    .from(buyingGroups)
    .where(eq(buyingGroups.id, groupId))
    .limit(1)

  if (group.length === 0) {
    throw new Error("Group not found")
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
    throw new Error("You are already a member of this group")
  }

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
    throw new Error("You have already requested to join this group")
  }

  // Generate secure token for this request
  const requestToken = randomBytes(32).toString("hex")
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30) // 30 days expiry

  // Create join request
  try {
    await db.insert(groupJoinRequests).values({
      groupId,
      userId: user.id,
      requestToken,
      message: message || null,
      expiresAt,
    })
  } catch (error) {
    console.error("Failed to create join request:", error)
    throw new Error("Failed to create join request")
  }

  // Send real-time notification to group owners/admins in active calculation sessions
  try {
    await notifyJoinRequest(groupId, "all", user.id)
  } catch (error) {
    console.error("Failed to send real-time notification:", error)
    // Don't fail the join request process for notification errors
  }

  return {
    success: true,
    message: "Join request submitted successfully",
    groupName: group[0].name,
  }
}

export async function getJoinRequestsAction(groupId: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  // Check if user has permission to view join requests (owner/admin)
  const membership = await db
    .select({ role: groupMembers.role })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)))
    .limit(1)

  const userRole = membership[0]?.role
  if (!(userRole && ["admin", "owner"].includes(userRole))) {
    throw new Error("Insufficient permissions to view join requests")
  }

  // Get pending join requests with user details
  const requests = await db
    .select({
      id: groupJoinRequests.id,
      userId: groupJoinRequests.userId,
      message: groupJoinRequests.message,
      requestedAt: groupJoinRequests.requestedAt,
      expiresAt: groupJoinRequests.expiresAt,
      userFullName: profiles.fullName,
      userEmail: profiles.email,
      userAvatarUrl: profiles.avatarUrl,
    })
    .from(groupJoinRequests)
    .leftJoin(profiles, eq(groupJoinRequests.userId, profiles.id))
    .where(and(eq(groupJoinRequests.groupId, groupId), eq(groupJoinRequests.status, "pending")))
    .orderBy(groupJoinRequests.requestedAt)

  return requests
}
