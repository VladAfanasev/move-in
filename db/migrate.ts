import { migrate } from "drizzle-orm/postgres-js/migrator"
import { db, migrationClient } from "./client"

async function runMigrations() {
  console.log("Running migrations...")

  try {
    await migrate(db, { migrationsFolder: "./db/migrations" })
    console.log("Migrations completed successfully")
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  } finally {
    await migrationClient.end()
  }
}

runMigrations()
