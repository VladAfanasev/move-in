"use client"

import { Check, Edit2, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface EditableTextProps {
  value: string | null
  onSave: (value: string) => Promise<void>
  placeholder?: string
  multiline?: boolean
  className?: string
  disabled?: boolean
  maxLength?: number
}

export function EditableText({
  value,
  onSave,
  placeholder = "Voer tekst in...",
  multiline = false,
  className = "",
  disabled = false,
  maxLength,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || "")
  const [isLoading, setIsLoading] = useState(false)

  const handleEdit = () => {
    if (disabled) return
    setEditValue(value || "")
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditValue(value || "")
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (editValue.trim() === (value || "").trim()) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      await onSave(editValue.trim())
      setIsEditing(false)
      toast.success("Wijzigingen opgeslagen")
    } catch (error) {
      toast.error("Er is een fout opgetreden bij het opslaan")
      console.error("Error saving:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === "Escape") {
      handleCancel()
    }
  }

  if (isEditing) {
    const InputComponent = multiline ? Textarea : Input

    return (
      <div className="space-y-2">
        <InputComponent
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={multiline ? 3 : undefined}
          className={className}
          autoFocus
          disabled={isLoading}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isLoading}>
            <Check className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} disabled={isLoading}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="inline-flex items-start gap-2">
      <div className={`w-auto flex-1 ${className}`}>
        {value || <span className="text-muted-foreground italic">{placeholder}</span>}
      </div>
      {!disabled && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleEdit}
          className="shrink-0 opacity-30 hover:opacity-100"
          title="Bewerken"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
