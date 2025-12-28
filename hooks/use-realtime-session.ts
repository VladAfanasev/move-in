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
  const [lastHeartbeat, setLastHeartbeat] = useState<number>(Date.now())
  const [connectionQuality, setConnectionQuality] = useState<
    "excellent" | "good" | "poor" | "disconnected"
  >("disconnected")
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const connectTimeRef = useRef<number>(0)

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
        setConnectionQuality("excellent")
        connectTimeRef.current = Date.now()

        // Start heartbeat monitoring
        if (heartbeatTimeoutRef.current) {
          clearTimeout(heartbeatTimeoutRef.current)
        }
        heartbeatTimeoutRef.current = setTimeout(() => {
          console.log("No heartbeat received, connection may be stale")
          setConnectionQuality("poor")
        }, 45000) // 45 seconds timeout
      }

      eventSource.onmessage = event => {
        try {
          const data = JSON.parse(event.data)
          console.log("SSE message received:", data)

          // Update heartbeat for connection health monitoring
          setLastHeartbeat(Date.now())

          switch (data.type) {
            case "connected":
              console.log("SSE connection confirmed for user:", data.userId)
              // Ensure current user is included in online members
              if (data.userId === userId) {
                setOnlineMembers(prev => [...new Set([...prev, userId])])
              }
              break

            case "online-users": {
              console.log("Online users updated:", data.users)
              const onlineUsers = data.users || []
              // Always include current user in online members
              if (!onlineUsers.includes(userId)) {
                onlineUsers.push(userId)
              }
              setOnlineMembers(onlineUsers)
              callbacksRef.current.onOnlineMembersChange?.(onlineUsers)
              break
            }

            case "user-joined":
              console.log("User joined session:", data.userId)
              if (data.userId !== userId) {
                setOnlineMembers(prev => [...new Set([...prev, data.userId])])
              }
              break

            case "user-left":
              console.log("User left session:", data.userId)
              if (data.userId !== userId) {
                setOnlineMembers(prev => prev.filter(id => id !== data.userId))
              }
              break

            case "percentage-update":
              console.log("Percentage update received:", data)
              if (data.userId !== userId) {
                // Only process updates from other users
                callbacksRef.current.onPercentageUpdate?.(data)
              } else {
                console.log("Ignoring own percentage update to avoid feedback loop")
              }
              break

            case "status-change":
              console.log("Status change received:", data)
              if (data.userId !== userId) {
                // Only process status changes from other users
                callbacksRef.current.onStatusChange?.(data)
              } else {
                console.log("Ignoring own status change to avoid feedback loop")
              }
              break

            case "session-locked":
              console.log("Session locked:", data)
              break

            case "heartbeat":
              console.log("Heartbeat received")
              setConnectionQuality("excellent")

              // Reset heartbeat timeout
              if (heartbeatTimeoutRef.current) {
                clearTimeout(heartbeatTimeoutRef.current)
              }
              heartbeatTimeoutRef.current = setTimeout(() => {
                console.log("No heartbeat received, connection may be stale")
                setConnectionQuality("poor")
              }, 45000) // 45 seconds timeout
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
        setConnectionQuality("disconnected")

        // Clear heartbeat monitoring
        if (heartbeatTimeoutRef.current) {
          clearTimeout(heartbeatTimeoutRef.current)
          heartbeatTimeoutRef.current = null
        }

        // Use current state for reconnection logic
        setConnectionAttempts(currentAttempts => {
          if (currentAttempts < maxReconnectAttempts) {
            const delay = baseReconnectDelay * 2 ** currentAttempts
            console.log(
              `Reconnecting in ${delay}ms (attempt ${currentAttempts + 1}/${maxReconnectAttempts})`,
            )

            setConnectionQuality("poor")

            reconnectTimeoutRef.current = setTimeout(() => {
              connectToSSE()
            }, delay)

            return currentAttempts + 1
          } else {
            console.error("Max reconnection attempts reached")
            setConnectionQuality("disconnected")
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
    console.log("Disconnecting SSE connection")

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current)
      heartbeatTimeoutRef.current = null
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setIsConnected(false)
    setOnlineMembers([])
    setConnectionAttempts(0)
  }, [])

  // Initialize connection when component mounts or sessionId/userId changes
  useEffect(() => {
    connectToSSE()

    return disconnect
  }, [connectToSSE, disconnect])

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
    connectionQuality,
    emitPercentageUpdate,
    emitStatusChange,
    getOnlineMemberCount,
    disconnect,
  }
}
