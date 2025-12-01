"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"
import { useAuth } from "@/app/auth/auth-provider"
import { RegisterForm } from "@/components/register-form"

function RegisterContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo")

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTo || "/dashboard")
    }
  }, [user, loading, router, redirectTo])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <RegisterForm className="w-full max-w-md" redirectTo={redirectTo} />
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          </div>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  )
}
