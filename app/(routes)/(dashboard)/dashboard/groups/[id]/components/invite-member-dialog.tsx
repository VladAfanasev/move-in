"use client"

import { useRouter } from "next/navigation"
import { useId, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { inviteMemberAction } from "../invite-actions"

interface InviteMemberDialogProps {
  children: React.ReactNode
  groupId: string
}

export function InviteMemberDialog({ children, groupId }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const router = useRouter()
  const emailId = useId()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      await inviteMemberAction(groupId, email)
      toast.success(`Uitnodiging verstuurd naar ${email}`)
      setEmail("")
      setOpen(false)
      router.refresh()
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Er is een fout opgetreden bij het versturen van de uitnodiging"
      toast.error(errorMessage)
      console.error("Error inviting member:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Lid uitnodigen</SheetTitle>
          <SheetDescription>
            Nodig een nieuwe persoon uit om lid te worden van deze groep
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor={emailId}>E-mailadres *</Label>
            <Input
              id={emailId}
              type="email"
              placeholder="bijv. naam@voorbeeld.nl"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <p className="text-muted-foreground text-sm">
              De persoon ontvangt een e-mail met een uitnodiging om lid te worden van de groep.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={loading || !email} className="flex-1">
              {loading ? "Versturen..." : "Uitnodiging versturen"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
