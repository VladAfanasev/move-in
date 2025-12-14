"use server"

import { and, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { groupJoinRequests, groupMembers } from "@/db/schema"
import { notifyMemberApproved } from "@/lib/realtime-notifications"
import { createClient } from "@/lib/supabase/server"

export async function approveJoinRequestAction(requestId: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  // Get join request details
  const request = await db
    .select()
    .from(groupJoinRequests)
    .where(and(eq(groupJoinRequests.id, requestId), eq(groupJoinRequests.status, "pending")))
    .limit(1)

  if (request.length === 0) {
    throw new Error("Join request not found or already processed")
  }

  const requestData = request[0]

  // Check if request has expired
  if (new Date(requestData.expiresAt) < new Date()) {
    await db
      .update(groupJoinRequests)
      .set({ status: "expired" })
      .where(eq(groupJoinRequests.id, requestId))
    throw new Error("Join request has expired")
  }

  // Check if current user has permission to approve (owner/admin of the group)
  const membership = await db
    .select({ role: groupMembers.role })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, requestData.groupId), eq(groupMembers.userId, user.id)))
    .limit(1)

  const userRole = membership[0]?.role
  if (!(userRole && ["admin", "owner"].includes(userRole))) {
    throw new Error("Insufficient permissions to approve join requests")
  }

  // Check if user is already an active member (edge case)
  const existingMember = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, requestData.groupId),
        eq(groupMembers.userId, requestData.userId),
        eq(groupMembers.status, "active"),
      ),
    )
    .limit(1)

  if (existingMember.length > 0) {
    // Update request as approved anyway
    await db
      .update(groupJoinRequests)
      .set({
        status: "approved",
        processedAt: new Date(),
        processedBy: user.id,
      })
      .where(eq(groupJoinRequests.id, requestId))
    throw new Error("User is already a member of this group")
  }

  // Add user to group or reactivate removed member
  try {
    // Check if user was previously a member (any status)
    const previousMember = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, requestData.groupId),
          eq(groupMembers.userId, requestData.userId),
        ),
      )
      .limit(1)

    if (previousMember.length > 0) {
      // User was previously a member, update their status to active
      await db
        .update(groupMembers)
        .set({
          status: "active",
          role: "member", // Reset role to member
          leftAt: null, // Clear leftAt timestamp
        })
        .where(
          and(
            eq(groupMembers.groupId, requestData.groupId),
            eq(groupMembers.userId, requestData.userId),
          ),
        )
    } else {
      // New member, insert new record
      await db.insert(groupMembers).values({
        groupId: requestData.groupId,
        userId: requestData.userId,
        role: "member",
        status: "active",
      })
    }
  } catch (error) {
    console.error("Failed to add member to group:", error)
    throw new Error("Failed to add member to group")
  }

  // Update join request status
  try {
    await db
      .update(groupJoinRequests)
      .set({
        status: "approved",
        processedAt: new Date(),
        processedBy: user.id,
      })
      .where(eq(groupJoinRequests.id, requestId))
  } catch (error) {
    console.error("Failed to update join request status:", error)
  }

  // Send real-time notification to active calculation sessions
  // Note: We don't have propertyId in join request, so we'll notify all active sessions for this group
  try {
    await notifyMemberApproved(requestData.groupId, "all", requestData.userId)
  } catch (error) {
    console.error("Failed to send real-time notification:", error)
    // Don't fail the approval process for notification errors
  }

  return {
    success: true,
    message: "Join request approved successfully",
  }
}

export async function rejectJoinRequestAction(requestId: string, rejectionReason?: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  // Get join request details
  const request = await db
    .select()
    .from(groupJoinRequests)
    .where(and(eq(groupJoinRequests.id, requestId), eq(groupJoinRequests.status, "pending")))
    .limit(1)

  if (request.length === 0) {
    throw new Error("Join request not found or already processed")
  }

  const requestData = request[0]

  // Check if current user has permission to reject (owner/admin of the group)
  const membership = await db
    .select({ role: groupMembers.role })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, requestData.groupId), eq(groupMembers.userId, user.id)))
    .limit(1)

  const userRole = membership[0]?.role
  if (!(userRole && ["admin", "owner"].includes(userRole))) {
    throw new Error("Insufficient permissions to reject join requests")
  }

  // Update join request status to rejected
  try {
    await db
      .update(groupJoinRequests)
      .set({
        status: "rejected",
        processedAt: new Date(),
        processedBy: user.id,
        rejectionReason: rejectionReason || null,
      })
      .where(eq(groupJoinRequests.id, requestId))
  } catch (error) {
    console.error("Failed to update join request status:", error)
    throw new Error("Failed to reject join request")
  }

  return {
    success: true,
    message: "Join request rejected successfully",
  }
}
