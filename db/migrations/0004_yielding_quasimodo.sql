CREATE TYPE "public"."member_session_status" AS ENUM('adjusting', 'confirmed', 'locked');--> statement-breakpoint
CREATE TYPE "public"."negotiation_session_status" AS ENUM('intention_setting', 'active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "member_session_participation" (
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"current_percentage" numeric(5, 2) DEFAULT '0' NOT NULL,
	"intended_percentage" numeric(5, 2),
	"status" "member_session_status" DEFAULT 'adjusting' NOT NULL,
	"confirmed_at" timestamp,
	"last_activity" timestamp DEFAULT now() NOT NULL,
	"is_online" text DEFAULT 'false',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "member_session_participation_session_id_user_id_pk" PRIMARY KEY("session_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "negotiation_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calculation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"status" "negotiation_session_status" DEFAULT 'intention_setting' NOT NULL,
	"total_percentage" numeric(5, 2) DEFAULT '0',
	"locked_at" timestamp,
	"locked_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "member_session_participation" ADD CONSTRAINT "member_session_participation_session_id_negotiation_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."negotiation_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_session_participation" ADD CONSTRAINT "member_session_participation_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "negotiation_sessions" ADD CONSTRAINT "negotiation_sessions_calculation_id_cost_calculations_id_fk" FOREIGN KEY ("calculation_id") REFERENCES "public"."cost_calculations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "negotiation_sessions" ADD CONSTRAINT "negotiation_sessions_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "negotiation_sessions" ADD CONSTRAINT "negotiation_sessions_locked_by_profiles_id_fk" FOREIGN KEY ("locked_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;