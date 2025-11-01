"use server"

import { and, eq } from "drizzle-orm"
import { db } from "@/db/client"
import { groupMembers } from "@/db/schema"
import { createClient } from "@/lib/supabase/server"

export async function generateShareLinkAction(groupId: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  // Check if user is admin/owner of the group
  const membership = await db
    .select({ role: groupMembers.role })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)))
    .limit(1)

  const userRole = membership[0]?.role
  if (!(userRole && ["admin", "owner"].includes(userRole))) {
    throw new Error("Insufficient permissions to generate share links")
  }

  // Generate shareable link
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const shareUrl = `${baseUrl}/join/${groupId}`

  return {
    success: true,
    shareUrl,
    message: "Share link generated successfully",
  }
}
