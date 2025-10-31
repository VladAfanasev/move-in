import { Plus } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { GroupsList } from "@/app/features/groups/components/groups-list"
import { getUserGroups } from "@/lib/groups"
import { createClient } from "@/lib/supabase/server"

const GroupPage = async () => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const groups = await getUserGroups(user.id)

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="Mijn groepen" />
      <div className="@container/main flex flex-1 flex-col p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl">Mijn groepen</h1>
            <p className="text-muted-foreground">Beheer je koopgroepen en uitnodigingen</p>
          </div>
          <Link href="/dashboard/groups/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe groep
            </Button>
          </Link>
        </div>

        <GroupsList groups={groups} />
      </div>
    </div>
  )
}

export default GroupPage
