import type { InferSelectModel } from "drizzle-orm"
import type { buyingGroups, groupMembers, properties } from "@/db/schema"

export type Property = InferSelectModel<typeof properties>
export type BuyingGroup = InferSelectModel<typeof buyingGroups>
export type GroupMember = InferSelectModel<typeof groupMembers>

// Utility type: Converts Date fields to Date | string (for cached data)
type DateToString<T> = {
  [K in keyof T]: T[K] extends Date
    ? Date | string
    : T[K] extends Date | null
      ? Date | string | null
      : T[K]
}

// Cache-safe versions of types (Date fields accept strings from JSON serialization)
export type CachedProperty = DateToString<Property>
export type CachedBuyingGroup = DateToString<BuyingGroup>
export type CachedGroupMember = DateToString<GroupMember>

// Type for group member with profile information (as returned by getGroupMembers)
export interface GroupMemberWithProfile {
  userId: string
  role: "owner" | "admin" | "member"
  status: "pending" | "active" | "left" | "removed"
  contributionAmount: string | null
  ownershipPercentage: string | null
  joinedAt: Date | string
  fullName: string | null
  email: string | null
  avatarUrl: string | null
}

// Type for group with member count (as returned by getUserGroups query)
export interface GroupWithMemberCount {
  id: string
  name: string
  description: string | null
  targetBudget: string | null
  targetLocation: string | null
  maxMembers: number | null
  createdAt: Date | string
  memberCount: number
}
