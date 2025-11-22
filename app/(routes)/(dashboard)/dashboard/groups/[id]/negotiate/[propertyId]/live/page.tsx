import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { LiveNegotiationSession } from "@/components/live-negotiation-session"
import { LiveSessionHeader } from "@/components/live-session-header"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering to prevent build-time prerendering
export const dynamic = "force-dynamic"

interface LiveNegotiationPageProps {
  params: Promise<{
    id: string
    propertyId: string
  }>
}

export default async function LiveNegotiationPage({ params }: LiveNegotiationPageProps) {
  const { id: groupId, propertyId } = await params

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  // Dynamic imports to avoid build-time database connection
  const { getGroupById, getGroupMembers } = await import("@/lib/groups")
  const { getPropertyById } = await import("@/lib/properties")

  const [group, members, property] = await Promise.all([
    getGroupById(groupId),
    getGroupMembers(groupId),
    getPropertyById(propertyId),
  ])

  if (!group) {
    notFound()
  }

  if (!property) {
    notFound()
  }

  // Check if user is a member of this group
  const userMember = members.find(member => member.userId === user.id)
  if (!userMember || userMember.status !== "active") {
    redirect("/dashboard/groups")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader
        title="Live Onderhandeling"
        backButton={
          <Link href={`/dashboard/groups/${groupId}/calculate/${propertyId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar berekening
            </Button>
          </Link>
        }
      />

      <div className="flex flex-1 flex-col space-y-6 p-6">
        {/* Combined Property and Session Info Card */}
        <Card className="overflow-hidden">
          <div className="flex">
            {/* Property Section - Left Side */}
            <div className="flex w-1/2">
              {/* Property Image - Half of left side */}
              <div className="relative w-1/2 bg-muted">
                <Image
                  src={property.images?.[0] || "/placeholder-property.svg"}
                  alt={property.address}
                  fill
                  className="object-cover"
                  sizes="300px"
                />
              </div>

              {/* Property Info - Half of left side */}
              <div className="w-1/2 p-4">
                <h1 className="mb-2 font-bold text-lg">🏠 {property.address}</h1>
                <p className="mb-3 text-muted-foreground text-sm">
                  {property.zipCode} {property.city}
                </p>

                <div className="space-y-2">
                  <div>
                    <span className="block font-medium text-primary text-xs">Vraagprijs</span>
                    <span className="font-semibold text-lg">
                      {formatCurrency(Number(property.price))}
                    </span>
                  </div>
                </div>

                <div className="mt-3 text-muted-foreground text-xs">Groep: {group.name}</div>
              </div>
            </div>

            {/* Separator */}
            <div className="my-4 w-px bg-border"></div>

            {/* Session Info Section - Right Side */}
            <LiveSessionHeader property={property} group={group} currentUser={user} />
          </div>
        </Card>

        {/* Live Negotiation Session Content */}
        <LiveNegotiationSession
          property={property}
          group={group}
          members={members}
          currentUser={user}
          totalCosts={Number(property.price)}
        />
      </div>
    </div>
  )
}
