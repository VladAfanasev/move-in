import { and, eq } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"
import { JoinRequestForm } from "@/app/features/groups/components/join-request-form"
import { db } from "@/db/client"
import { buyingGroups, groupMembers } from "@/db/schema"
import { createClient } from "@/lib/supabase/server"

interface JoinPageProps {
  params: {
    token: string
  }
  searchParams: {
    g?: string // group ID
  }
}

export default async function JoinPage({ params, searchParams }: JoinPageProps) {
  const { token } = await params
  const { g: groupId } = await searchParams

  if (!groupId) {
    notFound()
  }

  // Get group details
  const group = await db
    .select({
      id: buyingGroups.id,
      name: buyingGroups.name,
      description: buyingGroups.description,
      status: buyingGroups.status,
    })
    .from(buyingGroups)
    .where(eq(buyingGroups.id, groupId))
    .limit(1)

  if (group.length === 0) {
    notFound()
  }

  const groupData = group[0]

  // Check if group is still accepting members
  if (groupData.status === "closed" || groupData.status === "disbanded") {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="font-semibold text-lg text-red-900">Groep niet beschikbaar</h1>
          <p className="mt-2 text-red-700">
            Deze koopgroep accepteert momenteel geen nieuwe leden.
          </p>
        </div>
      </div>
    )
  }

  // Check authentication
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(
      `/login?redirectTo=${encodeURIComponent(`/dashboard/groups/join/${token}?g=${groupId}`)}`,
    )
  }

  // Check if user is already a member of the group
  const existingMembership = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, user.id)))
    .limit(1)

  if (existingMembership.length > 0) {
    const membership = existingMembership[0]
    // If user is already an active member, redirect to the group
    if (membership.status === "active") {
      redirect(`/dashboard/groups/${groupId}`)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="space-y-6">
        {/* Group Info */}
        <div className="rounded-lg border bg-white p-6">
          <div className="text-center">
            <h1 className="font-bold text-2xl">Lid worden van koopgroep</h1>
            <h2 className="mt-2 text-gray-600 text-xl">{groupData.name}</h2>
            {groupData.description && <p className="mt-3 text-gray-600">{groupData.description}</p>}
          </div>
        </div>

        {/* Join Request Form */}
        <JoinRequestForm groupId={groupId} groupName={groupData.name} />

        {/* Info Box */}
        <div className="rounded-lg bg-blue-50 p-4">
          <h3 className="font-medium text-blue-900">Wat gebeurt er na je verzoek?</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-blue-800 text-sm">
            <li>De groepseigenaar ontvangt een notificatie van je verzoek</li>
            <li>Je verzoek wordt beoordeeld door de groepsbeheerders</li>
            <li>Je krijgt een e-mail als je verzoek is goedgekeurd of afgewezen</li>
            <li>Na goedkeuring krijg je volledige toegang tot de groep</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
