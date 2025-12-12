"use client"

import { useAuth } from "@/app/auth/auth-provider"

export function useProfile() {
  const { user } = useAuth()

  const getDisplayName = (): string => {
    // Try to get full name from user metadata (updated when profile is changed)
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
    }

    // Try first_name + last_name from metadata
    if (user?.user_metadata?.first_name) {
      const lastName = user.user_metadata?.last_name
      return lastName
        ? `${user.user_metadata.first_name} ${lastName}`
        : user.user_metadata.first_name
    }

    // Fallback to email prefix
    return user?.email?.split("@")[0] || "User"
  }

  const getInitials = (): string => {
    // Try from first and last name
    if (user?.user_metadata?.first_name) {
      const first = user.user_metadata.first_name.charAt(0).toUpperCase()
      const last = user?.user_metadata?.last_name?.charAt(0).toUpperCase() || ""
      return first + last
    }

    // Try from full name
    if (user?.user_metadata?.full_name) {
      const parts = user.user_metadata.full_name.split(" ")
      if (parts.length >= 2) {
        return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase()
      }
      return parts[0].charAt(0).toUpperCase()
    }

    // Fallback to email
    return user?.email?.charAt(0).toUpperCase() || "U"
  }

  return {
    user,
    getDisplayName,
    getInitials,
  }
}
