"use server"

import { getUserGroups } from "@/lib/groups"
import { createClient } from "@/lib/supabase/server"

export async function getUserGroupsAction() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Unauthorized")
  }

  try {
    const groups = await getUserGroups(user.id)
    return groups
  } catch (error) {
    console.error("Error fetching user groups:", error)
    throw new Error("Failed to fetch user groups")
  }
}
