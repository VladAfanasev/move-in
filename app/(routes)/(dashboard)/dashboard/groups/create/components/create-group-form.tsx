"use client"

import { useForm } from "@tanstack/react-form"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { createGroupAction } from "../../actions"
import { type CreateGroupFormData, createGroupSchema } from "../schema"

export function CreateGroupForm() {

  const form = useForm({
    defaultValues: {
      groepsnaam: "",
      beschrijving: "",
    } as CreateGroupFormData,
    onSubmit: async ({ value }) => {
      try {
        const formData = new FormData()
        formData.append("groepsnaam", value.groepsnaam)
        formData.append("beschrijving", value.beschrijving || "")

        await createGroupAction(formData)
        // If we reach here, there was an error (redirect would prevent this)
        toast.success("Groep succesvol aangemaakt!")
      } catch (error) {
        // Only show error toast for actual errors, not redirects
        const errorMessage = error instanceof Error ? error.message : "Er is een fout opgetreden"
        if (errorMessage !== "NEXT_REDIRECT") {
          toast.error("Er is een fout opgetreden bij het aanmaken van de groep")
          console.error("Error creating group:", error)
        }
      }
    },
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/groups">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar groepen
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nieuwe koopgroep aanmaken</CardTitle>
          <CardDescription>
            Maak een nieuwe groep aan om samen een woning te kopen. Je kunt later de
            groepsinstellingen aanpassen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={e => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="space-y-6"
          >
            <form.Field
              name="groepsnaam"
              validators={{
                onChange: ({ value }) => {
                  const result = createGroupSchema.shape.groepsnaam.safeParse(value)
                  return result.success ? undefined : result.error.issues[0]?.message
                },
              }}
            >
              {field => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Groepsnaam *</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder="Bijv. Koopgroep Amsterdam Zuid"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-red-600 text-sm">{field.state.meta.errors[0]}</p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name="beschrijving"
              validators={{
                onChange: ({ value }) => {
                  const result = createGroupSchema.shape.beschrijving.safeParse(value)
                  return result.success ? undefined : result.error.issues[0]?.message
                },
              }}
            >
              {field => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Beschrijving</Label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value || ""}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(e.target.value)}
                    placeholder="Kort beschrijving van de groep en doelstellingen..."
                    rows={4}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-red-600 text-sm">{field.state.meta.errors[0]}</p>
                  )}
                  <p className="text-muted-foreground text-sm">
                    Optioneel - je kunt later meer details toevoegen in de groepsinstellingen
                  </p>
                </div>
              )}
            </form.Field>

            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/groups" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Annuleren
                </Button>
              </Link>
              <form.Subscribe selector={state => [state.canSubmit, state.isSubmitting]}>
                {([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={!canSubmit || isSubmitting}
                    className="flex-1"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Aanmaken..." : "Groep aanmaken"}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
