import { ArrowLeft, Calculator } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { CostCalculationForm } from "@/components/cost-calculation-form"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering to prevent build-time prerendering
export const dynamic = "force-dynamic"

interface CostCalculationPageProps {
  params: Promise<{
    id: string
    propertyId: string
  }>
}

export default async function CostCalculationPage({ params }: CostCalculationPageProps) {
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
        title="Kosten berekenen"
        backButton={
          <Link href={`/dashboard/groups/${groupId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar groep
            </Button>
          </Link>
        }
      />

      <div className="flex flex-1 flex-col space-y-6 p-6">
        {/* Property Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="mr-2 h-5 w-5" />
              {property.address}, {property.zipCode} {property.city}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Vraagprijs</span>
                <p className="font-semibold">{formatCurrency(Number(property.price))}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Oppervlakte</span>
                <p className="font-semibold">{property.squareFeet} m²</p>
              </div>
              <div>
                <span className="text-muted-foreground">Kamers</span>
                <p className="font-semibold">{property.bedrooms} kamers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Calculation Form */}
        <CostCalculationForm
          property={property}
          group={group}
          members={members}
          currentUser={user}
        />
      </div>
    </div>
  )
}
