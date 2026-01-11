"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const redirectTo = formData.get("redirectTo") as string

  // Validate inputs
  if (!(email && password)) {
    return { error: "Email and password are required" }
  }

  try {
    const supabase = await createClient()

    console.log("Attempting to sign in user:", email)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Supabase signIn error:", error)
      return { error: error.message }
    }

    console.log("User signed in successfully")

    revalidatePath("/", "layout")

    if (redirectTo) {
      redirect(redirectTo)
    }

    return { success: true }
  } catch (error) {
    console.error("Unexpected error during signin:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const redirectTo = formData.get("redirectTo") as string

  // Validate inputs
  if (!(email && password && firstName)) {
    return { error: "Email, password, and first name are required" }
  }

  // Create full name from first and last name
  const fullName = lastName ? `${firstName} ${lastName}`.trim() : firstName

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" }
  }

  try {
    const supabase = await createClient()

    console.log("Attempting to sign up user:", email)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      console.error("Supabase signUp error:", error)
      return { error: error.message }
    }

    if (!data.user) {
      return { error: "Failed to create user" }
    }

    console.log("User signed up successfully:", data.user.id)

    // Create profile record in the profiles table
    try {
      const { db } = await import("@/db/client")
      const { profiles } = await import("@/db/schema")

      // Try to insert with new fields, fall back to fullName only if columns don't exist
      try {
        await db.insert(profiles).values({
          id: data.user.id,
          email: email,
          firstName: firstName,
          lastName: lastName || null,
          fullName: fullName,
        })
      } catch (insertError) {
        // Fallback to just fullName if firstName/lastName columns don't exist yet
        console.warn(
          "Failed to insert with firstName/lastName, falling back to fullName only:",
          insertError,
        )
        await db.insert(profiles).values({
          id: data.user.id,
          email: email,
          fullName: fullName,
        })
      }

      console.log("Profile created successfully for user:", data.user.id)
    } catch (profileError) {
      console.error("Failed to create profile:", profileError)
      // Don't return error here as the user was created successfully in auth
      // The profile can be created later via a trigger or manual process
    }

    revalidatePath("/", "layout")

    if (redirectTo) {
      redirect(redirectTo)
    }

    return { success: true }
  } catch (error) {
    console.error("Unexpected error during signup:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/")
}
