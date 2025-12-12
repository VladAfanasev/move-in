"use server"

import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export async function generateGroupQRInviteAction(groupId: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Unauthorized")
  }

  // Get base URL from request headers for dynamic domain detection
  const headersList = await headers()
  const host = headersList.get("host")
  const protocol =
    headersList.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https")
  const baseUrl = `${protocol}://${host}`

  // Use same URL structure as share link for consistency
  const qrInviteUrl = `${baseUrl}/join/${groupId}`

  return {
    success: true,
    qrInviteUrl,
  }
}
