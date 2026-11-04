CREATE TYPE "public"."user_role" AS ENUM('administrator', 'regular');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"address" text NOT NULL,
	"phone_number" text NOT NULL,
	"country" char(2) NOT NULL,
	"role" "user_role" DEFAULT 'regular' NOT NULL,
	CONSTRAINT "users_country_format" CHECK ("users"."country" ~ '^[A-Z]{2}$'),
	CONSTRAINT "users_deleted_consistent" CHECK ("users"."is_deleted" = ("users"."deleted_at" is not null))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree (lower("email")) WHERE "users"."is_deleted" = false;