"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { removePropertyFromGroup } from "@/lib/groups"
import { createClient } from "@/lib/supabase/server"

export async function removePropertyFromGroupAction(groupId: string, propertyId: string) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Unauthorized")
  }

  if (!(groupId && propertyId)) {
    throw new Error("Group ID and Property ID are required")
  }

  try {
    await removePropertyFromGroup(groupId, propertyId)

    revalidateTag("dashboard")
    revalidateTag("properties")
    revalidateTag(`group-${groupId}`)
    revalidatePath(`/dashboard/groups/${groupId}`)
    revalidatePath("/dashboard/properties")

    return { success: true }
  } catch (error) {
    console.error("Error removing property from group:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to remove property from group")
  }
}
