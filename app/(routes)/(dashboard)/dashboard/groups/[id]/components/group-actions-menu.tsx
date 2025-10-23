"use client"

import { MoreVertical, Settings, Trash2, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { deleteGroupAction } from "../actions"

interface GroupActionsMenuProps {
  groupId: string
  groupName: string
  userRole: "owner" | "admin" | "member"
}

export function GroupActionsMenu({ groupId, groupName, userRole }: GroupActionsMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const canDelete = userRole === "owner"
  const canManage = userRole === "owner" || userRole === "admin"

  const handleDeleteGroup = async () => {
    setIsDeleting(true)

    try {
      await deleteGroupAction(groupId)
      toast.success("Groep succesvol verwijderd")
      router.push("/dashboard/groups")
    } catch (error) {
      toast.error("Er is een fout opgetreden bij het verwijderen van de groep")
      console.error("Error deleting group:", error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {canManage && (
            <>
              <DropdownMenuItem disabled>
                <Settings className="mr-2 h-4 w-4" />
                Groepsinstellingen
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Users className="mr-2 h-4 w-4" />
                Ledenbeheer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {canDelete && (
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Groep verwijderen
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Groep verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je de groep "{groupName}" wilt verwijderen?
              <br />
              <br />
              Deze actie kan niet ongedaan worden gemaakt. Alle gegevens van de groep, inclusief
              leden en bewaarde woningen, zullen permanent worden verwijderd.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Verwijderen..." : "Verwijderen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
