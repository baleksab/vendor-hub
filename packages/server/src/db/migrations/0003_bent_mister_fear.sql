CREATE TYPE "public"."order_actor" AS ENUM('buyer', 'vendor', 'system');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('created', 'paid', 'delivered', 'closed', 'cancelled', 'return_requested', 'return_approved', 'return_rejected');--> statement-breakpoint
CREATE TYPE "public"."payment_failure_reason" AS ENUM('declined', 'unknownCard');--> statement-breakpoint
CREATE TYPE "public"."payment_kind" AS ENUM('charge', 'refund');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"order_id" uuid NOT NULL,
	"from_status" "order_status",
	"to_status" "order_status" NOT NULL,
	"actor" "order_actor" NOT NULL,
	"actor_user_id" uuid,
	"note" text,
	CONSTRAINT "order_events_actor_consistent" CHECK (("order_events"."actor" = 'system') = ("order_events"."actor_user_id" is null)),
	CONSTRAINT "order_events_deleted_consistent" CHECK ("order_events"."is_deleted" = ("order_events"."deleted_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"unit_price_minor" integer NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" >= 1),
	CONSTRAINT "order_items_unit_price_non_negative" CHECK ("order_items"."unit_price_minor" >= 0),
	CONSTRAINT "order_items_deleted_consistent" CHECK ("order_items"."is_deleted" = ("order_items"."deleted_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"user_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'created' NOT NULL,
	"currency" char(3) NOT NULL,
	"total_minor" integer NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"ship_first_name" text NOT NULL,
	"ship_last_name" text NOT NULL,
	"ship_email" text NOT NULL,
	"ship_phone" text NOT NULL,
	"ship_address" text NOT NULL,
	"ship_country" char(2) NOT NULL,
	"payment_attempts" integer DEFAULT 0 NOT NULL,
	"paid_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	CONSTRAINT "orders_total_non_negative" CHECK ("orders"."total_minor" >= 0),
	CONSTRAINT "orders_payment_attempts_non_negative" CHECK ("orders"."payment_attempts" >= 0),
	CONSTRAINT "orders_currency_format" CHECK ("orders"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "orders_ship_country_format" CHECK ("orders"."ship_country" ~ '^[A-Z]{2}$'),
	CONSTRAINT "orders_deleted_consistent" CHECK ("orders"."is_deleted" = ("orders"."deleted_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"order_id" uuid NOT NULL,
	"kind" "payment_kind" NOT NULL,
	"status" "payment_status" NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" char(3) NOT NULL,
	"failure_reason" "payment_failure_reason",
	CONSTRAINT "payments_amount_non_negative" CHECK ("payments"."amount_minor" >= 0),
	CONSTRAINT "payments_currency_format" CHECK ("payments"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "payments_failure_reason_consistent" CHECK (("payments"."status" = 'failed') = ("payments"."failure_reason" is not null)),
	CONSTRAINT "payments_deleted_consistent" CHECK ("payments"."is_deleted" = ("payments"."deleted_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_events_order_created_idx" ON "order_events" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_idempotency_unique" ON "orders" USING btree ("user_id","idempotency_key","vendor_id","currency") WHERE "orders"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "orders_user_created_idx" ON "orders" USING btree ("user_id","created_at" desc);--> statement-breakpoint
CREATE INDEX "orders_vendor_status_created_idx" ON "orders" USING btree ("vendor_id","status","created_at" desc);--> statement-breakpoint
CREATE INDEX "orders_status_created_idx" ON "orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "orders_status_delivered_idx" ON "orders" USING btree ("status","delivered_at");--> statement-breakpoint
CREATE INDEX "payments_order_created_idx" ON "payments" USING btree ("order_id","created_at");