import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function updateSession(request: NextRequest) {
  // Check if we're in build phase (when environment variables might not be available)
  const isBuildTime =
    process.env.NEXT_PHASE === "phase-production-build" ||
    (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_SUPABASE_URL)

  let supabaseResponse = NextResponse.next({
    request,
  })

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

  // Skip Supabase operations during build time
  if (isBuildTime) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        supabaseResponse = NextResponse.next({
          request,
        })
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options)
        }
      },
    },
  })

  // This will refresh the session if expired - required for Server Components
  await supabase.auth.getUser()

  return supabaseResponse
}
