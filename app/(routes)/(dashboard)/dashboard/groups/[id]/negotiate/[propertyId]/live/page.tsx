import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { LiveNegotiationSession } from "@/components/live-negotiation-session"
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
        {/* Property Header */}
        <Card className="overflow-hidden">
          <div className="flex">
            {/* Property Image - Left Side */}
            <div className="relative h-32 w-64 bg-muted">
              <Image
                src={property.images?.[0] || "/placeholder-property.svg"}
                alt={property.address}
                fill
                className="object-cover"
                sizes="256px"
              />
            </div>

            {/* Property Info - Right Side */}
            <div className="flex-1 p-4">
              <h1 className="mb-2 font-bold text-xl">
                🏠 {property.address}, {property.zipCode} {property.city}
              </h1>

              <div className="flex items-center space-x-6 text-sm">
                <div>
                  <span className="block font-medium text-primary">Vraagprijs</span>
                  <span className="font-semibold text-lg">
                    {formatCurrency(Number(property.price))}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  Live Session • Started:{" "}
                  {new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Live Negotiation Session */}
        <LiveNegotiationSession
          property={property}
          group={group}
          members={members}
          currentUser={user}
          totalCosts={Number(property.price) * 1.1} // Simplified calculation for demo
        />
      </div>
    </div>
  )
}
