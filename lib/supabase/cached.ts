import { cache } from "react"
import { createClient } from "./server"

/**
 * Cached version of getUser that deduplicates calls within a single request.
 * Uses React's cache() for request-level memoization.
 */
export const getUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  return { user, error }
})

/**
 * Get the current user or throw/redirect if not authenticated.
 * Use this in pages that require authentication.
 */
export const requireUser = cache(async () => {
  const { user, error } = await getUser()

  if (error || !user) {
    return null
  }

  return user
})
