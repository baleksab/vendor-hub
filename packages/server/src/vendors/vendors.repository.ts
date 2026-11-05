import { and, asc, count, desc, eq, sql, type SQL } from "drizzle-orm";

import { notDeleted } from "../db/base-entity.ts";
import type { Database } from "../db/client.ts";
import { users, vendorMembers, vendors } from "../db/schema.ts";
import { findUniqueViolation } from "../db/unique-violation.ts";
import { ConflictError } from "../shared/errors.ts";
import type { Page } from "../shared/pagination.ts";
import type { NewVendor, Vendor, VendorListItem, VendorSummary } from "./vendor.ts";

export type VendorsRepository = {
  create(input: NewVendor): Promise<Vendor>;
  list(page: Page): Promise<{ items: VendorListItem[]; total: number }>;
  findBySlug(slug: string): Promise<Vendor | undefined>;
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
