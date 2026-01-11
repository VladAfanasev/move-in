"use client"

import { Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useId, useState } from "react"
import { toast } from "sonner"
import { createJoinRequestAction } from "@/actions/groups/join-request"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface JoinRequestFormProps {
  groupId: string
  groupName: string
}

export function JoinRequestForm({ groupId, groupName }: JoinRequestFormProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()
  const messageId = useId()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createJoinRequestAction(groupId, message.trim() || undefined)
      if (result.success) {
        setSubmitted(true)
        toast.success("Verzoek verstuurd!")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Er is een fout opgetreden"
      toast.error(errorMessage)
      console.error("Error creating join request:", error)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Users className="h-5 w-5" />
            Verzoek verstuurd!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-green-800">
              Je verzoek om lid te worden van <strong>{groupName}</strong> is verstuurd naar de
              groepsbeheerders.
            </p>
            <p className="mt-2 text-green-700 text-sm">
              Je ontvangt een e-mail zodra je verzoek is goedgekeurd of afgewezen.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/dashboard")} className="flex-1">
              Terug naar dashboard
            </Button>
            <Button
              onClick={() => router.push("/dashboard/groups")}
              variant="outline"
              className="flex-1"
            >
              Bekijk mijn groepen
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Verzoek om lid te worden
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={messageId}>Bericht (optioneel)</Label>
            <Textarea
              id={messageId}
              placeholder="Vertel waarom je lid wilt worden van deze groep..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-muted-foreground text-xs">{message.length}/500 karakters</p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Versturen..." : "Verstuur verzoek"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
