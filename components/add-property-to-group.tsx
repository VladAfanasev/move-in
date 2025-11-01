"use client"

import { Plus, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getUserGroupsAction } from "@/actions/groups/get-user-groups"
import { addPropertyToGroupAction } from "@/actions/properties/add-to-group"
import { useAuth } from "@/app/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface AddPropertyToGroupProps {
  propertyId: string
}

interface Group {
  id: string
  name: string
  description: string | null
  targetLocation: string | null
}

export function AddPropertyToGroup({ propertyId }: AddPropertyToGroupProps) {
  const [open, setOpen] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user?.id && open) {
      setIsLoading(true)
      getUserGroupsAction()
        .then(setGroups)
        .catch(error => {
          console.error("Error fetching groups:", error)
          toast.error("Failed to load groups")
        })
        .finally(() => setIsLoading(false))
    }
  }, [user?.id, open])

  const handleAddToGroup = async (groupId: string) => {
    if (!user?.id) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("groupId", groupId)
      formData.append("propertyId", propertyId)

      await addPropertyToGroupAction(formData)
      toast.success("Property added to group")
      setOpen(false)
    } catch (error) {
      toast.error("Failed to add property to group")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 bg-white/80 p-1 hover:bg-white"
          title="Add to group"
        >
          <Plus className="h-4 w-4 text-gray-600" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Add to group</h4>
            <p className="text-muted-foreground text-sm">Select a group to add this property to.</p>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <div className="h-8 animate-pulse rounded bg-gray-200" />
              <div className="h-8 animate-pulse rounded bg-gray-200" />
            </div>
          ) : groups && groups.length > 0 ? (
            <div className="space-y-2">
              {groups.map(group => (
                <Button
                  key={group.id}
                  variant="ghost"
                  className="h-auto w-full justify-start p-3"
                  onClick={() => handleAddToGroup(group.id)}
                  disabled={isSubmitting}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{group.name}</div>
                      {group.targetLocation && (
                        <div className="text-muted-foreground text-xs">{group.targetLocation}</div>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="mb-3 text-muted-foreground text-sm">
                You're not part of any groups yet.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOpen(false)
                  window.location.href = "/dashboard/groups/create"
                }}
              >
                Create a group
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
