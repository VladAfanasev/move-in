import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { PendingInvitations } from "@/components/pending-invitations"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"

import data from "./data.json"

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="Dashboard" />
      <div className="@container/main flex flex-1 flex-col gap-6 p-6">
        <PendingInvitations />
        <SectionCards />
        <ChartAreaInteractive />
        <DataTable data={data} />
      </div>
    </div>
  )
}
