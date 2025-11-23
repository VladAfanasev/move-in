import { ArrowLeft, Calculator, FileText } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ContractDownloadButton } from "@/components/contract-download-button"
import { NegotiationOverview } from "@/components/negotiation-overview"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering to prevent build-time prerendering
export const dynamic = "force-dynamic"

interface ContractPageProps {
  params: Promise<{
    id: string
    propertyId: string
  }>
}

export default async function ContractPage({ params }: ContractPageProps) {
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
  const { getOrCreateCostCalculation, getNegotiationSession, getOrCreateNegotiationSession } =
    await import("@/lib/cost-calculations")

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

  // Get cost calculation and session
  const calculation = await getOrCreateCostCalculation(groupId, propertyId, user)
  
  // Find completed session for contract display
  const { getCompletedNegotiationSession } = await import("@/lib/cost-calculations")
  const session = await getCompletedNegotiationSession(calculation.id)

  // Verify session is completed
  if (!session || session.status !== "completed") {
    redirect(`/dashboard/groups/${groupId}/calculate/${propertyId}`)
  }

  const totalCosts = Number(calculation.totalCosts)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader
        title="Contract"
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
        <Card className="overflow-hidden">
          <div className="flex">
            {/* Property Image - Full Height Left Side */}
            <div className="relative min-h-[200px] w-80 bg-muted">
              <Image
                src={property.images?.[0] || "/placeholder-property.svg"}
                alt={property.address}
                fill
                className="object-cover"
                sizes="320px"
              />
            </div>

            {/* Property Info - Right Side */}
            <div className="flex-1 p-6">
              {/* Title with Icon and Address */}
              <div className="mb-4">
                <h1 className="mb-2 flex items-center font-bold text-xl">
                  <FileText className="mr-2 h-5 w-5 text-primary" />
                  Contract voor {property.address}, {property.zipCode} {property.city}
                </h1>
                <p className="text-muted-foreground">
                  De investeringsovereenkomst is gereed voor ondertekening door alle leden.
                </p>
              </div>

              {/* Compact Property Stats */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="block font-medium text-primary">Vraagprijs</span>
                  <span className="font-semibold text-lg">
                    {formatCurrency(Number(property.price))}
                  </span>
                </div>
                <div>
                  <span className="block font-medium text-primary">Totale Investering</span>
                  <span className="font-semibold text-lg">{formatCurrency(totalCosts)}</span>
                </div>
                <div>
                  <span className="block font-medium text-primary">Contract Datum</span>
                  <span className="font-semibold">{formatDate(new Date().toISOString())}</span>
                </div>
              </div>

              {/* Download Button */}
              <div className="mt-6">
                <ContractDownloadButton
                  groupId={groupId}
                  propertyId={propertyId}
                  propertyAddress={property.address}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Contract Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-4">
                <h3 className="mb-2 font-semibold text-blue-900">Volgende stappen:</h3>
                <ol className="space-y-2 text-blue-800 text-sm">
                  <li>1. Download het contract PDF</li>
                  <li>2. Print het document</li>
                  <li>3. Elke groepslid ondertekent op de aangewezen plaatsen</li>
                  <li>4. Bewaar een kopie voor uw administratie</li>
                  <li>5. De originele documenten worden gebruikt voor de notaris</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation back to calculate */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Wilt u de kostenberekening bekijken?</h3>
                <p className="text-muted-foreground text-sm">
                  Ga terug naar de kostenpagina om de volledige berekening en deal details te zien.
                </p>
              </div>
              <Link href={`/dashboard/groups/${groupId}/calculate/${propertyId}`}>
                <Button variant="outline">
                  <Calculator className="mr-2 h-4 w-4" />
                  Ga naar Kosten Berekening
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Investment Overview */}
        <NegotiationOverview
          property={property}
          group={group}
          members={members}
          participants={session.participants}
          totalCosts={totalCosts}
          isSessionLocked={true}
          sessionLockedAt={session.createdAt}
        />
      </div>
    </div>
  )
}
