"use server"

import { randomBytes } from "crypto"
import { and, eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { db } from "@/db/client"
import { buyingGroups, groupInvitations, groupMembers, profiles } from "@/db/schema"
import { createClient } from "@/lib/supabase/server"

export async function inviteMemberAction(groupId: string, email: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  // Check if user is admin/owner of the group using Drizzle
  const membership = await db
    .select({ role: groupMembers.role })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)))
    .limit(1)

  const userRole = membership[0]?.role
  if (!(userRole && ["admin", "owner"].includes(userRole))) {
    throw new Error("Insufficient permissions to invite members")
  }

  // Check if email corresponds to an existing user who is already a member
  const existingUser = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, email.toLowerCase()))
    .limit(1)

  if (existingUser.length > 0) {
    const existingMember = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, existingUser[0].id)))
      .limit(1)

    if (existingMember.length > 0) {
      throw new Error("User is already a member of this group")
    }
  }

  // Check for existing pending invitation
  const existingInvitation = await db
    .select()
    .from(groupInvitations)
    .where(
      and(
        eq(groupInvitations.groupId, groupId),
        eq(groupInvitations.email, email.toLowerCase()),
        eq(groupInvitations.status, "pending"),
      ),
    )
    .limit(1)

  if (existingInvitation.length > 0) {
    throw new Error("An invitation has already been sent to this email")
  }

  // Generate secure token
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

  // Create invitation record
  try {
    await db.insert(groupInvitations).values({
      groupId: groupId,
      email: email.toLowerCase(),
      token,
      invitedBy: user.id,
      expiresAt: expiresAt,
    })
  } catch (error) {
    console.error("Failed to create invitation:", error)
    throw new Error("Failed to create invitation")
  }

  // Get group details for email
  const group = await db
    .select({ name: buyingGroups.name })
    .from(buyingGroups)
    .where(eq(buyingGroups.id, groupId))
    .limit(1)

  // Send invitation email using Supabase Auth
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const inviteUrl = `${baseUrl}/dashboard/groups/invite/${token}`

  const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: inviteUrl,
    data: {
      group_name: group[0]?.name || "Buying Group",
      invite_token: token,
      group_id: groupId,
    },
  })

  if (emailError) {
    console.error("Failed to send invitation email:", emailError)
    // Don't throw here as the invitation record was created successfully
    // We could implement a retry mechanism or fallback email service
  }

  return { success: true, message: "Invitation sent successfully" }
}

export async function acceptInvitationAction(token: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // Get invitation details
  const invitation = await db
    .select()
    .from(groupInvitations)
    .where(and(eq(groupInvitations.token, token), eq(groupInvitations.status, "pending")))
    .limit(1)

  if (invitation.length === 0) {
    throw new Error("Invalid or expired invitation")
  }

  const inviteData = invitation[0]

  // Check if invitation has expired
  if (new Date(inviteData.expiresAt) < new Date()) {
    await db
      .update(groupInvitations)
      .set({ status: "expired" })
      .where(eq(groupInvitations.id, inviteData.id))
    throw new Error("Invitation has expired")
  }

  // Check if user's email matches invitation email
  if (user.email?.toLowerCase() !== inviteData.email.toLowerCase()) {
    throw new Error("This invitation was sent to a different email address")
  }

  // Check if user is already a member
  const existingMember = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, inviteData.groupId), eq(groupMembers.userId, user.id)))
    .limit(1)

  if (existingMember.length > 0) {
    // Update invitation as accepted anyway
    await db
      .update(groupInvitations)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
        acceptedBy: user.id,
      })
      .where(eq(groupInvitations.id, inviteData.id))
    throw new Error("You are already a member of this group")
  }

  // Add user to group
  try {
    await db.insert(groupMembers).values({
      groupId: inviteData.groupId,
      userId: user.id,
      role: inviteData.role,
      status: "active",
    })
  } catch (error) {
    console.error("Failed to add member to group:", error)
    throw new Error("Failed to join group")
  }

  // Update invitation status
  try {
    await db
      .update(groupInvitations)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
        acceptedBy: user.id,
      })
      .where(eq(groupInvitations.id, inviteData.id))
  } catch (error) {
    console.error("Failed to update invitation status:", error)
  }

  return { groupId: inviteData.groupId }
}
