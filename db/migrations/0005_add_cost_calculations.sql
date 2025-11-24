-- Create cost calculation tables
CREATE TYPE "public"."proposal_status" AS ENUM('draft', 'submitted', 'accepted', 'rejected', 'expired');
CREATE TYPE "public"."negotiation_session_status" AS ENUM('intention_setting', 'active', 'completed', 'cancelled');
CREATE TYPE "public"."member_session_status" AS ENUM('adjusting', 'confirmed', 'locked');

-- Cost calculation sessions for specific properties in groups
CREATE TABLE IF NOT EXISTS "cost_calculations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"purchase_price" numeric(12, 2) NOT NULL,
	"notary_fees" numeric(12, 2) DEFAULT '0',
	"transfer_tax" numeric(12, 2) DEFAULT '0',
	"renovation_costs" numeric(12, 2) DEFAULT '0',
	"broker_fees" numeric(12, 2) DEFAULT '0',
	"inspection_costs" numeric(12, 2) DEFAULT '0',
	"other_costs" numeric(12, 2) DEFAULT '0',
	"mortgage_amount" numeric(12, 2),
	"mortgage_interest_rate" numeric(5, 3),
	"mortgage_term" integer,
	"total_costs" numeric(12, 2) NOT NULL,
	"total_equity_needed" numeric(12, 2) NOT NULL,
	"title" varchar(255),
	"notes" text,
	"is_active" text DEFAULT 'true',
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Member investment proposals for cost calculations
CREATE TABLE IF NOT EXISTS "member_proposals" (
	"calculation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"investment_amount" numeric(12, 2) NOT NULL,
	"investment_percentage" numeric(5, 2) NOT NULL,
	"notes" text,
	"max_investment" numeric(12, 2),
	"preferred_investment" numeric(12, 2),
	"status" "proposal_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "member_proposals_calculation_id_user_id_pk" PRIMARY KEY("calculation_id","user_id")
);

-- Live negotiation sessions for real-time percentage agreement
CREATE TABLE IF NOT EXISTS "negotiation_sessions" (
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

-- Member participation in live negotiation sessions
CREATE TABLE IF NOT EXISTS "member_session_participation" (
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

-- Comments on cost calculations for group discussion
CREATE TABLE IF NOT EXISTS "calculation_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calculation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"is_system_message" text DEFAULT 'false',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "cost_calculations" ADD CONSTRAINT "cost_calculations_group_id_buying_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."buying_groups"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "cost_calculations" ADD CONSTRAINT "cost_calculations_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "cost_calculations" ADD CONSTRAINT "cost_calculations_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "member_proposals" ADD CONSTRAINT "member_proposals_calculation_id_cost_calculations_id_fk" FOREIGN KEY ("calculation_id") REFERENCES "public"."cost_calculations"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "member_proposals" ADD CONSTRAINT "member_proposals_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "negotiation_sessions" ADD CONSTRAINT "negotiation_sessions_calculation_id_cost_calculations_id_fk" FOREIGN KEY ("calculation_id") REFERENCES "public"."cost_calculations"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "negotiation_sessions" ADD CONSTRAINT "negotiation_sessions_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "negotiation_sessions" ADD CONSTRAINT "negotiation_sessions_locked_by_profiles_id_fk" FOREIGN KEY ("locked_by") REFERENCES "public"."profiles"("id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "member_session_participation" ADD CONSTRAINT "member_session_participation_session_id_negotiation_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."negotiation_sessions"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "member_session_participation" ADD CONSTRAINT "member_session_participation_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "calculation_comments" ADD CONSTRAINT "calculation_comments_calculation_id_cost_calculations_id_fk" FOREIGN KEY ("calculation_id") REFERENCES "public"."cost_calculations"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "calculation_comments" ADD CONSTRAINT "calculation_comments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;