import { eq } from "drizzle-orm"
import { CheckCircle, Clock, XCircle } from "lucide-react"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/db/client"
import { buyingGroups, groupInvitations, profiles } from "@/db/schema"
import { createClient } from "@/lib/supabase/server"
import { acceptInvitationAction } from "../../[id]/invite-actions"

interface InvitePageProps {
  params: {
    token: string
  }
}

async function getInvitationDetails(token: string) {
  try {
    const invitation = await db
      .select({
        id: groupInvitations.id,
        groupId: groupInvitations.groupId,
        email: groupInvitations.email,
        token: groupInvitations.token,
        role: groupInvitations.role,
        status: groupInvitations.status,
        expiresAt: groupInvitations.expiresAt,
        acceptedAt: groupInvitations.acceptedAt,
        createdAt: groupInvitations.createdAt,
        buyingGroups: {
          name: buyingGroups.name,
          description: buyingGroups.description,
          targetBudget: buyingGroups.targetBudget,
        },
        profiles: {
          fullName: profiles.fullName,
          email: profiles.email,
        },
      })
      .from(groupInvitations)
      .innerJoin(buyingGroups, eq(groupInvitations.groupId, buyingGroups.id))
      .innerJoin(profiles, eq(groupInvitations.invitedBy, profiles.id))
      .where(eq(groupInvitations.token, token))
      .limit(1)

    return invitation[0] || null
  } catch (error) {
    console.error("Error fetching invitation details:", error)
    return null
  }
}

async function InviteAcceptForm({ token }: { token: string }) {
  async function handleAccept() {
    "use server"
    const result = await acceptInvitationAction(token)
    redirect(`/dashboard/groups/${result.groupId}`)
  }

  return (
    <form action={handleAccept}>
      <Button type="submit" className="w-full">
        Uitnodiging accepteren
      </Button>
    </form>
  )
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = params
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?returnTo=/dashboard/groups/invite/${token}`)
  }

  const invitation = await getInvitationDetails(token)

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <CardTitle>Ongeldige uitnodiging</CardTitle>
            <CardDescription>Deze uitnodiging is ongeldig of verlopen</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/dashboard">Naar dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if invitation has expired
  const isExpired = new Date(invitation.expiresAt) < new Date()
  const isAccepted = invitation.status === "accepted"

  // Check if user's email matches invitation email
  const emailMatches = user.email?.toLowerCase() === invitation.email.toLowerCase()

  if (isAccepted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <CardTitle>Uitnodiging geaccepteerd</CardTitle>
            <CardDescription>Je bent al lid van deze groep</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={`/dashboard/groups/${invitation.groupId}`}>Naar groep</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Clock className="mx-auto h-12 w-12 text-orange-500" />
            <CardTitle>Uitnodiging verlopen</CardTitle>
            <CardDescription>
              Deze uitnodiging is verlopen. Vraag om een nieuwe uitnodiging.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/dashboard">Naar dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!emailMatches) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <CardTitle>E-mailadres komt niet overeen</CardTitle>
            <CardDescription>
              Deze uitnodiging werd verstuurd naar {invitation.email}. Je bent ingelogd als{" "}
              {user.email}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground text-sm">
              Log in met het juiste e-mailadres om deze uitnodiging te accepteren.
            </p>
            <Button asChild className="w-full">
              <a href="/login">Inloggen met ander account</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Uitnodiging voor koopgroep</CardTitle>
          <CardDescription>Je bent uitgenodigd om lid te worden van een koopgroep</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">{invitation.buyingGroups.name}</h3>
            {invitation.buyingGroups.description && (
              <p className="text-muted-foreground text-sm">{invitation.buyingGroups.description}</p>
            )}
            {invitation.buyingGroups.targetBudget && (
              <p className="text-sm">
                <span className="font-medium">Budget:</span> €
                {Number(invitation.buyingGroups.targetBudget).toLocaleString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              Uitgenodigd door: {invitation.profiles.fullName || invitation.profiles.email}
            </p>
            <p className="text-muted-foreground text-sm">
              Uitnodiging verloopt op: {new Date(invitation.expiresAt).toLocaleDateString("nl-NL")}
            </p>
          </div>

          <InviteAcceptForm token={token} />

          <Button variant="outline" asChild className="w-full">
            <a href="/dashboard">Naar dashboard</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
