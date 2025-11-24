"use client"

import { Download } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ContractDownloadButtonProps {
  groupId: string
  propertyId: string
  propertyAddress: string
}

export function ContractDownloadButton({
  groupId,
  propertyId,
  propertyAddress,
}: ContractDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true)
      const response = await fetch(`/api/groups/${groupId}/properties/${propertyId}/contract/pdf`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to generate PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `contract-${propertyAddress.replace(/\s+/g, "_")}-${formatDate(new Date().toISOString())}.html`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading PDF:", error)
      alert("Er ging iets mis bij het downloaden van het PDF. Probeer het opnieuw.")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      onClick={handleDownloadPDF}
      disabled={isDownloading}
      className="bg-green-600 hover:bg-green-700"
      size="lg"
    >
      <Download className="mr-2 h-4 w-4" />
      {isDownloading ? "Bezig met genereren..." : "Download Contract PDF"}
    </Button>
  )
}
