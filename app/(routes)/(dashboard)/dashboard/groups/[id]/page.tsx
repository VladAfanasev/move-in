import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { getGroupById, getGroupInvitations, getGroupMembers } from "@/lib/groups"
import { createClient } from "@/lib/supabase/server"
import { updateGroupDetailsAction } from "./actions"
import { EditableText } from "./components/editable-text"
import { GroupActionsMenu } from "./components/group-actions-menu"
import { GroupMembers } from "./components/group-members"
import { InviteMemberDialog } from "./components/invite-member-dialog"

interface GroupDetailPageProps {
  params: Promise<{
    id: string
  }>
}

const GroupDetailPage = async ({ params }: GroupDetailPageProps) => {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const [group, members, invitations] = await Promise.all([
    getGroupById(id),
    getGroupMembers(id),
    getGroupInvitations(id),
  ])

  if (!group) {
    notFound()
  }

  // Check if user is a member of this group
  const userMember = members.find(member => member.userId === user.id)
  if (!userMember || userMember.status !== "active") {
    redirect("/dashboard/groups")
  }

  const canEdit = userMember.role === "owner" || userMember.role === "admin"

  const updateGroupName = async (name: string) => {
    "use server"
    await updateGroupDetailsAction(id, { name })
  }

  const updateGroupDescription = async (description: string) => {
    "use server"
    await updateGroupDetailsAction(id, { description })
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader
        title={group.name}
        backButton={
          <Link href="/dashboard/groups">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar groepen
            </Button>
          </Link>
        }
      />

      <div className="@container/main flex flex-1 flex-col p-6">
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <EditableText
                value={group.name}
                onSave={updateGroupName}
                placeholder="Groepsnaam"
                className="font-bold text-2xl"
                disabled={!canEdit}
                maxLength={100}
              />
              <div className="mt-2">
                <EditableText
                  value={group.description}
                  onSave={updateGroupDescription}
                  placeholder="Voeg een beschrijving toe..."
                  className="text-muted-foreground"
                  disabled={!canEdit}
                  multiline
                  maxLength={500}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-muted-foreground text-sm">
                {group.targetBudget && (
                  <span>Budget: €{Number(group.targetBudget).toLocaleString()}</span>
                )}
                {group.targetLocation && <span>Locatie: {group.targetLocation}</span>}
              </div>
            </div>

            {(userMember.role === "owner" || userMember.role === "admin") && (
              <div className="flex gap-2">
                <InviteMemberDialog groupId={group.id}>
                  <Button variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Lid uitnodigen
                  </Button>
                </InviteMemberDialog>
                <GroupActionsMenu
                  groupId={group.id}
                  groupName={group.name}
                  userRole={userMember.role}
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <GroupMembers
            members={members}
            invitations={invitations}
            currentUserRole={userMember.role}
            groupId={group.id}
          />
        </div>
      </div>
    </div>
  )
}

export default GroupDetailPage
