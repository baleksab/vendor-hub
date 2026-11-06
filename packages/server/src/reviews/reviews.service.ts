import { ForbiddenError, NotFoundError } from "../shared/errors.ts";
import type { Page } from "../shared/pagination.ts";
import type { ProductsRepository } from "../products/products.repository.ts";
import { resolveAccess, type Actor } from "../vendors/vendor-access.ts";
import type { Vendor } from "../vendors/vendor.ts";
import type { VendorsRepository } from "../vendors/vendors.repository.ts";
import type { Review, ReviewSummary, ReviewTarget } from "./review.ts";
import type { ReviewsRepository } from "./reviews.repository.ts";
import type { PutReviewRequest } from "./reviews.schemas.ts";

export type ReviewPage = { items: Review[]; total: number; summary: ReviewSummary };

export class ReviewsService {
  private readonly reviews: ReviewsRepository;
  private readonly products: ProductsRepository;
  private readonly vendors: VendorsRepository;

  constructor(
    reviews: ReviewsRepository,
    products: ProductsRepository,
    vendors: VendorsRepository,
  ) {
    this.reviews = reviews;
    this.products = products;
    this.vendors = vendors;
  }

  async listForProduct(productId: string, page: Page): Promise<ReviewPage> {
    await this.resolve("product", productId);

    return this.page("product", productId, page);
  }

  async listForVendorSlug(slug: string, page: Page): Promise<ReviewPage> {
    const vendor = await this.vendors.findBySlug(slug);

    if (vendor === undefined) {
      throw new NotFoundError(`Vendor ${slug} not found`);
    }

    return this.page("vendor", vendor.id, page);
  }

  async put(
    target: ReviewTarget,
    targetId: string,
    actor: Actor,
    request: PutReviewRequest,
  ): Promise<Review> {
    const vendor = await this.resolve(target, targetId);

    if (vendor.members.some((member) => member.userId === actor.userId)) {
      throw new ForbiddenError("You cannot review your own vendor");
    }

    return this.reviews.upsert(target, targetId, actor.userId, request);
  }

  async delete(
    target: ReviewTarget,
    targetId: string,
    actor: Actor,
    reviewId: string,
  ): Promise<void> {
    const vendor = await this.resolve(target, targetId);
    const review = await this.reviews.findById(target, targetId, reviewId);

    if (review === undefined) {
      throw reviewNotFound();
    }

    const allowed = review.userId === actor.userId || resolveAccess(actor, vendor) !== undefined;

    if (!allowed || !(await this.reviews.delete(target, targetId, reviewId))) {
      throw reviewNotFound();
    }
  }

  private async page(target: ReviewTarget, targetId: string, page: Page): Promise<ReviewPage> {
    const [{ items, total }, summary] = await Promise.all([
      this.reviews.list(target, targetId, page),
      this.reviews.summary(target, targetId),
    ]);

    return { items, total, summary };
  }

  private async resolve(target: ReviewTarget, targetId: string): Promise<Vendor> {
    if (target === "vendor") {
      const vendor = await this.vendors.findById(targetId);

      if (vendor === undefined) {
        throw new NotFoundError("Vendor not found");
      }

      return vendor;
    }

    const product = await this.products.findById(targetId);
    const vendor = product && (await this.vendors.findById(product.vendorId));

    if (vendor === undefined) {
      throw new NotFoundError("Product not found");
    }

    return vendor;
  }
}

function reviewNotFound(): NotFoundError {
  return new NotFoundError("Review not found");
}
