"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRealTimeSession } from "@/hooks/use-real-time-session"

export default function TestRealTimePage() {
  const [sessionId, setSessionId] = useState("test-session-123")
  const [userId, setUserId] = useState(`user-${Math.random().toString(36).substr(2, 9)}`)
  const [messages, setMessages] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const realTime = useRealTimeSession({
    sessionId,
    userId,
    onMessage: message => {
      console.log("Received message:", message)
      setMessages(prev => [...prev, { ...message, receivedAt: new Date().toISOString() }])
    },
  })

  // Listen for connection errors
  window.addEventListener("error", e => {
    if (e.message.includes("SSE")) {
      setErrors(prev => [...prev, `${new Date().toISOString()}: ${e.message}`])
    }
  })

  const sendTestMessage = () => {
    realTime.send({
      type: "percentage-update",
      sessionId,
      userId,
      percentage: Math.floor(Math.random() * 100),
      status: "adjusting",
    })
  }

  const sendStatusChange = () => {
    realTime.send({
      type: "status-change",
      sessionId,
      userId,
      status: Math.random() > 0.5 ? "confirmed" : "adjusting",
    })
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Real-Time Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium text-sm">Session ID</label>
              <Input
                value={sessionId}
                onChange={e => setSessionId(e.target.value)}
                placeholder="Session ID"
              />
            </div>
            <div>
              <label className="font-medium text-sm">User ID</label>
              <Input
                value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder="User ID"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div
              className={`h-3 w-3 rounded-full ${realTime.isConnected ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-sm">
              {realTime.isConnected ? "Connected" : "Disconnected"}
              {realTime.reconnectAttempts > 0 &&
                ` (Reconnect attempts: ${realTime.reconnectAttempts})`}
            </span>
          </div>

          <div>
            <p className="font-medium text-sm">Online Users ({realTime.onlineUsers.length}):</p>
            <p className="text-gray-600 text-sm">{realTime.onlineUsers.join(", ") || "None"}</p>
          </div>

          <div className="flex space-x-2">
            <Button onClick={sendTestMessage} disabled={!realTime.isConnected}>
              Send Percentage Update
            </Button>
            <Button onClick={sendStatusChange} disabled={!realTime.isConnected}>
              Send Status Change
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Received Messages ({messages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {messages.map((message, index) => (
              <div key={index} className="rounded bg-gray-50 p-2 text-sm">
                <div className="font-mono">
                  <strong>{message.type}</strong>
                  {message.userId && ` from ${message.userId}`}
                </div>
                <pre className="mt-1 text-xs">{JSON.stringify(message, null, 2)}</pre>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
