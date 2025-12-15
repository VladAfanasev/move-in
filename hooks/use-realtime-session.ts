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
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Store callbacks in refs to avoid dependency issues
  const callbacksRef = useRef({
    onPercentageUpdate,
    onStatusChange,
    onOnlineMembersChange,
  })

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onPercentageUpdate,
      onStatusChange,
      onOnlineMembersChange,
    }
  }, [onPercentageUpdate, onStatusChange, onOnlineMembersChange])

  const maxReconnectAttempts = 5
  const baseReconnectDelay = 1000 // 1 second

  const connectToSSE = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      console.log("SSE already connected")
      return
    }

    try {
      const sseUrl = `/api/sse/${sessionId}?userId=${encodeURIComponent(userId)}`
      console.log("Connecting to SSE:", sseUrl)

      const eventSource = new EventSource(sseUrl)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log("SSE connected successfully")
        setIsConnected(true)
        setConnectionAttempts(0)
      }

      eventSource.onmessage = event => {
        try {
          const data = JSON.parse(event.data)
          console.log("SSE message received:", data)

          switch (data.type) {
            case "connected":
              console.log("SSE connection confirmed for user:", data.userId)
              break

            case "online-users":
              console.log("Online users updated:", data.users)
              setOnlineMembers(data.users || [])
              callbacksRef.current.onOnlineMembersChange?.(data.users || [])
              break

            case "user-joined":
              console.log("User joined session:", data.userId)
              if (data.userId !== userId) {
                setOnlineMembers(prev => [...new Set([...prev, data.userId])])
              }
              break

            case "user-left":
              console.log("User left session:", data.userId)
              setOnlineMembers(prev => prev.filter(id => id !== data.userId))
              break

            case "percentage-update":
              console.log("Percentage update received:", data)
              if (data.userId !== userId) {
                callbacksRef.current.onPercentageUpdate?.(data)
              }
              break

            case "status-change":
              console.log("Status change received:", data)
              if (data.userId !== userId) {
                callbacksRef.current.onStatusChange?.(data)
              }
              break

            case "session-locked":
              console.log("Session locked:", data)
              break

            default:
              console.log("Unknown SSE message type:", data.type)
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error)
        }
      }

      eventSource.onerror = error => {
        console.error("SSE connection error:", error)
        setIsConnected(false)

        // Use current state for reconnection logic
        setConnectionAttempts(currentAttempts => {
          if (currentAttempts < maxReconnectAttempts) {
            const delay = baseReconnectDelay * 2 ** currentAttempts
            console.log(
              `Reconnecting in ${delay}ms (attempt ${currentAttempts + 1}/${maxReconnectAttempts})`,
            )

            reconnectTimeoutRef.current = setTimeout(() => {
              connectToSSE()
            }, delay)

            return currentAttempts + 1
          } else {
            console.error("Max reconnection attempts reached")
            return currentAttempts
          }
        })
      }
    } catch (error) {
      console.error("Error creating SSE connection:", error)
      setIsConnected(false)
    }
  }, [sessionId, userId]) // Removed the callback dependencies that cause infinite loops

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setIsConnected(false)
    setOnlineMembers([])
  }, [])

  // Initialize connection only once
  useEffect(() => {
    connectToSSE()

    return () => {
      disconnect()
    }
  }, [sessionId, userId]) // Only reconnect if sessionId or userId changes

  // Update session status via API
  const updateSessionStatus = useCallback(
    async (percentage?: number, status?: "adjusting" | "confirmed") => {
      try {
        const response = await fetch(`/api/realtime-sessions/${sessionId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPercentage: percentage,
            status,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        console.log("Session status updated:", result)
        return result
      } catch (error) {
        console.error("Error updating session status:", error)
        throw error
      }
    },
    [sessionId],
  )

  const emitPercentageUpdate = useCallback(
    async (percentage: number, status: "adjusting" | "confirmed") => {
      console.log("Emitting percentage update:", { percentage, status })
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
      console.log("Emitting status change:", { status })
      try {
        await updateSessionStatus(undefined, status)
      } catch (error) {
        console.error("Failed to emit status change:", error)
      }
    },
    [updateSessionStatus],
  )

  const getOnlineMemberCount = useCallback(() => {
    return onlineMembers.length
  }, [onlineMembers])

  return {
    isConnected,
    onlineMembers,
    emitPercentageUpdate,
    emitStatusChange,
    getOnlineMemberCount,
    disconnect,
  }
}
