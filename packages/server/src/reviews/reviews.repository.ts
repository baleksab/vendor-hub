import { and, desc, count, eq, sql } from "drizzle-orm";

import { notDeleted } from "../db/base-entity.ts";
import type { Database } from "../db/client.ts";
import { productReviews, products, users, vendorReviews, vendors } from "../db/schema.ts";
import type { NewReview, Review, ReviewSummary, ReviewTarget } from "./review.ts";
import type { Page } from "../shared/pagination.ts";

export type ReviewsRepository = {
  list(
    target: ReviewTarget,
    targetId: string,
    page: Page,
  ): Promise<{ items: Review[]; total: number }>;
  summary(target: ReviewTarget, targetId: string): Promise<ReviewSummary>;
  upsert(target: ReviewTarget, targetId: string, userId: string, input: NewReview): Promise<Review>;
  findById(target: ReviewTarget, targetId: string, reviewId: string): Promise<Review | undefined>;
  delete(target: ReviewTarget, targetId: string, reviewId: string): Promise<boolean>;
};

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export class DrizzleReviewsRepository implements ReviewsRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async list(
    target: ReviewTarget,
    targetId: string,
    page: Page,
  ): Promise<{ items: Review[]; total: number }> {
    const table = tableOf(target);
    const where = and(eq(table.targetId, targetId), notDeleted(table));

    const items = await this.db
      .select(reviewColumns(table))
      .from(table)
      .innerJoin(users, eq(users.id, table.userId))
      .where(where)
      .orderBy(desc(table.createdAt), table.id)
      .limit(page.limit)
      .offset(page.offset);

    const [totalRow] = await this.db.select({ total: count() }).from(table).where(where);

    return { items, total: totalRow?.total ?? 0 };
  }

  async summary(target: ReviewTarget, targetId: string): Promise<ReviewSummary> {
    const table = tableOf(target);
    const rows = await this.db
      .select({ rating: table.rating, total: count() })
      .from(table)
      .where(and(eq(table.targetId, targetId), notDeleted(table)))
      .groupBy(table.rating);

    const distribution: ReviewSummary["distribution"] = [0, 0, 0, 0, 0];

    for (const row of rows) {
      distribution[row.rating - 1] = row.total;
    }

    return { distribution };
  }

  async upsert(
    target: ReviewTarget,
    targetId: string,
    userId: string,
    input: NewReview,
  ): Promise<Review> {
    const table = tableOf(target);

    const reviewId = await this.db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: table.id })
        .from(table)
        .where(and(eq(table.targetId, targetId), eq(table.userId, userId), notDeleted(table)));

      let id: string;

      if (existing === undefined) {
        const [created] = await tx
          .insert(table)
          .values({ targetId, userId, ...input })
          .returning({ id: table.id });

        if (created === undefined) {
          throw new Error("Insert returned no row");
        }

        id = created.id;
      } else {
        await tx.update(table).set(input).where(eq(table.id, existing.id));
        id = existing.id;
      }

      await recomputeAggregates(tx, target, targetId);

      return id;
    });

    const review = await this.findById(target, targetId, reviewId);

    if (review === undefined) {
      throw new Error("Saved review not found");
    }

    return review;
  }

  async findById(
    target: ReviewTarget,
    targetId: string,
    reviewId: string,
  ): Promise<Review | undefined> {
    const table = tableOf(target);
    const [row] = await this.db
      .select(reviewColumns(table))
      .from(table)
      .innerJoin(users, eq(users.id, table.userId))
      .where(and(eq(table.id, reviewId), eq(table.targetId, targetId), notDeleted(table)));

    return row;
  }

  async delete(target: ReviewTarget, targetId: string, reviewId: string): Promise<boolean> {
    const table = tableOf(target);

    return this.db.transaction(async (tx) => {
      const rows = await tx
        .update(table)
        .set({ isDeleted: true, deletedAt: sql`now()` })
        .where(and(eq(table.id, reviewId), eq(table.targetId, targetId), notDeleted(table)))
        .returning({ id: table.id });

      if (rows.length === 0) {
        return false;
      }

      await recomputeAggregates(tx, target, targetId);

      return true;
    });
  }
}

function tableOf(target: ReviewTarget): typeof productReviews {
  return target === "product" ? productReviews : vendorReviews;
}

function reviewColumns(table: typeof productReviews) {
  return {
    id: table.id,
    userId: table.userId,
    authorFirstName: users.firstName,
    authorLastName: users.lastName,
    rating: table.rating,
    comment: table.comment,
    createdAt: table.createdAt,
    updatedAt: table.updatedAt,
  };
}

async function recomputeAggregates(
  tx: Transaction,
  target: ReviewTarget,
  targetId: string,
): Promise<void> {
  const table = tableOf(target);
  const [aggregate] = await tx
    .select({
      ratingAvg: sql<number>`coalesce(round(avg(${table.rating}), 2), 0)`.mapWith(Number),
      ratingCount: count(),
    })
    .from(table)
    .where(and(eq(table.targetId, targetId), notDeleted(table)));

  const values = { ratingAvg: aggregate?.ratingAvg ?? 0, ratingCount: aggregate?.ratingCount ?? 0 };

  if (target === "product") {
    await tx.update(products).set(values).where(eq(products.id, targetId));
  } else {
    await tx.update(vendors).set(values).where(eq(vendors.id, targetId));
  }
}
