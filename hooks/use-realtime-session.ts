"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface UseRealtimeSessionProps {
  sessionId: string
  userId: string
  onPercentageUpdate?: (data: { userId: string; percentage: number; status: string }) => void
  onStatusChange?: (data: { userId: string; status: string }) => void
  onOnlineMembersChange?: (members: string[]) => void
}

export function useRealtimeSession({
  sessionId,
  userId,
  onPercentageUpdate,
  onStatusChange,
  onOnlineMembersChange,
}: UseRealtimeSessionProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [onlineMembers, setOnlineMembers] = useState<string[]>([])
  const [connectionQuality, setConnectionQuality] = useState<
    "excellent" | "good" | "poor" | "disconnected"
  >("disconnected")

  // Refs for callbacks to avoid effect dependencies
  const callbacksRef = useRef({ onPercentageUpdate, onStatusChange, onOnlineMembersChange })
  callbacksRef.current = { onPercentageUpdate, onStatusChange, onOnlineMembersChange }

  // Single effect to manage EventSource lifecycle
  useEffect(() => {
    const sseUrl = `/api/sse/${sessionId}?userId=${encodeURIComponent(userId)}`
    console.log("🔌 Creating SSE connection:", sseUrl)

    const eventSource = new EventSource(sseUrl)

    eventSource.onopen = () => {
      console.log("✅ SSE connected")
      setIsConnected(true)
      setConnectionQuality("excellent")
    }

    eventSource.onmessage = event => {
      try {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case "connected":
            console.log("SSE confirmed for:", data.userId)
            break

          case "online-users": {
            const users = data.users || []
            if (!users.includes(userId)) users.push(userId)
            setOnlineMembers(users)
            callbacksRef.current.onOnlineMembersChange?.(users)
            break
          }

          case "user-joined":
            if (data.userId !== userId) {
              setOnlineMembers(prev => [...new Set([...prev, data.userId])])
            }
            break

          case "user-left":
            if (data.userId !== userId) {
              setOnlineMembers(prev => prev.filter(id => id !== data.userId))
            }
            break

          case "percentage-update":
            if (data.userId !== userId) {
              callbacksRef.current.onPercentageUpdate?.(data)
            }
            break

          case "status-change":
            if (data.userId !== userId) {
              callbacksRef.current.onStatusChange?.(data)
            }
            break

          case "heartbeat":
            setConnectionQuality("excellent")
            break
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error)
      }
    }

    eventSource.onerror = () => {
      // EventSource auto-reconnects, just update state
      setIsConnected(false)
      setConnectionQuality("poor")
      // Don't log errors during CONNECTING state - it's normal for EventSource
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log("SSE connection closed")
      }
    }

    return () => {
      console.log("🔌 Closing SSE connection")
      eventSource.close()
      setIsConnected(false)
      setOnlineMembers([])
    }
  }, [sessionId, userId])

  // Update session status via API
  const updateSessionStatus = useCallback(
    async (percentage?: number, status?: "adjusting" | "confirmed") => {
      const response = await fetch(`/api/realtime-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPercentage: percentage, status }),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    },
    [sessionId],
  )

  const emitPercentageUpdate = useCallback(
    async (percentage: number, status: "adjusting" | "confirmed") => {
      try {
        await updateSessionStatus(percentage, status)
      } catch (error) {
        console.error("Failed to emit percentage update:", error)
      }
    },
    [updateSessionStatus],
  )

  const emitStatusChange = useCallback(
    async (status: "adjusting" | "confirmed") => {
      try {
        await updateSessionStatus(undefined, status)
      } catch (error) {
        console.error("Failed to emit status change:", error)
      }
    },
    [updateSessionStatus],
  )

  const getOnlineMemberCount = useCallback(() => onlineMembers.length, [onlineMembers])

  const disconnect = useCallback(() => {
    // No-op - let the effect cleanup handle it
  }, [])

  return {
    isConnected,
    onlineMembers,
    connectionQuality,
    emitPercentageUpdate,
    emitStatusChange,
    getOnlineMemberCount,
    disconnect,
  }
}
