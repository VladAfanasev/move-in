"use client"

import { AuthProvider } from "@/app/auth/auth-provider"
import { PendingGroupJoinHandler } from "@/components/pending-group-join-handler"
import { Toaster } from "@/components/ui/sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PendingGroupJoinHandler />
      {children}
      <Toaster />
    </AuthProvider>
  )
}
