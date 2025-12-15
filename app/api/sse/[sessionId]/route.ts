import {
  addConnection,
  getOnlineUsers,
  notifyUserJoined,
  notifyUserLeft,
  removeConnection,
} from "@/lib/sse-connections"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params
  const url = new URL(request.url)
  const userId = url.searchParams.get("userId")

  if (!userId) {
    return new Response("Missing userId", { status: 400 })
  }

  // Verify user authentication (skip for test sessions)
  if (!sessionId.includes("test")) {
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || user.id !== userId) {
        return new Response("Unauthorized", { status: 401 })
      }
    } catch (error) {
      console.error("SSE Authentication error:", error)
      return new Response("Authentication error", { status: 401 })
    }
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      try {
        // Add this user's controller to the session
        addConnection(sessionId, userId, controller)

        // Send initial connection message
        const data = JSON.stringify({
          type: "connected",
          userId,
          timestamp: Date.now(),
        })
        controller.enqueue(`data: ${data}\n\n`)

        // Send list of currently online users
        const onlineUsers = getOnlineUsers(sessionId)
        const onlineData = JSON.stringify({
          type: "online-users",
          users: onlineUsers,
          timestamp: Date.now(),
        })
        controller.enqueue(`data: ${onlineData}\n\n`)

        // Send periodic heartbeat to maintain connection health
        const heartbeatInterval = setInterval(() => {
          try {
            const heartbeat = JSON.stringify({
              type: "heartbeat",
              timestamp: Date.now(),
            })
            controller.enqueue(`data: ${heartbeat}\n\n`)
          } catch (error) {
            console.error("Heartbeat error:", error)
            clearInterval(heartbeatInterval)
          }
        }, 30000) // Every 30 seconds

        // Notify other users in the session that this user joined
        notifyUserJoined(sessionId, userId)

        console.log(`SSE connection established for user ${userId} in session ${sessionId}`)

        // Store heartbeat interval for cleanup
        const cleanup = () => {
          clearInterval(heartbeatInterval)
        }
        return cleanup
      } catch (error) {
        console.error("Error in SSE start:", error)
        controller.error(error)
      }
    },

    cancel() {
      try {
        // Remove user from session when they disconnect
        removeConnection(sessionId, userId)

        // Notify other users that this user left
        notifyUserLeft(sessionId, userId)

        console.log(`SSE connection closed for user ${userId} in session ${sessionId}`)
      } catch (error) {
        console.error("Error in SSE cancel:", error)
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  })
}
