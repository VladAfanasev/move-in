import { desc, eq, ne } from "drizzle-orm"
import { db } from "@/db/client"
import { properties } from "@/db/schema"

export async function getProperties() {
  try {
    const result = await db
      .select()
      .from(properties)
      .where(ne(properties.status, "archived"))
      .orderBy(desc(properties.createdAt))

    return result
  } catch (error) {
    console.error("Error fetching properties:", error)
    throw new Error("Failed to fetch properties")
  }
}

export async function getPropertyById(id: string) {
  try {
    const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1)

    return result[0] || null
  } catch (error) {
    console.error("Error fetching property:", error)
    throw new Error("Failed to fetch property")
  }
}

export async function getAvailableProperties() {
  try {
    const result = await db
      .select()
      .from(properties)
      .where(eq(properties.status, "available"))
      .orderBy(desc(properties.createdAt))

    return result
  } catch (error) {
    console.error("Error fetching available properties:", error)
    throw new Error("Failed to fetch available properties")
  }
}
