import { and, count, desc, eq, inArray } from "drizzle-orm"
import { db } from "@/db/client"
import {
  buyingGroups,
  groupInvitations,
  groupMembers,
  groupProperties,
  profiles,
  properties,
} from "@/db/schema"
import type { GroupWithMemberCount } from "@/lib/types"

export async function getUserGroups(userId: string) {
  try {
    // Get groups the user is a member of with their role/status
    const userMemberships = await db
      .select({
        groupId: groupMembers.groupId,
        role: groupMembers.role,
        status: groupMembers.status,
      })
      .from(groupMembers)
      .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "active")))

    if (userMemberships.length === 0) {
      return []
    }

    // Get group details with member counts
    const result = await db
      .select({
        id: buyingGroups.id,
        name: buyingGroups.name,
        description: buyingGroups.description,
        targetBudget: buyingGroups.targetBudget,
        targetLocation: buyingGroups.targetLocation,
        maxMembers: buyingGroups.maxMembers,
        createdAt: buyingGroups.createdAt,
        memberCount: count(groupMembers.userId),
      })
      .from(buyingGroups)
      .leftJoin(
        groupMembers,
        and(eq(buyingGroups.id, groupMembers.groupId), eq(groupMembers.status, "active")),
      )
      .where(
        inArray(
          buyingGroups.id,
          userMemberships.map((m: { groupId: string; role: string; status: string }) => m.groupId),
        ),
      )
      .groupBy(
        buyingGroups.id,
        buyingGroups.name,
        buyingGroups.description,
        buyingGroups.targetBudget,
        buyingGroups.targetLocation,
        buyingGroups.maxMembers,
        buyingGroups.createdAt,
      )
      .orderBy(desc(buyingGroups.createdAt))

    // Merge user membership data with group data
    return result.map((group: GroupWithMemberCount) => {
      const membership = userMemberships.find(
        (m: { groupId: string; role: string; status: string }) => m.groupId === group.id,
      )
      return {
        ...group,
        userRole: membership?.role || null,
        userStatus: membership?.status || null,
      }
    })
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

export async function getGroupInvitations(groupId: string) {
  try {
    const result = await db
      .select({
        id: groupInvitations.id,
        email: groupInvitations.email,
        role: groupInvitations.role,
        status: groupInvitations.status,
        token: groupInvitations.token,
        expiresAt: groupInvitations.expiresAt,
        createdAt: groupInvitations.createdAt,
        invitedByName: profiles.fullName,
        invitedByEmail: profiles.email,
      })
      .from(groupInvitations)
      .leftJoin(profiles, eq(groupInvitations.invitedBy, profiles.id))
      .where(eq(groupInvitations.groupId, groupId))
      .orderBy(groupInvitations.createdAt)

    return result
  } catch (error) {
    console.error("Error fetching group invitations:", error)
    throw new Error("Failed to fetch group invitations")
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
  },
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

export async function addPropertyToGroup(data: {
  groupId: string
  propertyId: string
  addedBy: string
  notes?: string
}) {
  try {
    const [result] = await db
      .insert(groupProperties)
      .values({
        groupId: data.groupId,
        propertyId: data.propertyId,
        addedBy: data.addedBy,
        notes: data.notes,
        status: "saved",
      })
      .returning()

    return result
  } catch (error) {
    console.error("Error adding property to group:", error)
    throw new Error("Failed to add property to group")
  }
}

export async function getGroupProperties(groupId: string) {
  try {
    const result = await db
      .select({
        propertyId: groupProperties.propertyId,
        notes: groupProperties.notes,
        rating: groupProperties.rating,
        status: groupProperties.status,
        addedAt: groupProperties.addedAt,
        addedBy: groupProperties.addedBy,
      })
      .from(groupProperties)
      .where(eq(groupProperties.groupId, groupId))
      .orderBy(desc(groupProperties.addedAt))

    return result
  } catch (error) {
    console.error("Error fetching group properties:", error)
    throw new Error("Failed to fetch group properties")
  }
}

export async function getGroupPropertiesWithDetails(groupId: string) {
  try {
    const result = await db
      .select({
        // Group property info
        notes: groupProperties.notes,
        rating: groupProperties.rating,
        groupPropertyStatus: groupProperties.status,
        addedAt: groupProperties.addedAt,
        addedBy: groupProperties.addedBy,
        addedByName: profiles.fullName,
        // Full property details
        property: {
          id: properties.id,
          description: properties.description,
          address: properties.address,
          city: properties.city,
          state: properties.state,
          zipCode: properties.zipCode,
          country: properties.country,
          price: properties.price,
          bedrooms: properties.bedrooms,
          bathrooms: properties.bathrooms,
          squareFeet: properties.squareFeet,
          lotSize: properties.lotSize,
          yearBuilt: properties.yearBuilt,
          propertyType: properties.propertyType,
          status: properties.status,
          images: properties.images,
          features: properties.features,
          metadata: properties.metadata,
          createdAt: properties.createdAt,
          updatedAt: properties.updatedAt,
          listedBy: properties.listedBy,
        },
      })
      .from(groupProperties)
      .innerJoin(properties, eq(groupProperties.propertyId, properties.id))
      .leftJoin(profiles, eq(groupProperties.addedBy, profiles.id))
      .where(eq(groupProperties.groupId, groupId))
      .orderBy(desc(groupProperties.addedAt))

    return result
  } catch (error) {
    console.error("Error fetching group properties with details:", error)
    throw new Error("Failed to fetch group properties with details")
  }
}
