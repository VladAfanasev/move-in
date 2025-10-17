ALTER TABLE "properties" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "status" SET DEFAULT 'available'::text;--> statement-breakpoint
DROP TYPE "public"."property_status";--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('available', 'in_option', 'sold', 'archived');--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "status" SET DEFAULT 'available'::"public"."property_status";--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "status" SET DATA TYPE "public"."property_status" USING "status"::"public"."property_status";--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "property_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."property_type";--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('house', 'apartment');--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "property_type" SET DATA TYPE "public"."property_type" USING "property_type"::"public"."property_type";--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "country" SET DEFAULT 'Nederland';--> statement-breakpoint
ALTER TABLE "properties" DROP COLUMN "title";