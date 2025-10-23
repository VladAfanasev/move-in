"use server"

import { and, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { groupInvitations, groupMembers } from "@/db/schema"
import { createClient } from "@/lib/supabase/server"

export async function cancelInvitationAction(invitationId: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  // Get invitation details first
  const invitation = await db
    .select({ groupId: groupInvitations.groupId })
    .from(groupInvitations)
    .where(eq(groupInvitations.id, invitationId))
    .limit(1)

  if (invitation.length === 0) {
    throw new Error("Invitation not found")
  }

  // Check if user has permission to cancel invitations
  const membership = await db
    .select({ role: groupMembers.role })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, invitation[0].groupId), eq(groupMembers.userId, user.id)))
    .limit(1)

  const userRole = membership[0]?.role
  if (!(userRole && ["admin", "owner"].includes(userRole))) {
    throw new Error("Insufficient permissions to cancel invitations")
  }

  // Cancel the invitation
  await db
    .update(groupInvitations)
    .set({ status: "cancelled" })
    .where(eq(groupInvitations.id, invitationId))

  return { success: true }
}
