"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"
import { useAuth } from "@/app/auth/auth-provider"

interface PendingGroupJoin {
  groupId: string
  groupName: string
  timestamp: number
}

export function PendingGroupJoinHandler() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading || !user) return

    // Check for pending group join
    const pendingJoinStr = localStorage.getItem("pendingGroupJoin")
    if (!pendingJoinStr) return

    try {
      const pendingJoin: PendingGroupJoin = JSON.parse(pendingJoinStr)

      // Check if the pending join is not too old (1 hour max)
      const oneHour = 60 * 60 * 1000
      if (Date.now() - pendingJoin.timestamp > oneHour) {
        localStorage.removeItem("pendingGroupJoin")
        return
      }

      // Clear the pending join first
      localStorage.removeItem("pendingGroupJoin")

      // Attempt to join the group
      const joinGroup = async () => {
        try {
          const response = await fetch(`/join/${pendingJoin.groupId}/confirm`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          })

          const result = await response.json()

          if (response.ok && result.success) {
            if (result.alreadyMember) {
              toast.success(`Je bent al lid van ${pendingJoin.groupName}!`)
            } else {
              toast.success(`Welkom bij ${pendingJoin.groupName}!`)
            }
            router.push(`/dashboard/groups/${pendingJoin.groupId}`)
          } else {
            const errorMessage = result.error || "Er ging iets mis bij het toevoegen aan de groep"
            toast.error(errorMessage)
            router.push("/dashboard/groups")
          }
        } catch (error) {
          console.error("Error joining group:", error)
          toast.error("Er ging iets mis bij het toevoegen aan de groep")
          router.push("/dashboard/groups")
        }
      }

      // Small delay to ensure auth is fully ready
      setTimeout(joinGroup, 500)
    } catch (error) {
      console.error("Error parsing pending group join:", error)
      localStorage.removeItem("pendingGroupJoin")
    }
  }, [user, loading, router])

  return null
}
