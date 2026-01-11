"use client"

import type { RealtimeChannel } from "@supabase/supabase-js"
import { useCallback, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface UseRealtimeSessionProps {
  sessionId: string
  userId: string
  onPercentageUpdate?: (data: { userId: string; percentage: number; status: string }) => void
  onStatusChange?: (data: { userId: string; status: string }) => void
  onOnlineMembersChange?: (members: string[]) => void
  onSessionCompleted?: (data: { sessionId: string; redirectUrl: string }) => void
}

export function useRealtimeSession({
  sessionId,
  userId,
  onPercentageUpdate,
  onStatusChange,
  onOnlineMembersChange,
  onSessionCompleted,
}: UseRealtimeSessionProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [onlineMembers, setOnlineMembers] = useState<string[]>([])
  const [connectionQuality, setConnectionQuality] = useState<
    "excellent" | "good" | "poor" | "disconnected"
  >("disconnected")

  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(createClient())

  // Refs for callbacks to avoid effect dependencies
  const callbacksRef = useRef({
    onPercentageUpdate,
    onStatusChange,
    onOnlineMembersChange,
    onSessionCompleted,
  })
  callbacksRef.current = {
    onPercentageUpdate,
    onStatusChange,
    onOnlineMembersChange,
    onSessionCompleted,
  }

  // Set up Supabase Realtime channel
  useEffect(() => {
    const supabase = supabaseRef.current
    const channelName = `session:${sessionId}`

    console.log(`🔌 Joining Supabase Realtime channel: ${channelName}`)

    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: userId },
        broadcast: { self: false }, // Don't receive own broadcasts
      },
    })

    // Handle presence (who's online)
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState()
      const onlineUserIds = Object.keys(state)
      console.log("👥 Presence sync:", onlineUserIds)
      setOnlineMembers(onlineUserIds)
      callbacksRef.current.onOnlineMembersChange?.(onlineUserIds)
    })

    // Handle broadcast messages
    channel.on("broadcast", { event: "percentage-update" }, ({ payload }) => {
      console.log("📡 Received percentage-update:", payload)
      if (payload.userId !== userId) {
        callbacksRef.current.onPercentageUpdate?.(payload)
      }
    })

    channel.on("broadcast", { event: "status-change" }, ({ payload }) => {
      console.log("📡 Received status-change:", payload)
      if (payload.userId !== userId) {
        callbacksRef.current.onStatusChange?.(payload)
      }
    })

    channel.on("broadcast", { event: "session-completed" }, ({ payload }) => {
      console.log("🎉 Received session-completed:", payload)
      callbacksRef.current.onSessionCompleted?.(payload)
    })

    // Subscribe and track presence
    channel.subscribe(async status => {
      console.log(`📶 Channel status: ${status}`)
      if (status === "SUBSCRIBED") {
        setIsConnected(true)
        setConnectionQuality("excellent")
        // Track this user's presence
        await channel.track({ userId, online_at: new Date().toISOString() })
      } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
        setIsConnected(false)
        setConnectionQuality("disconnected")
      }
    })

    channelRef.current = channel

    return () => {
      console.log(`🔌 Leaving channel: ${channelName}`)
      channel.unsubscribe()
      channelRef.current = null
      setIsConnected(false)
      setOnlineMembers([])
    }
  }, [sessionId, userId])

  // Broadcast percentage update
  const emitPercentageUpdate = useCallback(
    async (percentage: number, status: "adjusting" | "confirmed") => {
      const channel = channelRef.current
      if (!channel) {
        console.warn("Channel not connected, cannot emit percentage update")
        return
      }

      console.log(`📤 Broadcasting percentage-update: ${percentage}% (${status})`)

      // Broadcast to other users
      await channel.send({
        type: "broadcast",
        event: "percentage-update",
        payload: { userId, percentage, status, timestamp: Date.now() },
      })

      // Persist to database via API
      try {
        const response = await fetch(`/api/realtime-sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPercentage: percentage, status }),
        })

        const data = await response.json()

        // If session is completed, the API returns redirectUrl
        if (data.completed && data.redirectUrl) {
          console.log("🎉 Session completed! Triggering redirect...")
          // Broadcast to other users and trigger local redirect
          await channel.send({
            type: "broadcast",
            event: "session-completed",
            payload: { sessionId, redirectUrl: data.redirectUrl, timestamp: Date.now() },
          })
          // Also trigger local callback
          callbacksRef.current.onSessionCompleted?.({
            sessionId,
            redirectUrl: data.redirectUrl,
          })
        }
      } catch (error) {
        console.error("Failed to persist to database:", error)
      }
    },
    [sessionId, userId],
  )

  // Broadcast status change
  const emitStatusChange = useCallback(
    async (status: "adjusting" | "confirmed") => {
      const channel = channelRef.current
      if (!channel) {
        console.warn("Channel not connected, cannot emit status change")
        return
      }

      console.log(`📤 Broadcasting status-change: ${status}`)

      await channel.send({
        type: "broadcast",
        event: "status-change",
        payload: { userId, status, timestamp: Date.now() },
      })

      // Persist to database via API
      try {
        await fetch(`/api/realtime-sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        })
      } catch (error) {
        console.error("Failed to persist to database:", error)
      }
    },
    [sessionId, userId],
  )

  // Broadcast session completed (called from API, but can also be called from client)
  const emitSessionCompleted = useCallback(
    async (redirectUrl: string) => {
      const channel = channelRef.current
      if (!channel) return

      console.log(`📤 Broadcasting session-completed: ${redirectUrl}`)

      await channel.send({
        type: "broadcast",
        event: "session-completed",
        payload: { sessionId, redirectUrl, timestamp: Date.now() },
      })
    },
    [sessionId],
  )

  const getOnlineMemberCount = useCallback(() => onlineMembers.length, [onlineMembers])

  return {
    isConnected,
    onlineMembers,
    connectionQuality,
    emitPercentageUpdate,
    emitStatusChange,
    emitSessionCompleted,
    getOnlineMemberCount,
  }
}
