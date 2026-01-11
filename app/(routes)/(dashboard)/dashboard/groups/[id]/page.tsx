import { ArrowLeft, Users } from "lucide-react"
import { revalidatePath } from "next/cache"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { updateGroupDetailsAction } from "@/actions/groups/management"
import { EditableText } from "@/app/features/groups/components/editable-text"
import { GroupActionsMenu } from "@/app/features/groups/components/group-actions-menu"
import { GroupPropertiesSection } from "@/app/features/groups/components/group-properties-section"
import { InviteMemberPopover } from "@/app/features/groups/components/invite-member-popover"
import { MemberAvatarStack } from "@/app/features/groups/components/member-avatar-stack"
import { NoAccessGroupView } from "@/app/features/groups/components/no-access-group-view"
import { PendingGroupView } from "@/app/features/groups/components/pending-group-view"
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
  searchParams: Promise<{
    joined?: string
  }>
}

const GroupDetailPage = async ({ params, searchParams }: GroupDetailPageProps) => {
  const { id } = await params
  const { joined } = await searchParams

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
  const { db } = await import("@/db/client")
  const { groupJoinRequests } = await import("@/db/schema")
  const { and, eq } = await import("drizzle-orm")

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

  // If user is not an active member, handle different scenarios
  if (!userMember || userMember.status !== "active") {
    const activeMemberCount = members.filter(
      (m: GroupMemberWithProfile) => m.status === "active",
    ).length

    // If user was removed from the group, show no-access view
    if (userMember && userMember.status === "removed") {
      // Check if user has a pending rejoin request
      const pendingRequest = await db
        .select()
        .from(groupJoinRequests)
        .where(
          and(
            eq(groupJoinRequests.groupId, id),
            eq(groupJoinRequests.userId, user.id),
            eq(groupJoinRequests.status, "pending"),
          ),
        )
        .limit(1)

      // If user has a pending request, show the pending view instead
      if (pendingRequest.length > 0) {
        return (
          <PendingGroupView
            groupName={group.name}
            groupDescription={group.description}
            targetBudget={group.targetBudget}
            targetLocation={group.targetLocation}
            memberCount={activeMemberCount}
            maxMembers={group.maxMembers}
            showJoinedAlert={joined === "pending"}
          />
        )
      }

      // Show no-access view for removed users
      return (
        <NoAccessGroupView
          groupId={id}
          groupName={group.name}
          groupDescription={group.description}
          targetBudget={group.targetBudget}
          targetLocation={group.targetLocation}
          memberCount={activeMemberCount}
          maxMembers={group.maxMembers}
        />
      )
    }

    // For users with pending status or pending join requests
    const pendingRequest = await db
      .select()
      .from(groupJoinRequests)
      .where(
        and(
          eq(groupJoinRequests.groupId, id),
          eq(groupJoinRequests.userId, user.id),
          eq(groupJoinRequests.status, "pending"),
        ),
      )
      .limit(1)

    // If user has a pending request, show the pending view
    if (pendingRequest.length > 0 || (userMember && userMember.status === "pending")) {
      return (
        <PendingGroupView
          groupName={group.name}
          groupDescription={group.description}
          targetBudget={group.targetBudget}
          targetLocation={group.targetLocation}
          memberCount={activeMemberCount}
          maxMembers={group.maxMembers}
          showJoinedAlert={joined === "pending"}
        />
      )
    }

    // If no relationship with group, redirect to groups page
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
        title={`Groep: ${group.name}`}
        backButton={
          <Link href="/dashboard/groups">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar groepen
            </Button>
          </Link>
        }
      />

      <div className="@container/main flex flex-1 flex-col p-4 sm:p-6">
        <div className="mb-6">
          {/* Header with title, members and actions on same row */}
          <div>
            {/* Title and Members Row */}
            <div className="flex items-start justify-between">
              {/* Left: Title and basic info */}
              <div className="flex-1 pr-4">
                <EditableText
                  value={group.name}
                  onSave={updateGroupName}
                  placeholder="Groepsnaam"
                  className="font-bold text-xl sm:text-2xl"
                  disabled={!canEdit}
                  maxLength={100}
                />
                <div className="mt-3 flex flex-wrap gap-3 text-muted-foreground text-sm">
                  {group.targetBudget && (
                    <span>Budget: €{Number(group.targetBudget).toLocaleString()}</span>
                  )}
                  {group.targetLocation && <span>Locatie: {group.targetLocation}</span>}
                </div>
              </div>

              {/* Right: Member avatars and action buttons */}
              <div className="flex items-start gap-2">
                <MemberAvatarStack
                  members={members}
                  maxVisible={4}
                  size="sm"
                  currentUserRole={userMember.role}
                  groupId={group.id}
                  onMemberUpdate={handleMemberUpdate}
                />

                <InviteMemberPopover groupId={group.id} groupName={group.name}>
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Lid uitnodigen</span>
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
