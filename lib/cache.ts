import { revalidateTag } from "next/cache"

/**
 * Revalidate dashboard cache when dashboard-related data changes.
 * Call this after mutations to groups, properties, invitations, etc.
 */
export function revalidateDashboard() {
  revalidateTag("dashboard")
}

/**
 * Revalidate groups cache when group data changes.
 */
export function revalidateGroups() {
  revalidateTag("groups")
}

/**
 * Revalidate properties cache when property data changes.
 */
export function revalidateProperties() {
  revalidateTag("properties")
}

/**
 * Revalidate all dashboard-related caches.
 * Use this for operations that affect multiple areas.
 */
export function revalidateAll() {
  revalidateTag("dashboard")
  revalidateTag("groups")
  revalidateTag("properties")
}
