import { Suspense } from "react"
import { PropertiesList } from "@/components/properties-list"
import { PropertiesListWithFilters } from "@/components/properties-list-with-filters"
import { SiteHeader } from "@/components/site-header"
import { getProperties } from "@/lib/properties"

// Force dynamic rendering to prevent build-time prerendering
export const dynamic = "force-dynamic"

async function PropertiesContent() {
  const properties = await getProperties()

  return <PropertiesListWithFilters properties={properties} />
}

const PropertiesOverviewPage: React.FC = () => {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="Woningen overzicht" />
      <div className="@container/main flex flex-1 flex-col p-6">
        <Suspense
          fallback={
            <div className="flex gap-6">
              <div className="w-80 flex-shrink-0">
                <div className="space-y-4">
                  <div className="h-8 animate-pulse rounded bg-gray-200" />
                  <div className="h-32 animate-pulse rounded bg-gray-200" />
                  <div className="h-32 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
              <div className="flex-1">
                <PropertiesList properties={[]} isLoading={true} />
              </div>
            </div>
          }
        >
          <PropertiesContent />
        </Suspense>
      </div>
    </div>
  )
}

export default PropertiesOverviewPage
