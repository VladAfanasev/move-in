"use client"

import { useEffect } from "react"

interface JoinGroupClientProps {
  groupId: string
  groupName: string
}

export function JoinGroupClient({ groupId, groupName }: JoinGroupClientProps) {
  useEffect(() => {
    // Store pending group join in localStorage
    const pendingJoin = {
      groupId,
      groupName,
      timestamp: Date.now(),
    }

    localStorage.setItem("pendingGroupJoin", JSON.stringify(pendingJoin))
  }, [groupId, groupName])

  return null
}
