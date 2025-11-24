"use client"

import { Check, Copy } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { generateShareLinkAction } from "@/actions/groups/share"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface InviteMemberPopoverProps {
  children: React.ReactNode
  groupId: string
}

export function InviteMemberPopover({ children, groupId }: InviteMemberPopoverProps) {
  const [open, setOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleOpenPopover = async () => {
    if (!shareUrl) {
      try {
        const result = await generateShareLinkAction(groupId)
        setShareUrl(result.shareUrl)
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Er is een fout opgetreden bij het aanmaken van de deellink"
        toast.error(errorMessage)
        console.error("Error generating share link:", error)
        return
      }
    }
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
      <PopoverContent className="w-80">
        {shareUrl ? (
          <div className="space-y-3">
            <div>
              <h4 className="font-medium">Groepsuitnodiging</h4>
              <p className="text-muted-foreground text-sm">
                Deel deze link om mensen uit te nodigen
              </p>
            </div>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(shareUrl)}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <h4 className="font-medium">Deellink genereren</h4>
              <p className="text-muted-foreground text-sm">
                Bezig met genereren van uitnodigingslink...
              </p>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
