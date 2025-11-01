import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

// Check if we're in build phase (when DATABASE_URL might not be available)
const isBuildTime = process.env.NEXT_PHASE === "phase-production-build" || 
                   (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL)

if (!process.env.DATABASE_URL && !isBuildTime) {
  throw new Error("DATABASE_URL is not set")
}

// Use dummy connection string during build time
const connectionString = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy"

// For migrations
export const migrationClient = isBuildTime ? ({} as any) : postgres(connectionString, { max: 1 })

// For queries  
const queryClient = isBuildTime ? ({} as any) : postgres(connectionString)
export const db = isBuildTime ? ({} as any) : drizzle(queryClient)
