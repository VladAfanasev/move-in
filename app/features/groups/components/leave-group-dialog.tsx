"use client"

import { AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { leaveGroupAction } from "@/actions/groups/leave"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface LeaveGroupDialogProps {
  children: React.ReactNode
  groupId: string
  groupName: string
  isOwner: boolean
  isLastMember: boolean
  totalMembers: number
}

export function LeaveGroupDialog({
  children,
  groupId,
  groupName,
  isOwner,
  isLastMember,
  totalMembers,
}: LeaveGroupDialogProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleLeave = async () => {
    setLoading(true)

    try {
      const result = await leaveGroupAction(groupId)

      if (result.success) {
        toast.success(result.message)

        if (result.groupDeleted) {
          router.push("/dashboard/groups")
        } else {
          router.push("/dashboard/groups")
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Er is een fout opgetreden bij het verlaten van de groep"
      toast.error(errorMessage)
      console.error("Error leaving group:", error)
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  const getDialogContent = () => {
    if (isOwner && isLastMember) {
      return {
        title: "Groep verlaten en verwijderen",
        description: `Je bent de eigenaar en enige lid van "${groupName}". Als je de groep verlaat, wordt de groep permanent verwijderd.`,
        warning: "Deze actie kan niet ongedaan worden gemaakt.",
        actionText: "Groep verlaten en verwijderen",
        actionVariant: "destructive" as const,
      }
    } else if (isOwner) {
      return {
        title: "Eigenaarschap overdragen",
        description: `Je bent de eigenaar van "${groupName}". Als je de groep verlaat, wordt het eigenaarschap overgedragen aan het lid dat het langst lid is van de groep.`,
        warning: `Er zijn ${totalMembers - 1} andere leden in de groep.`,
        actionText: "Groep verlaten en eigenaarschap overdragen",
        actionVariant: "destructive" as const,
      }
    } else {
      return {
        title: "Groep verlaten",
        description: `Weet je zeker dat je "${groupName}" wilt verlaten?`,
        warning: "Je kunt de groep later opnieuw joinen via een uitnodiging.",
        actionText: "Groep verlaten",
        actionVariant: "destructive" as const,
      }
    }
  }

  const content = getDialogContent()

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {content.title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {content.description}
          </AlertDialogDescription>
          {content.warning && (
            <div className="font-medium text-muted-foreground text-sm">{content.warning}</div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuleren</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLeave}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Bezig..." : content.actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
