ALTER TABLE "products" ADD COLUMN "seo_title" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "seo_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "seo_image_id" uuid;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "seo_title" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "seo_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_seo_image_id_product_images_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."product_images"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_seo_title_not_blank" CHECK (btrim("products"."seo_title") <> '');--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_seo_description_not_blank" CHECK (btrim("products"."seo_description") <> '');--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_seo_title_not_blank" CHECK (btrim("vendors"."seo_title") <> '');--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_seo_description_not_blank" CHECK (btrim("vendors"."seo_description") <> '');