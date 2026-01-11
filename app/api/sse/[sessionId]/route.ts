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

  console.log(`🔌 SSE connection request - Session: ${sessionId}, User: ${userId}`)

  if (!userId) {
    console.error("❌ SSE request missing userId")
    return new Response("Missing userId", { status: 400 })
  }

  // Verify user authentication (skip for test sessions)
  if (!sessionId.includes("test")) {
    try {
      const supabase = await createClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      console.log(
        `🔐 SSE auth check - userId param: ${userId}, auth user: ${user?.id}, error: ${authError?.message}`,
      )

      if (authError) {
        console.error("SSE auth error:", authError.message)
        return new Response(`Auth error: ${authError.message}`, { status: 401 })
      }

      if (!user) {
        console.error("SSE: No authenticated user found")
        return new Response("Not authenticated", { status: 401 })
      }

      if (user.id !== userId) {
        console.error(`SSE: User ID mismatch - param: ${userId}, auth: ${user.id}`)
        return new Response("User ID mismatch", { status: 401 })
      }
    } catch (error) {
      console.error("SSE Authentication error:", error)
      return new Response("Authentication error", { status: 401 })
    }
  }

  // Track heartbeat interval for cleanup
  let heartbeatInterval: NodeJS.Timeout | null = null

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      try {
        // Create cleanup function for heartbeat
        const cleanup = () => {
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval)
            heartbeatInterval = null
          }
        }

        // Add this user's controller to the session with cleanup
        addConnection(sessionId, userId, controller, cleanup)

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
        heartbeatInterval = setInterval(() => {
          try {
            const heartbeat = JSON.stringify({
              type: "heartbeat",
              timestamp: Date.now(),
            })
            controller.enqueue(`data: ${heartbeat}\n\n`)
          } catch {
            // Controller closed, clean up
            cleanup()
          }
        }, 120000) // Every 2 minutes

        // Notify other users in the session that this user joined
        notifyUserJoined(sessionId, userId)

        console.log(`SSE connection established for user ${userId} in session ${sessionId}`)
      } catch (error) {
        console.error("Error in SSE start:", error)
        controller.error(error)
      }
    },

    cancel() {
      try {
        // Remove user from session when they disconnect (also calls cleanup)
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
