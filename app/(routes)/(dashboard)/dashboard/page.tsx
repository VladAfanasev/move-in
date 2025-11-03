import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"

import data from "./data.json"

// Force dynamic rendering to prevent build-time prerendering
export const dynamic = "force-dynamic"

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="Dashboard" />
      <div className="@container/main flex flex-1 flex-col gap-6 p-6">
        <SectionCards />
        <ChartAreaInteractive />
        <DataTable data={data} />
      </div>
    </div>
  )
}
