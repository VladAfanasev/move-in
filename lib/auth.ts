import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { profiles } from "@/db/schema"

export async function ensureUserProfile(userId: string, email: string, fullName?: string) {
  try {
    // Check if profile already exists
    const existingProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1)

    if (existingProfile.length > 0) {
      return existingProfile[0]
    }

    // Create profile if it doesn't exist
    const [newProfile] = await db
      .insert(profiles)
      .values({
        id: userId,
        email: email,
        fullName: fullName || email.split("@")[0],
      })
      .returning()

    console.log("Profile created for user:", userId)
    return newProfile
  } catch (error) {
    console.error("Error ensuring user profile:", error)
    throw new Error("Failed to ensure user profile exists")
  }
}