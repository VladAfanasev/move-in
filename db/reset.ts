import { sql } from "drizzle-orm"
import { db, migrationClient } from "./client"

async function resetDatabase() {
  console.log("⚠️  WARNING: This will drop all tables and recreate them!")
  console.log("Press Ctrl+C to cancel or wait 5 seconds to continue...")

  await new Promise(resolve => setTimeout(resolve, 5000))

  try {
    console.log("Dropping existing tables...")

    // Drop tables in reverse order of dependencies
    await db.execute(sql`DROP TABLE IF EXISTS group_properties CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS group_members CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS buying_groups CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS properties CASCADE`)
    await db.execute(sql`DROP TABLE IF EXISTS profiles CASCADE`)

    // Drop enums
    await db.execute(sql`DROP TYPE IF EXISTS property_status CASCADE`)
    await db.execute(sql`DROP TYPE IF EXISTS property_type CASCADE`)
    await db.execute(sql`DROP TYPE IF EXISTS group_status CASCADE`)
    await db.execute(sql`DROP TYPE IF EXISTS member_role CASCADE`)
    await db.execute(sql`DROP TYPE IF EXISTS member_status CASCADE`)

    console.log("Tables dropped successfully")

    // Now run migrations
    console.log("Running migrations...")
    const { migrate } = await import("drizzle-orm/postgres-js/migrator")
    await migrate(db, { migrationsFolder: "./db/migrations" })

    console.log("✅ Database reset and migrations completed successfully")
  } catch (error) {
    console.error("❌ Reset failed:", error)
    process.exit(1)
  } finally {
    await migrationClient.end()
  }
}

resetDatabase()
