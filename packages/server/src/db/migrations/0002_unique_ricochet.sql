CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"product_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	CONSTRAINT "product_images_deleted_consistent" CHECK ("product_images"."is_deleted" = ("product_images"."deleted_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"product_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	CONSTRAINT "product_reviews_rating_range" CHECK ("product_reviews"."rating" between 1 and 5),
	CONSTRAINT "product_reviews_deleted_consistent" CHECK ("product_reviews"."is_deleted" = ("product_reviews"."deleted_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"vendor_id" uuid NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price_minor" integer NOT NULL,
	"currency" char(3) NOT NULL,
	"stock" integer NOT NULL,
	"rating_avg" numeric(3, 2) DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "products_price_non_negative" CHECK ("products"."price_minor" >= 0),
	CONSTRAINT "products_stock_non_negative" CHECK ("products"."stock" >= 0),
	CONSTRAINT "products_currency_format" CHECK ("products"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "products_deleted_consistent" CHECK ("products"."is_deleted" = ("products"."deleted_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "vendor_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"vendor_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	CONSTRAINT "vendor_reviews_rating_range" CHECK ("vendor_reviews"."rating" between 1 and 5),
	CONSTRAINT "vendor_reviews_deleted_consistent" CHECK ("vendor_reviews"."is_deleted" = ("vendor_reviews"."deleted_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "rating_avg" numeric(3, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "rating_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_images_position_unique" ON "product_images" USING btree ("product_id","position") WHERE "product_images"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "product_reviews_user_unique" ON "product_reviews" USING btree ("product_id","user_id") WHERE "product_reviews"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "product_reviews_target_created_idx" ON "product_reviews" USING btree ("product_id","created_at" desc);--> statement-breakpoint
CREATE INDEX "products_vendor_category_idx" ON "products" USING btree ("vendor_id","category");--> statement-breakpoint
CREATE INDEX "products_vendor_created_idx" ON "products" USING btree ("vendor_id","created_at" desc);--> statement-breakpoint
CREATE INDEX "products_rating_idx" ON "products" USING btree ("rating_avg");--> statement-breakpoint
CREATE INDEX "products_name_trgm_idx" ON "products" USING gin (lower("name") gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_reviews_user_unique" ON "vendor_reviews" USING btree ("vendor_id","user_id") WHERE "vendor_reviews"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "vendor_reviews_target_created_idx" ON "vendor_reviews" USING btree ("vendor_id","created_at" desc);