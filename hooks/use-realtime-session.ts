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
  const [_connectionAttempts, setConnectionAttempts] = useState(0)
  const [connectionQuality, setConnectionQuality] = useState<
    "excellent" | "good" | "poor" | "disconnected"
  >("disconnected")
  const [useDatabase, setUseDatabase] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const connectTimeRef = useRef<number>(0)
  const isConnectingRef = useRef<boolean>(false) // Prevent duplicate connection attempts
  const useDatabaseRef = useRef<boolean>(false) // Track database mode with ref

  // React 19: Use refs for stable callback references without dependencies
  const callbacksRef = useRef({
    onPercentageUpdate,
    onStatusChange,
    onOnlineMembersChange,
  })

  // Always update refs with latest callbacks - no useEffect needed in React 19
  callbacksRef.current = {
    onPercentageUpdate,
    onStatusChange,
    onOnlineMembersChange,
  }

  const maxReconnectAttempts = 5
  const baseReconnectDelay = 1000 // 1 second

  // Check if session should use database mode instead of real-time
  const checkSessionMode = useCallback(async () => {
    try {
      console.log("🔍 Checking session mode...")
      const response = await fetch(
        `/api/realtime-sessions/${sessionId}/mode?userId=${encodeURIComponent(userId)}`,
      )
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log("📋 Session mode:", data)
      
      if (data.useDatabase) {
        console.log("✅ Single user session detected, using database mode")
        setUseDatabase(true)
        useDatabaseRef.current = true
        setIsConnected(false)
        setConnectionQuality("excellent") // Database mode is always "connected"
        // Stop any reconnection attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
        setConnectionAttempts(0)
        return true // Return true if database mode is enabled
      }
      return false // Return false if SSE mode should be used
    } catch (error) {
      console.error("❌ Failed to check session mode:", error)
      return false // Default to SSE mode on error
    }
  }, [sessionId, userId])

  // React 19: Use useCallback with stable dependencies
  const connectToSSE = useCallback(() => {
    // Prevent duplicate connection attempts
    if (isConnectingRef.current) {
      console.log("🚫 Connection attempt already in progress, skipping duplicate")
      return
    }

    // Prevent duplicate connections
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      console.log("🚫 SSE already connected, skipping duplicate connection")
      return
    }

    isConnectingRef.current = true

    // Close any existing connection before creating new one
    if (eventSourceRef.current) {
      console.log("🔄 Closing existing connection before creating new one")
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    try {
      const sseUrl = `/api/sse/${sessionId}?userId=${encodeURIComponent(userId)}`
      console.log("Connecting to SSE:", sseUrl)

      const eventSource = new EventSource(sseUrl)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log("✅ SSE connected successfully")
        setIsConnected(true)
        setConnectionAttempts(0)
        setConnectionQuality("excellent")
        connectTimeRef.current = Date.now()
        isConnectingRef.current = false // Reset connecting flag

        // Start heartbeat monitoring
        if (heartbeatTimeoutRef.current) {
          clearTimeout(heartbeatTimeoutRef.current)
        }
        heartbeatTimeoutRef.current = setTimeout(() => {
          console.log("No heartbeat received, connection may be stale")
          setConnectionQuality("poor")
        }, 150000) // 2.5 minutes timeout (server sends every 2 min)
      }

      eventSource.onmessage = event => {
        try {
          const data = JSON.parse(event.data)
          console.log("SSE message received:", data)

          // Update heartbeat for connection health monitoring
          // (heartbeat timestamp is tracked via setTimeout reset)

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
              }, 150000) // 2.5 minutes timeout (server sends every 2 min)
              break

            default:
              console.log("Unknown SSE message type:", data.type)
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error)
        }
      }

      eventSource.onerror = error => {
        console.error("❌ SSE connection error details:", {
          error,
          readyState: eventSource.readyState,
          readyStateText: {
            0: "CONNECTING",
            1: "OPEN",
            2: "CLOSED",
          }[eventSource.readyState],
          url: sseUrl,
        })

        isConnectingRef.current = false // Reset connecting flag on any error
        setIsConnected(false)
        setConnectionQuality("disconnected")

        // Clear heartbeat monitoring
        if (heartbeatTimeoutRef.current) {
          clearTimeout(heartbeatTimeoutRef.current)
          heartbeatTimeoutRef.current = null
        }

        // Check if we should fall back to database mode
        if (eventSource.readyState === EventSource.CLOSED) {
          checkSessionMode().then((isDatabaseMode) => {
            if (isDatabaseMode) {
              // Database mode activated, no need to reconnect
              return
            }
          })
        }

        // Use current state for reconnection logic
        setConnectionAttempts(currentAttempts => {
          if (currentAttempts < maxReconnectAttempts && !useDatabaseRef.current) {
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
            if (currentAttempts >= maxReconnectAttempts) {
              console.error("Max reconnection attempts reached")
            }
            setConnectionQuality("disconnected")
            return currentAttempts
          }
        })
      }
    } catch (error) {
      console.error("❌ Error creating SSE connection:", error)
      setIsConnected(false)
      isConnectingRef.current = false // Reset connecting flag on error
    }
  }, [sessionId, userId, checkSessionMode]) // Include checkSessionMode as dependency

  const disconnect = useCallback(() => {
    console.log("🔌 Disconnecting SSE connection")

    // Reset connecting flag
    isConnectingRef.current = false

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
  }, []) // React 19: Empty deps since this only uses refs and setters

  // Connection initialization effect - only run when sessionId or userId changes
  useEffect(() => {
    console.log(`Initializing connection for session ${sessionId}, user ${userId}`)
    
    // Check session mode first before attempting SSE connection
    const initializeConnection = async () => {
      const isDatabaseMode = await checkSessionMode()
      // Only connect to SSE if not in database mode
      if (!isDatabaseMode) {
        connectToSSE()
      }
    }
    
    initializeConnection()

    return () => {
      console.log(`Cleaning up connection for session ${sessionId}, user ${userId}`)
      disconnect()
    }
  }, [sessionId, userId]) // Only re-run when sessionId or userId changes

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

  // Database fallback functions for single-user sessions
  const updateDatabaseSession = async (percentage?: number, status?: "adjusting" | "confirmed") => {
    if (!useDatabase) return updateSessionStatus(percentage, status)

    try {
      // Update database directly for single-user sessions
      const response = await fetch(`/api/realtime-sessions/${sessionId}/database`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          currentPercentage: percentage,
          status,
        }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error("Database update error:", error)
      throw error
    }
  }

  return {
    isConnected: useDatabase ? false : isConnected,
    onlineMembers: useDatabase ? [userId] : onlineMembers,
    connectionQuality: useDatabase ? "excellent" : connectionQuality,
    emitPercentageUpdate: useDatabase
      ? (percentage: number, status: "adjusting" | "confirmed") =>
          updateDatabaseSession(percentage, status)
      : emitPercentageUpdate,
    emitStatusChange: useDatabase
      ? (status: "adjusting" | "confirmed") => updateDatabaseSession(undefined, status)
      : emitStatusChange,
    getOnlineMemberCount: useDatabase ? () => 1 : getOnlineMemberCount,
    disconnect,
    useDatabase,
  }
}
