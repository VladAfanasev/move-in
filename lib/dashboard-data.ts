import { and, count, desc, eq, gt, inArray, sql } from "drizzle-orm"
import { db } from "@/db/client"
import {
  buyingGroups,
  calculationComments,
  costCalculations,
  groupInvitations,
  groupJoinRequests,
  groupMembers,
  groupProperties,
  memberSessionParticipation,
  negotiationSessions,
  profiles,
  properties,
} from "@/db/schema"

export async function getDashboardStats(userId: string) {
  try {
    // Get user's groups with statistics
    const userGroups = await db
      .select({
        groupId: groupMembers.groupId,
        groupName: buyingGroups.name,
        groupStatus: buyingGroups.status,
        role: groupMembers.role,
        contributionAmount: groupMembers.contributionAmount,
        ownershipPercentage: groupMembers.ownershipPercentage,
        targetBudget: buyingGroups.targetBudget,
        currentFunds: buyingGroups.currentFunds,
      })
      .from(groupMembers)
      .innerJoin(buyingGroups, eq(groupMembers.groupId, buyingGroups.id))
      .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "active")))

    // Get total contributions
    const totalContributions = userGroups.reduce(
      (sum, group) => sum + Number(group.contributionAmount || 0),
      0,
    )

    // Get average ownership percentage
    const avgOwnership =
      userGroups.length > 0
        ? userGroups.reduce((sum, group) => sum + Number(group.ownershipPercentage || 0), 0) /
          userGroups.length
        : 0

    // Count groups by status
    const groupsByStatus = userGroups.reduce(
      (acc, group) => {
        const status = group.groupStatus || "forming"
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Get recent activities (last 10)
    const recentActivities = await getRecentActivities(userId)

    // Get action required items
    const actionItems = await getActionRequiredItems(userId)

    // Get saved properties count for user's groups
    const savedPropertiesCount =
      userGroups.length > 0
        ? await db
            .select({ count: count() })
            .from(groupProperties)
            .where(
              inArray(
                groupProperties.groupId,
                userGroups.map(g => g.groupId),
              ),
            )
        : [{ count: 0 }]

    // Get active negotiations count
    const activeNegotiations =
      userGroups.length > 0
        ? await db
            .select({ count: count() })
            .from(negotiationSessions)
            .innerJoin(costCalculations, eq(negotiationSessions.calculationId, costCalculations.id))
            .where(
              and(
                eq(negotiationSessions.status, "active"),
                inArray(
                  costCalculations.groupId,
                  userGroups.map(g => g.groupId),
                ),
              ),
            )
        : [{ count: 0 }]

    return {
      totalGroups: userGroups.length,
      totalContributions,
      avgOwnership,
      groupsByStatus,
      userGroups,
      recentActivities,
      actionItems,
      savedPropertiesCount: savedPropertiesCount[0]?.count || 0,
      activeNegotiations: activeNegotiations[0]?.count || 0,
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    throw new Error("Failed to fetch dashboard statistics")
  }
}

export async function getRecentActivities(userId: string, limit: number = 10) {
  try {
    // Get user's group IDs
    const userGroupIds = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "active")))

    if (userGroupIds.length === 0) return []

    const groupIds = userGroupIds.map(g => g.groupId)

    // Get recent comments from negotiations
    const recentComments =
      groupIds.length > 0
        ? await db
            .select({
              type: sql<string>`'comment'`,
              title: sql<string>`'Nieuwe reactie in onderhandeling'`,
              description: calculationComments.content,
              createdAt: calculationComments.createdAt,
              groupId: costCalculations.groupId,
              groupName: buyingGroups.name,
            })
            .from(calculationComments)
            .innerJoin(costCalculations, eq(calculationComments.calculationId, costCalculations.id))
            .innerJoin(buyingGroups, eq(costCalculations.groupId, buyingGroups.id))
            .where(inArray(costCalculations.groupId, groupIds))
            .orderBy(desc(calculationComments.createdAt))
            .limit(limit)
        : []

    // Get recent property additions
    const recentProperties =
      groupIds.length > 0
        ? await db
            .select({
              type: sql<string>`'property'`,
              title: sql<string>`'Woning toegevoegd aan groep'`,
              description: properties.address,
              createdAt: groupProperties.addedAt,
              groupId: groupProperties.groupId,
              groupName: buyingGroups.name,
            })
            .from(groupProperties)
            .innerJoin(properties, eq(groupProperties.propertyId, properties.id))
            .innerJoin(buyingGroups, eq(groupProperties.groupId, buyingGroups.id))
            .where(inArray(groupProperties.groupId, groupIds))
            .orderBy(desc(groupProperties.addedAt))
            .limit(limit)
        : []

    // Combine and sort all activities
    const allActivities = [...recentComments, ...recentProperties]
      .sort((a, b) => {
        const dateA =
          a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()
        const dateB =
          b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()
        return dateB - dateA
      })
      .slice(0, limit)

    return allActivities
  } catch (error) {
    console.error("Error fetching recent activities:", error)
    return []
  }
}

