import { createServerClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

export async function createClient() {
  // Check if we're in build phase (when environment variables might not be available)
  const isBuildTime =
    process.env.NEXT_PHASE === "phase-production-build" ||
    (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_SUPABASE_URL)

  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co"
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-anon-key"

  if (!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    if (!isBuildTime) {
      throw new Error("Missing Supabase environment variables")
    }
  }

  // Return dummy client during build time
  if (isBuildTime) {
    return {} as SupabaseClient
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
