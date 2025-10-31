import { redirect } from "next/navigation"

import { SiteHeader } from "@/components/site-header"
import { CreateGroupForm } from "@/app/features/groups/components/create-group-form"
import { createClient } from "@/lib/supabase/server"

const CreateGroupPage = async () => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="Nieuwe groep aanmaken" />
      <div className="@container/main flex flex-1 flex-col p-6">
        <CreateGroupForm />
      </div>
    </div>
  )
}

export default CreateGroupPage
