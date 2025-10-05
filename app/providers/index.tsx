"use client"

import { AuthProvider } from "@/app/auth/auth-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
