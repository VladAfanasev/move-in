"use server"

import { revalidatePath } from "next/cache"
import { ensureUserProfile } from "@/lib/auth"
import { addPropertyToGroup } from "@/lib/groups"
import { createClient } from "@/lib/supabase/server"

export async function addPropertyToGroupAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Unauthorized")
  }

  // Ensure user profile exists in the database
  await ensureUserProfile(user.id, user.email || "")

  const groupId = formData.get("groupId") as string
  const propertyId = formData.get("propertyId") as string

  if (!(groupId && propertyId)) {
    throw new Error("Group ID and Property ID are required")
  }

  try {
    await addPropertyToGroup({
      groupId,
      propertyId,
      addedBy: user.id,
    })

    revalidatePath(`/dashboard/groups/${groupId}`)
    revalidatePath("/dashboard/properties")

    return { success: true }
  } catch (error) {
    console.error("Error adding property to group:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to add property to group")
  }
}
