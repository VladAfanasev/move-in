"use client"

import { Check, Copy, QrCode } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { generateGroupQRInviteAction } from "@/actions/groups/qr-invite"
import { generateShareLinkAction } from "@/actions/groups/share"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

interface InviteMemberPopoverProps {
  children: React.ReactNode
  groupId: string
  groupName: string
}

export function InviteMemberPopover({ children, groupId, groupName }: InviteMemberPopoverProps) {
  const [open, setOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [qrInviteUrl, setQrInviteUrl] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)

  const generateQRInviteUrl = useCallback(async () => {
    if (qrInviteUrl || qrLoading) return

    setQrLoading(true)
    try {
      const result = await generateGroupQRInviteAction(groupId)
      if (result.success) {
        setQrInviteUrl(result.qrInviteUrl)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Er is een fout opgetreden"
      toast.error(errorMessage)
      console.error("Error generating QR invite URL:", error)
    } finally {
      setQrLoading(false)
    }
  }, [groupId, qrInviteUrl, qrLoading])

  const handleOpenPopover = async () => {
    // Generate both share URL and QR URL when popover opens
    const promises = []

    if (!shareUrl) {
      promises.push(
        generateShareLinkAction(groupId)
          .then(result => setShareUrl(result.shareUrl))
          .catch(error => {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Er is een fout opgetreden bij het aanmaken van de deellink"
            toast.error(errorMessage)
            console.error("Error generating share link:", error)
          }),
      )
    }

    if (!(qrInviteUrl || qrLoading)) {
      promises.push(generateQRInviteUrl())
    }

    await Promise.all(promises)
    setOpen(true)
  }

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success("Link gekopieerd naar klembord")
        setTimeout(() => setCopied(false), 2000)
      } else {
        // Fallback for older browsers or server-side rendering
        const textArea = document.createElement("textarea")
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          const successful = document.execCommand("copy")
          if (successful) {
            setCopied(true)
            toast.success("Link gekopieerd naar klembord")
            setTimeout(() => setCopied(false), 2000)
          } else {
            toast.error("Kon niet kopiëren naar klembord")
          }
        } catch (_error) {
          toast.error("Kon niet kopiëren naar klembord")
        }
        document.body.removeChild(textArea)
      }
    } catch (_error) {
      toast.error("Kon niet kopiëren naar klembord")
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onClick={handleOpenPopover}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <div className="space-y-6">
          <div>
            <h4 className="font-medium">Leden uitnodigen</h4>
            <p className="text-muted-foreground text-sm">
              Deel de QR-code of link om nieuwe leden uit te nodigen
            </p>
          </div>

          {/* QR Code Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span className="font-medium text-sm">QR-code</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                Aanbevolen
              </Badge>
            </div>

            <div className="flex flex-col items-center space-y-3">
              {qrLoading ? (
                <div className="flex h-48 w-48 items-center justify-center rounded-lg border-2 border-gray-300 border-dashed">
                  <div className="text-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="mt-2 text-muted-foreground text-xs">Genereren...</p>
                  </div>
                </div>
              ) : qrInviteUrl ? (
                <>
                  <div className="rounded-lg border-2 border-gray-200 p-2">
                    <QRCodeSVG
                      value={qrInviteUrl}
                      size={180}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(qrInviteUrl)}
                      className={copied ? "text-green-600" : ""}
                    >
                      {copied ? (
                        <>
                          <Check className="mr-1 h-3 w-3 text-green-600" />
                          Gekopieerd
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3 w-3" />
                          Kopieer link
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const message = `Hallo! Je bent uitgenodigd om lid te worden van de koopgroep "${groupName}". Klik op deze link om te joinen: ${qrInviteUrl}`
                        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
                        window.open(whatsappUrl, "_blank")
                      }}
                    >
                      Deel via WhatsApp
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-lg border-2 border-gray-300 border-dashed">
                  <p className="text-muted-foreground text-xs">Er is een fout opgetreden</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
