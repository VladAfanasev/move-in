"use client"

import type { User } from "@supabase/supabase-js"
import { useCallback, useEffect, useState } from "react"
import { type RealTimeMessage, useRealTimeSession } from "@/hooks/use-real-time-session"

interface Property {
  id: string
  address: string
  city: string
  zipCode: string
  price: string
}

interface Group {
  id: string
  name: string
}

interface Member {
  userId: string
  fullName: string | null
  email: string | null
  role: "owner" | "admin" | "member"
  status: "pending" | "active" | "left" | "removed"
}

interface LiveSessionHeaderProps {
  property: Property
  group: Group
  members: Member[]
  currentUser: User
}

export function LiveSessionHeader({
  property,
  group,
  currentUser,
}: Omit<LiveSessionHeaderProps, "members">) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Handle real-time messages
  const handleRealTimeMessage = useCallback((message: RealTimeMessage) => {
    switch (message.type) {
      case "user-joined":
        console.log(`${message.userId} joined the session`)
        break
      case "user-left":
        console.log(`${message.userId} left the session`)
        break
    }
  }, [])

  // Real-time connection (only when sessionId is available)
  const realTime = useRealTimeSession({
    sessionId: sessionId || "no-session",
    userId: currentUser.id,
    onMessage: handleRealTimeMessage,
  })

  // Load session data from database
  const loadSession = useCallback(async () => {
    try {
      setLoading(true)

      // First, try to get existing session
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: group.id,
          propertyId: property.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSessionId(data.sessionId)

        // Get session details
        const sessionResponse = await fetch(`/api/sessions/${data.sessionId}`)
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json()

          // Set session start time from creation timestamp
          if (sessionData.createdAt) {
            const createdDate = new Date(sessionData.createdAt)
            const today = new Date()
            const isToday = createdDate.toDateString() === today.toDateString()

            if (isToday) {
              // Show only time if today
              setSessionStartTime(
                createdDate.toLocaleTimeString("nl-NL", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              )
            } else {
              // Show date and time if not today
              setSessionStartTime(
                createdDate.toLocaleString("nl-NL", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              )
            }
          }
        }
      } else {
        console.error("Failed to load session")
      }
    } catch (error) {
      console.error("Error loading session:", error)
    } finally {
      setLoading(false)
    }
  }, [group.id, property.id])

  // Load session on component mount
  useEffect(() => {
    loadSession()
  }, [loadSession])

  if (loading) {
    return (
      <div className="flex w-1/2 flex-col">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-3/4 rounded bg-green-200"></div>
            <div className="h-3 w-1/2 rounded bg-green-200"></div>
            <div className="h-3 w-1/3 rounded bg-green-200"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-1/2 flex-col">
      <div className="flex h-full flex-col p-6">
        <div className="flex flex-col justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`h-3 w-3 rounded-full ${
                realTime.isConnected ? "animate-pulse bg-green-500" : "bg-red-500"
              }`}
            />
            <h2 className="font-semibold text-green-800">
              Live Negotiation Session {!realTime.isConnected && "(Disconnected)"}
            </h2>
          </div>
          <p className="text-green-700 text-sm">
            Iedereen kan nu zijn investeerpercentage aanpassen. De sessie vergrendelt wanneer alle
            bevestigen en de totaal van 100% bereikt is.
          </p>
        </div>
        <div className="mt-auto text-right">
          {/* <div className="text-green-600 text-sm">

            {realTime.reconnectAttempts > 0 && (
              <span className="text-orange-600"> (reconnecting...)</span>
            )}
            {process.env.NODE_ENV === "development" && (
              <div className="text-gray-500 text-xs">
                Session: {sessionId || "loading..."} | Connected:{" "}
                {realTime.isConnected ? "✅" : "❌"}
              </div>
            )}
          </div> */}
          <div className="text-green-600 text-xs">
            Gestart op: {sessionStartTime || "Loading..."}
          </div>
        </div>
      </div>
    </div>
  )
}
