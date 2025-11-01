import type { InferSelectModel } from "drizzle-orm"
import type { buyingGroups, groupMembers, properties } from "@/db/schema"

export type Property = InferSelectModel<typeof properties>
export type BuyingGroup = InferSelectModel<typeof buyingGroups>
export type GroupMember = InferSelectModel<typeof groupMembers>

// Type for group member with profile information (as returned by getGroupMembers)
export interface GroupMemberWithProfile {
  userId: string
  role: "owner" | "admin" | "member"
  status: "pending" | "active" | "left" | "removed"
  contributionAmount: string | null
  ownershipPercentage: string | null
  joinedAt: Date
  fullName: string | null
  email: string | null
  avatarUrl: string | null
}
