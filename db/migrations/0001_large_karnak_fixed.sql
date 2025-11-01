-- Drop policies that depend on the status column
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;--> statement-breakpoint

-- Remove default temporarily
ALTER TABLE "properties" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint

-- Convert to text first
ALTER TABLE "properties" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint

-- Drop and recreate the enum
DROP TYPE "public"."property_status";--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('available', 'in_option', 'sold', 'archived');--> statement-breakpoint

-- Convert back to enum with proper mapping
ALTER TABLE "properties" ALTER COLUMN "status" SET DATA TYPE "public"."property_status" 
USING CASE 
  WHEN "status" = 'active' THEN 'available'::"public"."property_status"
  WHEN "status" = 'pending' THEN 'in_option'::"public"."property_status"
  ELSE "status"::"public"."property_status"
END;--> statement-breakpoint

-- Set new default
ALTER TABLE "properties" ALTER COLUMN "status" SET DEFAULT 'available'::"public"."property_status";--> statement-breakpoint

-- Handle property_type enum
ALTER TABLE "properties" ALTER COLUMN "property_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."property_type";--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('house', 'apartment');--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "property_type" SET DATA TYPE "public"."property_type" USING "property_type"::"public"."property_type";--> statement-breakpoint

-- Update country default
ALTER TABLE "properties" ALTER COLUMN "country" SET DEFAULT 'Nederland';--> statement-breakpoint

-- Drop title column
ALTER TABLE "properties" DROP COLUMN "title";--> statement-breakpoint

-- Recreate the policy with new enum values
CREATE POLICY "Anyone can view available properties" ON properties
    FOR SELECT USING (status = 'available');