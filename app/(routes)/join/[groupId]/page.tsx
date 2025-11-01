import { Building2, Euro, MapPin, Users } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { JoinGroupClient } from "@/app/features/join/components/join-group-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import type { GroupMemberWithProfile } from "@/lib/types"

interface JoinGroupPageProps {
  params: Promise<{
    groupId: string
  }>
}

export default async function JoinGroupPage({ params }: JoinGroupPageProps) {
  const { groupId } = await params
  const supabase = await createClient()

  // Dynamic imports to avoid build-time database connection
  const { getGroupById, getGroupMembers } = await import("@/lib/groups")
  
  // Get group details
  const [group, members] = await Promise.all([getGroupById(groupId), getGroupMembers(groupId)])

  if (!group) {
    notFound()
  }

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is authenticated, check if already member
  if (user) {
    const userMember = members.find((member: GroupMemberWithProfile) => member.userId === user.id)
    if (userMember && userMember.status === "active") {
      redirect(`/dashboard/groups/${groupId}`)
    }
  }

  const activeMemberCount = members.filter((m: GroupMemberWithProfile) => m.status === "active").length

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <JoinGroupClient groupId={groupId} groupName={group.name} />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Users className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">Je bent uitgenodigd!</CardTitle>
          <CardDescription>Kom bij deze koopgroep om samen een huis te kopen</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Group Info */}
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="font-semibold text-lg">{group.name}</h2>
              {group.description && (
                <p className="mt-1 text-muted-foreground text-sm">{group.description}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <Users className="h-4 w-4" />
                <span>
                  {activeMemberCount} {activeMemberCount === 1 ? "lid" : "leden"}
                </span>
                {group.maxMembers && <span>/ {group.maxMembers}</span>}
              </div>

              {group.targetLocation && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{group.targetLocation}</span>
                </div>
              )}

              {group.targetBudget && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                  <Euro className="h-4 w-4" />
                  <span>€{Number(group.targetBudget).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Join Actions */}
          <div className="space-y-3">
            {user ? (
              // User is logged in but not a member
              <form action={`/join/${groupId}/confirm`} method="post">
                <Button type="submit" className="w-full">
                  Lid worden van deze groep
                </Button>
              </form>
            ) : (
              // User not logged in
              <>
                <Button asChild className="w-full">
                  <Link href={`/login?returnTo=/join/${groupId}`}>Inloggen en lid worden</Link>
                </Button>

                <Button asChild variant="outline" className="w-full">
                  <Link href={`/register?returnTo=/join/${groupId}`}>
                    Account aanmaken en lid worden
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* App Info */}
          <div className="border-t pt-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Move-in</span>
            </div>
            <p className="text-muted-foreground text-xs">
              Platform voor gezamenlijke huizenaankoop
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
