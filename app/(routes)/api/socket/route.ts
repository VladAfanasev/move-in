import type { Server as NetServer } from "http"
import type { NextRequest } from "next/server"
import { Server as SocketIOServer } from "socket.io"

// Global socket server instance
let io: SocketIOServer | undefined

export async function GET(req: NextRequest) {
  if (!io) {
    console.log("*First use, starting socket.io server")

    // Get the server from the request
    const httpServer: NetServer = (req as { socket?: { server?: NetServer } }).socket
      ?.server as NetServer

    if (!httpServer) {
      return new Response("Socket server not available", { status: 500 })
    }

    io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
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
      socket.on("join-session", (sessionId: string) => {
        console.log(`Socket ${socket.id} joining session ${sessionId}`)
        socket.join(sessionId)

        // Broadcast to others in the room that a new user joined
        socket.to(sessionId).emit("user-joined", {
          userId: socket.handshake.query.userId,
          socketId: socket.id,
        })
      })

      // Handle percentage updates
      socket.on("percentage-update", data => {
        console.log(`Percentage update from ${socket.id}:`, data)

        // Broadcast to all other users in the session
        socket.to(data.sessionId).emit("percentage-update", {
          userId: data.userId,
          percentage: data.percentage,
          status: data.status,
          timestamp: Date.now(),
        })
      })

      // Handle status changes (confirm/unconfirm)
      socket.on("status-change", data => {
        console.log(`Status change from ${socket.id}:`, data)

        // Broadcast to all other users in the session
        socket.to(data.sessionId).emit("status-change", {
          userId: data.userId,
          status: data.status,
          timestamp: Date.now(),
        })
      })

      // Handle user online status
      socket.on("user-online", data => {
        socket.to(data.sessionId).emit("user-online", {
          userId: data.userId,
          isOnline: true,
        })
      })

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id)

        // Notify all rooms this user was in that they went offline
        const rooms = Array.from(socket.rooms).filter(room => room !== socket.id)
        rooms.forEach(room => {
          socket.to(room).emit("user-offline", {
            userId: socket.handshake.query.userId,
            socketId: socket.id,
          })
        })
      })

      // Leave session
      socket.on("leave-session", (sessionId: string) => {
        console.log(`Socket ${socket.id} leaving session ${sessionId}`)
        socket.leave(sessionId)

        socket.to(sessionId).emit("user-left", {
          userId: socket.handshake.query.userId,
          socketId: socket.id,
        })
      })
    })
  }

  return new Response("Socket.IO server running", { status: 200 })
}
