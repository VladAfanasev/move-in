"use client"

import { Check, Clock, MessageSquare, User, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { getJoinRequestsAction } from "@/actions/groups/join-request"
import {
  approveJoinRequestAction,
  rejectJoinRequestAction,
} from "@/actions/groups/process-join-request"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface JoinRequest {
  id: string
  userId: string
  message: string | null
  requestedAt: Date
  expiresAt: Date
  userFullName: string | null
  userEmail: string | null
  userAvatarUrl: string | null
}

interface JoinRequestListProps {
  groupId: string
  onRequestProcessed?: () => void
}

export function JoinRequestList({ groupId, onRequestProcessed }: JoinRequestListProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectDialog, setRejectDialog] = useState<{
    isOpen: boolean
    requestId: string
    userName: string
  }>({ isOpen: false, requestId: "", userName: "" })
  const [rejectionReason, setRejectionReason] = useState("")

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getJoinRequestsAction(groupId)
      setRequests(result as JoinRequest[])
    } catch (error) {
      console.error("Error loading join requests:", error)
      toast.error("Kon verzoeken niet laden")
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      await approveJoinRequestAction(requestId)
      toast.success("Verzoek goedgekeurd!")
      await loadRequests()
      onRequestProcessed?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Er is een fout opgetreden"
      toast.error(errorMessage)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async () => {
    if (!rejectDialog.requestId) return

    setProcessingId(rejectDialog.requestId)
    try {
      await rejectJoinRequestAction(rejectDialog.requestId, rejectionReason.trim() || undefined)
      toast.success("Verzoek afgewezen")
      setRejectDialog({ isOpen: false, requestId: "", userName: "" })
      setRejectionReason("")
      await loadRequests()
      onRequestProcessed?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Er is een fout opgetreden"
      toast.error(errorMessage)
    } finally {
      setProcessingId(null)
    }
  }

  const openRejectDialog = (requestId: string, userName: string) => {
    setRejectDialog({ isOpen: true, requestId, userName })
    setRejectionReason("")
  }

  const closeRejectDialog = () => {
    setRejectDialog({ isOpen: false, requestId: "", userName: "" })
    setRejectionReason("")
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lidmaatschapsverzoeken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="mt-2 text-muted-foreground text-sm">Laden...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lidmaatschapsverzoeken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <User className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Geen openstaande verzoeken</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Lidmaatschapsverzoeken
            </div>
            <Badge variant="secondary">{requests.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {requests.map(request => (
            <div key={request.id} className="flex items-start gap-4 rounded-lg border p-4">
              <Avatar>
                <AvatarImage src={request.userAvatarUrl || ""} />
                <AvatarFallback>
                  {request.userFullName
                    ? request.userFullName.charAt(0).toUpperCase()
                    : request.userEmail
                      ? request.userEmail.charAt(0).toUpperCase()
                      : "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">
                      {request.userFullName || request.userEmail || "Onbekende gebruiker"}
                    </h4>
                    {request.userEmail && request.userFullName && (
                      <p className="text-muted-foreground text-sm">{request.userEmail}</p>
                    )}
                    <p className="mt-1 text-muted-foreground text-xs">
                      Verzoek ingediend op{" "}
                      {new Date(request.requestedAt).toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(request.id)}
                      disabled={processingId === request.id}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Goedkeuren
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        openRejectDialog(
                          request.id,
                          request.userFullName || request.userEmail || "Gebruiker",
                        )
                      }
                      disabled={processingId === request.id}
                    >
                      <X className="mr-1 h-3 w-3" />
                      Afwijzen
                    </Button>
                  </div>
                </div>

                {request.message && (
                  <div className="mt-3 rounded-lg bg-gray-50 p-3">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <MessageSquare className="h-3 w-3" />
                      Bericht van gebruiker:
                    </div>
                    <p className="mt-1 text-sm">{request.message}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialog.isOpen} onOpenChange={closeRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verzoek afwijzen</DialogTitle>
            <p className="mt-2 text-muted-foreground text-sm">
              Weet je zeker dat je het verzoek van {rejectDialog.userName} wilt afwijzen?
            </p>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Reden (optioneel)</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Leg uit waarom je het verzoek afwijst..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-muted-foreground text-xs">
                {rejectionReason.length}/500 karakters
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={closeRejectDialog}>
              Annuleren
            </Button>
            <Button onClick={handleReject} disabled={processingId === rejectDialog.requestId}>
              {processingId === rejectDialog.requestId ? "Afwijzen..." : "Afwijzen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
