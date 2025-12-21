"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface JoinGroupButtonProps {
  groupId: string
  redirectUrl?: string
  children: React.ReactNode
}

export function JoinGroupButton({ groupId, redirectUrl, children }: JoinGroupButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleJoin = () => {
    startTransition(async () => {
      try {
        toast.loading("Lid worden van groep...")

        const formData = new FormData()
        if (redirectUrl) {
          formData.append("redirect", redirectUrl)
        }

        // Submit form to join endpoint
        const response = await fetch(`/api/join/${groupId}/confirm`, {
          method: "POST",
          body: formData,
        })

        toast.dismiss()

        if (response.redirected) {
          toast.success("Je wordt doorgestuurd...")
          window.location.href = response.url
        } else if (response.ok) {
          toast.success("Succesvol toegevoegd aan groep!")
          // Handle successful join without redirect
        } else {
          // Handle any errors
          const result = await response.json()
          if (result.error) {
            toast.error(`Fout bij toevoegen aan groep: ${result.error}`)
            console.error("Join error:", result.error)
          } else {
            toast.error("Er is een onverwachte fout opgetreden")
          }
        }
      } catch (error) {
        toast.dismiss()
        toast.error("Netwerkfout. Probeer opnieuw.")
        console.error("Network error during join:", error)
      }
    })
  }

  return (
    <Button onClick={handleJoin} className="w-full" disabled={isPending}>
      {isPending ? "Lid worden..." : children}
    </Button>
  )
}