export async function getPropertyPriceDistribution(userId: string) {
  try {
    // Get user's group IDs
    const userGroupIds = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "active")))

    if (userGroupIds.length === 0) return []

    const groupIds = userGroupIds.map(g => g.groupId)

    // Get properties saved by user's groups
    const groupPropertiesData =
      groupIds.length > 0
        ? await db
            .select({
              price: properties.price,
              address: properties.address,
              city: properties.city,
            })
            .from(groupProperties)
            .innerJoin(properties, eq(groupProperties.propertyId, properties.id))
            .where(inArray(groupProperties.groupId, groupIds))
        : []

    // Create price distribution buckets
    const priceRanges = [
      { range: "0-200k", min: 0, max: 200000, count: 0 },
      { range: "200k-400k", min: 200000, max: 400000, count: 0 },
      { range: "400k-600k", min: 400000, max: 600000, count: 0 },
      { range: "600k-800k", min: 600000, max: 800000, count: 0 },
      { range: "800k+", min: 800000, max: Infinity, count: 0 },
    ]

    groupPropertiesData.forEach(property => {
      const price = Number(property.price)
      const range = priceRanges.find(r => price >= r.min && price < r.max)
      if (range) range.count++
    })

    return priceRanges.filter(r => r.count > 0)
  } catch (error) {
    console.error("Error fetching property price distribution:", error)
    return []
  }
}

