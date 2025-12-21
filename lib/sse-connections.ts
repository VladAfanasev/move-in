// Global connection manager for SSE
// In production, this should be replaced with Redis or another shared store

type MessageData = {
  type: string
  userId?: string
  percentage?: number
  status?: string
  users?: string[]
  timestamp?: number
  sessionId?: string
  lockedBy?: string
}

type Controller = ReadableStreamDefaultController<string>
type SessionConnections = Map<string, Controller>
type GlobalConnections = Map<string, SessionConnections>

// Use a global variable to persist connections across requests
const getConnections = (): GlobalConnections => {
  const global = globalThis as {
    __sse_connections?: GlobalConnections
  }
  if (!global.__sse_connections) {
    global.__sse_connections = new Map()
  }
  return global.__sse_connections
}

export function addConnection(sessionId: string, userId: string, controller: Controller) {
  const connections = getConnections()

  if (!connections.has(sessionId)) {
    connections.set(sessionId, new Map())
  }

  const sessionConnections = connections.get(sessionId)
  if (sessionConnections) {
    sessionConnections.set(userId, controller)
  }
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

export function broadcastToSession(
  sessionId: string,
  message: MessageData,
  excludeUserId?: string,
) {
  const connections = getConnections()
  const sessionConnections = connections.get(sessionId)

  if (!sessionConnections) {
    console.log(`No connections found for session ${sessionId}`)
    return { success: false, error: "No connections found", sentCount: 0 }
  }

  const data = JSON.stringify({
    ...message,
    timestamp: Date.now(),
  })

  const disconnectedUsers: string[] = []
  const failedUsers: string[] = []
  let sentCount = 0

  for (const [userId, controller] of sessionConnections) {
    if (excludeUserId && userId === excludeUserId) continue

    try {
      // Check if controller is still valid
      if (controller.desiredSize === null) {
        console.log(`Controller for user ${userId} is closed, marking for removal`)
        disconnectedUsers.push(userId)
        continue
      }

      controller.enqueue(`data: ${data}\n\n`)
      sentCount++
    } catch (error) {
      console.log(`Failed to send to user ${userId}, marking for removal:`, error)
      disconnectedUsers.push(userId)
      failedUsers.push(userId)
    }
  }

  // Clean up disconnected users
  disconnectedUsers.forEach(userId => {
    sessionConnections.delete(userId)
    console.log(`Removed disconnected user ${userId} from session ${sessionId}`)
  })

  // Clean up empty session
  if (sessionConnections.size === 0) {
    connections.delete(sessionId)
    console.log(`Cleaned up empty session ${sessionId}`)
  }

  const result = {
    success: sentCount > 0 || sessionConnections.size === 0, // Success if we sent to someone or no one is connected
    sentCount,
    totalConnections: sessionConnections.size + disconnectedUsers.length,
    disconnectedUsers,
    failedUsers,
  }

  console.log(`Broadcasted ${message.type} to ${sentCount} users in session ${sessionId}`, result)

  return result
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

  // Broadcast updated online users list to all connections
  const onlineUsers = getOnlineUsers(sessionId)
  broadcastToSession(sessionId, {
    type: "online-users",
    users: onlineUsers,
  })
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

  // Broadcast updated online users list to all connections
  const onlineUsers = getOnlineUsers(sessionId)
  broadcastToSession(sessionId, {
    type: "online-users",
    users: onlineUsers,
  })
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
