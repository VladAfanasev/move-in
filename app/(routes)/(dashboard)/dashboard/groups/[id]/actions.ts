"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { updateMemberStatus, updateGroupDetails, getGroupMembers, deleteGroup } from "@/lib/groups"
import { createClient } from "@/lib/supabase/server"

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
    return { success: true }
  } catch (error) {
    console.error("Error updating member status:", error)
    throw new Error("Failed to update member status")
  }
}

export async function updateGroupDetailsAction(
  groupId: string,
  data: {
    name?: string
    description?: string
  }
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
    // Check if user has permission to edit the group
    const members = await getGroupMembers(groupId)
    const userMember = members.find(member => member.userId === user.id)
    
    if (!userMember || (userMember.role !== "owner" && userMember.role !== "admin")) {
      throw new Error("Insufficient permissions to edit group details")
    }

    const updatedGroup = await updateGroupDetails(groupId, data)
    revalidatePath(`/dashboard/groups/${groupId}`)
    revalidatePath("/dashboard/groups")
    return { success: true, group: updatedGroup }
  } catch (error) {
    console.error("Error updating group details:", error)
    throw new Error("Failed to update group details")
  }
}

export async function deleteGroupAction(groupId: string) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Unauthorized")
  }

  try {
    // Check if user has permission to delete the group (only owners can delete)
    const members = await getGroupMembers(groupId)
    const userMember = members.find(member => member.userId === user.id)
    
    if (!userMember || userMember.role !== "owner") {
      throw new Error("Only group owners can delete the group")
    }

    await deleteGroup(groupId)
    revalidatePath("/dashboard/groups")
    redirect("/dashboard/groups")
  } catch (error) {
    // Re-throw redirect errors as they are expected
    if (error && typeof error === "object" && "digest" in error && 
        typeof error.digest === "string" && error.digest.includes("NEXT_REDIRECT")) {
      throw error
    }
    console.error("Error deleting group:", error)
    throw new Error("Failed to delete group")
  }
}
