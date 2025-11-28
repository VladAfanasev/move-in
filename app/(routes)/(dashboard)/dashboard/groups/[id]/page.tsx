import { ArrowLeft, Users } from "lucide-react"
import { revalidatePath } from "next/cache"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { updateGroupDetailsAction } from "@/actions/groups/management"
import { EditableText } from "@/app/features/groups/components/editable-text"
import { GroupActionsMenu } from "@/app/features/groups/components/group-actions-menu"
import { InviteMemberPopover } from "@/app/features/groups/components/invite-member-popover"
import { GroupPropertiesSection } from "@/components/group-properties-section"
import { MemberAvatarStack } from "@/components/member-avatar-stack"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import type { GroupMemberWithProfile } from "@/lib/types"

// Force dynamic rendering to prevent build-time prerendering
export const dynamic = "force-dynamic"

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

  // Dynamic imports to avoid build-time database connection
  const { getGroupById, getGroupMembers, getGroupPropertiesWithDetails } = await import(
    "@/lib/groups"
  )

  const [group, members, groupProperties] = await Promise.all([
    getGroupById(id),
    getGroupMembers(id),
    getGroupPropertiesWithDetails(id),
  ])

  if (!group) {
    notFound()
  }

  // Check if user is a member of this group
  const userMember = members.find((member: GroupMemberWithProfile) => member.userId === user.id)
  if (!userMember || userMember.status !== "active") {
    redirect("/dashboard/groups")
  }

  const canEdit = userMember.role === "owner" || userMember.role === "admin"

  // Calculate member info for leave group functionality
  const activeMembers = members.filter((m: GroupMemberWithProfile) => m.status === "active")
  const totalActiveMembers = activeMembers.length
  const isLastMember = totalActiveMembers === 1

  const updateGroupName = async (name: string) => {
    "use server"
    await updateGroupDetailsAction(id, { name })
  }

  const handleMemberUpdate = async () => {
    "use server"
    revalidatePath(`/dashboard/groups/${id}`)
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
              {/* <div className="mt-2">
                <EditableText
                  value={group.description}
                  onSave={updateGroupDescription}
                  placeholder="Voeg een beschrijving toe..."
                  className="text-muted-foreground"
                  disabled={!canEdit}
                  multiline
                  maxLength={500}
                />
              </div> */}
              <div className="mt-4 flex flex-wrap gap-4 text-muted-foreground text-sm">
                {group.targetBudget && (
                  <span>Budget: €{Number(group.targetBudget).toLocaleString()}</span>
                )}
                {group.targetLocation && <span>Locatie: {group.targetLocation}</span>}
              </div>
            </div>

            <div className="flex gap-2">
              <MemberAvatarStack
                members={members}
                maxVisible={4}
                size="sm"
                currentUserRole={userMember.role}
                groupId={group.id}
                onMemberUpdate={handleMemberUpdate}
              />

              <InviteMemberPopover groupId={group.id} groupName={group.name}>
                <Button variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Lid uitnodigen
                </Button>
              </InviteMemberPopover>

              <GroupActionsMenu
                groupId={group.id}
                groupName={group.name}
                userRole={userMember.role}
                isLastMember={isLastMember}
                totalMembers={totalActiveMembers}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <GroupPropertiesSection
            groupProperties={groupProperties}
            members={members}
            groupId={group.id}
          />
        </div>
      </div>
    </div>
  )
}

export default GroupDetailPage
