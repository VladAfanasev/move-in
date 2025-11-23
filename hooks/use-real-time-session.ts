"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export interface RealTimeMessage {
  type:
    | "connected"
    | "user-joined"
    | "user-left"
    | "percentage-update"
    | "status-change"
    | "online-users"
    | "user-activity"
    | "session-locked"
  userId?: string
  percentage?: number
  status?: "adjusting" | "confirmed"
  activity?: "typing" | "adjusting" | "idle"
  users?: string[]
  timestamp?: number
  sessionId?: string
  socketId?: string
  isOnline?: boolean
  lockedBy?: string
}

export interface UseRealTimeSessionOptions {
  sessionId: string
  userId: string
  onMessage?: (message: RealTimeMessage) => void
}

export function useRealTimeSession({ sessionId, userId, onMessage }: UseRealTimeSessionOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  const maxReconnectAttempts = 5
  const baseReconnectDelay = 1000 // 1 second

  // Function to send messages to other users
  const send = useCallback(
    async (message: Omit<RealTimeMessage, "timestamp">) => {
      if (!isConnected) {
        console.warn("Not connected, cannot send message:", message)
        return
      }

      try {
        const response = await fetch("/api/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            type: message.type,
            data: message,
            excludeUserId: userId, // Don't send back to ourselves
          }),
        })

        if (!response.ok) {
          console.error("Failed to send message:", response.statusText)
        }
      } catch (error) {
        console.error("Error sending message:", error)
      }
    },
    [sessionId, userId, isConnected],
  )

  // Connect to SSE
  const connect = useCallback(() => {
    if (!sessionId || sessionId === "no-session" || !userId) {
      console.log("Skipping SSE connection: missing sessionId or userId")
      return
    }

    if (eventSourceRef.current?.readyState === EventSource.CONNECTING) {
      return // Already connecting
    }

    console.log(`Connecting to SSE for session ${sessionId} as user ${userId}`)

    const eventSource = new EventSource(
      `/api/sse/${sessionId}?userId=${encodeURIComponent(userId)}`,
    )

    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log("SSE connection opened")
      setIsConnected(true)
      setReconnectAttempts(0)

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }

    eventSource.onmessage = event => {
      try {
        const message: RealTimeMessage = JSON.parse(event.data)

        // Handle online users update
        if (message.type === "online-users") {
          setOnlineUsers(message.users || [])
        }

        console.log("📨 Received SSE message:", message.type, "from:", message.userId, message)

        // Call the provided message handler
        if (onMessage) {
          onMessage(message)
        }
      } catch (error) {
        console.error("Error parsing SSE message:", error)
      }
    }

    eventSource.onerror = error => {
      console.error("SSE error:", error, {
        readyState: eventSource.readyState,
        url: eventSource.url,
      })
      setIsConnected(false)

      // Check if it's a permanent error (like 401 Unauthorized)
      if (eventSource.readyState === EventSource.CLOSED) {
        console.error("SSE connection permanently closed, won't retry")
        return
      }

      // Don't reconnect if we're at max attempts
      if (reconnectAttempts >= maxReconnectAttempts) {
        console.error("Max reconnect attempts reached, giving up")
        return
      }

      // Close the current connection before retrying
      eventSource.close()

      // Exponential backoff for reconnection
      const delay = Math.min(baseReconnectDelay * 2 ** reconnectAttempts, 30000)

      console.log(
        `SSE connection failed, retrying in ${delay}ms (attempt ${reconnectAttempts + 1})`,
      )

      reconnectTimeoutRef.current = setTimeout(() => {
        setReconnectAttempts(prev => prev + 1)
        connect()
      }, delay)
    }
  }, [sessionId, userId, onMessage, reconnectAttempts])

  // Disconnect from SSE
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log("Disconnecting from SSE")
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    setIsConnected(false)
    setOnlineUsers([])
  }, [])

  // Auto-connect on mount and clean up on unmount
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  // Send activity indicators
  const sendActivity = useCallback(
    (activity: "typing" | "adjusting" | "idle") => {
      send({
        type: "user-activity",
        sessionId,
        userId,
        activity,
      })
    },
    [send, sessionId, userId],
  )

  return {
    isConnected,
    onlineUsers,
    send,
    connect,
    disconnect,
    sendActivity,
    reconnectAttempts,
  }
}
