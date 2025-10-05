CREATE TYPE "public"."group_status" AS ENUM('forming', 'active', 'viewing', 'offer_made', 'closed', 'disbanded');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('pending', 'active', 'left', 'removed');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('active', 'pending', 'sold', 'archived');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('house', 'apartment', 'condo', 'townhouse', 'land', 'other');--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255),
	"avatar_url" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buying_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"target_budget" numeric(12, 2),
	"current_funds" numeric(12, 2) DEFAULT '0',
	"target_location" varchar(500),
	"preferred_property_type" jsonb,
	"status" "group_status" DEFAULT 'forming' NOT NULL,
	"max_members" integer DEFAULT 10,
	"metadata" jsonb,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"status" "member_status" DEFAULT 'pending' NOT NULL,
	"contribution_amount" numeric(12, 2),
	"ownership_percentage" numeric(5, 2),
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp,
	"metadata" jsonb,
	CONSTRAINT "group_members_group_id_user_id_pk" PRIMARY KEY("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "group_properties" (
	"group_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"added_by" uuid NOT NULL,
	"notes" text,
	"rating" integer,
	"status" varchar(50) DEFAULT 'saved',
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "group_properties_group_id_property_id_pk" PRIMARY KEY("group_id","property_id")
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"address" varchar(500) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(50) NOT NULL,
	"zip_code" varchar(20) NOT NULL,
	"country" varchar(100) DEFAULT 'USA' NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"bedrooms" integer,
	"bathrooms" numeric(3, 1),
	"square_feet" integer,
	"lot_size" numeric(10, 2),
	"year_built" integer,
	"property_type" "property_type" NOT NULL,
	"status" "property_status" DEFAULT 'active' NOT NULL,
	"images" jsonb,
	"features" jsonb,
	"metadata" jsonb,
	"listed_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "buying_groups" ADD CONSTRAINT "buying_groups_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_buying_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."buying_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_properties" ADD CONSTRAINT "group_properties_group_id_buying_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."buying_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_properties" ADD CONSTRAINT "group_properties_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_properties" ADD CONSTRAINT "group_properties_added_by_profiles_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_listed_by_profiles_id_fk" FOREIGN KEY ("listed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;