"use client"

import { Calendar, ExternalLink, Mail, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

interface PendingInvitation {
  id: string
  token: string
  group_id: string
  email: string
  role: string
  expires_at: string
  created_at: string
  buying_groups: {
    name: string
    description: string | null
    target_budget: string | null
  }
  profiles: {
    full_name: string | null
    email: string
  }
}

export function PendingInvitations() {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInvitations() {
      try {
        const supabase = createClient()

        // Get current user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          setLoading(false)
          return
        }

        // Fetch pending invitations for current user's email
        const { data, error } = await supabase
          .from("group_invitations")
          .select(`
            *,
            buying_groups!inner(name, description, target_budget),
            profiles!group_invitations_invited_by_fkey(full_name, email)
          `)
          .eq("email", user.email?.toLowerCase())
          .eq("status", "pending")
          .gte("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching invitations:", error)
          toast.error("Failed to load invitations")
        } else {
          setInvitations(data || [])
        }
      } catch (error) {
        console.error("Error fetching invitations:", error)
        toast.error("Failed to load invitations")
      } finally {
        setLoading(false)
      }
    }

    fetchInvitations()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Uitnodigingen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="mb-2 h-4 w-3/4 rounded bg-muted"></div>
            <div className="h-4 w-1/2 rounded bg-muted"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (invitations.length === 0) {
    return null // Don't show the card if there are no invitations
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Uitnodigingen ({invitations.length})
        </CardTitle>
        <CardDescription>Je hebt uitnodigingen voor koopgroepen</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {invitations.map(invitation => (
          <div
            key={invitation.id}
            className="flex items-start justify-between rounded-lg border p-4"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{invitation.buying_groups.name}</h4>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {invitation.role}
                </Badge>
              </div>

              {invitation.buying_groups.description && (
                <p className="text-muted-foreground text-sm">
                  {invitation.buying_groups.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-muted-foreground text-sm">
                <span>Van: {invitation.profiles.full_name || invitation.profiles.email}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Verloopt: {new Date(invitation.expires_at).toLocaleDateString("nl-NL")}
                </span>
              </div>

              {invitation.buying_groups.target_budget && (
                <p className="text-sm">
                  <span className="font-medium">Budget:</span> €
                  {Number(invitation.buying_groups.target_budget).toLocaleString()}
                </p>
              )}
            </div>

            <Button asChild size="sm">
              <a
                href={`/dashboard/groups/invite/${invitation.token}`}
                className="flex items-center gap-1"
              >
                Bekijken <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
