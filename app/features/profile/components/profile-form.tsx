"use client"

import { useRouter } from "next/navigation"
import { useId, useState, useTransition } from "react"
import { toast } from "sonner"
import { updateProfileAction } from "@/actions/profile/update"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProfileFormProps {
  initialData: {
    firstName: string
    lastName: string
    email: string
  }
  userId: string
}

export function ProfileForm({ initialData, userId }: ProfileFormProps) {
  const firstNameId = useId()
  const lastNameId = useId()
  const emailId = useId()

  const [firstName, setFirstName] = useState(initialData.firstName)
  const [lastName, setLastName] = useState(initialData.lastName)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const hasChanges = firstName !== initialData.firstName || lastName !== initialData.lastName

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!firstName.trim()) {
      setError("First name is required")
      return
    }

    setError(null)

    startTransition(async () => {
      try {
        const result = await updateProfileAction({
          userId,
          firstName: firstName.trim(),
          lastName: lastName.trim() || null,
        })

        if (result.success) {
          toast.success("Profile updated successfully")
          router.refresh() // Refresh to update any cached data
        } else {
          setError(result.error || "Failed to update profile")
        }
      } catch (err) {
        setError("An unexpected error occurred")
        console.error("Profile update error:", err)
      }
    })
  }

  const handleReset = () => {
    setFirstName(initialData.firstName)
    setLastName(initialData.lastName)
    setError(null)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor={firstNameId}>First Name</Label>
          <Input
            id={firstNameId}
            type="text"
            placeholder="John"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            required
            maxLength={255}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={lastNameId}>Last Name</Label>
          <Input
            id={lastNameId}
            type="text"
            placeholder="Doe"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            maxLength={255}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor={emailId}>Email</Label>
          <Input
            id={emailId}
            type="email"
            value={initialData.email}
            disabled
            className="bg-muted"
          />
          <p className="text-muted-foreground text-xs">
            Email cannot be changed here. Contact support if you need to update your email.
          </p>
        </div>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending || !hasChanges} className="flex-1">
          {isPending ? "Updating..." : "Update Profile"}
        </Button>

        {hasChanges && (
          <Button type="button" variant="outline" onClick={handleReset} disabled={isPending}>
            Reset
          </Button>
        )}
      </div>
    </form>
  )
}
