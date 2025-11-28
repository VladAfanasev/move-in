"use server"

import { randomBytes } from "crypto"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db/client"
import { buyingGroups, groupInvitations, groupMembers, profiles } from "@/db/schema"
import { sendInvitationEmail } from "@/lib/email"
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

  // Get group details and inviter info for email
  const [group, inviter] = await Promise.all([
    db
      .select({ name: buyingGroups.name, description: buyingGroups.description })
      .from(buyingGroups)
      .where(eq(buyingGroups.id, groupId))
      .limit(1),
    db
      .select({ fullName: profiles.fullName, email: profiles.email })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1),
  ])

  // Get base URL from request headers for dynamic domain detection
  const headersList = await headers()
  const host = headersList.get("host")
  const protocol =
    headersList.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https")
  const baseUrl = `${protocol}://${host}`
  const inviteUrl = `${baseUrl}/dashboard/groups/invite/${token}`

  // Prepare email parameters
  const groupName = group[0]?.name || "Koopgroep"
  const inviterName = inviter[0]?.fullName || inviter[0]?.email || "Een groepslid"
  const expiryDate = expiresAt.toLocaleDateString("nl-NL")

  // Send invitation email using configured service
  const emailResult = await sendInvitationEmail({
    to: email,
    groupName,
    groupDescription: group[0]?.description || undefined,
    inviterName,
    inviteUrl,
    expiryDate,
  })

  if (!emailResult.success) {
    console.error("Failed to prepare invitation email:", emailResult.error)
    // Don't throw here as the invitation record was created successfully
  }

  return {
    success: true,
    message: "Invitation created successfully",
    inviteUrl,
    mailtoLink: emailResult.mailtoLink,
    emailSubject: emailResult.emailSubject,
    emailBody: emailResult.emailBody,
  }
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
