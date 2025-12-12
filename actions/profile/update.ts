"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db/client"
import { profiles } from "@/db/schema"
import { createClient } from "@/lib/supabase/server"

interface UpdateProfileData {
  userId: string
  firstName: string
  lastName: string | null
}

export async function updateProfileAction(data: UpdateProfileData) {
  const { userId, firstName, lastName } = data

  // Validate input
  if (!firstName?.trim()) {
    return { success: false, error: "First name is required" }
  }

  if (firstName.length > 255) {
    return { success: false, error: "First name is too long" }
  }

  if (lastName && lastName.length > 255) {
    return { success: false, error: "Last name is too long" }
  }

  try {
    // Verify user authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      return { success: false, error: "Unauthorized" }
    }

    // Create full name
    const fullName = lastName ? `${firstName.trim()} ${lastName.trim()}`.trim() : firstName.trim()

    // Update profile in database
    await db
      .update(profiles)
      .set({
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null,
        fullName: fullName,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId))

    // Also update Supabase auth metadata
    await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        first_name: firstName.trim(),
        last_name: lastName?.trim() || null,
      },
    })

    // Revalidate pages that might display user data
    revalidatePath("/dashboard", "layout")
    revalidatePath("/dashboard/profile")

    return { success: true }
  } catch (error) {
    console.error("Profile update error:", error)
    return {
      success: false,
      error: "Failed to update profile. Please try again.",
    }
  }
}
