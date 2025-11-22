// Global connection manager for SSE
// In production, this should be replaced with Redis or another shared store

type Controller = ReadableStreamDefaultController<any>
type SessionConnections = Map<string, Controller>
type GlobalConnections = Map<string, SessionConnections>

// Use a global variable to persist connections across requests
const getConnections = (): GlobalConnections => {
  if (!(globalThis as any).__sse_connections) {
    ;(globalThis as any).__sse_connections = new Map()
  }
  return (globalThis as any).__sse_connections
}

export function addConnection(sessionId: string, userId: string, controller: Controller) {
  const connections = getConnections()

  if (!connections.has(sessionId)) {
    connections.set(sessionId, new Map())
  }

  connections.get(sessionId)!.set(userId, controller)
  console.log(`Added connection for user ${userId} in session ${sessionId}`)
}

export function removeConnection(sessionId: string, userId: string) {
  const connections = getConnections()
  const sessionConnections = connections.get(sessionId)

  if (sessionConnections) {
    sessionConnections.delete(userId)
    console.log(`Removed connection for user ${userId} in session ${sessionId}`)

    // Clean up empty session
    if (sessionConnections.size === 0) {
      connections.delete(sessionId)
      console.log(`Cleaned up empty session ${sessionId}`)
    }
  }
}

export function getOnlineUsers(sessionId: string): string[] {
  const connections = getConnections()
  const sessionConnections = connections.get(sessionId)

  if (!sessionConnections) return []

  return Array.from(sessionConnections.keys())
}

export function broadcastToSession(sessionId: string, message: any, excludeUserId?: string) {
  const connections = getConnections()
  const sessionConnections = connections.get(sessionId)

  if (!sessionConnections) {
    console.log(`No connections found for session ${sessionId}`)
    return
  }

  const data = JSON.stringify({
    ...message,
    timestamp: Date.now(),
  })

  const disconnectedUsers: string[] = []
  let sentCount = 0

  for (const [userId, controller] of sessionConnections) {
    if (excludeUserId && userId === excludeUserId) continue

    try {
      controller.enqueue(`data: ${data}\n\n`)
      sentCount++
    } catch (error) {
      console.log(`Failed to send to user ${userId}, marking for removal:`, error)
      disconnectedUsers.push(userId)
    }
  }

  // Clean up disconnected users
  disconnectedUsers.forEach(userId => {
    sessionConnections.delete(userId)
  })

  // Clean up empty session
  if (sessionConnections.size === 0) {
    connections.delete(sessionId)
  }

  console.log(`Broadcasted ${message.type} to ${sentCount} users in session ${sessionId}`)
}

export function notifyUserJoined(sessionId: string, userId: string) {
  broadcastToSession(
    sessionId,
    {
      type: "user-joined",
      userId,
    },
    userId,
  ) // Exclude the user who just joined
}

export function notifyUserLeft(sessionId: string, userId: string) {
  broadcastToSession(
    sessionId,
    {
      type: "user-left",
      userId,
    },
    userId,
  ) // Exclude the user who left
}

export function getConnectionCount(sessionId?: string): number {
  const connections = getConnections()

  if (sessionId) {
    return connections.get(sessionId)?.size || 0
  }

  // Count total connections across all sessions
  let total = 0
  for (const sessionConnections of connections.values()) {
    total += sessionConnections.size
  }
  return total
}
