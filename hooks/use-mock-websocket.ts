"use client"

import { useCallback, useEffect, useRef } from "react"

type WebSocketMessage = 
  | { type: "percentage-update"; userId: string; percentage: number; status: "adjusting" | "confirmed" }
  | { type: "status-change"; userId: string; status: "adjusting" | "confirmed" }
  | { type: "member-join"; userId: string; name: string }
  | { type: "member-leave"; userId: string }
  | { type: "session-locked"; finalDistribution: Array<{ userId: string; percentage: number }> }

type WebSocketEventHandler = (message: WebSocketMessage) => void

interface MockWebSocket {
  send: (message: WebSocketMessage) => void
  on: (handler: WebSocketEventHandler) => void
  off: (handler: WebSocketEventHandler) => void
  close: () => void
}

// Global state to simulate shared connection between all tabs/users
const globalHandlers = new Set<WebSocketEventHandler>()
const simulatedDelay = 100 // ms

export function useMockWebSocket(sessionId: string, currentUserId: string): MockWebSocket {
  const handlersRef = useRef(new Set<WebSocketEventHandler>())

  const send = useCallback((message: WebSocketMessage) => {
    // Simulate network delay and broadcast to all handlers (except sender in real scenario)
    setTimeout(() => {
      globalHandlers.forEach(handler => {
        // In real WebSocket, we wouldn't receive our own messages back
        // But for demo purposes, we'll skip this filter
        handler(message)
      })
    }, simulatedDelay)

    // Simulate some realistic responses from other users
    if (message.type === "percentage-update" && message.userId === currentUserId) {
      // Simulate another user adjusting after you change
      setTimeout(() => {
        const otherUsersResponses = [
          { userId: "user-2", percentage: Math.random() * 30 + 20, name: "Emma" },
          { userId: "user-3", percentage: Math.random() * 25 + 15, name: "Mark" },
          { userId: "user-4", percentage: Math.random() * 20 + 10, name: "Lisa" },
        ].filter(u => u.userId !== currentUserId)
        
        if (otherUsersResponses.length > 0 && Math.random() > 0.7) {
          const randomUser = otherUsersResponses[Math.floor(Math.random() * otherUsersResponses.length)]
          globalHandlers.forEach(handler => {
            handler({
              type: "percentage-update",
              userId: randomUser.userId,
              percentage: randomUser.percentage,
              status: "adjusting"
            })
          })
        }
      }, 1000 + Math.random() * 3000) // 1-4 seconds delay
    }

    // Simulate confirmations from other users
    if (message.type === "status-change" && message.status === "confirmed") {
      setTimeout(() => {
        const shouldOtherConfirm = Math.random() > 0.6
        if (shouldOtherConfirm) {
          const otherUsers = ["user-2", "user-3", "user-4"].filter(id => id !== currentUserId)
          const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)]
          
          globalHandlers.forEach(handler => {
            handler({
              type: "status-change",
              userId: randomUser,
              status: "confirmed"
            })
          })
        }
      }, 2000 + Math.random() * 4000) // 2-6 seconds delay
    }
  }, [currentUserId])

  const on = useCallback((handler: WebSocketEventHandler) => {
    handlersRef.current.add(handler)
    globalHandlers.add(handler)
  }, [])

  const off = useCallback((handler: WebSocketEventHandler) => {
    handlersRef.current.delete(handler)
    globalHandlers.delete(handler)
  }, [])

  const close = useCallback(() => {
    handlersRef.current.forEach(handler => {
      globalHandlers.delete(handler)
    })
    handlersRef.current.clear()
  }, [])

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      close()
    }
  }, [close])

  // Simulate other users joining when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      const users = [
        { userId: "user-2", name: "Emma" },
        { userId: "user-3", name: "Mark" },
        { userId: "user-4", name: "Lisa" },
      ].filter(u => u.userId !== currentUserId)

      users.forEach((user, index) => {
        setTimeout(() => {
          globalHandlers.forEach(handler => {
            handler({
              type: "member-join",
              userId: user.userId,
              name: user.name
            })
          })
        }, index * 1000) // Stagger the joins
      })
    }, 500)

    return () => clearTimeout(timer)
  }, [currentUserId])

  return { send, on, off, close }
}