import { and, count, desc, eq, gt, inArray, sql } from "drizzle-orm"
import { unstable_cache } from "next/cache"
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

type UserGroup = {
  groupId: string
  groupName: string
  groupStatus: string | null
  role: string
  contributionAmount: string | null
  ownershipPercentage: string | null
  targetBudget: string | null
  currentFunds: string | null
}

/**
 * Fetch user's groups - the core data needed for all dashboard queries.
 * This is cached and shared across all dashboard functions.
 */
async function fetchUserGroups(userId: string): Promise<UserGroup[]> {
  return db
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
}

/**
 * Get recent activities for a user's groups.
 * Optimized to accept groupIds directly instead of re-fetching.
 */
async function fetchRecentActivities(groupIds: string[], limit: number = 10) {
  if (groupIds.length === 0) return []

  // Run both queries in parallel
  const [recentComments, recentProperties] = await Promise.all([
    db
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
      .limit(limit),

    db
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
      .limit(limit),
  ])

  // Combine and sort all activities
  return [...recentComments, ...recentProperties]
    .sort((a, b) => {
      const dateA =
        a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()
      const dateB =
        b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()
      return dateB - dateA
    })
    .slice(0, limit)
}

/**
 * Get action items requiring user attention.
 * Optimized to accept userId and groupIds, runs queries in parallel.
 */
async function fetchActionRequiredItems(
  userId: string,
  groupIds: string[],
  adminGroupIds: string[],
) {
  const now = new Date()

  // Run all independent queries in parallel
  const [pendingInvitations, pendingRequests, activeNegotiationSessions, scheduledViewings] =
    await Promise.all([
      // Pending invitations sent to user's email
      db
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
        ),

      // Pending join requests for groups where user is admin/owner
      adminGroupIds.length > 0
        ? db
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
                inArray(groupJoinRequests.groupId, adminGroupIds),
                eq(groupJoinRequests.status, "pending"),
                gt(groupJoinRequests.expiresAt, now),
              ),
            )
        : Promise.resolve([]),

      // Active negotiation sessions where user hasn't confirmed
      groupIds.length > 0
        ? db
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
                inArray(costCalculations.groupId, groupIds),
                eq(negotiationSessions.status, "active"),
                eq(memberSessionParticipation.status, "adjusting"),
              ),
            )
        : Promise.resolve([]),

      // Properties with scheduled viewings
      groupIds.length > 0
        ? db
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
                inArray(groupProperties.groupId, groupIds),
                eq(groupProperties.status, "viewing_scheduled"),
              ),
            )
        : Promise.resolve([]),
    ])

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
}

/**
 * Core dashboard stats fetching logic.
 * All queries are parallelized where possible.
 */
async function fetchDashboardStatsCore(userId: string) {
  // Step 1: Fetch user groups (needed for all other queries)
  const userGroups = await fetchUserGroups(userId)

  if (userGroups.length === 0) {
    return {
      totalGroups: 0,
      totalContributions: 0,
      avgOwnership: 0,
      groupsByStatus: {},
      userGroups: [],
      recentActivities: [],
      actionItems: {
        pendingInvitations: 0,
        pendingJoinRequests: 0,
        activeNegotiations: 0,
        scheduledViewings: 0,
        items: [],
      },
      savedPropertiesCount: 0,
      activeNegotiations: 0,
    }
  }

  // Extract group IDs once
  const groupIds = userGroups.map(g => g.groupId)
  const adminGroupIds = userGroups
    .filter(g => g.role === "owner" || g.role === "admin")
    .map(g => g.groupId)

  // Step 2: Run all independent queries in parallel
  const [recentActivities, actionItems, savedPropertiesResult, activeNegotiationsResult] =
    await Promise.all([
      fetchRecentActivities(groupIds),
      fetchActionRequiredItems(userId, groupIds, adminGroupIds),
      db
        .select({ count: count() })
        .from(groupProperties)
        .where(inArray(groupProperties.groupId, groupIds)),
      db
        .select({ count: count() })
        .from(negotiationSessions)
        .innerJoin(costCalculations, eq(negotiationSessions.calculationId, costCalculations.id))
        .where(
          and(
            eq(negotiationSessions.status, "active"),
            inArray(costCalculations.groupId, groupIds),
          ),
        ),
    ])

  // Calculate derived stats (no DB calls needed)
  const totalContributions = userGroups.reduce(
    (sum, group) => sum + Number(group.contributionAmount || 0),
    0,
  )

  const avgOwnership =
    userGroups.reduce((sum, group) => sum + Number(group.ownershipPercentage || 0), 0) /
    userGroups.length

  const groupsByStatus = userGroups.reduce(
    (acc, group) => {
      const status = group.groupStatus || "forming"
      acc[status] = (acc[status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return {
    totalGroups: userGroups.length,
    totalContributions,
    avgOwnership,
    groupsByStatus,
    userGroups,
    recentActivities,
    actionItems,
    savedPropertiesCount: savedPropertiesResult[0]?.count || 0,
    activeNegotiations: activeNegotiationsResult[0]?.count || 0,
  }
}

/**
 * Get dashboard stats with caching.
 * Cached for 30 seconds, revalidated on-demand via tags.
 */
export const getDashboardStats = unstable_cache(fetchDashboardStatsCore, ["dashboard-stats"], {
  revalidate: 30, // Revalidate every 30 seconds
  tags: ["dashboard", "groups", "properties"],
})

/**
 * Get dashboard stats without caching (for real-time updates).
 */
export const getDashboardStatsUncached = fetchDashboardStatsCore

/**
 * Legacy export for getRecentActivities (now uses optimized internal function).
 */
export async function getRecentActivities(userId: string, limit: number = 10) {
  const userGroups = await fetchUserGroups(userId)
  const groupIds = userGroups.map(g => g.groupId)
  return fetchRecentActivities(groupIds, limit)
}

/**
 * Legacy export for getActionRequiredItems.
 */
export async function getActionRequiredItems(userId: string) {
  const userGroups = await fetchUserGroups(userId)
  const groupIds = userGroups.map(g => g.groupId)
  const adminGroupIds = userGroups
    .filter(g => g.role === "owner" || g.role === "admin")
    .map(g => g.groupId)
  return fetchActionRequiredItems(userId, groupIds, adminGroupIds)
}

export async function getPropertyPriceDistribution(userId: string) {
  try {
    const userGroups = await fetchUserGroups(userId)
    const groupIds = userGroups.map(g => g.groupId)

    if (groupIds.length === 0) return []

    const groupPropertiesData = await db
      .select({
        price: properties.price,
        address: properties.address,
        city: properties.city,
      })
      .from(groupProperties)
      .innerJoin(properties, eq(groupProperties.propertyId, properties.id))
      .where(inArray(groupProperties.groupId, groupIds))

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

export async function getGroupFundingProgress(userId: string) {
  try {
    const userGroups = await fetchUserGroups(userId)

    return userGroups.map(group => ({
      name: group.groupName,
      target: Number(group.targetBudget || 0),
      current: Number(group.currentFunds || 0),
      percentage:
        group.targetBudget && Number(group.targetBudget) > 0
          ? (Number(group.currentFunds || 0) / Number(group.targetBudget)) * 100
          : 0,
      status: group.groupStatus,
    }))
  } catch (error) {
    console.error("Error fetching group funding progress:", error)
    return []
  }
}
