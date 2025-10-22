import { z } from "zod"

export const createGroupSchema = z.object({
  groepsnaam: z
    .string()
    .min(1, "Groepsnaam is verplicht")
    .min(3, "Groepsnaam moet minimaal 3 karakters lang zijn")
    .max(100, "Groepsnaam mag maximaal 100 karakters lang zijn"),
  beschrijving: z.string().max(500, "Beschrijving mag maximaal 500 karakters lang zijn").optional(),
})

export type CreateGroupFormData = z.infer<typeof createGroupSchema>
