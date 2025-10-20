import type { InferSelectModel } from "drizzle-orm"
import type { properties } from "@/db/schema"

export type Property = InferSelectModel<typeof properties>
