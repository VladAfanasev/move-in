import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

export function createClient() {
  // Check if we're in build phase (when environment variables might not be available)
  const isBuildTime =
    process.env.NEXT_PHASE === "phase-production-build" ||
    (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_SUPABASE_URL)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co"
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-anon-key"

  if (
    !(
      (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
      isBuildTime
    )
  ) {
    throw new Error("Missing Supabase environment variables")
  }

  // Return dummy client during build time
  if (isBuildTime) {
    return {} as SupabaseClient
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
