-- Create join request status enum
CREATE TYPE "public"."join_request_status" AS ENUM('pending', 'approved', 'rejected', 'expired');

-- Create group join requests table
CREATE TABLE "group_join_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"request_token" varchar(64) NOT NULL,
	"status" "join_request_status" DEFAULT 'pending' NOT NULL,
	"message" text,
	"rejection_reason" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"processed_by" uuid,
	"expires_at" timestamp NOT NULL,
	"metadata" jsonb,
	CONSTRAINT "group_join_requests_request_token_unique" UNIQUE("request_token")
);

-- Add foreign key constraints
ALTER TABLE "group_join_requests" ADD CONSTRAINT "group_join_requests_group_id_buying_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."buying_groups"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "group_join_requests" ADD CONSTRAINT "group_join_requests_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "group_join_requests" ADD CONSTRAINT "group_join_requests_processed_by_profiles_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;