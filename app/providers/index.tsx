"use client"

import { AuthProvider } from "@/app/auth/auth-provider"
import { CookieBanner } from "@/components/cookie-banner"
import { Toaster } from "@/components/ui/sonner"
import { CookieConsentProvider } from "@/lib/cookie-consent"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CookieConsentProvider>
      <AuthProvider>
        {children}
        <Toaster />
        <CookieBanner />
      </AuthProvider>
    </CookieConsentProvider>
  )
}