export async function getActionRequiredItems(userId: string) {
  try {
    const now = new Date()

    // Get pending invitations sent to user's email
    const pendingInvitations = await db
      .select({
        type: sql<string>`'invitation'`,
        groupId: groupInvitations.groupId,
        groupName: buyingGroups.name,
        id: groupInvitations.id,
        expiresAt: groupInvitations.expiresAt,
      })
      .from(groupInvitations)
      .innerJoin(buyingGroups, eq(groupInvitations.groupId, buyingGroups.id))
      .innerJoin(profiles, eq(profiles.email, groupInvitations.email))
      .where(
        and(
          eq(profiles.id, userId),
          eq(groupInvitations.status, "pending"),
          gt(groupInvitations.expiresAt, now),
        ),
      )

    // Get pending join requests for groups where user is admin/owner
    const adminGroups = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.userId, userId),
          eq(groupMembers.status, "active"),
          inArray(groupMembers.role, ["owner", "admin"]),
        ),
      )

    const pendingRequests =
      adminGroups.length > 0
        ? await db
            .select({
              type: sql<string>`'join_request'`,
              groupId: groupJoinRequests.groupId,
              groupName: buyingGroups.name,
              userId: groupJoinRequests.userId,
              userName: profiles.fullName,
              message: groupJoinRequests.message,
              id: groupJoinRequests.id,
              requestedAt: groupJoinRequests.requestedAt,
            })
            .from(groupJoinRequests)
            .innerJoin(buyingGroups, eq(groupJoinRequests.groupId, buyingGroups.id))
            .innerJoin(profiles, eq(groupJoinRequests.userId, profiles.id))
            .where(
              and(
                inArray(
                  groupJoinRequests.groupId,
                  adminGroups.map(g => g.groupId),
                ),
                eq(groupJoinRequests.status, "pending"),
                gt(groupJoinRequests.expiresAt, now),
              ),
            )
        : []

    // Get active negotiation sessions where user hasn't confirmed
    const userGroupIds = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "active")))

    const activeNegotiationSessions =
      userGroupIds.length > 0
        ? await db
            .select({
              type: sql<string>`'negotiation'`,
              sessionId: negotiationSessions.id,
              propertyId: costCalculations.propertyId,
              groupId: costCalculations.groupId,
              groupName: buyingGroups.name,
              propertyAddress: properties.address,
              status: negotiationSessions.status,
            })
            .from(negotiationSessions)
            .innerJoin(costCalculations, eq(negotiationSessions.calculationId, costCalculations.id))
            .innerJoin(buyingGroups, eq(costCalculations.groupId, buyingGroups.id))
            .innerJoin(properties, eq(costCalculations.propertyId, properties.id))
            .leftJoin(
              memberSessionParticipation,
              and(
                eq(memberSessionParticipation.sessionId, negotiationSessions.id),
                eq(memberSessionParticipation.userId, userId),
              ),
            )
            .where(
              and(
                inArray(
                  costCalculations.groupId,
                  userGroupIds.map(g => g.groupId),
                ),
                eq(negotiationSessions.status, "active"),
                eq(memberSessionParticipation.status, "adjusting"), // User hasn't confirmed yet
              ),
            )
        : []

    // Get properties with scheduled viewings
    const scheduledViewings =
      userGroupIds.length > 0
        ? await db
            .select({
              type: sql<string>`'viewing'`,
              propertyId: groupProperties.propertyId,
              groupId: groupProperties.groupId,
              groupName: buyingGroups.name,
              propertyAddress: properties.address,
              notes: groupProperties.notes,
            })
            .from(groupProperties)
            .innerJoin(buyingGroups, eq(groupProperties.groupId, buyingGroups.id))
            .innerJoin(properties, eq(groupProperties.propertyId, properties.id))
            .where(
              and(
                inArray(
                  groupProperties.groupId,
                  userGroupIds.map(g => g.groupId),
                ),
                eq(groupProperties.status, "viewing_scheduled"),
              ),
            )
        : []

    return {
      pendingInvitations: pendingInvitations.length,
      pendingJoinRequests: pendingRequests.length,
      activeNegotiations: activeNegotiationSessions.length,
      scheduledViewings: scheduledViewings.length,
      items: [
        ...pendingInvitations.map(i => ({ ...i, priority: 1 })),
        ...pendingRequests.map(r => ({ ...r, priority: 2 })),
        ...activeNegotiationSessions.map(n => ({ ...n, priority: 3 })),
        ...scheduledViewings.map(v => ({ ...v, priority: 4 })),
      ].sort((a, b) => a.priority - b.priority),
    }
  } catch (error) {
    console.error("Error fetching action required items:", error)
    return {
      pendingInvitations: 0,
      pendingJoinRequests: 0,
      activeNegotiations: 0,
      scheduledViewings: 0,
      items: [],
    }
  }
}

export async function getGroupFundingProgress(userId: string) {
  try {
    const userGroups = await db
      .select({
        name: buyingGroups.name,
        targetBudget: buyingGroups.targetBudget,
        currentFunds: buyingGroups.currentFunds,
        status: buyingGroups.status,
      })
      .from(groupMembers)
      .innerJoin(buyingGroups, eq(groupMembers.groupId, buyingGroups.id))
      .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "active")))

    return userGroups.map(group => ({
      name: group.name,
      target: Number(group.targetBudget || 0),
      current: Number(group.currentFunds || 0),
      percentage:
        group.targetBudget && Number(group.targetBudget) > 0
          ? (Number(group.currentFunds || 0) / Number(group.targetBudget)) * 100
          : 0,
      status: group.status,
    }))
  } catch (error) {
    console.error("Error fetching group funding progress:", error)
    return []
  }
}
