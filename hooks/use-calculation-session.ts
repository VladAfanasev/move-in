"use client"

import { useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { toast } from "sonner"

interface SessionMember {
  userId: string
  name: string
  percentage: number
  status: "adjusting" | "confirmed"
  isOnline?: boolean
}

interface UseCalculationSessionProps {
  sessionId: string
  userId: string
  userName: string
  groupId: string
  propertyId: string
}

export function useCalculationSession({
  sessionId,
  userId,
  userName,
  groupId,
  propertyId,
}: UseCalculationSessionProps) {
  const [socket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineMembers, setOnlineMembers] = useState<string[]>([])
  const [sessionMembers] = useState<SessionMember[]>([])
  const isInitializedRef = useRef(false)

  // Initialize socket connection
  useEffect(() => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    // Temporarily disabled socket connection due to Next.js limitations
    // TODO: Implement socket.io server in a separate process or use different real-time solution
    console.log("Socket connection temporarily disabled")
    setIsConnected(false)

    // Mock some initial data
    setOnlineMembers([userId])

    return () => {
      // cleanup
    }

    /*
    const socketInstance = io({
      path: "/api/socket",
      query: {
        userId,
        userName,
      },
    })

    socketInstance.on("connect", () => {
      console.log("Connected to socket server:", socketInstance.id)
      setIsConnected(true)
      
      // Join the calculation session
      socketInstance.emit("join-session", { sessionId, userId })
      
      // Emit user online status
      socketInstance.emit("user-online", { sessionId, userId, userName })
    })

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from socket server")
      setIsConnected(false)
    })

    // Listen for other users joining
    socketInstance.on("user-joined", (data: { userId: string; userName?: string }) => {
      console.log("User joined:", data)
      
      if (data.userId !== userId && data.userName) {
        toast.success(`${data.userName} is nu lid van deze groep`)
      }
    })

    // Listen for users going online
    socketInstance.on("user-online", (data: { userId: string; userName?: string }) => {
      console.log("User came online:", data)
      setOnlineMembers(prev => [...new Set([...prev, data.userId])])
      
      if (data.userId !== userId && data.userName) {
        toast.info(`${data.userName} is nu online`)
      }
    })

    // Listen for users going offline
    socketInstance.on("user-offline", (data: { userId: string; userName?: string }) => {
      console.log("User went offline:", data)
      setOnlineMembers(prev => prev.filter(id => id !== data.userId))
      
      if (data.userId !== userId && data.userName) {
        toast.info(`${data.userName} is offline gegaan`)
      }
    })

    // Listen for percentage updates
    socketInstance.on("percentage-update", (data: { 
      userId: string 
      percentage: number 
      status: "adjusting" | "confirmed"
    }) => {
      console.log("Percentage update:", data)
      
      setSessionMembers(prev => 
        prev.map(member => 
          member.userId === data.userId 
            ? { ...member, percentage: data.percentage, status: data.status }
            : member
        )
      )
    })

    // Listen for status changes
    socketInstance.on("status-change", (data: { 
      userId: string 
      status: "adjusting" | "confirmed" 
    }) => {
      console.log("Status change:", data)
      
      setSessionMembers(prev => 
        prev.map(member => 
          member.userId === data.userId 
            ? { ...member, status: data.status }
            : member
        )
      )
    })

    // Listen for online users list
    socketInstance.on("online-users", (userIds: string[]) => {
      console.log("Online users:", userIds)
      setOnlineMembers(userIds)
    })

    // Listen for join requests (for group owners)
    socketInstance.on("join-request", (data: { 
      userId: string 
      userName: string 
      groupId: string 
      propertyId: string 
    }) => {
      console.log("Join request received:", data)
      
      if (data.groupId === groupId && data.propertyId === propertyId) {
        toast.info(`${data.userName} wil lid worden van deze groep`, {
          duration: 10000,
          action: {
            label: "Beheren",
            onClick: () => window.open(`/dashboard/groups/${groupId}`, '_blank')
          }
        })
      }
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
    */
  }, [userId])

  const emitPercentageUpdate = (percentage: number, status: "adjusting" | "confirmed") => {
    if (socket && isConnected) {
      socket.emit("percentage-update", {
        sessionId,
        userId,
        percentage,
        status,
      })
    } else {
      // Mock functionality when socket is disabled
      console.log("Mock emit percentage update:", { percentage, status })
    }
  }

  const emitStatusChange = (status: "adjusting" | "confirmed") => {
    if (socket && isConnected) {
      socket.emit("status-change", {
        sessionId,
        userId,
        status,
      })
    } else {
      // Mock functionality when socket is disabled
      console.log("Mock emit status change:", { status })
    }
  }

  const getOnlineMemberCount = () => {
    return onlineMembers.length
  }

  return {
    socket,
    isConnected,
    onlineMembers,
    sessionMembers,
    emitPercentageUpdate,
    emitStatusChange,
    getOnlineMemberCount,
  }
}
