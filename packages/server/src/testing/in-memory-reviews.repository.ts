import type { NewReview, Review, ReviewSummary, ReviewTarget } from "../reviews/review.ts";
import type { ReviewsRepository } from "../reviews/reviews.repository.ts";
import type { Page } from "../shared/pagination.ts";
import type { InMemoryProductsRepository } from "./in-memory-products.repository.ts";
import type { InMemoryUsersRepository } from "./in-memory-users.repository.ts";
import type { InMemoryVendorsRepository } from "./in-memory-vendors.repository.ts";

type StoredReview = {
  id: string;
  target: ReviewTarget;
  targetId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class InMemoryReviewsRepository implements ReviewsRepository {
  readonly rows: StoredReview[] = [];
  private readonly users: InMemoryUsersRepository;
  private readonly products: InMemoryProductsRepository;
  private readonly vendors: InMemoryVendorsRepository;

  constructor(
    users: InMemoryUsersRepository,
    products: InMemoryProductsRepository,
    vendors: InMemoryVendorsRepository,
  ) {
    this.users = users;
    this.products = products;
    this.vendors = vendors;
  }

  async list(
    target: ReviewTarget,
    targetId: string,
    page: Page,
  ): Promise<{ items: Review[]; total: number }> {
    const matching = this.of(target, targetId).sort(
      (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
    );

    return {
      items: matching
        .slice(page.offset, page.offset + page.limit)
        .flatMap((row) => this.expose(row)),
      total: matching.length,
    };
  }

  async summary(target: ReviewTarget, targetId: string): Promise<ReviewSummary> {
    const distribution: ReviewSummary["distribution"] = [0, 0, 0, 0, 0];

    for (const row of this.of(target, targetId)) {
      distribution[row.rating - 1] = (distribution[row.rating - 1] ?? 0) + 1;
    }

    return { distribution };
  }

  async upsert(
    target: ReviewTarget,
    targetId: string,
    userId: string,
    input: NewReview,
  ): Promise<Review> {
    const now = new Date(this.rows.length + 1);
    let row = this.of(target, targetId).find((candidate) => candidate.userId === userId);

    if (row === undefined) {
      row = {
        id: crypto.randomUUID(),
        target,
        targetId,
        userId,
        ...input,
        createdAt: now,
        updatedAt: now,
      };
      this.rows.push(row);
    } else {
      Object.assign(row, input, { updatedAt: now });
    }

    this.recompute(target, targetId);

    return this.expose(row)[0] as Review;
  }

  async findById(
    target: ReviewTarget,
    targetId: string,
    reviewId: string,
  ): Promise<Review | undefined> {
    const row = this.of(target, targetId).find((candidate) => candidate.id === reviewId);

    return row && this.expose(row)[0];
  }

  async delete(target: ReviewTarget, targetId: string, reviewId: string): Promise<boolean> {
    const index = this.rows.findIndex(
      (row) => row.id === reviewId && row.target === target && row.targetId === targetId,
    );

    if (index === -1) {
      return false;
    }

    this.rows.splice(index, 1);
    this.recompute(target, targetId);

    return true;
  }

  private of(target: ReviewTarget, targetId: string): StoredReview[] {
    return this.rows.filter((row) => row.target === target && row.targetId === targetId);
  }

  private recompute(target: ReviewTarget, targetId: string): void {
    const rows = this.of(target, targetId);
    const ratingCount = rows.length;
    const ratingAvg =
      ratingCount === 0
        ? 0
        : Math.round((rows.reduce((sum, row) => sum + row.rating, 0) / ratingCount) * 100) / 100;
    const holder =
      target === "product"
        ? this.products.rows.find((row) => row.id === targetId)
        : this.vendors.vendors.find((row) => row.id === targetId);

    if (holder !== undefined) {
      holder.ratingAvg = ratingAvg;
      holder.ratingCount = ratingCount;
    }
  }

  private expose(row: StoredReview): Review[] {
    const user = this.users.rows.find((candidate) => candidate.id === row.userId);

    return user === undefined
      ? []
      : [
          {
            id: row.id,
            userId: row.userId,
            authorFirstName: user.firstName,
            authorLastName: user.lastName,
            rating: row.rating,
            comment: row.comment,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          },
        ];
  }
}
