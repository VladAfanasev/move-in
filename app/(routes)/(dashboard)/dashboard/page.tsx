import { SiteHeader } from "@/components/site-header"

// Force dynamic rendering to prevent build-time prerendering
export const dynamic = "force-dynamic"

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="Dashboard" />
      <div className="@container/main flex flex-1 flex-col gap-6 p-6"></div>
    </div>
  )
}
