CREATE TYPE "public"."vendor_member_role" AS ENUM('owner', 'operator');--> statement-breakpoint
CREATE TABLE "vendor_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"vendor_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "vendor_member_role" NOT NULL,
	CONSTRAINT "vendor_members_deleted_consistent" CHECK ("vendor_members"."is_deleted" = ("vendor_members"."deleted_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "vendors_deleted_consistent" CHECK ("vendors"."is_deleted" = ("vendors"."deleted_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "vendor_members" ADD CONSTRAINT "vendor_members_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_members" ADD CONSTRAINT "vendor_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_members_owner_per_user_unique" ON "vendor_members" USING btree ("user_id") WHERE "vendor_members"."role" = 'owner' and "vendor_members"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_members_owner_per_vendor_unique" ON "vendor_members" USING btree ("vendor_id") WHERE "vendor_members"."role" = 'owner' and "vendor_members"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_members_vendor_user_unique" ON "vendor_members" USING btree ("vendor_id","user_id") WHERE "vendor_members"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "vendors_slug_unique" ON "vendors" USING btree (lower("slug")) WHERE "vendors"."is_deleted" = false;