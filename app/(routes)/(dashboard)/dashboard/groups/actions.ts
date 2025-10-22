"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createGroup, updateMemberStatus } from "@/lib/groups"
import { createClient } from "@/lib/supabase/server"
import { ensureUserProfile } from "@/lib/auth"

export async function createGroupAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Ensure user profile exists in the database
  await ensureUserProfile(user.id, user.email || "")

  const data = {
    name: formData.get("groepsnaam") as string,
    description: formData.get("beschrijving") as string,
    targetBudget: undefined,
    targetLocation: undefined,
    maxMembers: 10,
    createdBy: user.id,
  }

  try {
    const group = await createGroup(data)
    revalidatePath("/dashboard/groups")
    redirect(`/dashboard/groups/${group.id}`)
  } catch (error) {
    // Check if this is a Next.js redirect error (which is expected)
    if (error && typeof error === "object" && "digest" in error && 
        typeof error.digest === "string" && error.digest.includes("NEXT_REDIRECT")) {
      throw error
    }
    console.error("Error creating group:", error)
    throw new Error("Failed to create group")
  }
}

export async function updateMemberStatusAction(
  groupId: string,
  userId: string,
  status: "active" | "left" | "removed",
) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Unauthorized")
  }

  try {
    await updateMemberStatus(groupId, userId, status)
    revalidatePath(`/dashboard/groups/${groupId}`)
    revalidatePath("/dashboard/groups")
  } catch (error) {
    console.error("Error updating member status:", error)
    throw new Error("Failed to update member status")
  }
}
