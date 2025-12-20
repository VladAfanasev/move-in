"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface RequestAccessButtonProps {
  groupId: string
  children: React.ReactNode
}

export function RequestAccessButton({ groupId, children }: RequestAccessButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleRequestAccess = () => {
    startTransition(async () => {
      try {
        toast.loading("Toegang aanvragen...")

        // Submit form to join endpoint (same as regular join)
        const formData = new FormData()
        
        const response = await fetch(`/api/join/${groupId}/confirm`, {
          method: "POST",
          body: formData,
        })

        toast.dismiss()

        if (response.redirected) {
          toast.success("Je wordt doorgestuurd...")
          window.location.href = response.url
        } else if (response.ok) {
          toast.success("Aanvraag verzonden!")
          // Reload the page to show updated status
          window.location.reload()
        } else {
          // Handle any errors
          try {
            const result = await response.json()
            if (result.error) {
              toast.error(`Fout bij aanvragen toegang: ${result.error}`)
              console.error("Request access error:", result.error)
            } else {
              toast.error("Er is een onverwachte fout opgetreden")
            }
          } catch {
            // Response is not JSON, show generic error
            console.error("Non-JSON response:", response.status, response.statusText)
            toast.error(`Fout ${response.status}: ${response.statusText || "Onbekende fout"}`)
          }
        }
      } catch (error) {
        toast.dismiss()
        toast.error("Netwerkfout. Probeer opnieuw.")
        console.error("Network error during request access:", error)
      }
    })
  }

  return (
    <Button onClick={handleRequestAccess} className="w-full" disabled={isPending}>
      {isPending ? "Aanvragen..." : children}
    </Button>
  )
}