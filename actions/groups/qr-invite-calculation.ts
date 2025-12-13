"use server"

import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export async function generateCalculationQRInviteAction(groupId: string, propertyId: string) {
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

  // Create URL for direct calculation page access after joining
  const qrInviteUrl = `${baseUrl}/join/${groupId}?redirect=${encodeURIComponent(`/dashboard/groups/${groupId}/calculate/${propertyId}`)}`

  return {
    success: true,
    qrInviteUrl,
  }
}
