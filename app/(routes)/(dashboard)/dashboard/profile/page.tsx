import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ProfileForm } from "@/app/features/profile/components/profile-form"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export default async function ProfilePage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    notFound()
  }

  // Get user profile from database
  const { db } = await import("@/db/client")
  const { profiles } = await import("@/db/schema")
  const { eq } = await import("drizzle-orm")

  type ProfileData = {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    fullName: string | null
  }

  let profile: ProfileData | null = null

  try {
    // Try to get profile with new firstName/lastName columns
    const userProfileResult = await db
      .select({
        id: profiles.id,
        email: profiles.email,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        fullName: profiles.fullName,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1)

    profile = userProfileResult[0] || null
  } catch (error) {
    // Fallback: columns might not exist yet, try with just basic columns
    console.warn(
      "Failed to fetch profile with firstName/lastName, falling back to basic columns:",
      error,
    )

    const basicProfileResult = await db
      .select({
        id: profiles.id,
        email: profiles.email,
        fullName: profiles.fullName,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1)

    const basicProfile = basicProfileResult[0]

    if (basicProfile) {
      // Parse fullName to get firstName and lastName
      const nameParts = basicProfile.fullName?.trim().split(" ") || []
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      profile = {
        ...basicProfile,
        firstName: firstName || null,
        lastName: lastName || null,
      }
    }
  }

  if (!profile) {
    notFound()
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader
        title="Profile"
        backButton={
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        }
      />
      <div className="container max-w-2xl py-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your personal information and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              initialData={{
                firstName: profile.firstName || "",
                lastName: profile.lastName || "",
                email: profile.email,
              }}
              userId={user.id}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
