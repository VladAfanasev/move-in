"use server"

import { and, asc, eq, ne } from "drizzle-orm"
import { db } from "@/db/client"
import { buyingGroups, groupMembers } from "@/db/schema"
import { createClient } from "@/lib/supabase/server"
import type { GroupMemberWithProfile } from "@/lib/types"

export async function leaveGroupAction(groupId: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  try {
    // Get user's current membership
    const userMembership = await db
      .select({
        role: groupMembers.role,
        status: groupMembers.status,
        joinedAt: groupMembers.joinedAt,
      })
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)))
      .limit(1)

    if (userMembership.length === 0 || userMembership[0].status !== "active") {
      throw new Error("You are not an active member of this group")
    }

    const isOwner = userMembership[0].role === "owner"

    // Get all other active members
    const otherActiveMembers = await db
      .select({
        userId: groupMembers.userId,
        role: groupMembers.role,
        joinedAt: groupMembers.joinedAt,
      })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.status, "active"),
          ne(groupMembers.userId, user.id),
        ),
      )
      .orderBy(asc(groupMembers.joinedAt)) // Oldest member first

    // Handle ownership transfer if user is owner
    if (isOwner) {
      if (otherActiveMembers.length === 0) {
        // No other members - delete the group
        await db.delete(buyingGroups).where(eq(buyingGroups.id, groupId))

        // Remove the leaving user (will be cascade deleted)
        await db
          .update(groupMembers)
          .set({
            status: "left",
            leftAt: new Date(),
          })
          .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)))

        return {
          success: true,
          message:
            "Je hebt de groep verlaten en de groep is verwijderd omdat je de laatste lid was",
          groupDeleted: true,
        }
      } else {
        // Transfer ownership to the longest-standing member
        const newOwner = otherActiveMembers[0]

        // Update new owner's role
        await db
          .update(groupMembers)
          .set({ role: "owner" })
          .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, newOwner.userId)))
      }
    }

    // Remove the leaving user from the group
    await db
      .update(groupMembers)
      .set({
        status: "left",
        leftAt: new Date(),
      })
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)))

    return {
      success: true,
      message: isOwner
        ? "Je hebt de groep verlaten en het eigenaarschap is overgedragen aan de langst lid zijnde persoon"
        : "Je hebt de groep succesvol verlaten",
      ownershipTransferred: isOwner && otherActiveMembers.length > 0,
      newOwnerCount: otherActiveMembers.length,
    }
  } catch (error) {
    console.error("Error leaving group:", error)
    throw new Error("Failed to leave group")
  }
}

export async function getLeaveGroupInfo(groupId: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  try {
    // Get user's role and total active members
    const [userMembership, activeMembers] = await Promise.all([
      db
        .select({ role: groupMembers.role })
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)))
        .limit(1),
      db
        .select({
          userId: groupMembers.userId,
          joinedAt: groupMembers.joinedAt,
        })
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "active")))
        .orderBy(asc(groupMembers.joinedAt)),
    ])

    if (userMembership.length === 0) {
      throw new Error("You are not a member of this group")
    }

    const isOwner = userMembership[0].role === "owner"
    const totalMembers = activeMembers.length
    const isLastMember = totalMembers === 1

    // Find who would become the new owner (excluding current user)
    const nextOwner = activeMembers.find((member: GroupMemberWithProfile) => member.userId !== user.id)

    return {
      isOwner,
      isLastMember,
      totalMembers,
      nextOwnerId: nextOwner?.userId,
      wouldDeleteGroup: isOwner && isLastMember,
    }
  } catch (error) {
    console.error("Error getting leave group info:", error)
    throw new Error("Failed to get group information")
  }
}
