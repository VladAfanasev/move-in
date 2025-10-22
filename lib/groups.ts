import { and, count, desc, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { buyingGroups, groupMembers, profiles } from "@/db/schema"

export async function getUserGroups(userId: string) {
  try {
    const result = await db
      .select({
        id: buyingGroups.id,
        name: buyingGroups.name,
        description: buyingGroups.description,
        status: buyingGroups.status,
        targetBudget: buyingGroups.targetBudget,
        targetLocation: buyingGroups.targetLocation,
        maxMembers: buyingGroups.maxMembers,
        createdAt: buyingGroups.createdAt,
        memberCount: count(groupMembers.userId),
        userRole: groupMembers.role,
        userStatus: groupMembers.status,
      })
      .from(buyingGroups)
      .leftJoin(groupMembers, eq(buyingGroups.id, groupMembers.groupId))
      .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "active")))
      .groupBy(
        buyingGroups.id,
        buyingGroups.name,
        buyingGroups.description,
        buyingGroups.status,
        buyingGroups.targetBudget,
        buyingGroups.targetLocation,
        buyingGroups.maxMembers,
        buyingGroups.createdAt,
        groupMembers.role,
        groupMembers.status,
      )
      .orderBy(desc(buyingGroups.createdAt))

    return result
  } catch (error) {
    console.error("Error fetching user groups:", error)
    throw new Error("Failed to fetch user groups")
  }
}

export async function getGroupById(groupId: string) {
  try {
    const result = await db.select().from(buyingGroups).where(eq(buyingGroups.id, groupId)).limit(1)

    return result[0] || null
  } catch (error) {
    console.error("Error fetching group:", error)
    throw new Error("Failed to fetch group")
  }
}

export async function getGroupMembers(groupId: string) {
  try {
    const result = await db
      .select({
        userId: groupMembers.userId,
        role: groupMembers.role,
        status: groupMembers.status,
        contributionAmount: groupMembers.contributionAmount,
        ownershipPercentage: groupMembers.ownershipPercentage,
        joinedAt: groupMembers.joinedAt,
        fullName: profiles.fullName,
        email: profiles.email,
        avatarUrl: profiles.avatarUrl,
      })
      .from(groupMembers)
      .leftJoin(profiles, eq(groupMembers.userId, profiles.id))
      .where(eq(groupMembers.groupId, groupId))
      .orderBy(groupMembers.joinedAt)

    return result
  } catch (error) {
    console.error("Error fetching group members:", error)
    throw new Error("Failed to fetch group members")
  }
}

export async function createGroup(data: {
  name: string
  description?: string
  targetBudget?: string
  targetLocation?: string
  maxMembers?: number
  createdBy: string
}) {
  try {
    const [newGroup] = await db
      .insert(buyingGroups)
      .values({
        name: data.name,
        description: data.description,
        targetBudget: data.targetBudget,
        targetLocation: data.targetLocation,
        maxMembers: data.maxMembers || 10,
        createdBy: data.createdBy,
      })
      .returning()

    // Add creator as owner
    await db.insert(groupMembers).values({
      groupId: newGroup.id,
      userId: data.createdBy,
      role: "owner",
      status: "active",
    })

    return newGroup
  } catch (error) {
    console.error("Error creating group:", error)
    throw new Error("Failed to create group")
  }
}

export async function inviteUserToGroup(data: {
  groupId: string
  userId: string
  invitedBy: string
}) {
  try {
    const [invitation] = await db
      .insert(groupMembers)
      .values({
        groupId: data.groupId,
        userId: data.userId,
        role: "member",
        status: "pending",
      })
      .returning()

    return invitation
  } catch (error) {
    console.error("Error inviting user to group:", error)
    throw new Error("Failed to invite user to group")
  }
}

export async function updateMemberStatus(
  groupId: string,
  userId: string,
  status: "active" | "left" | "removed",
) {
  try {
    const [updatedMember] = await db
      .update(groupMembers)
      .set({
        status,
        leftAt: status === "left" || status === "removed" ? new Date() : null,
      })
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .returning()

    return updatedMember
  } catch (error) {
    console.error("Error updating member status:", error)
    throw new Error("Failed to update member status")
  }
}

export async function updateGroupDetails(
  groupId: string,
  data: {
    name?: string
    description?: string
  }
) {
  try {
    const [updatedGroup] = await db
      .update(buyingGroups)
      .set({
        name: data.name,
        description: data.description,
        updatedAt: new Date(),
      })
      .where(eq(buyingGroups.id, groupId))
      .returning()

    return updatedGroup
  } catch (error) {
    console.error("Error updating group details:", error)
    throw new Error("Failed to update group details")
  }
}

export async function deleteGroup(groupId: string) {
  try {
    // Delete the group - cascade will handle related records
    const [deletedGroup] = await db
      .delete(buyingGroups)
      .where(eq(buyingGroups.id, groupId))
      .returning()

    return deletedGroup
  } catch (error) {
    console.error("Error deleting group:", error)
    throw new Error("Failed to delete group")
  }
}
