import type { Server as HTTPServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import { updateMemberSessionStatus } from "./cost-calculations"

let io: SocketIOServer | undefined

export const initSocketServer = (httpServer: HTTPServer) => {
  if (io) {
    return io
  }

  io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.NEXTAUTH_URL
          : ["http://localhost:3000", "http://localhost:3001"],
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", socket => {
    console.log("New client connected:", socket.id)

    // Join a specific negotiation session room
    socket.on("join-session", async (data: { sessionId: string; userId: string }) => {
      const { sessionId, userId } = data
      console.log(`Socket ${socket.id} (user ${userId}) joining session ${sessionId}`)

      socket.join(sessionId)

      // Update user's online status in database
      try {
        await updateMemberSessionStatus(sessionId, userId, { isOnline: true })
      } catch (error) {
        console.error("Error updating online status:", error)
      }

      // Broadcast to others in the room that a new user joined
      socket.to(sessionId).emit("user-joined", {
        userId,
        socketId: socket.id,
        timestamp: Date.now(),
      })

      // Send current online users to the newly joined user
      if (io) {
        const socketsInRoom = await io.in(sessionId).fetchSockets()
        const onlineUsers = socketsInRoom.map(s => s.data?.userId).filter(Boolean)
        socket.emit("online-users", onlineUsers)
      }
    })

    // Handle percentage updates
    socket.on(
      "percentage-update",
      async (data: {
        sessionId: string
        userId: string
        percentage: number
        status: "adjusting" | "confirmed"
      }) => {
        console.log(`Percentage update from ${socket.id}:`, data)

        // Update database
        try {
          await updateMemberSessionStatus(data.sessionId, data.userId, {
            currentPercentage: data.percentage,
            status: data.status,
            isOnline: true,
          })
        } catch (error) {
          console.error("Error updating percentage in database:", error)
        }

        // Broadcast to all other users in the session
        socket.to(data.sessionId).emit("percentage-update", {
          userId: data.userId,
          percentage: data.percentage,
          status: data.status,
          timestamp: Date.now(),
        })
      },
    )

    // Handle status changes (confirm/unconfirm)
    socket.on(
      "status-change",
      async (data: { sessionId: string; userId: string; status: "adjusting" | "confirmed" }) => {
        console.log(`Status change from ${socket.id}:`, data)

        // Update database
        try {
          await updateMemberSessionStatus(data.sessionId, data.userId, {
            status: data.status,
            isOnline: true,
          })
        } catch (error) {
          console.error("Error updating status in database:", error)
        }

        // Broadcast to all other users in the session
        socket.to(data.sessionId).emit("status-change", {
          userId: data.userId,
          status: data.status,
          timestamp: Date.now(),
        })
      },
    )

    // Handle user typing or active indicators
    socket.on(
      "user-activity",
      (data: { sessionId: string; userId: string; activity: "typing" | "adjusting" | "idle" }) => {
        socket.to(data.sessionId).emit("user-activity", {
          userId: data.userId,
          activity: data.activity,
          timestamp: Date.now(),
        })
      },
    )

    // Store user data on socket
    socket.on("set-user-data", (userData: { userId: string }) => {
      socket.data = userData
    })

    // Handle disconnection
    socket.on("disconnect", async () => {
      console.log("Client disconnected:", socket.id)

      if (socket.data?.userId) {
        // Find all rooms this socket was in and update offline status
        const rooms = Array.from(socket.rooms).filter(room => room !== socket.id)

        for (const sessionId of rooms) {
          try {
            await updateMemberSessionStatus(sessionId, socket.data.userId, { isOnline: false })
          } catch (error) {
            console.error("Error updating offline status:", error)
          }

          // Notify other users in the session
          socket.to(sessionId).emit("user-offline", {
            userId: socket.data.userId,
            socketId: socket.id,
            timestamp: Date.now(),
          })
        }
      }
    })

    // Leave session explicitly
    socket.on("leave-session", async (data: { sessionId: string; userId: string }) => {
      const { sessionId, userId } = data
      console.log(`Socket ${socket.id} leaving session ${sessionId}`)

      socket.leave(sessionId)

      // Update offline status in database
      try {
        await updateMemberSessionStatus(sessionId, userId, { isOnline: false })
      } catch (error) {
        console.error("Error updating offline status:", error)
      }

      socket.to(sessionId).emit("user-left", {
        userId,
        socketId: socket.id,
        timestamp: Date.now(),
      })
    })
  })

  return io
}

export const getSocketServer = () => {
  return io
}
