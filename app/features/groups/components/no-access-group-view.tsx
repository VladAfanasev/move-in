import { ArrowLeft, ShieldX, Users } from "lucide-react"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NoAccessAlert } from "./no-access-alert"
import { RequestAccessButton } from "./request-access-button"

interface NoAccessGroupViewProps {
  groupId: string
  groupName: string
  groupDescription?: string | null
  targetBudget?: string | null
  targetLocation?: string | null
  memberCount: number
  maxMembers?: number | null
}

export function NoAccessGroupView({
  groupId,
  groupName,
  groupDescription,
  targetBudget,
  targetLocation,
  memberCount,
  maxMembers,
}: NoAccessGroupViewProps) {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader
        title={groupName}
        backButton={
          <Link href="/dashboard/groups">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar groepen
            </Button>
          </Link>
        }
      />

      <div className="@container/main flex flex-1 flex-col p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <NoAccessAlert groupName={groupName} />

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <ShieldX className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl">Geen toegang tot groep</CardTitle>
              <CardDescription>
                Je hebt momenteel geen toegang tot deze groep. Je kunt opnieuw toegang aanvragen.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Group Info */}
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="font-semibold text-lg">{groupName}</h2>
                  {groupDescription && (
                    <p className="mt-1 text-muted-foreground text-sm">{groupDescription}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <Users className="h-4 w-4" />
                    <span>
                      {memberCount} {memberCount === 1 ? "lid" : "leden"}
                    </span>
                    {maxMembers && <span>/ {maxMembers}</span>}
                  </div>

                  {targetLocation && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                      <span>📍 {targetLocation}</span>
                    </div>
                  )}

                  {targetBudget && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                      <span>💰 €{Number(targetBudget).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Request Access Action */}
              <div className="space-y-3">
                <RequestAccessButton groupId={groupId}>Vraag toegang</RequestAccessButton>
              </div>

              {/* What happens next */}
              <div className="rounded-lg bg-muted/50 p-4">
                <h3 className="mb-2 font-medium text-sm">
                  Wat gebeurt er als je toegang aanvraagt?
                </h3>
                <ul className="space-y-1 text-muted-foreground text-sm">
                  <li>• De groepseigenaar ontvangt een melding van je aanvraag</li>
                  <li>• Je krijgt een e-mail zodra je aanvraag is goedgekeurd of afgewezen</li>
                  <li>• Na goedkeuring krijg je weer volledige toegang tot de groep</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
