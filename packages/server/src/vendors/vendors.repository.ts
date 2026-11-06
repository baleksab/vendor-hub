import { and, asc, count, desc, eq, ilike, isNotNull, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { notDeleted } from "../db/base-entity.ts";
import type { Database } from "../db/client.ts";
import { products, users, vendorMembers, vendors } from "../db/schema.ts";
import { findUniqueViolation } from "../db/unique-violation.ts";
import { ConflictError } from "../shared/errors.ts";
import { escapeLike } from "../shared/like.ts";
import type { Page } from "../shared/pagination.ts";
import type { Actor } from "./vendor-access.ts";
import type {
  ManagedVendorRow,
  NewVendor,
  Vendor,
  VendorListItem,
  VendorPatch,
  VendorSummary,
} from "./vendor.ts";
import { resolveOrder, type ListManagedVendorsQuery } from "./vendors.schemas.ts";

export type VendorsRepository = {
  create(input: NewVendor): Promise<Vendor>;
  list(page: Page): Promise<{ items: VendorListItem[]; total: number }>;
  listManaged(
    actor: Actor,
    query: ListManagedVendorsQuery,
  ): Promise<{ items: ManagedVendorRow[]; total: number }>;
  findById(id: string): Promise<Vendor | undefined>;
  findBySlug(slug: string): Promise<Vendor | undefined>;
  update(id: string, patch: VendorPatch): Promise<Vendor | undefined>;
  softDelete(id: string): Promise<boolean>;
  findOwnedBy(userId: string): Promise<Vendor | undefined>;
  listOperatedBy(userId: string): Promise<VendorSummary[]>;
  addOperator(vendorId: string, userId: string): Promise<void>;
  removeOperator(vendorId: string, userId: string): Promise<boolean>;
};

export const VENDOR_SLUG_UNIQUE = "vendors_slug_unique";
export const VENDOR_OWNER_PER_USER_UNIQUE = "vendor_members_owner_per_user_unique";
export const VENDOR_MEMBER_UNIQUE = "vendor_members_vendor_user_unique";

export const SLUG_TAKEN_MESSAGE = "A vendor with this slug already exists";
export const ALREADY_OWNER_MESSAGE = "You already own a vendor";
export const ALREADY_MEMBER_MESSAGE = "This user is already a member of the vendor";

function toConflict(error: unknown): unknown {
  const constraint = findUniqueViolation(error)?.constraint;

  if (constraint === VENDOR_SLUG_UNIQUE) {
    return new ConflictError(SLUG_TAKEN_MESSAGE);
  }

  if (constraint === VENDOR_OWNER_PER_USER_UNIQUE) {
    return new ConflictError(ALREADY_OWNER_MESSAGE);
  }

  if (constraint === VENDOR_MEMBER_UNIQUE) {
    return new ConflictError(ALREADY_MEMBER_MESSAGE);
  }

  return error;
}

export class DrizzleVendorsRepository implements VendorsRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async create(input: NewVendor): Promise<Vendor> {
    try {
      const vendorId = await this.db.transaction(async (tx) => {
        const [row] = await tx
          .insert(vendors)
          .values({ slug: input.slug, name: input.name, description: input.description })
          .returning({ id: vendors.id });

        if (row === undefined) {
          throw new Error("Insert returned no row");
        }

        await tx
          .insert(vendorMembers)
          .values({ vendorId: row.id, userId: input.ownerId, role: "owner" });

        return row.id;
      });

      const vendor = await this.load(eq(vendors.id, vendorId));

      if (vendor === undefined) {
        throw new Error("Created vendor not found");
      }

      return vendor;
    } catch (error) {
      throw toConflict(error);
    }
  }

  async list(page: Page): Promise<{ items: VendorListItem[]; total: number }> {
    const items = await this.db
      .select({ slug: vendors.slug, name: vendors.name, description: vendors.description })
      .from(vendors)
      .where(notDeleted(vendors))
      .orderBy(desc(vendors.createdAt), vendors.id)
      .limit(page.limit)
      .offset(page.offset);

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(vendors)
      .where(notDeleted(vendors));

    return { items, total: totalRow?.total ?? 0 };
  }

  async listManaged(
    actor: Actor,
    query: ListManagedVendorsQuery,
  ): Promise<{ items: ManagedVendorRow[]; total: number }> {
    const mine = alias(vendorMembers, "mine");
    const ownerMember = alias(vendorMembers, "owner_member");
    const memberCounts = this.db
      .select({ vendorId: vendorMembers.vendorId, total: count().as("total") })
      .from(vendorMembers)
      .where(notDeleted(vendorMembers))
      .groupBy(vendorMembers.vendorId)
      .as("member_counts");

    const conditions: (SQL | undefined)[] = [notDeleted(vendors)];

    if (actor.role !== "administrator") {
      conditions.push(isNotNull(mine.id));
    }

    if (query.relation !== undefined) {
      conditions.push(eq(mine.role, query.relation === "owned" ? "owner" : "operator"));
    }

    if (query.search !== undefined) {
      const pattern = `%${escapeLike(query.search)}%`;

      conditions.push(or(ilike(vendors.name, pattern), ilike(vendors.slug, pattern)));
    }

    const where = and(...conditions);
    const mineJoin = and(
      eq(mine.vendorId, vendors.id),
      eq(mine.userId, actor.userId),
      notDeleted(mine),
    );
    const sortColumn = {
      name: vendors.name,
      createdAt: vendors.createdAt,
      memberCount: memberCounts.total,
    }[query.sort];
    const direction = resolveOrder(query) === "asc" ? asc : desc;

    const items = await this.db
      .select({
        id: vendors.id,
        slug: vendors.slug,
        name: vendors.name,
        description: vendors.description,
        ownerId: users.id,
        ownerFirstName: users.firstName,
        ownerLastName: users.lastName,
        memberCount: memberCounts.total,
        callerRole: mine.role,
        createdAt: vendors.createdAt,
      })
      .from(vendors)
      .innerJoin(memberCounts, eq(memberCounts.vendorId, vendors.id))
      .innerJoin(
        ownerMember,
        and(
          eq(ownerMember.vendorId, vendors.id),
          eq(ownerMember.role, "owner"),
          notDeleted(ownerMember),
        ),
      )
      .innerJoin(users, eq(users.id, ownerMember.userId))
      .leftJoin(mine, mineJoin)
      .where(where)
      .orderBy(direction(sortColumn), asc(vendors.id))
      .limit(query.limit)
      .offset(query.offset);

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(vendors)
      .leftJoin(mine, mineJoin)
      .where(where);

    return {
      items: items.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        owner: { userId: row.ownerId, firstName: row.ownerFirstName, lastName: row.ownerLastName },
        memberCount: row.memberCount,
        callerRole: row.callerRole ?? undefined,
        createdAt: row.createdAt,
      })),
      total: totalRow?.total ?? 0,
    };
  }

  async findById(id: string): Promise<Vendor | undefined> {
    return this.load(eq(vendors.id, id));
  }

  async update(id: string, patch: VendorPatch): Promise<Vendor | undefined> {
    const rows = await this.db
      .update(vendors)
      .set(patch)
      .where(and(eq(vendors.id, id), notDeleted(vendors)))
      .returning({ id: vendors.id });

    return rows.length === 0 ? undefined : this.load(eq(vendors.id, id));
  }

  async softDelete(id: string): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const deleted = await tx
        .update(vendors)
        .set({ isDeleted: true, deletedAt: sql`now()` })
        .where(and(eq(vendors.id, id), notDeleted(vendors)))
        .returning({ id: vendors.id });

      if (deleted.length === 0) {
        return false;
      }

      await tx
        .update(vendorMembers)
        .set({ isDeleted: true, deletedAt: sql`now()` })
        .where(and(eq(vendorMembers.vendorId, id), notDeleted(vendorMembers)));

      await tx
        .update(products)
        .set({ isDeleted: true, deletedAt: sql`now()` })
        .where(and(eq(products.vendorId, id), notDeleted(products)));

      return true;
    });
  }

  async findBySlug(slug: string): Promise<Vendor | undefined> {
    return this.load(sql`lower(${vendors.slug}) = lower(${slug})`);
  }

  async findOwnedBy(userId: string): Promise<Vendor | undefined> {
    const [row] = await this.db
      .select({ vendorId: vendorMembers.vendorId })
      .from(vendorMembers)
      .where(
        and(
          eq(vendorMembers.userId, userId),
          eq(vendorMembers.role, "owner"),
          notDeleted(vendorMembers),
        ),
      );

    return row && this.load(eq(vendors.id, row.vendorId));
  }

  async listOperatedBy(userId: string): Promise<VendorSummary[]> {
    return this.db
      .select({ slug: vendors.slug, name: vendors.name })
      .from(vendorMembers)
      .innerJoin(vendors, eq(vendors.id, vendorMembers.vendorId))
      .where(
        and(
          eq(vendorMembers.userId, userId),
          eq(vendorMembers.role, "operator"),
          notDeleted(vendorMembers),
          notDeleted(vendors),
        ),
      )
      .orderBy(asc(vendors.name), vendors.id);
  }

  async addOperator(vendorId: string, userId: string): Promise<void> {
    try {
      await this.db.insert(vendorMembers).values({ vendorId, userId, role: "operator" });
    } catch (error) {
      throw toConflict(error);
    }
  }

  async removeOperator(vendorId: string, userId: string): Promise<boolean> {
    const rows = await this.db
      .update(vendorMembers)
      .set({ isDeleted: true, deletedAt: sql`now()` })
      .where(
        and(
          eq(vendorMembers.vendorId, vendorId),
          eq(vendorMembers.userId, userId),
          eq(vendorMembers.role, "operator"),
          notDeleted(vendorMembers),
        ),
      )
      .returning({ id: vendorMembers.id });

    return rows.length > 0;
  }

  private async load(condition: SQL): Promise<Vendor | undefined> {
    const [vendor] = await this.db
      .select({
        id: vendors.id,
        slug: vendors.slug,
        name: vendors.name,
        description: vendors.description,
        ratingAvg: vendors.ratingAvg,
        ratingCount: vendors.ratingCount,
        createdAt: vendors.createdAt,
      })
      .from(vendors)
      .where(and(condition, notDeleted(vendors)));

    if (vendor === undefined) {
      return undefined;
    }

    const members = await this.db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        role: vendorMembers.role,
      })
      .from(vendorMembers)
      .innerJoin(users, eq(users.id, vendorMembers.userId))
      .where(
        and(eq(vendorMembers.vendorId, vendor.id), notDeleted(vendorMembers), notDeleted(users)),
      )
      .orderBy(asc(vendorMembers.createdAt), vendorMembers.id);

    return { ...vendor, members };
  }
}
